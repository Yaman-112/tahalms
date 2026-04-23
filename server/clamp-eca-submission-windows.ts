import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const WRITE = process.argv.includes('--write');
const SAMPLE_LIMIT = parseInt(process.argv.find(a => a.startsWith('--sample='))?.slice('--sample='.length) ?? '10', 10);

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

function moduleWeeks(hours: number | null | undefined): number {
  const h = hours ?? 45;
  return Math.max(3, Math.ceil(h / 15));
}

async function main() {
  const course = await prisma.course.findUnique({
    where: { code: 'ECA' },
    include: { modules: { select: { id: true, name: true, startDate: true, hours: true } } },
  });
  if (!course) { console.error('ECA not found'); process.exit(1); }

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string) =>
    sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const assignments = await prisma.assignment.findMany({ where: { courseId: course.id }, select: { id: true, title: true } });
  const windowByAssignment = new Map<string, { first: Date; last: Date; moduleName: string }>();
  const titleById = new Map<string, string>();
  for (const a of assignments) {
    titleById.set(a.id, a.title);
    if (a.title.endsWith(' - Final')) continue;
    const m = resolve(a.title);
    if (!m?.startDate) continue;
    const weeks = moduleWeeks(m.hours);
    const last = new Date(m.startDate.getTime() + (weeks - 1) * 7 * 86400000);
    windowByAssignment.set(a.id, { first: m.startDate, last, moduleName: m.name });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT' },
    select: { userId: true, user: { select: { firstName: true, lastName: true } } },
  });
  const labelByUser = new Map<string, string>();
  for (const e of enrollments) labelByUser.set(e.userId, `${e.user.firstName} ${e.user.lastName}`);

  const subs = await prisma.submission.findMany({
    where: { assignmentId: { in: Array.from(windowByAssignment.keys()) }, submittedAt: { not: null } },
    select: { id: true, studentId: true, assignmentId: true, submittedAt: true },
  });
  console.log(`ECA non-final submissions with submittedAt: ${subs.length}`);

  type Plan = { id: string; oldAt: Date; newAt: Date; label: string; title: string; first: Date; last: Date };
  const plans: Plan[] = [];
  let inside = 0, skipped = 0;
  for (const s of subs) {
    const w = windowByAssignment.get(s.assignmentId);
    if (!w) { skipped++; continue; }
    const label = labelByUser.get(s.studentId) ?? '?';

    // Window: [first 00:00 ET, last + 7 days 23:59 ET]
    const winStart = w.first;
    const winEnd = new Date(w.last.getTime() + 7 * 86400000);
    const at = s.submittedAt!;
    if (at.getTime() >= winStart.getTime() && at.getTime() <= winEnd.getTime() + 86400000 - 1) {
      inside++;
      continue;
    }

    const rng = makeRng(hash(`eca-clamp:${s.studentId}:${s.assignmentId}`));
    const spanDays = Math.max(7, Math.round((winEnd.getTime() - winStart.getTime()) / 86400000));
    const frac = rng() < 0.7 ? 0.55 + rng() * 0.45 : rng() * 0.9;
    const baseMs = winStart.getTime() + 12 * 3600 * 1000 + Math.floor(spanDays * 86400000 * frac);
    const r = rng();
    const hour = r < 0.7 ? 16 + Math.floor(rng() * 7) : r < 0.9 ? 12 + Math.floor(rng() * 4) : 8 + Math.floor(rng() * 4);
    const minute = Math.floor(rng() * 60);
    const second = Math.floor(rng() * 60);
    const tp = torontoParts(new Date(baseMs));
    let newAt = torontoWallToUtc(tp.y, tp.m, tp.d, hour, minute, second);
    const loBound = winStart.getTime();
    const hiBound = winEnd.getTime() + 86400000 - 1;
    if (newAt.getTime() < loBound) newAt = new Date(loBound + Math.floor(rng() * 6 * 3600 * 1000));
    if (newAt.getTime() > hiBound) newAt = new Date(hiBound - Math.floor(rng() * 6 * 3600 * 1000));
    plans.push({ id: s.id, oldAt: at, newAt, label, title: titleById.get(s.assignmentId) ?? '?', first: w.first, last: w.last });
  }

  console.log(`In-window: ${inside}`);
  console.log(`Out-of-window (to clamp): ${plans.length}`);
  console.log(`Skipped: ${skipped}\n`);
  console.log(`Sample (${Math.min(SAMPLE_LIMIT, plans.length)}):`);
  for (const p of plans.slice(0, SAMPLE_LIMIT)) {
    const tp = torontoParts(p.newAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${tp.y}-${pad(tp.m + 1)}-${pad(tp.d)} ${pad(tp.h)}:${pad(tp.min)} ET`;
    console.log(`  ${p.label.padEnd(26).slice(0, 26)} | window ${p.first.toISOString().slice(0, 10)}..${p.last.toISOString().slice(0, 10)} | was ${p.oldAt.toISOString().slice(0, 16)} → ${ts} | ${p.title}`);
  }

  if (!WRITE) { console.log('\nDRY RUN — add --write to apply.'); await pool.end(); return; }
  console.log(`\nApplying ${plans.length} updates (concurrency=10)…`);
  let cursor = 0, done = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= plans.length) return;
      const p = plans[i];
      try { await prisma.submission.update({ where: { id: p.id }, data: { submittedAt: p.newAt, isLate: false } }); }
      catch (e: any) { console.warn(`  skip: ${e.message?.slice(0, 80)}`); }
      done++;
      if (done % 500 === 0) console.log(`  ${done}/${plans.length}`);
    }
  };
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`  ${done}/${plans.length}\nDone.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
