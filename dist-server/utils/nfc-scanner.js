/**
 * NFC Scanner Utilities
 * Helper functions for NFC tag reading and validation
 */
/**
 * Validate NFC UID format
 */
export function validateNFCUID(uid) {
    // NFC UIDs are typically 4, 7, or 10 bytes in hex format
    const cleaned = uid.replace(/[:\s-]/g, '').toUpperCase();
    // Check if valid hex
    if (!/^[0-9A-F]+$/.test(cleaned)) {
        return false;
    }
    // Check byte length (4, 7, or 10 bytes = 8, 14, or 20 hex chars)
    const validLengths = [8, 14, 20];
    return validLengths.includes(cleaned.length);
}
/**
 * Normalize NFC UID format
 */
export function normalizeNFCUID(uid) {
    // Remove separators and convert to uppercase
    return uid.replace(/[:\s-]/g, '').toUpperCase();
}
/**
 * Format NFC UID for display (adds colons every 2 chars)
 */
export function formatNFCUID(uid) {
    const normalized = normalizeNFCUID(uid);
    return normalized.match(/.{1,2}/g)?.join(':') || normalized;
}
/**
 * Parse NFC NDEF message (if available)
 */
export function parseNDEFMessage(message) {
    try {
        if (!message || !message.records || message.records.length === 0) {
            return null;
        }
        const record = message.records[0];
        const decoder = new TextDecoder(record.encoding || 'utf-8');
        const data = decoder.decode(record.data);
        return {
            type: record.recordType,
            data,
            encoding: record.encoding,
        };
    }
    catch {
        return null;
    }
}
/**
 * Generate NFC tag URL for passport
 */
export function generateNFCTagURL(baseUrl, serial) {
    return `${baseUrl}/passport/${serial}`;
}
/**
 * Client-side NFC scanner helper (for documentation/reference)
 * This would be used in browser/React components
 */
export const NFCScannerClient = {
    /**
     * Check if NFC is supported in current browser
     */
    isSupported() {
        return typeof window !== 'undefined' && 'NDEFReader' in window;
    },
    /**
     * Example scan implementation (for documentation)
     */
    exampleScanImplementation: `
    async function scanNFC() {
      if (!('NDEFReader' in window)) {
        alert('NFC not supported on this device');
        return;
      }

      try {
        const reader = new NDEFReader();
        await reader.scan();

        reader.onreading = async (event) => {
          const { serialNumber } = event;
          
          // Verify via API
          const response = await fetch(\`/api/public/verify/nfc/\${serialNumber}\`);
          const result = await response.json();
          
          if (result.verified) {
            window.location.href = \`/passport/\${result.serial}\`;
          } else {
            alert(result.message);
          }
        };

        reader.onerror = (event) => {
          console.error('NFC read error:', event);
        };
      } catch (error) {
        console.error('Failed to start NFC scan:', error);
      }
    }
  `,
};
/**
 * NTAG chip type detection based on UID byte length
 */
export function detectNTAGType(uid) {
    const normalized = normalizeNFCUID(uid);
    const byteLength = normalized.length / 2;
    switch (byteLength) {
        case 4:
            return 'NTAG213/215/216 (Classic UID)';
        case 7:
            return 'NTAG213/215/216 (Random UID)';
        case 10:
            return 'NTAG424 DNA (Advanced)';
        default:
            return 'Unknown NTAG Type';
    }
}
export function performBasicSecurityCheck(uid, previousScans) {
    const result = {
        suspicious: false,
        reasons: [],
        recommendation: 'ACCEPT',
    };
    // Check UID format
    if (!validateNFCUID(uid)) {
        result.suspicious = true;
        result.reasons.push('Invalid NFC UID format');
        result.recommendation = 'REJECT';
    }
    // Check for impossible travel (if location data available)
    if (previousScans && previousScans.length >= 2) {
        const recent = previousScans.slice(-2);
        const timeDiff = recent[1].timestamp.getTime() - recent[0].timestamp.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        // If scanned in different locations within 5 minutes, flag as suspicious
        if (minutesDiff < 5 &&
            recent[0].location &&
            recent[1].location &&
            recent[0].location !== recent[1].location) {
            result.suspicious = true;
            result.reasons.push('Impossible travel detected between scans');
            result.recommendation = 'REVIEW';
        }
    }
    // Check for burst scanning (multiple scans in short time)
    if (previousScans && previousScans.length > 10) {
        const lastHour = previousScans.filter((scan) => Date.now() - scan.timestamp.getTime() < 60 * 60 * 1000);
        if (lastHour.length > 10) {
            result.suspicious = true;
            result.reasons.push('Unusual scan frequency detected');
            result.recommendation = 'REVIEW';
        }
    }
    return result;
}
