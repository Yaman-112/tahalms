import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { getAcRotation } from './utils/ac-schedule.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const WRITE = process.argv.includes('--write');

async function main() {
  const course = await prisma.course.findUnique({
    where: { code: 'AC' },
    include: { modules: { select: { id: true, name: true } } },
  });
  if (!course) { console.error('AC not found'); process.exit(1); }

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string): string | null => {
    const m = sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name));
    return m ? m.name : null;
  };

  const assignments = await prisma.assignment.findMany({ where: { courseId: course.id }, select: { id: true, title: true } });
  const moduleForAssignment = new Map<string, string>();
  let unmapped = 0;
  for (const a of assignments) {
    const m = resolve(a.title);
    if (m) moduleForAssignment.set(a.id, m); else unmapped++;
  }
  console.log(`AC: ${assignments.length} assignments (${moduleForAssignment.size} mapped, ${unmapped} unmapped)`);

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT', startDate: { not: null } },
    select: { userId: true, startDate: true, user: { select: { firstName: true, lastName: true, email: true } } },
  });
  const rotationByUser = new Map<string, { rotation: Set<string>; start: Date; label: string }>();
  for (const e of enrollments) {
    const rot = getAcRotation(e.startDate!);
    rotationByUser.set(e.userId, {
      rotation: new Set(rot.keys()),
      start: e.startDate!,
      label: `${e.user.firstName} ${e.user.lastName} <${e.user.email}>`,
    });
  }
  console.log(`AC students with startDate: ${rotationByUser.size}`);
  console.log(`Mode: ${WRITE ? 'WRITE (DESTRUCTIVE)' : 'DRY RUN'}\n`);

  console.log(`Fetching all AC submissions…`);
  const allSubs = await prisma.submission.findMany({
    where: { assignment: { courseId: course.id } },
    select: { id: true, studentId: true, assignmentId: true },
  });
  console.log(`  ${allSubs.length} submissions total.`);

  const idsToDelete: string[] = [];
  const perStudent = new Map<string, number>();
  for (const s of allSubs) {
    const modName = moduleForAssignment.get(s.assignmentId);
    if (!modName) continue;
    const r = rotationByUser.get(s.studentId);
    if (!r) continue;
    if (!r.rotation.has(modName)) {
      idsToDelete.push(s.id);
      perStudent.set(s.studentId, (perStudent.get(s.studentId) ?? 0) + 1);
    }
  }

  console.log(`\nSubmissions to delete: ${idsToDelete.length}`);
  console.log(`Students affected:      ${perStudent.size}`);
  const top = [...perStudent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`\nTop 8 students by delete count:`);
  for (const [uid, n] of top) {
    const r = rotationByUser.get(uid)!;
    console.log(`  ${r.label} | start=${r.start.toISOString().slice(0, 10)} | to delete: ${n}`);
  }

  if (!WRITE) { console.log('\nDRY RUN — re-run with --write to delete.'); await pool.end(); return; }
  if (idsToDelete.length === 0) { await pool.end(); return; }

  console.log(`\nDeleting ${idsToDelete.length} submissions in batches of 500…`);
  let deleted = 0;
  for (let i = 0; i < idsToDelete.length; i += 500) {
    const res = await prisma.submission.deleteMany({ where: { id: { in: idsToDelete.slice(i, i + 500) } } });
    deleted += res.count;
    console.log(`  ${deleted}/${idsToDelete.length}`);
  }
  console.log(`Deleted ${deleted} submissions.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
