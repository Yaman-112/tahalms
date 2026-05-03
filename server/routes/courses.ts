import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/courses — list courses for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 25);
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    let where: any = {};

    // Admin sees all courses, others see only enrolled
    if (role !== 'ADMIN') {
      where.enrollments = { some: { userId } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrollments: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
          _count: { select: { assignments: true, enrollments: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const formatted = courses.map(course => ({
      ...course,
      teachers: course.enrollments
        .filter(e => e.role === 'TEACHER')
        .map(e => {
          const first = e.user.firstName ?? '';
          const last = e.user.lastName ?? '';
          const initial = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?';
          return { id: e.user.id, name: `${first} ${last}`.trim() || 'Unknown', initial };
        }),
      studentCount: course.enrollments.filter(e => e.role === 'STUDENT').length,
      enrollments: undefined,
    }));

    return success(res, { courses: formatted, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List courses error:', err);
    return error(res, 'Failed to list courses', 500);
  }
});

// GET /api/courses/:id — get single course with details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    // For TEACHER: pre-resolve batch codes they teach in this course so
    // submissions can be scoped to their own students only.
    let teacherBatchCodes: string[] | null = null;
    if (req.user!.role === 'TEACHER') {
      const myBatches = await prisma.batch.findMany({
        where: { teacherId: req.user!.userId, courseId: req.params.id },
        select: { batchCode: true },
      });
      teacherBatchCodes = myBatches.map(b => b.batchCode);
    }

    const studentSubmissionFilter = req.user!.role === 'STUDENT'
      ? { where: { studentId: req.user!.userId }, select: { id: true, studentId: true, score: true, status: true, feedback: true } }
      : req.user!.role === 'TEACHER'
      ? {
          where: {
            student: {
              enrollments: {
                some: {
                  courseId: req.params.id,
                  batchCode: { in: teacherBatchCodes || [] },
                },
              },
            },
          },
          select: { id: true, studentId: true, score: true, status: true },
        }
      : { select: { id: true, studentId: true, score: true, status: true } };

    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        modules: { orderBy: { position: 'asc' } },
        assignments: {
          orderBy: { dueDate: 'asc' },
          include: { submissions: studentSubmissionFilter as any },
        },
        enrollments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!course) {
      return error(res, 'Course not found', 404);
    }

    // Check access: admin or enrolled
    if (req.user!.role !== 'ADMIN') {
      const enrolled = course.enrollments.some(e => e.userId === req.user!.userId);
      if (!enrolled) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, course);
  } catch (err) {
    console.error('Get course error:', err);
    return error(res, 'Failed to get course', 500);
  }
});

// POST /api/courses — create course (admin/teacher)
router.post('/', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { name, code, description, color, status, term, subAccount } = req.body;

    if (!name || !code) {
      return error(res, 'Name and code are required');
    }

    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      return error(res, 'A course with this code already exists');
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        description,
        color: color || '#2D3B45',
        status: status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED',
        term: term || 'Default Term',
        subAccount: subAccount || 'TAHA College',
      },
    });

    await createAuditLog({
      tableName: 'courses',
      recordId: course.id,
      action: 'INSERT',
      newValues: { name, code },
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, course, 201);
  } catch (err) {
    console.error('Create course error:', err);
    return error(res, 'Failed to create course', 500);
  }
});

// PATCH /api/courses/:id — update course (admin/teacher)
router.patch('/:id', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return error(res, 'Course not found', 404);

    const course = await prisma.course.update({ where: { id }, data: updates });

    await createAuditLog({
      tableName: 'courses',
      recordId: id,
      action: 'UPDATE',
      oldValues: existing,
      newValues: updates,
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, course);
  } catch (err) {
    console.error('Update course error:', err);
    return error(res, 'Failed to update course', 500);
  }
});

// POST /api/courses/:id/enroll — enroll user in course (admin)
router.post('/:id/enroll', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { userId, role } = req.body;
    const courseId = req.params.id;

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { role: role?.toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT' },
      create: { userId, courseId, role: role?.toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT' },
    });

    return success(res, enrollment, 201);
  } catch (err) {
    console.error('Enroll error:', err);
    return error(res, 'Failed to enroll user', 500);
  }
});

export default router;
