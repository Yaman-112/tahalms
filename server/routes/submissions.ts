import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/submissions?studentId=&courseId=&assignmentId=
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;
    const studentId = req.query.studentId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const assignmentId = req.query.assignmentId as string | undefined;

    let where: any = {};

    // Students can only see their own submissions
    if (role === 'STUDENT') {
      where.studentId = userId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    if (courseId) {
      where.assignment = { courseId };
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        assignment: {
          select: { id: true, title: true, type: true, points: true, dueDate: true },
          include: { course: { select: { id: true, name: true, code: true } } },
        },
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        gradedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return success(res, submissions);
  } catch (err) {
    console.error('List submissions error:', err);
    return error(res, 'Failed to list submissions', 500);
  }
});

// POST /api/submissions — create/submit (student)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user!.userId;

    if (!assignmentId) {
      return error(res, 'assignmentId is required');
    }

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: { status: 'SUBMITTED', date: new Date() },
      create: { assignmentId, studentId, status: 'SUBMITTED', date: new Date() },
    });

    return success(res, submission, 201);
  } catch (err) {
    console.error('Create submission error:', err);
    return error(res, 'Failed to create submission', 500);
  }
});

// PATCH /api/submissions/:id/grade — grade a submission (teacher/admin)
router.patch('/:id/grade', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { score, feedback } = req.body;
    const { id } = req.params;

    const existing = await prisma.submission.findUnique({ where: { id } });
    if (!existing) return error(res, 'Submission not found', 404);

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback,
        status: 'GRADED',
        gradedById: req.user!.userId,
      },
    });

    await createAuditLog({
      tableName: 'submissions',
      recordId: id,
      action: 'UPDATE',
      oldValues: { score: existing.score, status: existing.status },
      newValues: { score, status: 'GRADED', feedback },
      changedById: req.user!.userId,
      reason: 'Grade submission',
      ipAddress: req.ip,
    });

    return success(res, submission);
  } catch (err) {
    console.error('Grade submission error:', err);
    return error(res, 'Failed to grade submission', 500);
  }
});

export default router;
