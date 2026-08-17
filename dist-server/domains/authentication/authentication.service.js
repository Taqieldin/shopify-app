import { prisma } from '../../infrastructure/database/client.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import { RiskEngine } from './risk-engine.js';
import { SecurityMonitorService } from '../../security/security-monitor.service.js';
import { NotificationService } from '../notifications/notification.service.js';
export class AuthenticationService {
    /**
     * Layered verification of a physical product piece with risk & telemetry analysis
     */
    static async verifyPiece(shop_id, dto) {
        const piece = await prisma.physicalPiece.findUnique({
            where: {
                shop_id_serial: {
                    shop_id,
                    serial: dto.serial,
                },
            },
            include: {
                product_ref: true,
                passport: true,
                ownerships: {
                    where: { is_active: true },
                    include: { customer: true },
                },
                lost_reports: {
                    where: { status: 'CONFIRMED' },
                },
            },
        });
        if (!piece) {
            throw new NotFoundError('Physical piece for serial', dto.serial);
        }
        // Enforce per-product verification method options (intersected with shop-level flags)
        await this.assertMethodEnabled(shop_id, piece.product_ref, dto.method);
        // Check if NFC UID is blocked
        if (dto.nfc_uid) {
            const isBlocked = await SecurityMonitorService.isNFCBlocked(shop_id, dto.nfc_uid);
            if (isBlocked) {
                // Log blocked attempt
                await prisma.authenticationEvent.create({
                    data: {
                        shop_id,
                        physical_piece_id: piece.id,
                        method: dto.method,
                        result: 'REVOKED',
                        risk_level: 'HIGH_RISK',
                        nfc_uid: dto.nfc_uid,
                        ip_hash: dto.ip_address ? `ip_${dto.ip_address.slice(0, 7)}` : undefined,
                        metadata_json: JSON.stringify({ reason: 'NFC_UID_BLOCKED' }),
                    },
                });
                return {
                    serial: piece.serial,
                    result: 'REVOKED',
                    is_genuine: false,
                    is_registered: false,
                    timestamp: new Date(),
                    product: {
                        title: piece.product_ref.title,
                        image_url: piece.product_ref.image_url,
                    },
                };
            }
            // Run security analysis for suspicious patterns
            const securityAlerts = await SecurityMonitorService.analyzeScan(shop_id, dto.serial, dto.nfc_uid, {
                ip: dto.ip_address,
                userAgent: dto.user_agent,
                location: { city: dto.city, country: dto.country },
            });
            // If critical alerts, log them
            if (securityAlerts.some((a) => a.level === 'CRITICAL' || a.level === 'HIGH')) {
                for (const alert of securityAlerts) {
                    await prisma.authenticationRiskEvent.create({
                        data: {
                            shop_id,
                            physical_piece_id: piece.id,
                            anomaly_type: alert.type,
                            severity: alert.level,
                            details_json: JSON.stringify(alert.details),
                        },
                    });
                }
            }
        }
        // Fetch recent authentication scans for telemetry analysis
        const recentScans = await prisma.authenticationEvent.findMany({
            where: {
                shop_id,
                physical_piece_id: piece.id,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
        });
        const isStolenOrLost = piece.lost_reports.length > 0;
        // Run behavioral & cryptographic risk analysis
        const telemetry = {
            timestamp: new Date(),
            ip_hash: dto.ip_address ? `ip_${dto.ip_address.slice(0, 7)}` : undefined,
            device_hash: dto.user_agent ? `dev_${dto.user_agent.slice(0, 10)}` : undefined,
            country: dto.country || 'Global',
            city: dto.city,
            nfc_read_counter: dto.nfc_read_counter,
        };
        const riskAnalysis = RiskEngine.evaluate(recentScans, telemetry, isStolenOrLost);
        // Determine verification state
        let result = 'AUTHENTICATED';
        if (piece.status === 'REVOKED' || piece.passport?.status === 'REVOKED') {
            result = 'REVOKED';
        }
        else if (isStolenOrLost || riskAnalysis.risk_level === 'HIGH_RISK') {
            result = 'SUSPICIOUS';
        }
        else if (piece.ownerships.length === 0) {
            result = 'UNREGISTERED';
        }
        // Record immutable authentication event
        const authEvent = await prisma.authenticationEvent.create({
            data: {
                shop_id,
                physical_piece_id: piece.id,
                method: dto.method,
                result,
                risk_level: riskAnalysis.risk_level,
                nfc_read_counter: dto.nfc_read_counter,
                ip_hash: telemetry.ip_hash,
                device_hash: telemetry.device_hash,
                country: telemetry.country,
                city: telemetry.city,
                metadata_json: JSON.stringify({
                    anomalies: riskAnalysis.anomalies,
                }),
            },
        });
        // If risk anomalies detected, log an internal risk event
        if (riskAnalysis.anomalies.length > 0) {
            for (const anomaly of riskAnalysis.anomalies) {
                await prisma.authenticationRiskEvent.create({
                    data: {
                        shop_id,
                        physical_piece_id: piece.id,
                        anomaly_type: anomaly.type,
                        severity: anomaly.severity,
                        details_json: JSON.stringify({ reason: anomaly.reason, event_id: authEvent.id }),
                    },
                });
            }
        }
        // Return safe customer response (never expose raw internal risk scores)
        // Alert the current owner that their piece was verified
        if (result === 'AUTHENTICATED' && piece.ownerships[0]?.customer?.email) {
            try {
                const shop = await prisma.shop.findUnique({
                    where: { id: shop_id },
                    include: { features: true },
                });
                if (shop?.features?.notifications_enabled) {
                    const owner = piece.ownerships[0].customer;
                    await NotificationService.send(shop_id, {
                        recipient_email: owner.email,
                        type: 'PIECE_VERIFIED',
                        subject: `Your piece ${piece.serial} was verified`,
                        data: {
                            serial: piece.serial,
                            method: dto.method,
                            country: telemetry.country,
                            city: telemetry.city,
                            timestamp: authEvent.created_at.toISOString(),
                            product_title: piece.product_ref.title,
                        },
                    });
                }
            }
            catch (notifyErr) {
                // Notification delivery must never break the verification response
            }
        }
        return {
            serial: piece.serial,
            result,
            is_genuine: result === 'AUTHENTICATED' || result === 'UNREGISTERED',
            is_registered: piece.ownerships.length > 0,
            timestamp: authEvent.created_at,
            product: {
                title: piece.product_ref.title,
                image_url: piece.product_ref.image_url,
            },
        };
    }
    /**
     * Resolve the effective verification methods for a product reference:
     * per-product configured methods (verification_methods JSON) intersected with
     * shop-level feature flags. MANUAL stays available as an admin override.
     */
    static async assertMethodEnabled(shop_id, productRef, method) {
        if (method === 'MANUAL')
            return;
        const shopFlags = await prisma.shopFeatureFlag.findUnique({
            where: { shop_id },
        });
        let configured = [];
        if (productRef.verification_methods) {
            try {
                configured = JSON.parse(productRef.verification_methods);
            }
            catch {
                configured = [];
            }
        }
        const shopAllowed = [];
        if (shopFlags?.nfc_enabled !== false)
            shopAllowed.push('NFC');
        if (shopFlags?.qr_enabled !== false)
            shopAllowed.push('QR');
        shopAllowed.push('SERIAL_LOOKUP');
        const effective = configured.filter((m) => shopAllowed.includes(m));
        if (!effective.includes(method)) {
            throw new ConflictError(`${method} verification is not enabled for this product. Enabled methods: ${effective.join(', ') || 'none'}.`);
        }
    }
    /**
     * Internal Admin inspection of authentication events and risk signals
     */
    static async getAdminAuthLogs(shop_id, options = {}) {
        const { limit = 50, offset = 0 } = options;
        return prisma.authenticationEvent.findMany({
            where: { shop_id },
            include: {
                physical_piece: {
                    include: { product_ref: true },
                },
            },
            orderBy: { created_at: 'desc' },
            take: Math.min(limit, 100),
            skip: offset,
        });
    }
    /**
     * List unresolved risk events for security operations
     */
    static async getRiskEvents(shop_id) {
        return prisma.authenticationRiskEvent.findMany({
            where: { shop_id, resolved: false },
            include: {
                physical_piece: {
                    include: { product_ref: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
}
