import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/analytics/hub — high-level platform summary for Admin → Analytics Hub
router.get('/hub', requireRole('ADMIN'), async (_req: AuthRequest, res) => {
  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const d7 = new Date(now.getTime() - 7 * 86400000);

    const [totalUsers, activeStudents, totalTeachers, totalAdmins, activeLast30, totalCourses, totalBatches, subsTotal, subsLast30, subsLast7, gradedLast30] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { lastLoginAt: { gte: d30 } } }),
      prisma.course.count(),
      prisma.enrollment.findMany({ select: { batchCode: true }, distinct: ['batchCode'] }).then(r => r.filter(x => x.batchCode).length),
      prisma.submission.count({ where: { submittedAt: { not: null } } }),
      prisma.submission.count({ where: { submittedAt: { gte: d30 } } }),
      prisma.submission.count({ where: { submittedAt: { gte: d7 } } }),
      prisma.submission.count({ where: { submittedAt: { gte: d30 }, status: 'GRADED' } }),
    ]);

    // Top 5 courses by submissions in last 30 days
    const courseActivity = await prisma.submission.groupBy({
      by: ['assignmentId'],
      where: { submittedAt: { gte: d30 } },
      _count: { _all: true },
    });
    const asgToCourse = await prisma.assignment.findMany({
      where: { id: { in: courseActivity.map(c => c.assignmentId) } },
      select: { id: true, courseId: true, course: { select: { code: true, name: true } } },
    });
    const courseCountMap = new Map<string, { code: string; name: string; count: number }>();
    for (const c of courseActivity) {
      const asg = asgToCourse.find(a => a.id === c.assignmentId);
      if (!asg) continue;
      const key = asg.courseId;
      const entry = courseCountMap.get(key) ?? { code: asg.course.code, name: asg.course.name, count: 0 };
      entry.count += c._count._all;
      courseCountMap.set(key, entry);
    }
    const topCourses = Array.from(courseCountMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    return success(res, {
      users: { total: totalUsers, activeStudents, teachers: totalTeachers, admins: totalAdmins, activeLast30 },
      courses: { total: totalCourses, batches: totalBatches },
      submissions: { total: subsTotal, last30: subsLast30, last7: subsLast7, gradedLast30 },
      topCourses,
    });
  } catch (err) {
    console.error('Analytics hub error:', err);
    return error(res, 'Failed to load hub', 500);
  }
});

// GET /api/analytics/admin — deeper time-series + breakdowns for Admin → Admin Analytics
router.get('/admin', requireRole('ADMIN'), async (_req: AuthRequest, res) => {
  try {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);

    // Daily submission counts for last 30 days
    const recent = await prisma.submission.findMany({
      where: { submittedAt: { gte: d30 } },
      select: { submittedAt: true, status: true },
    });
    const dayMap = new Map<string, { total: number; graded: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(d30.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { total: 0, graded: 0 });
    }
    for (const s of recent) {
      if (!s.submittedAt) continue;
      const key = s.submittedAt.toISOString().slice(0, 10);
      if (!dayMap.has(key)) continue;
      const e = dayMap.get(key)!;
      e.total++;
      if (s.status === 'GRADED') e.graded++;
    }
    const timeseries = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

    // Per-course breakdown: submissions + enrolled-student count + avg graded score
    const courses = await prisma.course.findMany({ select: { id: true, code: true, name: true } });
    const perCourse = await Promise.all(courses.map(async c => {
      const [subCount, gradedAgg, enrolled] = await Promise.all([
        prisma.submission.count({ where: { assignment: { courseId: c.id }, submittedAt: { gte: d30 } } }),
        prisma.submission.aggregate({ where: { assignment: { courseId: c.id }, status: 'GRADED', submittedAt: { gte: d30 } }, _avg: { score: true }, _count: { _all: true } }),
        prisma.enrollment.count({ where: { courseId: c.id, role: 'STUDENT' } }),
      ]);
      return {
        code: c.code, name: c.name,
        subsLast30: subCount,
        avgScore: gradedAgg._avg.score != null ? Math.round(gradedAgg._avg.score * 10) / 10 : null,
        gradedCount: gradedAgg._count._all,
        enrolled,
      };
    }));

    // Teacher activity: last 30 days, who graded how many
    const teacherActivity = await prisma.submission.groupBy({
      by: ['gradedById'],
      where: { gradedById: { not: null }, submittedAt: { gte: d30 } },
      _count: { _all: true },
    });
    const teacherIds = teacherActivity.map(t => t.gradedById!).filter(Boolean);
    const teachers = await prisma.user.findMany({ where: { id: { in: teacherIds } }, select: { id: true, firstName: true, lastName: true } });
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const teacherStats = teacherActivity
      .map(t => ({ name: teacherMap.get(t.gradedById!) ? `${teacherMap.get(t.gradedById!)!.firstName} ${teacherMap.get(t.gradedById!)!.lastName}` : 'Unknown', count: t._count._all }))
      .sort((a, b) => b.count - a.count);

    // Data quality alerts
    const [usersNoEmail, enrollmentsNoBatch, subsNoDate] = await Promise.all([
      prisma.user.count({ where: { OR: [{ email: '' }, { email: { contains: 'no-email' } }] } }),
      prisma.enrollment.count({ where: { batchCode: null, role: 'STUDENT' } }),
      prisma.submission.count({ where: { submittedAt: null, score: { not: null } } }),
    ]);

    return success(res, {
      timeseries,
      perCourse: perCourse.sort((a, b) => b.subsLast30 - a.subsLast30),
      teacherStats,
      alerts: { usersNoEmail, enrollmentsNoBatch, subsNoDate },
    });
  } catch (err) {
    console.error('Analytics admin error:', err);
    return error(res, 'Failed to load admin analytics', 500);
  }
});

export default router;
