import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/batches — list all batches with course and teacher info
router.get('/', async (req: AuthRequest, res) => {
  try {
    const search = req.query.search as string | undefined;
    const courseId = req.query.courseId as string | undefined;

    const batchType = req.query.batchType as string | undefined;
    const parentBatchCode = req.query.parentBatchCode as string | undefined;

    let where: any = {};
    if (courseId) where.courseId = courseId;
    if (batchType) where.batchType = batchType;
    if (parentBatchCode) where.parentBatchCode = parentBatchCode;
    if (search) {
      where.OR = [
        { batchCode: { contains: search, mode: 'insensitive' } },
        { course: { name: { contains: search, mode: 'insensitive' } } },
        { teacher: { firstName: { contains: search, mode: 'insensitive' } } },
        { teacher: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const batches = await prisma.batch.findMany({
      where,
      orderBy: { batchCode: 'asc' },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return success(res, batches);
  } catch (err) {
    console.error('List batches error:', err);
    return error(res, 'Failed to list batches', 500);
  }
});

export default router;
