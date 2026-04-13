import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/assignments?courseId= — list assignments
router.get('/', async (req: AuthRequest, res) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const { role, userId } = req.user!;

    let where: any = {};
    if (courseId) {
      where.courseId = courseId;
    } else if (role !== 'ADMIN') {
      // Only show assignments from enrolled courses
      where.course = { enrollments: { some: { userId } } };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
        _count: { select: { submissions: true } },
      },
    });

    return success(res, assignments);
  } catch (err) {
    console.error('List assignments error:', err);
    return error(res, 'Failed to list assignments', 500);
  }
});

// GET /api/assignments/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        submissions: req.user!.role !== 'STUDENT'
          ? {
              include: {
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            }
          : { where: { studentId: req.user!.userId } },
      },
    });

    if (!assignment) return error(res, 'Assignment not found', 404);
    return success(res, assignment);
  } catch (err) {
    console.error('Get assignment error:', err);
    return error(res, 'Failed to get assignment', 500);
  }
});

// POST /api/assignments — create (teacher/admin)
router.post('/', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { courseId, title, description, type, points, dueDate } = req.body;

    if (!courseId || !title) {
      return error(res, 'courseId and title are required');
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title,
        description,
        type: type?.toUpperCase() === 'QUIZ' ? 'QUIZ' : 'ASSIGNMENT',
        points: points || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await createAuditLog({
      tableName: 'assignments',
      recordId: assignment.id,
      action: 'INSERT',
      newValues: { courseId, title, type, points, dueDate },
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, assignment, 201);
  } catch (err) {
    console.error('Create assignment error:', err);
    return error(res, 'Failed to create assignment', 500);
  }
});

// PATCH /api/assignments/:id — update (teacher/admin)
router.patch('/:id', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Assignment not found', 404);

    const updates = req.body;
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: updates,
    });

    await createAuditLog({
      tableName: 'assignments',
      recordId: req.params.id,
      action: 'UPDATE',
      oldValues: existing,
      newValues: updates,
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, assignment);
  } catch (err) {
    console.error('Update assignment error:', err);
    return error(res, 'Failed to update assignment', 500);
  }
});

export default router;
