import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';

/**
 * Third-Party Verification API Service
 * Provides rate-limited, read-only endpoints for external verification systems
 */

export interface VerificationRequest {
  serial: string;
  method: 'serial' | 'nfc' | 'qr';
  nfc_uid?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface VerificationResponse {
  verified: boolean;
  serial: string;
  product_title: string;
  edition?: string;
  authenticated: boolean;
  status: 'ACTIVE' | 'LOST' | 'STOLEN' | 'REVOKED' | 'UNKNOWN';
  message: string;
  timestamp: string;
  // Public info only - no private data
}

/**
 * Verify a physical piece for third-party systems
 * Rate-limited and returns only public information
 */
export class VerificationAPIService {
  /**
   * Verify by serial number
   */
  static async verifyBySerial(shopId: string, serial: string): Promise<VerificationResponse> {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial } },
      include: {
        product_ref: true,
        passport: true,
        lost_reports: { where: { status: 'CONFIRMED' } },
      },
    });

    if (!piece) {
      return {
        verified: false,
        serial,
        product_title: 'Unknown',
        authenticated: false,
        status: 'UNKNOWN',
        message: 'Serial number not found in this registry.',
        timestamp: new Date().toISOString(),
      };
    }

    return this.buildResponse(piece);
  }

  /**
   * Verify by NFC UID
   */
  static async verifyByNFC(shopId: string, nfcUid: string): Promise<VerificationResponse> {
    const piece = await prisma.physicalPiece.findFirst({
      where: { shop_id: shopId, nfc_uid: nfcUid },
      include: {
        product_ref: true,
        passport: true,
        lost_reports: { where: { status: 'CONFIRMED' } },
      },
    });

    if (!piece) {
      return {
        verified: false,
        serial: 'Unknown',
        product_title: 'Unknown',
        authenticated: false,
        status: 'UNKNOWN',
        message: 'NFC tag not registered in this registry.',
        timestamp: new Date().toISOString(),
      };
    }

    return this.buildResponse(piece);
  }

  /**
   * Quick status check - minimal data for high-volume lookups
   */
  static async quickStatus(shopId: string, serial: string): Promise<{
    exists: boolean;
    status: 'ACTIVE' | 'LOST' | 'STOLEN' | 'REVOKED' | 'UNKNOWN';
  }> {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial } },
      include: {
        lost_reports: { where: { status: 'CONFIRMED' } },
      },
    });

    if (!piece) {
      return { exists: false, status: 'UNKNOWN' };
    }

    let status: VerificationResponse['status'] = 'ACTIVE';
    if (piece.lost_reports.length > 0) {
      status = piece.lost_reports[0].report_type === 'LOST' ? 'LOST' : 'STOLEN';
    } else if (piece.status === 'REVOKED') {
      status = 'REVOKED';
    }

    return { exists: true, status };
  }

  /**
   * Build standardized verification response
   */
  private static buildResponse(piece: any): VerificationResponse {
    // Determine status
    let status: VerificationResponse['status'] = 'ACTIVE';
    let message = 'Authentic piece verified.';

    if (piece.lost_reports?.length > 0) {
      status = piece.lost_reports[0].report_type === 'LOST' ? 'LOST' : 'STOLEN';
      message = 'This piece has been reported ' + (status === 'LOST' ? 'lost' : 'stolen');
    } else if (piece.status === 'REVOKED') {
      status = 'REVOKED';
      message = 'This digital identity is no longer active.';
    } else if (!piece.passport) {
      status = 'UNKNOWN';
      message = 'Digital passport not yet created.';
    }

    // Check if authenticated (has authentication events)
    const authenticated = piece.passport?.status === 'ACTIVE' && status === 'ACTIVE';

    return {
      verified: authenticated,
      serial: piece.serial,
      product_title: piece.product_ref.title,
      edition: piece.edition_number && piece.edition_total
        ? `${piece.edition_number}/${piece.edition_total}`
        : undefined,
      authenticated,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Batch verification for multiple serials
   */
  static async batchVerify(
    shopId: string,
    serials: string[]
  ): Promise<Array<{ serial: string; status: VerificationResponse['status'] }>> {
    const pieces = await prisma.physicalPiece.findMany({
      where: {
        shop_id: shopId,
        serial: { in: serials },
      },
      include: {
        lost_reports: { where: { status: 'CONFIRMED' } },
      },
    });

    const pieceMap = new Map(pieces.map(p => [p.serial, p]));

    return serials.map(serial => {
      const piece = pieceMap.get(serial);
      if (!piece) {
        return { serial, status: 'UNKNOWN' as const };
      }

      let status: VerificationResponse['status'] = 'ACTIVE';
      if (piece.lost_reports?.length > 0) {
        status = piece.lost_reports[0].report_type === 'LOST' ? 'LOST' : 'STOLEN';
      } else if (piece.status === 'REVOKED') {
        status = 'REVOKED';
      }

      return { serial, status };
    });
  }
}