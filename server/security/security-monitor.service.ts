import { prisma } from '../infrastructure/database/client.js';

/**
 * Security Monitoring Service
 * Implements anomaly detection and security checks for NFC scans
 */

export interface SecurityAlert {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  serial: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface ScanPattern {
  serial: string;
  nfc_uid: string;
  scan_count: number;
  unique_locations: number;
  unique_ips: number;
  first_scan: Date;
  last_scan: Date;
  suspicious_indicators: string[];
}

export class SecurityMonitorService {
  /**
   * Analyze NFC scan for suspicious patterns
   */
  static async analyzeScan(
    shopId: string,
    serial: string,
    nfcUid: string,
    metadata: {
      ip?: string;
      userAgent?: string;
      location?: { city?: string; country?: string };
    }
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    // Get recent scan history for this piece
    const recentScans = await prisma.authenticationEvent.findMany({
      where: {
        shop_id: shopId,
        physical_piece_id: (
          await prisma.physicalPiece.findUnique({
            where: { shop_id_serial: { shop_id: shopId, serial } },
            select: { id: true },
          })
        )?.id,
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      orderBy: { created_at: 'desc' },
    });

    // 1. High-frequency scanning (burst attack)
    const lastHourScans = recentScans.filter(
      (s) => s.created_at.getTime() > Date.now() - 60 * 60 * 1000
    );

    if (lastHourScans.length > 10) {
      alerts.push({
        level: 'HIGH',
        type: 'HIGH_FREQUENCY_SCAN',
        message: `${lastHourScans.length} scans in the last hour - possible cloning attempt`,
        serial,
        details: { scan_count: lastHourScans.length, nfc_uid: nfcUid },
        timestamp: new Date(),
      });
    }

    // 2. Impossible travel detection
    if (metadata.location && recentScans.length > 0) {
      const impossibleTravel = this.detectImpossibleTravel(
        recentScans,
        metadata.location
      );

      if (impossibleTravel) {
        alerts.push({
          level: 'CRITICAL',
          type: 'IMPOSSIBLE_TRAVEL',
          message: impossibleTravel.message,
          serial,
          details: impossibleTravel.details,
          timestamp: new Date(),
        });
      }
    }

    // 3. Multiple IPs from same NFC UID (possible cloning)
    const uniqueIPs = new Set(recentScans.map((s) => s.ip_hash).filter(Boolean));
    if (uniqueIPs.size > 5) {
      alerts.push({
        level: 'HIGH',
        type: 'MULTIPLE_IP_ADDRESSES',
        message: `NFC UID scanned from ${uniqueIPs.size} different IP addresses`,
        serial,
        details: { unique_ips: uniqueIPs.size, nfc_uid: nfcUid },
        timestamp: new Date(),
      });
    }

    // 4. NFC UID change (tag replacement)
    const previousNfcUids = new Set(
      recentScans.map((s) => s.nfc_uid).filter(Boolean)
    );
    if (previousNfcUids.size > 1 && !previousNfcUids.has(nfcUid)) {
      alerts.push({
        level: 'CRITICAL',
        type: 'NFC_UID_MISMATCH',
        message: 'Different NFC UID detected for same serial - possible tag swap',
        serial,
        details: {
          current_uid: nfcUid,
          previous_uids: Array.from(previousNfcUids),
        },
        timestamp: new Date(),
      });
    }

    // 5. Unusual user agent patterns
    if (metadata.userAgent && this.isAutomatedScanner(metadata.userAgent)) {
      alerts.push({
        level: 'MEDIUM',
        type: 'AUTOMATED_SCANNER',
        message: 'Scan appears to be from automated tool',
        serial,
        details: { user_agent: metadata.userAgent },
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  /**
   * Detect impossible travel between scans
   */
  private static detectImpossibleTravel(
    recentScans: any[],
    currentLocation: { city?: string; country?: string }
  ): { message: string; details: Record<string, unknown> } | null {
    if (recentScans.length === 0 || !currentLocation.country) {
      return null;
    }

    const lastScan = recentScans[0];
    const timeDiff = (Date.now() - lastScan.created_at.getTime()) / (1000 * 60); // minutes

    // If previous scan was in different country within 30 minutes
    if (
      lastScan.country &&
      lastScan.country !== currentLocation.country &&
      timeDiff < 30
    ) {
      return {
        message: `Scanned in ${currentLocation.country} only ${Math.round(timeDiff)} minutes after scan in ${lastScan.country}`,
        details: {
          previous_country: lastScan.country,
          current_country: currentLocation.country,
          time_diff_minutes: Math.round(timeDiff),
        },
      };
    }

    return null;
  }

  /**
   * Detect automated scanning tools
   */
  private static isAutomatedScanner(userAgent: string): boolean {
    const automatedPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /postman/i,
    ];

    return automatedPatterns.some((pattern) => pattern.test(userAgent));
  }

  /**
   * Get scan pattern analysis for a serial
   */
  static async getScanPattern(
    shopId: string,
    serial: string
  ): Promise<ScanPattern | null> {
    const piece = await prisma.physicalPiece.findUnique({
      where: { shop_id_serial: { shop_id: shopId, serial } },
      select: { id: true, nfc_uid: true },
    });

    if (!piece) {
      return null;
    }

    const scans = await prisma.authenticationEvent.findMany({
      where: {
        shop_id: shopId,
        physical_piece_id: piece.id,
      },
      orderBy: { created_at: 'asc' },
    });

    if (scans.length === 0) {
      return null;
    }

    const uniqueLocations = new Set(
      scans.map((s) => `${s.city || ''},${s.country || ''}`).filter((l) => l !== ',')
    );

    const uniqueIPs = new Set(scans.map((s) => s.ip_hash).filter(Boolean));

    const suspiciousIndicators: string[] = [];

    // Check for suspicious patterns
    if (scans.length > 50) {
      suspiciousIndicators.push('HIGH_SCAN_COUNT');
    }

    if (uniqueIPs.size > 10) {
      suspiciousIndicators.push('MANY_UNIQUE_IPS');
    }

    if (uniqueLocations.size > 5) {
      suspiciousIndicators.push('MANY_LOCATIONS');
    }

    const avgTimeBetweenScans =
      (scans[scans.length - 1].created_at.getTime() - scans[0].created_at.getTime()) /
      scans.length;

    if (avgTimeBetweenScans < 60 * 1000) {
      // Less than 1 minute average
      suspiciousIndicators.push('HIGH_FREQUENCY');
    }

    return {
      serial,
      nfc_uid: piece.nfc_uid || '',
      scan_count: scans.length,
      unique_locations: uniqueLocations.size,
      unique_ips: uniqueIPs.size,
      first_scan: scans[0].created_at,
      last_scan: scans[scans.length - 1].created_at,
      suspicious_indicators: suspiciousIndicators,
    };
  }

  /**
   * Get all security alerts for a shop
   */
  static async getShopAlerts(
    shopId: string,
    options?: { level?: string; limit?: number }
  ): Promise<SecurityAlert[]> {
    // In production, store alerts in database
    // For now, analyze recent high-risk events

    const highRiskEvents = await prisma.authenticationRiskEvent.findMany({
      where: {
        shop_id: shopId,
        severity: options?.level || { in: ['HIGH', 'CRITICAL'] },
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      include: {
        physical_piece: {
          select: { serial: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: options?.limit || 50,
    });

    return highRiskEvents.map((event) => ({
      level: event.severity === 'CRITICAL' ? 'CRITICAL' : event.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      type: event.anomaly_type || 'UNKNOWN',
      message: event.notes || 'Suspicious activity detected',
      serial: event.physical_piece.serial,
      details: {
        event_id: event.id,
        created_at: event.created_at,
      },
      timestamp: event.created_at,
    }));
  }

  /**
   * Mark alert as reviewed
   */
  static async acknowledgeAlert(
    shopId: string,
    eventId: string,
    actorId: string,
    notes?: string
  ): Promise<void> {
    await prisma.authenticationRiskEvent.update({
      where: { id: eventId },
      data: {
        reviewed_by: actorId,
        reviewed_at: new Date(),
        notes: notes || 'Alert reviewed and acknowledged',
      },
    });
  }

  /**
   * Block a suspicious NFC UID
   */
  static async blockNFCUID(
    shopId: string,
    nfcUid: string,
    reason: string,
    actorId: string
  ): Promise<void> {
    // Add to blocklist
    await prisma.nFCBlocklist.create({
      data: {
        shop_id: shopId,
        nfc_uid: nfcUid,
        reason,
        blocked_by: actorId,
        blocked_at: new Date(),
      },
    });

    // Mark all pieces with this UID as suspicious
    await prisma.physicalPiece.updateMany({
      where: {
        shop_id: shopId,
        nfc_uid: nfcUid,
      },
      data: {
        status: 'UNDER_REVIEW',
      },
    });
  }

  /**
   * Check if NFC UID is blocked
   */
  static async isNFCBlocked(shopId: string, nfcUid: string): Promise<boolean> {
    const blocked = await prisma.nFCBlocklist.findFirst({
      where: {
        shop_id: shopId,
        nfc_uid: nfcUid,
        is_active: true,
      },
    });

    return blocked !== null;
  }
}
