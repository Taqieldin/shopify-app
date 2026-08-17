import crypto from 'crypto';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { AuditService } from '../audit/audit.service.js';
export class CareService {
    /**
     * Create a care & restoration service ticket for a physical piece
     */
    static async createServiceCase(shop_id, dto, actor_id) {
        const piece = await prisma.physicalPiece.findUnique({
            where: {
                shop_id_serial: { shop_id, serial: dto.serial },
            },
            include: {
                ownerships: {
                    where: { is_active: true },
                },
            },
        });
        if (!piece) {
            throw new NotFoundError('PhysicalPiece', dto.serial);
        }
        const activeOwner = piece.ownerships[0];
        const caseNumber = `SRV-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const serviceCase = await prisma.serviceCase.create({
            data: {
                shop_id,
                case_number: caseNumber,
                physical_piece_id: piece.id,
                customer_id: activeOwner?.customer_id || null,
                service_type: dto.service_type,
                status: 'RECEIVED',
                technician_name: dto.technician_name,
                cost_amount: dto.cost_amount || 0,
                warranty_covered: dto.warranty_covered || false,
                internal_notes: dto.internal_notes,
                customer_notes: dto.customer_notes || 'Service request received at our atelier.',
                photos_json: dto.photos ? JSON.stringify(dto.photos) : null,
            },
            include: {
                physical_piece: {
                    include: { product_ref: true },
                },
            },
        });
        // Update piece status to SERVICED
        await prisma.physicalPiece.update({
            where: { id: piece.id },
            data: { status: 'SERVICED' },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id,
            action: 'SERVICE_CASE_CREATED',
            resource_type: 'SERVICE_CASE',
            resource_id: serviceCase.id,
            metadata: { serial: piece.serial, case_number: caseNumber },
        });
        return serviceCase;
    }
    /**
     * Update service case status and add notes
     */
    static async updateServiceCase(shop_id, case_id, updates, actor_id) {
        const updated = await prisma.serviceCase.update({
            where: { id: case_id },
            data: {
                ...updates,
                completed_date: updates.status === 'COMPLETED' ? new Date() : updates.completed_date,
            },
        });
        await AuditService.log({
            shop_id,
            actor_type: 'MERCHANT_ADMIN',
            actor_id,
            action: 'SERVICE_CASE_UPDATED',
            resource_type: 'SERVICE_CASE',
            resource_id: updated.id,
            metadata: updates,
        });
        return updated;
    }
    /**
     * List all service cases for embedded admin
     */
    static async listServiceCases(shop_id) {
        return prisma.serviceCase.findMany({
            where: { shop_id },
            include: {
                physical_piece: {
                    include: { product_ref: true },
                },
                customer: true,
            },
            orderBy: { received_date: 'desc' },
        });
    }
}
