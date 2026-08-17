import { prisma } from '../../infrastructure/database/client.js';

export class AnalyticsService {
  /**
   * Aggregate merchant analytics for embedded admin dashboard
   */
  static async getDashboardMetrics(shop_id: string) {
    const [
      totalPieces,
      registeredPieces,
      totalPassports,
      authEventsCount,
      riskEventsCount,
      activeMembersCount,
      creditsAggregate,
      transfersCount,
      servicesCount,
      stolenCount,
    ] = await Promise.all([
      prisma.physicalPiece.count({ where: { shop_id } }),
      prisma.physicalPiece.count({ where: { shop_id, status: 'REGISTERED' } }),
      prisma.passport.count({ where: { shop_id, status: 'ACTIVE' } }),
      prisma.authenticationEvent.count({ where: { shop_id } }),
      prisma.authenticationRiskEvent.count({ where: { shop_id, resolved: false } }),
      prisma.customer.count({ where: { shop_id } }),
      prisma.creditsLedger.aggregate({
        where: { shop_id },
        _sum: { amount: true },
      }),
      prisma.ownershipTransfer.count({ where: { shop_id, status: 'COMPLETED' } }),
      prisma.serviceCase.count({ where: { shop_id, status: 'COMPLETED' } }),
      prisma.lostStolenReport.count({ where: { shop_id, status: 'CONFIRMED' } }),
    ]);

    // Recent 5 authentication scan telemetry
    const recentScans = await prisma.authenticationEvent.findMany({
      where: { shop_id },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 6,
    });

    // Recent 5 ownership transfers
    const recentTransfers = await prisma.ownershipTransfer.findMany({
      where: { shop_id },
      include: {
        physical_piece: {
          include: { product_ref: true },
        },
        sender: true,
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    return {
      kpis: {
        total_pieces: totalPieces,
        registered_pieces: registeredPieces,
        registration_rate: totalPieces > 0 ? Math.round((registeredPieces / totalPieces) * 100) : 0,
        active_passports: totalPassports,
        total_scans: authEventsCount,
        unresolved_risks: riskEventsCount,
        active_collectors: activeMembersCount,
        total_credits_in_circulation: creditsAggregate._sum.amount || 0,
        completed_transfers: transfersCount,
        completed_services: servicesCount,
        flagged_stolen: stolenCount,
      },
      recent_scans: recentScans,
      recent_transfers: recentTransfers,
    };
  }
}
