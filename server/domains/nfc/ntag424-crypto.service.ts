import crypto from 'crypto';

/**
 * NTAG424 DNA Cryptographic Authentication Service
 * Implements SUN (Secure Unique NFC) message verification
 * 
 * NTAG424 DNA provides cryptographic authentication using AES-128
 * and generates dynamic URLs that can be verified server-side.
 */

export interface NTAG424Config {
  uid: string; // 7-byte UID
  readCounter: number;
  fileData: string; // SDM file data
  encryptedData: string; // PICC data (encrypted)
  mac: string; // CMAC
}

export interface NTAG424Keys {
  masterKey: Buffer; // 16-byte AES key
  sdmMetaReadKey: Buffer;
  sdmFileReadKey: Buffer;
}

export interface NTAG424VerificationResult {
  valid: boolean;
  uid: string;
  readCounter: number;
  error?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class NTAG424CryptoService {
  /**
   * Verify NTAG424 DNA SUN message
   */
  static verifySUNMessage(
    config: NTAG424Config,
    keys: NTAG424Keys
  ): NTAG424VerificationResult {
    try {
      // 1. Decrypt PICC data using SDM File Read Key
      const decryptedData = this.decryptPICCData(
        config.encryptedData,
        keys.sdmFileReadKey,
        config.uid
      );

      // 2. Verify CMAC using SDM Meta Read Key
      const isValidMAC = this.verifyCMAC(
        {
          uid: config.uid,
          readCounter: config.readCounter,
          fileData: config.fileData,
          encryptedData: config.encryptedData,
        },
        config.mac,
        keys.sdmMetaReadKey
      );

      if (!isValidMAC) {
        return {
          valid: false,
          uid: config.uid,
          readCounter: config.readCounter,
          error: 'Invalid CMAC - authentication failed',
          confidence: 'LOW',
        };
      }

      // 3. Verify read counter sequence
      const counterValid = this.verifyReadCounter(config.readCounter);

      return {
        valid: true,
        uid: config.uid,
        readCounter: config.readCounter,
        confidence: counterValid ? 'HIGH' : 'MEDIUM',
      };
    } catch (error: any) {
      return {
        valid: false,
        uid: config.uid,
        readCounter: config.readCounter,
        error: error.message,
        confidence: 'LOW',
      };
    }
  }

  /**
   * Decrypt PICC data using AES-128
   */
  private static decryptPICCData(
    encryptedData: string,
    key: Buffer,
    iv: string
  ): Buffer {
    const decipher = crypto.createDecipheriv(
      'aes-128-cbc',
      key,
      Buffer.from(iv.substring(0, 32), 'hex')
    );

    const encrypted = Buffer.from(encryptedData, 'hex');
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted;
  }

  /**
   * Verify CMAC (Cipher-based Message Authentication Code)
   */
  private static verifyCMAC(
    data: {
      uid: string;
      readCounter: number;
      fileData: string;
      encryptedData: string;
    },
    providedMAC: string,
    key: Buffer
  ): boolean {
    // Construct message for CMAC
    const message = Buffer.concat([
      Buffer.from(data.uid, 'hex'),
      Buffer.from(data.readCounter.toString(16).padStart(6, '0'), 'hex'),
      Buffer.from(data.fileData, 'hex'),
      Buffer.from(data.encryptedData, 'hex'),
    ]);

    // Calculate CMAC using AES-128-CMAC
    const calculatedMAC = this.calculateCMAC(message, key);
    const providedMACBuffer = Buffer.from(providedMAC, 'hex');

    // Constant-time comparison
    return crypto.timingSafeEqual(calculatedMAC.subarray(0, 8), providedMACBuffer.subarray(0, 8));
  }

  /**
   * Calculate CMAC (AES-CMAC)
   */
  private static calculateCMAC(message: Buffer, key: Buffer): Buffer {
    // Simplified CMAC implementation
    // For production, use a proper CMAC library like 'node-aes-cmac'
    
    const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.alloc(16));
    cipher.setAutoPadding(false);

    // Pad message to block size
    const paddedMessage = this.padMessage(message);
    
    let mac = Buffer.alloc(16);
    for (let i = 0; i < paddedMessage.length; i += 16) {
      const block = paddedMessage.subarray(i, i + 16);
      const xored = Buffer.alloc(16);
      for (let j = 0; j < 16; j++) {
        xored[j] = mac[j] ^ block[j];
      }
      mac = cipher.update(xored);
    }

    return mac;
  }

  /**
   * Pad message to AES block size
   */
  private static padMessage(message: Buffer): Buffer {
    const blockSize = 16;
    const padding = blockSize - (message.length % blockSize);
    
    if (padding === blockSize) {
      return message;
    }

    const padded = Buffer.alloc(message.length + padding);
    message.copy(padded);
    padded[message.length] = 0x80; // ISO/IEC 9797-1 padding

    return padded;
  }

  /**
   * Verify read counter sequence (detect replay attacks)
   */
  private static verifyReadCounter(readCounter: number): boolean {
    // In production, store last read counter in database
    // and verify that new counter > last counter
    return readCounter > 0;
  }

  /**
   * Parse NTAG424 SUN URL
   * Example: https://domain.com/passport/SERIAL?uid=04ABC...&c=123&enc=...&mac=...
   */
  static parseSUNURL(url: string): NTAG424Config | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      return {
        uid: params.get('uid') || '',
        readCounter: parseInt(params.get('c') || '0'),
        fileData: params.get('f') || '',
        encryptedData: params.get('enc') || '',
        mac: params.get('mac') || '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate master key derivation (for key setup)
   */
  static deriveMasterKey(baseKey: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(baseKey, salt, 10000, 16, 'sha256');
  }

  /**
   * Detect if UID is from NTAG424 DNA (vs regular NTAG)
   */
  static isNTAG424(uid: string): boolean {
    // NTAG424 DNA uses 7-byte UID
    const cleanUID = uid.replace(/[:\s-]/g, '');
    return cleanUID.length === 14; // 7 bytes = 14 hex chars
  }

  /**
   * Get security recommendation based on tag type
   */
  static getSecurityRecommendation(uid: string): {
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: string;
  } {
    if (this.isNTAG424(uid)) {
      return {
        level: 'HIGH',
        recommendation: 'NTAG424 DNA detected. Enable cryptographic verification for maximum security.',
      };
    }

    return {
      level: 'MEDIUM',
      recommendation: 'Standard NFC tag. Consider upgrading to NTAG424 DNA for cryptographic authentication.',
    };
  }
}

/**
 * Example usage for verification endpoint
 */
export async function verifyNTAG424Scan(
  sunURL: string,
  shopId: string,
  serial: string
): Promise<NTAG424VerificationResult> {
  // 1. Parse SUN URL
  const config = NTAG424CryptoService.parseSUNURL(sunURL);
  if (!config) {
    return {
      valid: false,
      uid: '',
      readCounter: 0,
      error: 'Invalid SUN URL format',
      confidence: 'LOW',
    };
  }

  // 2. Fetch keys from secure storage (database/vault)
  // In production, keys should be stored per shop and per physical piece
  const keys = await fetchNTAG424Keys(shopId, serial);

  // 3. Verify cryptographic signature
  return NTAG424CryptoService.verifySUNMessage(config, keys);
}

/**
 * Stub: Fetch NTAG424 keys from secure storage
 * In production, implement secure key management
 */
async function fetchNTAG424Keys(shopId: string, serial: string): Promise<NTAG424Keys> {
  // TODO: Implement secure key retrieval from database or vault
  // Keys should be unique per physical piece for maximum security
  
  throw new Error('NTAG424 key management not yet implemented');
}
