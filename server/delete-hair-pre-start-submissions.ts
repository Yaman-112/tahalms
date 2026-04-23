import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const WRITE = process.argv.includes('--write');

async function main() {
  const course = await prisma.course.findUnique({ where: { code: 'HAIR' }, include: { modules: { select: { name: true, startDate: true } } } });
  if (!course) { console.error('HAIR not found'); process.exit(1); }
  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string) => sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const assignments = await prisma.assignment.findMany({ where: { courseId: course.id }, select: { id: true, title: true } });
  const moduleStart = new Map<string, Date>();
  for (const a of assignments) { const m = resolve(a.title); if (m?.startDate) moduleStart.set(a.id, m.startDate); }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT', startDate: { not: null } },
    select: { userId: true, startDate: true, user: { select: { firstName: true, lastName: true, email: true } } },
  });
  const startByUser = new Map<string, { start: Date; label: string }>();
  for (const e of enrollments) {
    const p = startByUser.get(e.userId);
    if (!p || e.startDate! < p.start) startByUser.set(e.userId, { start: e.startDate!, label: `${e.user.firstName} ${e.user.lastName} <${e.user.email}>` });
  }
  console.log(`HAIR: ${assignments.length} assignments, ${startByUser.size} students with startDate`);
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN'}\n`);

  const subs = await prisma.submission.findMany({ where: { assignment: { courseId: course.id } }, select: { id: true, studentId: true, assignmentId: true } });
  const ids: string[] = [];
  const per = new Map<string, number>();
  for (const s of subs) {
    const ms = moduleStart.get(s.assignmentId);
    if (!ms) continue;
    const u = startByUser.get(s.studentId);
    if (!u) continue;
    if (ms.toISOString().slice(0, 10) < u.start.toISOString().slice(0, 10)) {
      ids.push(s.id);
      per.set(s.studentId, (per.get(s.studentId) ?? 0) + 1);
    }
  }
  console.log(`Submissions to delete: ${ids.length}  (${per.size} students)`);
  for (const [uid, n] of [...per.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    const u = startByUser.get(uid)!;
    console.log(`  ${u.label} | start=${u.start.toISOString().slice(0, 10)} | to delete: ${n}`);
  }
  if (!WRITE) { console.log('\nDRY RUN — re-run with --write.'); await pool.end(); return; }
  if (ids.length === 0) { await pool.end(); return; }
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 500) {
    const res = await prisma.submission.deleteMany({ where: { id: { in: ids.slice(i, i + 500) } } });
    deleted += res.count; console.log(`  ${deleted}/${ids.length}`);
  }
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
