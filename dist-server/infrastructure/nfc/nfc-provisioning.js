import crypto from 'crypto';
export class NFCProvisioningEngine {
    static DEFAULT_BASE_URL = process.env.PUBLIC_APP_URL || 'https://passport.app';
    /**
     * Generate a complete NFC tag programming payload for NTAG 424 DNA (flagship)
     * or fallback NTAG 213/215/216 chips.
     *
     * NTAG 424 DNA supports SUN (Secure Unique NFC) authentication with:
     * - Rolling counter (increments on each tap)
     * - AES-128 cryptographic MAC verification
     * - UID mirroring in the NDEF message
     *
     * For simpler NTAG 213/215/216, we generate a static NDEF URL record
     * with a binding hash for UID↔serial integrity.
     */
    static generateProvisioningPayload(dto) {
        const tagType = dto.tag_type || 'NTAG_424_DNA';
        const baseUrl = dto.passport_base_url || this.DEFAULT_BASE_URL;
        // Create the binding hash: SHA-256(shop_domain + serial + nfc_uid + secret)
        const bindingSecret = process.env.ENCRYPTION_KEY || 'nfc_binding_secret_key_32bytes!';
        const bindingHash = crypto
            .createHmac('sha256', bindingSecret)
            .update(`${dto.shop_domain}:${dto.serial}:${dto.nfc_uid}`)
            .digest('hex')
            .slice(0, 16);
        const isAdvancedTag = tagType === 'NTAG_424_DNA';
        // Build the NDEF URL
        // NTAG 424 DNA: Dynamic URL with SUN parameters (UID mirror + read counter + CMAC)
        // NTAG 213/215/216: Static URL with binding hash
        let ndefUrl;
        if (isAdvancedTag) {
            // NTAG 424 DNA SUN URL template — the tag firmware replaces placeholders on each tap
            ndefUrl = `${baseUrl}/scan/${dto.serial}?uid={UID}&ctr={COUNTER}&cmac={CMAC}`;
        }
        else {
            ndefUrl = `${baseUrl}/scan/${dto.serial}?uid=${dto.nfc_uid}&bind=${bindingHash}`;
        }
        // Generate provisioning command sequence
        const commands = isAdvancedTag
            ? this.generateNTAG424Commands(dto, ndefUrl, bindingHash)
            : this.generateNTAGClassicCommands(dto, ndefUrl, tagType);
        return {
            tag_type: tagType,
            serial: dto.serial,
            shop_domain: dto.shop_domain,
            nfc_uid: dto.nfc_uid,
            ndef_url: ndefUrl,
            rolling_counter_enabled: isAdvancedTag,
            sun_authentication: isAdvancedTag,
            provisioning_commands: commands,
            binding_hash: bindingHash,
            provisioned_at: new Date().toISOString(),
        };
    }
    /**
     * NTAG 424 DNA: Full SUN authentication provisioning sequence
     */
    static generateNTAG424Commands(dto, ndefUrl, bindingHash) {
        // Derive per-tag AES key from master key + UID
        const masterKey = process.env.ENCRYPTION_KEY || 'nfc_binding_secret_key_32bytes!';
        const tagKey = crypto
            .createHmac('sha256', masterKey)
            .update(`tag_key:${dto.nfc_uid}`)
            .digest('hex')
            .slice(0, 32);
        return [
            {
                step: 1,
                instruction: 'AUTHENTICATE_EV2_FIRST',
                hex_payload: '9071000005000000000000',
                description: 'Authenticate with factory default key (all zeros) using EV2 authentication.',
            },
            {
                step: 2,
                instruction: 'CHANGE_KEY_0',
                hex_payload: `9054000019${tagKey}`,
                description: `Rotate Key 0 (AppMasterKey) to derived per-tag key: ${tagKey.slice(0, 8)}...`,
            },
            {
                step: 3,
                instruction: 'SET_CONFIGURATION',
                hex_payload: '905C00000500000000E0',
                description: 'Enable SUN (Secure Unique NFC) message authentication and UID/counter mirroring.',
            },
            {
                step: 4,
                instruction: 'SET_NDEF_FILE_SETTINGS',
                hex_payload: '905F000009020000E00000400000',
                description: 'Configure NDEF file with SDM (Secure Dynamic Messaging) access rights.',
            },
            {
                step: 5,
                instruction: 'WRITE_NDEF_MESSAGE',
                description: `Write NDEF URL record: ${ndefUrl}`,
            },
            {
                step: 6,
                instruction: 'SET_SDM_META_READ',
                description: 'Enable UID mirroring, read counter mirroring, and CMAC in NDEF URL.',
            },
            {
                step: 7,
                instruction: 'LOCK_CONFIGURATION',
                description: 'Write-protect SDM configuration to prevent tampering.',
            },
        ];
    }
    /**
     * NTAG 213/215/216: Static NDEF URL with binding hash
     */
    static generateNTAGClassicCommands(dto, ndefUrl, tagType) {
        // Calculate NDEF record bytes
        const urlBytes = Buffer.from(ndefUrl, 'utf8');
        const ndefHeader = Buffer.from([
            0x03, // NDEF Message TLV Type
            urlBytes.length + 5, // Length
            0xD1, // MB=1, ME=1, CF=0, SR=1, IL=0, TNF=001 (Well-Known)
            0x01, // Type Length
            urlBytes.length + 1, // Payload Length
            0x55, // Type: 'U' (URI)
            0x00, // URI Identifier Code: no prefix
        ]);
        return [
            {
                step: 1,
                instruction: 'WRITE_NDEF_MESSAGE',
                hex_payload: Buffer.concat([ndefHeader, urlBytes, Buffer.from([0xFE])]).toString('hex').toUpperCase(),
                description: `Write static NDEF URI record pointing to passport URL for serial ${dto.serial}.`,
            },
            {
                step: 2,
                instruction: 'SET_PASSWORD',
                hex_payload: crypto.randomBytes(4).toString('hex').toUpperCase(),
                description: 'Set 4-byte PWD to prevent unauthorized re-programming.',
            },
            {
                step: 3,
                instruction: 'LOCK_PAGES',
                description: `Lock NDEF data pages on ${tagType} to make the URL immutable.`,
            },
        ];
    }
    /**
     * Validate an incoming NFC SUN authentication tap from an NTAG 424 DNA tag.
     * Verifies the rolling counter hasn't been rolled back and the CMAC is structurally valid.
     */
    static validateSUNTap(params) {
        const anomalies = [];
        // 1. Counter rollback detection
        if (params.last_known_counter !== undefined && params.counter <= params.last_known_counter) {
            anomalies.push(`COUNTER_ROLLBACK: Received counter ${params.counter} but last known was ${params.last_known_counter}`);
        }
        // 2. CMAC structural validation (must be 16 hex chars for NTAG 424 DNA)
        if (!params.cmac || params.cmac.length !== 16 || !/^[0-9A-Fa-f]+$/.test(params.cmac)) {
            anomalies.push(`INVALID_CMAC_FORMAT: CMAC '${params.cmac}' does not match expected 16-hex-char format`);
        }
        // 3. UID format validation
        if (!params.uid || params.uid.length < 8) {
            anomalies.push(`INVALID_UID: UID '${params.uid}' is too short for NFC tag identification`);
        }
        return {
            valid: anomalies.length === 0,
            anomalies,
        };
    }
    /**
     * Generate a batch of provisioning payloads for multiple serials (factory line use)
     */
    static generateBatchPayloads(shop_domain, items, passport_base_url) {
        return items.map((item) => this.generateProvisioningPayload({
            serial: item.serial,
            shop_domain,
            nfc_uid: item.nfc_uid,
            tag_type: item.tag_type,
            passport_base_url,
        }));
    }
}
