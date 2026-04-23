import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { getCswModuleRun } from './utils/csw-schedule.js';

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

function parseShiftStart(shift: string | null, classTime: string | null): { h: number; m: number } {
  const s = (shift ?? classTime ?? '').toString();
  const match = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = (match[3] ?? '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m };
  }
  const sl = s.toLowerCase();
  if (sl.includes('evening')) return { h: 17, m: 0 };
  if (sl.includes('afternoon')) return { h: 13, m: 0 };
  if (sl.includes('morning')) return { h: 9, m: 30 };
  return { h: 9, m: 30 };
}

async function main() {
  const course = await prisma.course.findUnique({ where: { code: 'CSW' }, include: { modules: { select: { name: true } } } });
  if (!course) { console.error('CSW not found'); process.exit(1); }

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string) => sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const finals = await prisma.assignment.findMany({
    where: { courseId: course.id, title: { endsWith: ' - Final' } },
    include: { _count: { select: { questions: true } } },
  });
  console.log(`CSW "- Final" assignments: ${finals.length}`);
  const assignmentMeta = new Map<string, { moduleName: string; title: string; durationMin: number; qcount: number }>();
  for (const a of finals) {
    const mod = resolve(a.title);
    if (!mod) continue;
    let dur = a.timeLimit ?? 0;
    if (!dur) {
      if (a.format === 'MCQ' || a.format === 'MIXED') dur = Math.max(30, Math.min(90, a._count.questions * 1.5));
      else dur = 45;
    }
    assignmentMeta.set(a.id, { moduleName: mod.name, title: a.title, durationMin: dur, qcount: a._count.questions });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT', startDate: { not: null } },
    include: { user: { select: { id: true, firstName: true, lastName: true, shift: true } } },
  });
  type UserInfo = { startDate: Date; batchCode: string | null; label: string; start: { h: number; m: number } };
  const infoByUser = new Map<string, UserInfo>();
  for (const e of enrollments) {
    const prev = infoByUser.get(e.userId);
    if (prev && e.startDate! >= prev.startDate) continue;
    infoByUser.set(e.userId, { startDate: e.startDate!, batchCode: e.batchCode, label: `${e.user.firstName} ${e.user.lastName}`, start: parseShiftStart(e.user.shift, e.classTime) });
  }

  const subs = await prisma.submission.findMany({
    where: { assignmentId: { in: Array.from(assignmentMeta.keys()) }, submittedAt: { not: null } },
    select: { id: true, studentId: true, assignmentId: true },
  });
  console.log(`Finals with submittedAt: ${subs.length}`);

  type Plan = { id: string; newSubmittedAt: Date; label: string; assignment: string; batch: string | null; examDay: Date; startH: number; startM: number };
  const plans: Plan[] = [];
  let skipped = 0;
  for (const s of subs) {
    const meta = assignmentMeta.get(s.assignmentId);
    if (!meta) { skipped++; continue; }
    const u = infoByUser.get(s.studentId);
    if (!u) { skipped++; continue; }
    const run = getCswModuleRun(meta.moduleName, u.startDate);
    if (!run) { skipped++; continue; }
    // Exam day = last session (a Monday) + 3 days (Thursday of that week)
    const examDay = new Date(run.last.getTime() + 3 * 86400000);

    const rng = makeRng(hash(`csw-final-exam:${s.studentId}:${s.assignmentId}`));
    const ey = examDay.getUTCFullYear(), em = examDay.getUTCMonth(), ed = examDay.getUTCDate();
    const startMin = u.start.h * 60 + u.start.m;
    const offsetMin = meta.durationMin * 0.60 + rng() * (meta.durationMin * 0.4 + 5);
    const totalMin = startMin + Math.floor(offsetMin);
    const wallH = Math.floor(totalMin / 60);
    const wallM = totalMin % 60;
    const submittedAt = torontoWallToUtc(ey, em, ed, wallH, wallM, Math.floor(rng() * 60));
    plans.push({ id: s.id, newSubmittedAt: submittedAt, label: u.label, assignment: meta.title, batch: u.batchCode, examDay, startH: u.start.h, startM: u.start.m });
  }

  console.log(`Planned updates: ${plans.length} (skipped ${skipped})\n`);
  console.log(`Sample (${Math.min(SAMPLE_LIMIT, plans.length)} rows):`);
  for (const p of plans.slice(0, SAMPLE_LIMIT)) {
    const tp = torontoParts(p.newSubmittedAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${tp.y}-${pad(tp.m + 1)}-${pad(tp.d)} ${pad(tp.h)}:${pad(tp.min)} ET`;
    console.log(`  ${p.label.padEnd(30).slice(0, 30)} | batch=${(p.batch ?? '-').padEnd(12)} | classStart=${pad(p.startH)}:${pad(p.startM)} | examDay=${p.examDay.toISOString().slice(0, 10)} | submit=${ts} | ${p.assignment}`);
  }

  if (!WRITE) { console.log('\nDRY RUN — add --write to apply.'); await pool.end(); return; }
  console.log(`\nApplying ${plans.length} updates (concurrency=10)…`);
  let cursor = 0, done = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= plans.length) return;
      const p = plans[i];
      try { await prisma.submission.update({ where: { id: p.id }, data: { submittedAt: p.newSubmittedAt } }); }
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
