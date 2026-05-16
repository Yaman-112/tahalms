import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, auditorScope, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';
import { getBatchScheduleMap } from '../lib/batchSchedule';

const router = Router();
router.use(authenticate);

// GET /api/enrollments?batchCode=AC01&courseId=xxx
router.get('/', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const batchCode = req.query.batchCode as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(5000, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    let where: any = {};
    if (batchCode) where.batchCode = batchCode;
    if (courseId) where.courseId = courseId;

    const scope = auditorScope(req);
    if (scope !== null) {
      where.user = { role: 'STUDENT', vNumber: { in: scope } };
    }

    // Teachers don't see hidden enrollments or enrollments in batches they
    // own which have been hidden (per the master-sheet sync). Admins do.
    if (req.user!.role === 'TEACHER') {
      where.hiddenFromTeacher = false;
      // Hide enrollments whose batch is hidden for this teacher.
      const hiddenBatchCodes = await prisma.batch.findMany({
        where: { teacherId: req.user!.userId, hiddenFromTeacher: true },
        select: { batchCode: true },
      });
      if (hiddenBatchCodes.length) {
        where.batchCode = where.batchCode
          ? { equals: where.batchCode, notIn: hiddenBatchCodes.map(b => b.batchCode) } as any
          : { notIn: hiddenBatchCodes.map(b => b.batchCode) };
      }
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, vNumber: true, campus: true } },
          course: {
            select: {
              id: true, name: true, code: true,
              modules: { select: { id: true, name: true, position: true, startDate: true, weight: true, hours: true }, orderBy: { position: 'asc' } },
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    // Get submission stats for these students in this course
    const userIds = enrollments.map(e => e.userId);
    const courseIds = [...new Set(enrollments.map(e => e.courseId))];

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: { in: userIds },
        assignment: { courseId: { in: courseIds } },
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
      select: { studentId: true, assignmentId: true, status: true, score: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, courseId: true, points: true },
    });

    // Build lookups
    const assignmentsByCourse = new Map<string, typeof assignments>();
    for (const a of assignments) {
      if (!assignmentsByCourse.has(a.courseId)) assignmentsByCourse.set(a.courseId, []);
      assignmentsByCourse.get(a.courseId)!.push(a);
    }

    const subsByStudent = new Map<string, typeof submissions>();
    for (const s of submissions) {
      if (!subsByStudent.has(s.studentId)) subsByStudent.set(s.studentId, []);
      subsByStudent.get(s.studentId)!.push(s);
    }

    const now = new Date();

    // Apply per-batch schedule overrides to each enrollment's modules
    const allBatchCodes = [...new Set(enrollments.map(e => e.batchCode).filter((b): b is string => !!b))];
    const allModuleIds = [...new Set(enrollments.flatMap(e => (e.course.modules || []).map((m: any) => m.id)))];
    const scheduleByBatch = new Map<string, Map<string, Date>>();
    for (const bc of allBatchCodes) {
      scheduleByBatch.set(bc, await getBatchScheduleMap(bc, allModuleIds));
    }

    // Enrich enrollments with progress
    const enriched = enrollments.map(e => {
      const courseAssignments = assignmentsByCourse.get(e.courseId) || [];
      const studentSubs = subsByStudent.get(e.userId) || [];
      const studentAssignmentIds = new Set(studentSubs.map(s => s.assignmentId));

      const completedAssignments = courseAssignments.filter(a => studentAssignmentIds.has(a.id)).length;
      const totalAssignments = courseAssignments.length;
      const assignmentProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      // Grade from graded submissions
      const gradedSubs = studentSubs.filter(s => s.status === 'GRADED' && s.score !== null);
      const totalScore = gradedSubs.reduce((sum, s) => sum + (s.score || 0), 0);
      const maxScore = courseAssignments
        .filter(a => gradedSubs.some(s => s.assignmentId === a.id))
        .reduce((sum, a) => sum + a.points, 0);
      const gradePct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null;

      // Module progress based on dates — apply per-batch override if present
      const overrides = e.batchCode ? scheduleByBatch.get(e.batchCode) : undefined;
      const rawModules = e.course.modules || [];
      const modules = overrides && overrides.size > 0
        ? rawModules.map((m: any) => overrides.has(m.id) ? { ...m, startDate: overrides.get(m.id) } : m)
        : rawModules;
      const totalModules = modules.length;
      const completedModules = modules.filter((m: any) => m.startDate && new Date(m.startDate) < now).length;
      const currentModule = modules.find((m: any, idx: number) => {
        if (!m.startDate) return false;
        const mStart = new Date(m.startDate);
        const nextMod = modules[idx + 1] as any;
        const mEnd = nextMod?.startDate ? new Date(nextMod.startDate) : new Date(mStart.getTime() + 14 * 86400000);
        return now >= mStart && now < mEnd;
      });

      return {
        ...e,
        course: { ...e.course, modules },
        progress: {
          completedAssignments,
          totalAssignments,
          assignmentProgress,
          gradePct,
          totalModules,
          completedModules,
          moduleProgress: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
          currentModuleName: (currentModule as any)?.name || null,
        },
      };
    });

    return success(res, { enrollments: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
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

// DELETE /api/enrollments/:id — unenroll a student from a course (admin only)
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Enrollment not found', 404);
    await prisma.enrollment.delete({ where: { id: req.params.id } });
    return success(res, { id: req.params.id });
  } catch (err) {
    console.error('Delete enrollment error:', err);
    return error(res, 'Failed to delete enrollment', 500);
  }
});

export default router;
