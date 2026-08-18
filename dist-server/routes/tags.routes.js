import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
router.get('/', async (_req, res) => {
    const tags = await prisma.nfcTag.findMany({
        orderBy: { registered_at: 'desc' },
        include: { piece: { select: { serial: true, model_name: true } } },
    });
    res.json({ success: true, data: tags });
});
router.post('/', async (req, res) => {
    const { tag_uid, tag_id } = req.body;
    const tag = await prisma.nfcTag.create({
        data: { tag_uid, tag_id },
    });
    res.status(201).json({ success: true, data: tag });
});
router.post('/assign', async (req, res) => {
    const { tag_id, piece_id } = req.body;
    const tag = await prisma.nfcTag.findUnique({ where: { tag_id } });
    if (!tag)
        return res.status(404).json({ success: false, error: 'Tag not found' });
    if (piece_id) {
        const piece = await prisma.physicalPiece.findUnique({ where: { id: piece_id } });
        if (!piece)
            return res.status(404).json({ success: false, error: 'Piece not found' });
    }
    const updated = await prisma.nfcTag.update({
        where: { tag_id },
        data: {
            piece_id: piece_id || null,
            status: piece_id ? 'ACTIVE' : 'UNREGISTERED',
        },
    });
    if (piece_id) {
        await prisma.physicalPiece.update({
            where: { id: piece_id },
            data: { nfc_tag_id: tag.id },
        });
    }
    res.json({ success: true, data: updated });
});
router.delete('/:id', async (req, res) => {
    const tag = await prisma.nfcTag.findUnique({ where: { id: req.params.id } });
    if (tag?.piece_id) {
        await prisma.physicalPiece.update({
            where: { id: tag.piece_id },
            data: { nfc_tag_id: null },
        });
    }
    await prisma.nfcTag.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
export default router;
