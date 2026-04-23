import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { detectHtTrack, getHtFirstSessionDate } from './utils/ht-schedule.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const WRITE = process.argv.includes('--write');

async function main() {
  const course = await prisma.course.findUnique({
    where: { code: 'HT' },
    include: { modules: { select: { id: true, name: true } } },
  });
  if (!course) { console.error('HT course not found'); process.exit(1); }

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string) =>
    sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const assignments = await prisma.assignment.findMany({
    where: { courseId: course.id },
    select: { id: true, title: true },
  });
  const moduleByAssignment = new Map<string, string>(); // assignmentId -> module name
  let unmapped = 0;
  for (const a of assignments) {
    const m = resolve(a.title);
    if (m) moduleByAssignment.set(a.id, m.name);
    else unmapped++;
  }
  console.log(`HT assignments: ${assignments.length} (${moduleByAssignment.size} mapped to modules, ${unmapped} unmapped)`);

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT', startDate: { not: null } },
    select: { userId: true, startDate: true, classDays: true, user: { select: { firstName: true, lastName: true, email: true } } },
  });

  // Per user: startDate + track. Prefer earliest startDate across dup enrollments.
  const userInfo = new Map<string, { start: Date; track: 'weekday' | 'weekend'; label: string }>();
  for (const e of enrollments) {
    const track = detectHtTrack(e.classDays);
    const prev = userInfo.get(e.userId);
    if (!prev || e.startDate! < prev.start) {
      userInfo.set(e.userId, {
        start: e.startDate!,
        track,
        label: `${e.user.firstName} ${e.user.lastName} <${e.user.email}>`,
      });
    }
  }

  console.log(`HT students with startDate: ${userInfo.size}`);
  console.log(`Mode: ${WRITE ? 'WRITE (DESTRUCTIVE)' : 'DRY RUN'}\n`);

  console.log(`Fetching all HT submissions…`);
  const allSubs = await prisma.submission.findMany({
    where: { assignment: { courseId: course.id } },
    select: { id: true, studentId: true, assignmentId: true },
  });
  console.log(`  ${allSubs.length} submissions total.`);

  const submissionIdsToDelete: string[] = [];
  const perStudent = new Map<string, number>();
  let scheduleMissing = 0;

  for (const s of allSubs) {
    const modName = moduleByAssignment.get(s.assignmentId);
    if (!modName) continue;
    const u = userInfo.get(s.studentId);
    if (!u) continue;
    const sessionDate = getHtFirstSessionDate(modName, u.track);
    if (!sessionDate) { scheduleMissing++; continue; }
    if (sessionDate < u.start) {
      submissionIdsToDelete.push(s.id);
      perStudent.set(s.studentId, (perStudent.get(s.studentId) ?? 0) + 1);
    }
  }

  console.log(`\nSubmissions to delete: ${submissionIdsToDelete.length}`);
  console.log(`Students affected:      ${perStudent.size}`);
  if (scheduleMissing > 0) console.log(`  (${scheduleMissing} submissions skipped: module name not in schedule file)`);

  const top = [...perStudent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`\nTop 10 students by delete count:`);
  for (const [uid, n] of top) {
    const u = userInfo.get(uid)!;
    console.log(`  ${u.label} | track=${u.track} | start=${u.start.toISOString().slice(0, 10)} | to delete: ${n}`);
  }

  if (!WRITE) {
    console.log('\nDRY RUN — re-run with --write to delete.');
    await pool.end();
    return;
  }

  if (submissionIdsToDelete.length === 0) { await pool.end(); return; }

  console.log(`\nDeleting ${submissionIdsToDelete.length} submissions in batches of 500…`);
  let deleted = 0;
  for (let i = 0; i < submissionIdsToDelete.length; i += 500) {
    const batch = submissionIdsToDelete.slice(i, i + 500);
    const res = await prisma.submission.deleteMany({ where: { id: { in: batch } } });
    deleted += res.count;
    console.log(`  ${deleted}/${submissionIdsToDelete.length}`);
  }
  console.log(`Deleted ${deleted} submissions.`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
