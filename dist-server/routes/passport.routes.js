import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
router.get('/by-serial/:serial', async (req, res) => {
    const piece = await prisma.physicalPiece.findUnique({
        where: { serial: req.params.serial },
        include: {
            nfc_tag: true,
            service_records: { orderBy: { service_date: 'desc' } },
        },
    });
    if (!piece) {
        return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({
        success: true,
        data: {
            serial: piece.serial,
            model_name: piece.model_name,
            color: piece.color,
            material: piece.material,
            size: piece.size,
            hardware: piece.hardware,
            weight: piece.weight,
            manufacturing_year: piece.manufacturing_year,
            purchase_date: piece.purchase_date,
            warranty_until: piece.warranty_until,
            service_status: piece.service_status,
            has_service_history: piece.has_service_history,
            service_count: piece.service_count,
            last_service_date: piece.last_service_date,
            authentication_status: piece.authentication_status,
            tag_uid: piece.nfc_tag?.tag_uid || null,
            services: piece.service_records.map((s) => ({
                date: s.service_date,
                type: s.service_type,
                notes: s.notes,
            })),
        },
    });
});
router.get('/by-tag/:tagUid', async (req, res) => {
    const tag = await prisma.nfcTag.findUnique({
        where: { tag_uid: req.params.tagUid },
        include: {
            piece: {
                include: {
                    service_records: { orderBy: { service_date: 'desc' } },
                },
            },
        },
    });
    if (!tag || !tag.piece) {
        return res.status(404).json({ success: false, error: 'Tag not registered' });
    }
    const piece = tag.piece;
    res.json({
        success: true,
        data: {
            serial: piece.serial,
            model_name: piece.model_name,
            color: piece.color,
            material: piece.material,
            size: piece.size,
            hardware: piece.hardware,
            weight: piece.weight,
            manufacturing_year: piece.manufacturing_year,
            purchase_date: piece.purchase_date,
            warranty_until: piece.warranty_until,
            service_status: piece.service_status,
            has_service_history: piece.has_service_history,
            service_count: piece.service_count,
            last_service_date: piece.last_service_date,
            authentication_status: piece.authentication_status,
            tag_uid: tag.tag_uid,
            services: piece.service_records.map((s) => ({
                date: s.service_date,
                type: s.service_type,
                notes: s.notes,
            })),
        },
    });
});
export default router;
