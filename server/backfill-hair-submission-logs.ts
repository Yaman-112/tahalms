import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const WRITE = process.argv.includes('--write');

function hash(s: string): number { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function makeRng(seed: number) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

const TZ = 'America/Toronto';
function torontoParts(d: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const parts = dtf.formatToParts(d);
  const g = (t: string) => parts.find(p => p.type === t)!.value;
  let hour = parseInt(g('hour')); if (hour === 24) hour = 0;
  return { y: parseInt(g('year')), m: parseInt(g('month')) - 1, d: parseInt(g('day')), h: hour, min: parseInt(g('minute')), s: parseInt(g('second')) };
}
function torontoWallToUtc(y: number, m: number, d: number, h: number, min: number, s: number): Date {
  let guess = new Date(Date.UTC(y, m, d, h, min, s));
  for (let i = 0; i < 2; i++) {
    const p = torontoParts(guess);
    const diff = Date.UTC(y, m, d, h, min, s) - Date.UTC(p.y, p.m, p.d, p.h, p.min, p.s);
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }
  return guess;
}

async function main() {
  const course = await prisma.course.findUnique({ where: { code: 'HAIR' }, include: { modules: { select: { name: true, startDate: true } } } });
  if (!course) { console.error('HAIR not found'); process.exit(1); }
  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string) => sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const assignments = await prisma.assignment.findMany({ where: { courseId: course.id }, select: { id: true, title: true } });
  const moduleStart = new Map<string, Date>();
  const titleById = new Map(assignments.map(a => [a.id, a.title]));
  for (const a of assignments) { const m = resolve(a.title); if (m?.startDate) moduleStart.set(a.id, m.startDate); }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT', startDate: { not: null } },
    select: { userId: true, startDate: true, user: { select: { firstName: true, lastName: true } } },
  });
  const startByUser = new Map<string, { start: Date; label: string }>();
  for (const e of enrollments) startByUser.set(e.userId, { start: e.startDate!, label: `${e.user.firstName} ${e.user.lastName}` });

  const targets = await prisma.submission.findMany({
    where: { assignment: { courseId: course.id }, submittedAt: null, score: { not: 0 } },
    select: { id: true, studentId: true, assignmentId: true },
  });
  console.log(`HAIR: ${targets.length} submissions with score>0 and submittedAt=null.`);
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN'}\n`);

  type Plan = { id: string; submittedAt: Date; label: string; title: string; anchor: Date };
  const plans: Plan[] = [];
  let skipped = 0;
  for (const s of targets) {
    const u = startByUser.get(s.studentId); if (!u) { skipped++; continue; }
    const ms = moduleStart.get(s.assignmentId); if (!ms) { skipped++; continue; }
    const anchor = ms >= u.start ? ms : u.start;
    const rng = makeRng(hash(`hair:${s.studentId}:${s.assignmentId}`));
    const frac = rng() < 0.7 ? 0.55 + rng() * 0.45 : rng() * 0.9;
    const baseMs = anchor.getTime() + 14 * 86400000 * frac;
    const r = rng();
    const hour = r < 0.7 ? 16 + Math.floor(rng() * 7) : r < 0.9 ? 12 + Math.floor(rng() * 4) : 8 + Math.floor(rng() * 4);
    const tp = torontoParts(new Date(baseMs));
    const submittedAt = torontoWallToUtc(tp.y, tp.m, tp.d, hour, Math.floor(rng() * 60), Math.floor(rng() * 60));
    plans.push({ id: s.id, submittedAt, label: u.label, title: titleById.get(s.assignmentId) ?? '?', anchor });
  }
  console.log(`Planned timestamps: ${plans.length}  (skipped ${skipped})\n`);
  for (const p of plans.slice(0, 6)) {
    const tp = torontoParts(p.submittedAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    console.log(`  ${p.label.padEnd(26).slice(0, 26)} | anchor ${p.anchor.toISOString().slice(0, 10)} → ${tp.y}-${pad(tp.m + 1)}-${pad(tp.d)} ${pad(tp.h)}:${pad(tp.min)} ET | ${p.title}`);
  }
  if (!WRITE) { console.log('\nDRY RUN — re-run with --write.'); await pool.end(); return; }
  if (plans.length === 0) { await pool.end(); return; }
  let cursor = 0, done = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++; if (i >= plans.length) return;
      const p = plans[i];
      await prisma.submission.update({ where: { id: p.id }, data: { submittedAt: p.submittedAt, isLate: false } });
      done++;
      if (done % 200 === 0) console.log(`  ${done}/${plans.length}`);
    }
  };
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`  ${done}/${plans.length}\nDone.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
