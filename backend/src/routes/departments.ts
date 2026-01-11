import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// GET /api/departments - list all departments
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const list = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: list });
  })
);

export default router;
