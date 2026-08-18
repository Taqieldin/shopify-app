import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
router.get('/', async (_req, res) => {
    const pieces = await prisma.physicalPiece.findMany({
        orderBy: { created_at: 'desc' },
        include: { nfc_tag: true },
    });
    res.json({ success: true, data: pieces });
});
router.get('/:id', async (req, res) => {
    const piece = await prisma.physicalPiece.findUnique({
        where: { id: req.params.id },
        include: { nfc_tag: true, service_records: { orderBy: { service_date: 'desc' } } },
    });
    if (!piece)
        return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: piece });
});
router.post('/', async (req, res) => {
    const { serial, model_name, color, material, size, hardware, weight, manufacturing_year, purchase_date, warranty_until, service_status, has_service_history, service_count, last_service_date, authentication_status, } = req.body;
    const piece = await prisma.physicalPiece.create({
        data: {
            serial,
            model_name,
            color,
            material,
            size,
            hardware,
            weight,
            manufacturing_year: Number(manufacturing_year),
            purchase_date: purchase_date ? new Date(purchase_date) : null,
            warranty_until: warranty_until ? new Date(warranty_until) : null,
            service_status: service_status || 'NOT_IN_SERVICE',
            has_service_history: has_service_history || false,
            service_count: Number(service_count) || 0,
            last_service_date: last_service_date ? new Date(last_service_date) : null,
            authentication_status: authentication_status || 'UNVERIFIED',
        },
    });
    res.status(201).json({ success: true, data: piece });
});
router.patch('/:id', async (req, res) => {
    const piece = await prisma.physicalPiece.update({
        where: { id: req.params.id },
        data: req.body,
    });
    res.json({ success: true, data: piece });
});
router.delete('/:id', async (req, res) => {
    await prisma.serviceRecord.deleteMany({ where: { piece_id: req.params.id } });
    await prisma.nfcTag.updateMany({ where: { piece_id: req.params.id }, data: { piece_id: null, status: 'UNREGISTERED' } });
    await prisma.physicalPiece.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
export default router;
