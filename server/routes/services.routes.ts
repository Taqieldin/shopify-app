import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const records = await prisma.serviceRecord.findMany({
    orderBy: { service_date: 'desc' },
    include: { piece: { select: { serial: true, model_name: true } } },
  });
  res.json({ success: true, data: records });
});

router.post('/', async (req, res) => {
  const { piece_id, service_date, service_type, notes } = req.body;

  const piece = await prisma.physicalPiece.findUnique({ where: { id: piece_id } });
  if (!piece) return res.status(404).json({ success: false, error: 'Piece not found' });

  const record = await prisma.serviceRecord.create({
    data: {
      piece_id,
      service_date: new Date(service_date),
      service_type,
      notes,
    },
  });

  await prisma.physicalPiece.update({
    where: { id: piece_id },
    data: {
      has_service_history: true,
      service_count: { increment: 1 },
      last_service_date: new Date(service_date),
    },
  });

  res.status(201).json({ success: true, data: record });
});

router.delete('/:id', async (req, res) => {
  await prisma.serviceRecord.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
