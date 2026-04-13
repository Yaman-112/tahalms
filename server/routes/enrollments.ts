import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/enrollments?batchCode=AC01&courseId=xxx
router.get('/', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const batchCode = req.query.batchCode as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    let where: any = {};
    if (batchCode) where.batchCode = batchCode;
    if (courseId) where.courseId = courseId;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, vNumber: true } },
          course: { select: { id: true, name: true, code: true, modules: { select: { id: true, name: true, position: true }, orderBy: { position: 'asc' } } } },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return success(res, { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List enrollments error:', err);
    return error(res, 'Failed to list enrollments', 500);
  }
});

// GET /api/enrollments/batch-summary — summary stats per batch
router.get('/batch-summary', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { batchCode: 'asc' },
      include: {
        course: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const enrollmentCounts = await prisma.enrollment.groupBy({
      by: ['batchCode'],
      _count: true,
    });
    const countMap: Record<string, number> = {};
    enrollmentCounts.forEach(e => { if (e.batchCode) countMap[e.batchCode] = e._count; });

    const result = batches.map(b => ({
      ...b,
      studentCount: countMap[b.batchCode] || 0,
    }));

    return success(res, result);
  } catch (err) {
    console.error('Batch summary error:', err);
    return error(res, 'Failed to get batch summary', 500);
  }
});

export default router;
