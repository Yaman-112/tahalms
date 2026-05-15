import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 30 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DRY_RUN = !process.argv.includes('--write');
const CONCURRENCY = 20;
const COURSE_CODES = ['IBA', 'AC', 'CSW', 'HT', 'HAIR', 'MD', 'MOA', 'PSW', 'ECA'];

type CourseCtx = {
  id: string;
  code: string;
  modules: { id: string; name: string; position: number; weight: number | null }[];
  assignmentsByModule: Map<string, { id: string; title: string; points: number }[]>;
};

async function buildCourseCtx(code: string): Promise<CourseCtx | null> {
  const course = await prisma.course.findUnique({
    where: { code },
    include: {
      modules: { orderBy: { position: 'asc' } },
      assignments: true,
    },
  });
  if (!course) return null;

  const assignmentsByModule = new Map<string, { id: string; title: string; points: number }[]>();
  for (const mod of course.modules) {
    const prefix = `${mod.name} - `;
    const matched = course.assignments
      .filter(a => (a.title.startsWith(prefix) || a.title === mod.name) && a.countsTowardGrade)
      .map(a => ({ id: a.id, title: a.title, points: a.points }));
    assignmentsByModule.set(mod.id, matched);
  }

  return {
    id: course.id,
    code: course.code,
    modules: course.modules.map(m => ({ id: m.id, name: m.name, position: m.position, weight: m.weight })),
    assignmentsByModule,
  };
}

async function run() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}\n`);

  const contexts: CourseCtx[] = [];
  for (const code of COURSE_CODES) {
    const ctx = await buildCourseCtx(code);
    if (!ctx) { console.log(`  ⚠ Course ${code} not found, skipping`); continue; }
    const modulesWithAssignments = Array.from(ctx.assignmentsByModule.values()).filter(a => a.length > 0).length;
    console.log(`  ${ctx.code.padEnd(5)}  modules: ${ctx.modules.length}  with assignments: ${modulesWithAssignments}`);
    contexts.push(ctx);
  }
  console.log();

  // Get all enrollments in these courses (student role)
  const courseIds = contexts.map(c => c.id);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds }, role: 'STUDENT' },
    select: { id: true, userId: true, courseId: true, batchCode: true, joinedModulePosition: true },
  });
  console.log(`Loaded ${enrollments.length} enrollments`);

  // Build batchCode → batchId map for the batches in our courses
  const batches = await prisma.batch.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, batchCode: true, courseId: true },
  });
  const batchByCode = new Map(batches.map(b => [b.batchCode, b]));
  const firstBatchByCourse = new Map<string, string>();
  for (const b of batches) {
    if (!firstBatchByCourse.has(b.courseId)) firstBatchByCourse.set(b.courseId, b.id);
  }
  console.log(`Loaded ${batches.length} batches`);

  // For efficiency, pre-load all submissions for these enrollments' students in these courses
  const userIds = Array.from(new Set(enrollments.map(e => e.userId)));
  console.log(`Loading submissions for ${userIds.length} unique students...`);

  // Load in chunks to avoid big IN clauses
  const submissions: { studentId: string; assignmentId: string; score: number | null; status: string }[] = [];
  const CHUNK = 500;
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const batch = await prisma.submission.findMany({
      where: {
        studentId: { in: userIds.slice(i, i + CHUNK) },
        assignment: { courseId: { in: courseIds } },
        status: 'GRADED',
      },
      select: { studentId: true, assignmentId: true, score: true, status: true },
    });
    submissions.push(...batch);
  }
  console.log(`Loaded ${submissions.length} graded submissions\n`);

  // Index: studentId → assignmentId → score
  const subByStudent = new Map<string, Map<string, number>>();
  for (const s of submissions) {
    if (s.score === null) continue;
    if (!subByStudent.has(s.studentId)) subByStudent.set(s.studentId, new Map());
    subByStudent.get(s.studentId)!.set(s.assignmentId, s.score);
  }

  const ctxByCourseId = new Map(contexts.map(c => [c.id, c] as const));

  // Build all upsert tasks
  type Task = {
    enrollmentId: string;
    batchId: string;
    moduleId: string;
    status: 'COMPLETED' | 'IN_PROGRESS';
    moduleScore: number;
  };
  const tasks: Task[] = [];
  const enrollmentsToRecalc = new Set<string>();
  let enrollmentsSkippedNoBatch = 0;
  let enrollmentsWithAnyProgress = 0;

  for (const e of enrollments) {
    const ctx = ctxByCourseId.get(e.courseId);
    if (!ctx) continue;

    // Pick batch: enrollment's batchCode if exists, else first batch in course
    let batchId: string | undefined;
    if (e.batchCode && batchByCode.has(e.batchCode)) batchId = batchByCode.get(e.batchCode)!.id;
    else batchId = firstBatchByCourse.get(e.courseId);
    if (!batchId) { enrollmentsSkippedNoBatch++; continue; }

    const studentSubs = subByStudent.get(e.userId);
    if (!studentSubs || studentSubs.size === 0) continue;

    let hasAnyProgress = false;
    for (const mod of ctx.modules) {
      const modAssignments = ctx.assignmentsByModule.get(mod.id) || [];
      if (modAssignments.length === 0) continue;

      let totalScore = 0, totalMaxOfGraded = 0, gradedCount = 0;
      for (const a of modAssignments) {
        const score = studentSubs.get(a.id);
        if (score === undefined) continue;
        totalScore += score;
        totalMaxOfGraded += a.points;
        gradedCount++;
      }
      if (gradedCount === 0) continue;

      const moduleScore = totalMaxOfGraded > 0 ? (totalScore / totalMaxOfGraded) * 100 : 0;
      const status: 'COMPLETED' | 'IN_PROGRESS' = gradedCount === modAssignments.length ? 'COMPLETED' : 'IN_PROGRESS';

      tasks.push({ enrollmentId: e.id, batchId, moduleId: mod.id, status, moduleScore });
      hasAnyProgress = true;
    }
    if (hasAnyProgress) {
      enrollmentsToRecalc.add(e.id);
      enrollmentsWithAnyProgress++;
    }
  }

  console.log(`Summary:`);
  console.log(`  Enrollments with any grade data: ${enrollmentsWithAnyProgress}`);
  console.log(`  Enrollments skipped (no batch):  ${enrollmentsSkippedNoBatch}`);
  console.log(`  StudentProgress rows to upsert:  ${tasks.length}`);
  console.log(`  Enrollments to recalculate:      ${enrollmentsToRecalc.size}\n`);

  if (DRY_RUN) {
    console.log('DRY RUN — re-run with --write to commit.');
    return;
  }

  // Phase 1: upsert StudentProgress
  console.log('Phase 1: Upserting StudentProgress...');
  {
    const start = Date.now();
    let done = 0, lastLog = 0, cursor = 0;
    async function worker() {
      while (true) {
        const i = cursor++;
        if (i >= tasks.length) return;
        const t = tasks[i];
        const now = new Date();
        await prisma.studentProgress.upsert({
          where: { enrollmentId_moduleId: { enrollmentId: t.enrollmentId, moduleId: t.moduleId } },
          update: {
            moduleScore: t.moduleScore,
            status: t.status,
            ...(t.status === 'COMPLETED' ? { completedAt: now } : {}),
          },
          create: {
            enrollmentId: t.enrollmentId,
            batchId: t.batchId,
            moduleId: t.moduleId,
            moduleScore: t.moduleScore,
            status: t.status,
            startedAt: now,
            ...(t.status === 'COMPLETED' ? { completedAt: now } : {}),
          },
        });
        done++;
        if (done - lastLog >= 1000) {
          lastLog = done;
          const sec = (Date.now() - start) / 1000;
          const rate = done / sec;
          console.log(`  ${done}/${tasks.length} (${rate.toFixed(0)}/s, ETA ${((tasks.length - done) / rate).toFixed(0)}s)`);
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`  Completed ${done} StudentProgress upserts in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  }

  // Phase 2: recalc enrollment totals
  console.log('\nPhase 2: Recalculating enrollment overallProgress/overallGrade...');
  const enrollmentIds = Array.from(enrollmentsToRecalc);
  {
    const start = Date.now();
    let done = 0, lastLog = 0, cursor = 0;
    async function worker() {
      while (true) {
        const i = cursor++;
        if (i >= enrollmentIds.length) return;
        const eid = enrollmentIds[i];
        const enrollment = await prisma.enrollment.findUnique({
          where: { id: eid },
          include: { studentProgress: true, course: { include: { modules: { orderBy: { position: 'asc' } } } } },
        });
        if (!enrollment) continue;
        const joinPos = enrollment.joinedModulePosition || 1;
        const applicable = enrollment.course.modules.filter(m => m.position >= joinPos);
        const totalApplicable = applicable.length || 1;
        const completed = enrollment.studentProgress.filter(p => p.status === 'COMPLETED');
        const inProgress = enrollment.studentProgress.find(p => p.status === 'IN_PROGRESS');
        const overallProgress = (completed.length / totalApplicable) * 100;
        let weightedGrade = 0;
        for (const p of completed) {
          const mod = enrollment.course.modules.find(m => m.id === p.moduleId);
          if (mod && mod.weight && p.moduleScore !== null) {
            weightedGrade += (p.moduleScore / 100) * mod.weight;
          }
        }
        const currentModuleId = inProgress?.moduleId || completed[completed.length - 1]?.moduleId || null;
        await prisma.enrollment.update({
          where: { id: eid },
          data: { overallProgress, overallGrade: weightedGrade, currentModuleId },
        });
        done++;
        if (done - lastLog >= 500) {
          lastLog = done;
          const sec = (Date.now() - start) / 1000;
          const rate = done / sec;
          console.log(`  ${done}/${enrollmentIds.length} (${rate.toFixed(0)}/s, ETA ${((enrollmentIds.length - done) / rate).toFixed(0)}s)`);
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`  Completed ${done} enrollment recalcs in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  }

  console.log('\nDone.');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
