import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';
import { getProgramSchedule, getScheduleEntryFor } from '../data/program-schedules';

const router = Router();
router.use(authenticate);

// GET /api/modules/current-program?courseId=... — returns the program module
// (per the static program schedule) the cohort is studying this week. Filler
// modules are excluded by construction. Returns { module, weekStart } or
// { module: null } when the course has no schedule or it's a break week.
router.get('/current-program', async (req: AuthRequest, res) => {
  try {
    const courseId = String(req.query.courseId || '');
    if (!courseId) return error(res, 'courseId is required');

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return error(res, 'Course not found', 404);

    const sched = getProgramSchedule(course.code);
    if (!sched) return success(res, { module: null, reason: 'no-schedule' });

    const entry = getScheduleEntryFor(sched.schedule, new Date());
    if (!entry || !entry.programModule) {
      return success(res, { module: null, weekStart: entry?.weekStart || null, reason: entry ? 'break' : 'before-schedule' });
    }

    const dbName = sched.nameMap[entry.programModule] || entry.programModule;
    const mod = await prisma.module.findFirst({
      where: { courseId, name: dbName },
      select: { id: true, name: true, position: true },
    });
    if (!mod) return success(res, { module: null, weekStart: entry.weekStart, scheduleName: entry.programModule, reason: 'module-missing' });

    return success(res, {
      module: mod,
      weekStart: entry.weekStart,
      scheduleName: entry.programModule,
    });
  } catch (err) {
    console.error('current-program error:', err);
    return error(res, 'Failed to resolve current program module', 500);
  }
});

// GET /api/modules/:id/budgets — list all kind/maxPoints rows for a module
// plus how many points are already used and how many remain.
router.get('/:id/budgets', async (req: AuthRequest, res) => {
  try {
    const moduleId = req.params.id;
    const mod = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) return error(res, 'Module not found', 404);

    const budgets = await prisma.moduleAssessmentBudget.findMany({
      where: { moduleId },
      orderBy: { kind: 'asc' },
    });

    if (budgets.length === 0) return success(res, { budgets: [], hasBudgets: false });

    const usage = await prisma.assignment.groupBy({
      by: ['assessmentKind'],
      where: { moduleId, assessmentKind: { not: null } },
      _sum: { points: true },
    });
    const usedByKind = new Map<string, number>();
    for (const u of usage) {
      if (u.assessmentKind) usedByKind.set(u.assessmentKind, u._sum.points || 0);
    }

    const out = budgets.map(b => {
      const used = usedByKind.get(b.kind) || 0;
      return {
        kind: b.kind,
        maxPoints: b.maxPoints,
        used,
        remaining: Math.max(0, b.maxPoints - used),
      };
    });
    return success(res, { budgets: out, hasBudgets: true });
  } catch (err) {
    console.error('Get module budgets error:', err);
    return error(res, 'Failed to get module budgets', 500);
  }
});

// GET /api/modules/:id/budget?kind=FINAL — single-kind budget summary
router.get('/:id/budget', async (req: AuthRequest, res) => {
  try {
    const moduleId = req.params.id;
    const kind = (req.query.kind as string || '').toUpperCase();
    if (!['FINAL', 'PARTICIPATION', 'ASSIGNMENT', 'QUIZ'].includes(kind)) {
      return error(res, 'kind must be one of FINAL, PARTICIPATION, ASSIGNMENT, QUIZ');
    }
    const budget = await prisma.moduleAssessmentBudget.findUnique({
      where: { moduleId_kind: { moduleId, kind: kind as any } },
    });
    if (!budget) return success(res, { hasBudget: false });

    const used = await prisma.assignment.aggregate({
      where: { moduleId, assessmentKind: kind as any },
      _sum: { points: true },
    });
    const usedPts = used._sum.points || 0;
    return success(res, {
      hasBudget: true,
      kind,
      maxPoints: budget.maxPoints,
      used: usedPts,
      remaining: Math.max(0, budget.maxPoints - usedPts),
    });
  } catch (err) {
    console.error('Get budget error:', err);
    return error(res, 'Failed to get budget', 500);
  }
});

// PUT /api/modules/:id/budgets — admin edits the spec for a module.
// Body: { budgets: [{kind, maxPoints}, ...] } — replaces all rows for the module.
router.put('/:id/budgets', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const moduleId = req.params.id;
    const incoming: Array<{ kind: string; maxPoints: number }> = req.body.budgets || [];
    const valid = incoming.filter(b =>
      ['FINAL', 'PARTICIPATION', 'ASSIGNMENT', 'QUIZ'].includes((b.kind || '').toUpperCase())
      && typeof b.maxPoints === 'number' && b.maxPoints >= 0
    ).map(b => ({ kind: b.kind.toUpperCase() as any, maxPoints: b.maxPoints }));

    await prisma.moduleAssessmentBudget.deleteMany({ where: { moduleId } });
    if (valid.length > 0) {
      await prisma.moduleAssessmentBudget.createMany({
        data: valid.map(b => ({ moduleId, kind: b.kind, maxPoints: b.maxPoints })),
      });
    }
    return success(res, { count: valid.length });
  } catch (err) {
    console.error('Put budgets error:', err);
    return error(res, 'Failed to update budgets', 500);
  }
});

export default router;
