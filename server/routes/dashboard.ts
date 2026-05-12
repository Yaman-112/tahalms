import { Router } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/dashboard — dashboard data for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'ADMIN') {
      return getAdminDashboard(req, res);
    } else if (role === 'TEACHER') {
      return getTeacherDashboard(req, res);
    } else {
      return getStudentDashboard(req, res);
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    return error(res, 'Failed to load dashboard', 500);
  }
});

async function getStudentDashboard(req: AuthRequest, res: any) {
  const userId = req.user!.userId;

  // Resolve the student's (courseId, batchCode) so we can scope targeted
  // assignments to ones they're actually allowed to see.
  const myEnrollments = await prisma.enrollment.findMany({
    where: { userId, role: 'STUDENT' },
    select: { courseId: true, batchCode: true },
  });
  const myBatchCodes = Array.from(new Set(myEnrollments.map(e => e.batchCode).filter((b): b is string => !!b)));

  const [profile, enrollments, todoItems, recentGrades, upcomingAssignments] = await Promise.all([
    // Student profile
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, vNumber: true,
        contactNo: true, address: true, campus: true, program: true,
        startDate: true, finishDate: true, shift: true, campusStatus: true,
      },
    }),

    // All enrollments with batch, schedule, fees, and progress info
    prisma.enrollment.findMany({
      where: { userId, role: 'STUDENT' },
      include: {
        course: {
          select: {
            id: true, name: true, code: true, color: true,
            _count: { select: { assignments: true } },
            modules: { orderBy: { position: 'asc' }, select: { id: true, name: true, position: true, weight: true, startDate: true, hours: true } },
          },
        },
        studentProgress: { orderBy: { moduleId: 'asc' } },
      },
      orderBy: { enrolledAt: 'desc' },
    }),

    // To-do: assignments with submissions
    prisma.submission.findMany({
      where: { studentId: userId },
      orderBy: { date: 'asc' },
      include: {
        assignment: {
          include: { course: { select: { id: true, name: true, code: true, color: true } } },
        },
      },
    }),

    // Recent grades
    prisma.submission.findMany({
      where: { studentId: userId, status: 'GRADED' },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        assignment: {
          include: { course: { select: { id: true, name: true, code: true } } },
        },
      },
    }),

    // Upcoming + recently-overdue-unsubmitted assignments. The frontend
    // splits these into two buckets (Coming Up vs Overdue) by comparing
    // dueDate to now.
    prisma.assignment.findMany({
      where: {
        course: { enrollments: { some: { userId } } },
        published: true,
        dueDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days for overdue
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // next 14 days upcoming
        },
        // Honor AssignmentTarget visibility: untargeted (course-wide) OR
        // targeted to one of the student's batches OR to the student.
        OR: [
          { targets: { none: {} } },
          { targets: { some: { kind: 'STUDENT', targetId: userId } } },
          ...(myBatchCodes.length > 0
            ? [{ targets: { some: { kind: 'BATCH' as const, targetId: { in: myBatchCodes } } } }]
            : []),
        ],
        // Hide assignments the student has already completed
        NOT: {
          submissions: { some: { studentId: userId, status: { in: ['SUBMITTED', 'GRADED'] } } },
        },
      },
      orderBy: { dueDate: 'asc' },
      include: { course: { select: { id: true, name: true, code: true, color: true } } },
    }),
  ]);

  // Look up the teacher for each enrollment via its (courseId, batchCode).
  const batchKeys = enrollments
    .filter(e => e.batchCode)
    .map(e => ({ courseId: e.courseId, batchCode: e.batchCode! }));
  const batchTeachers = batchKeys.length === 0 ? [] : await prisma.batch.findMany({
    where: { OR: batchKeys.map(k => ({ courseId: k.courseId, batchCode: k.batchCode })) },
    select: {
      courseId: true, batchCode: true,
      teacher: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
    },
  });
  const teacherByKey = new Map<string, any>();
  for (const b of batchTeachers) teacherByKey.set(`${b.courseId}::${b.batchCode}`, b.teacher);

  const enrollmentsWithTeacher = enrollments.map(e => ({
    ...e,
    teacher: e.batchCode ? teacherByKey.get(`${e.courseId}::${e.batchCode}`) ?? null : null,
  }));

  return success(res, {
    profile,
    enrollments: enrollmentsWithTeacher,
    todoItems,
    recentGrades,
    upcomingAssignments,
  });
}

async function getTeacherDashboard(req: AuthRequest, res: any) {
  const userId = req.user!.userId;

  const [profile, batches, publishedCourses, unpublishedCourses, todoItems, upcoming] = await Promise.all([
    // Teacher profile
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    }),

    // Teacher's assigned batches with student counts and progress
    prisma.batch.findMany({
      where: { teacherId: userId, hiddenFromTeacher: false },
      include: {
        course: {
          select: { id: true, name: true, code: true, color: true, modules: { select: { id: true, position: true, name: true }, orderBy: { position: 'asc' } } },
        },
      },
      orderBy: { batchCode: 'asc' },
    }).then(async (teacherBatches) => {
      // Count students per (courseId, batchCode) — only role=STUDENT, and
      // scoped to the batch's own course so same-named batches in other
      // courses don't bleed into the count.
      const counts = await prisma.enrollment.groupBy({
        by: ['courseId', 'batchCode'],
        where: {
          role: 'STUDENT',
          hiddenFromTeacher: false,
          OR: teacherBatches.map(b => ({ courseId: b.courseId, batchCode: b.batchCode })),
        },
        _count: true,
      });
      const countMap: Record<string, number> = {};
      counts.forEach(c => { if (c.batchCode) countMap[`${c.courseId}::${c.batchCode}`] = c._count; });

      // Get progress stats per batch
      const progressCounts = await prisma.studentProgress.groupBy({
        by: ['batchId', 'status'],
        where: { batchId: { in: teacherBatches.map(b => b.id) } },
        _count: true,
      });
      const progressMap: Record<string, Record<string, number>> = {};
      progressCounts.forEach(p => {
        if (!progressMap[p.batchId]) progressMap[p.batchId] = {};
        progressMap[p.batchId][p.status] = p._count;
      });

      return teacherBatches.map(b => {
        const pm = progressMap[b.id] || {};
        const totalModules = b.course.modules.length;
        let currentModulePos = 0;
        if (b.startDate && b.durationWeeks && totalModules > 0) {
          const weeksPerMod = b.durationWeeks / totalModules;
          const weeksElapsed = (Date.now() - b.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
          currentModulePos = Math.min(Math.floor(weeksElapsed / weeksPerMod) + 1, totalModules);
        }
        const currentModule = b.course.modules.find(m => m.position === currentModulePos);

        return {
          ...b,
          studentCount: countMap[`${b.courseId}::${b.batchCode}`] || 0,
          currentModulePosition: currentModulePos,
          currentModuleName: currentModule?.name || null,
          totalModules,
          progressStats: { completed: pm.COMPLETED || 0, inProgress: pm.IN_PROGRESS || 0, notStarted: pm.NOT_STARTED || 0 },
        };
      });
    }),

    prisma.course.findMany({
      where: { batches: { some: { teacherId: userId, hiddenFromTeacher: false } }, status: 'PUBLISHED' },
      include: { _count: { select: { enrollments: true, assignments: true } } },
    }),

    prisma.course.findMany({
      where: { batches: { some: { teacherId: userId, hiddenFromTeacher: false } }, status: 'UNPUBLISHED' },
      include: { _count: { select: { enrollments: true } } },
    }),

    // Submissions needing grading
    prisma.submission.findMany({
      where: {
        status: 'SUBMITTED',
        assignment: { course: { batches: { some: { teacherId: userId, hiddenFromTeacher: false } } } },
      },
      take: 10,
      include: {
        assignment: { include: { course: { select: { name: true, code: true } } } },
        student: { select: { firstName: true, lastName: true } },
      },
    }),

    // Upcoming assignments
    prisma.assignment.findMany({
      where: {
        course: { batches: { some: { teacherId: userId, hiddenFromTeacher: false } } },
        dueDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: 'asc' },
      include: { course: { select: { name: true, code: true } } },
    }),
  ]);

  return success(res, { profile, batches, publishedCourses, unpublishedCourses, todoItems, upcoming });
}

async function getAdminDashboard(req: AuthRequest, res: any) {
  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    publishedCourses,
    recentImports,
    upcoming,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
    prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
    prisma.course.count(),
    prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { role: 'TEACHER' },
          take: 2,
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    Promise.resolve([]), // imports hidden
    prisma.assignment.findMany({
      where: { dueDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      take: 10,
      orderBy: { dueDate: 'asc' },
      include: { course: { select: { name: true, code: true } } },
    }),
  ]);

  return success(res, {
    stats: { totalStudents, totalTeachers, totalCourses },
    publishedCourses,
    recentImports,
    upcoming,
  });
}

export default router;
