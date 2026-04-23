import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';
import XLSX from 'xlsx';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const WRITE = process.argv.includes('--write');
const SAMPLE_LIMIT = parseInt(process.argv.find(a => a.startsWith('--sample='))?.slice('--sample='.length) ?? '10', 10);
const SCHEDULE_FILE = '/Users/yaman/Downloads/IBA Schedule.xlsx';

function hash(s: string): number { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function makeRng(seed: number) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

// Toronto wall-clock → UTC Date
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

type Track = 'weekday' | 'weekend';
type Session = { date: Date; track: Track; module: string };

function parseSchedule(): Session[] {
  const wb = XLSX.read(fs.readFileSync(SCHEDULE_FILE), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json<[string, string]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });
  const out: Session[] = [];
  for (const r of rows) {
    if (!r || !r[0] || !r[1] || !/^\d/.test(String(r[0]))) continue;
    const m = String(r[1]).match(/^(Weekday|Weekend)\s*-\s*(.+)$/i);
    if (!m || /winter break/i.test(m[2])) continue;
    const [mo, da, yr] = String(r[0]).split('/').map(s => parseInt(s, 10));
    out.push({ date: new Date(Date.UTC(yr < 100 ? 2000 + yr : yr, mo - 1, da)), track: m[1].toLowerCase() as Track, module: m[2].trim() });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function detectTrack(classDays: string | null): Track {
  if (!classDays) return 'weekday';
  return /friday|saturday|sunday|weekend/i.test(classDays) && !/monday.*thursday/i.test(classDays) ? 'weekend' : 'weekday';
}

// Returns: moduleName → { session1, session2 } for a student's rotation
function buildRotation(sessions: Session[], track: Track, startDate: Date): Map<string, { s1: Date; s2: Date }> {
  const trackSessions = sessions.filter(s => s.track === track);
  const startIdx = trackSessions.findIndex(s => s.date >= startDate);
  const collected: { module: string; date: Date }[] = [];
  const seen = new Set<string>();
  for (let i = startIdx; i < trackSessions.length && collected.length < 48; i++) {
    collected.push({ module: trackSessions[i].module, date: trackSessions[i].date });
  }
  // Each module appears twice consecutively in the weekly schedule (week 1 & week 2).
  const out = new Map<string, { s1: Date; s2: Date }>();
  for (const c of collected) {
    if (seen.has(c.module)) {
      // already seen → this must be week 2 session
      const cur = out.get(c.module)!;
      if (!cur.s2 || cur.s2 < c.date) out.set(c.module, { s1: cur.s1, s2: c.date });
    } else {
      seen.add(c.module);
      out.set(c.module, { s1: c.date, s2: c.date });
    }
  }
  return out;
}

// Parse a shift string → start-of-class wall hour/minute in Toronto
function parseShiftStart(shift: string | null, classTime: string | null): { h: number; m: number } {
  const s = (shift ?? classTime ?? '').toString();
  // Match patterns like "9:30 AM", "5:00 PM", "9:30 am"
  const match = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = (match[3] ?? '').toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m };
  }
  // Fallback on named shift
  const sl = s.toLowerCase();
  if (sl.includes('evening')) return { h: 17, m: 0 };
  if (sl.includes('afternoon')) return { h: 13, m: 0 };
  if (sl.includes('morning')) return { h: 9, m: 30 };
  return { h: 9, m: 30 };
}

async function main() {
  const sessions = parseSchedule();
  const course = await prisma.course.findUnique({ where: { code: 'IBA' }, include: { modules: { select: { name: true } } } });
  if (!course) { console.error('IBA not found'); process.exit(1); }

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolve = (title: string) => sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const finals = await prisma.assignment.findMany({
    where: { courseId: course.id, title: { endsWith: ' - Final' } },
    include: { _count: { select: { questions: true } } },
  });
  console.log(`IBA "- Final" assignments: ${finals.length}`);
  const assignmentMeta = new Map<string, { moduleName: string; title: string; durationMin: number; mcqCount: number }>();
  for (const a of finals) {
    const mod = resolve(a.title);
    if (!mod) continue;
    // Duration: use timeLimit if set, else estimate from question count (assume all MCQ if MCQ/MIXED, else 45 min default).
    let dur = a.timeLimit ?? 0;
    if (!dur) {
      if (a.format === 'MCQ' || a.format === 'MIXED') dur = Math.max(30, Math.min(90, a._count.questions * 1.5));
      else dur = 45;
    }
    assignmentMeta.set(a.id, { moduleName: mod.name, title: a.title, durationMin: dur, mcqCount: a._count.questions });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT', startDate: { not: null } },
    include: { user: { select: { id: true, firstName: true, lastName: true, shift: true } } },
  });
  const infoByUser = new Map<string, { startDate: Date; track: Track; batchCode: string | null; label: string; start: { h: number; m: number } }>();
  for (const e of enrollments) {
    const prev = infoByUser.get(e.userId);
    const track = detectTrack(e.classDays);
    const start = parseShiftStart(e.user.shift, e.classTime);
    if (!prev || (e.startDate! < prev.startDate)) {
      infoByUser.set(e.userId, { startDate: e.startDate!, track, batchCode: e.batchCode, label: `${e.user.firstName} ${e.user.lastName}`, start });
    }
  }

  // Cache rotation per (track|startDate) to avoid recomputation
  const rotationCache = new Map<string, Map<string, { s1: Date; s2: Date }>>();
  const getRotation = (track: Track, startDate: Date) => {
    const k = `${track}|${startDate.toISOString().slice(0, 10)}`;
    let r = rotationCache.get(k);
    if (!r) { r = buildRotation(sessions, track, startDate); rotationCache.set(k, r); }
    return r;
  };

  // Fetch all Final submissions with existing submittedAt
  const subs = await prisma.submission.findMany({
    where: { assignmentId: { in: Array.from(assignmentMeta.keys()) }, submittedAt: { not: null } },
    select: { id: true, studentId: true, assignmentId: true, submittedAt: true },
  });
  console.log(`Finals with submittedAt: ${subs.length}`);

  type Plan = { id: string; newSubmittedAt: Date; label: string; assignment: string; batch: string | null; examDay: Date };
  const plans: Plan[] = [];
  let skipped = 0;
  for (const s of subs) {
    const meta = assignmentMeta.get(s.assignmentId);
    if (!meta) { skipped++; continue; }
    const u = infoByUser.get(s.studentId);
    if (!u) { skipped++; continue; }
    const rot = getRotation(u.track, u.startDate);
    const modInfo = rot.get(meta.moduleName);
    if (!modInfo) { skipped++; continue; }

    // Exam day: week-2 session + 3 days (weekday) or + 2 days (weekend, Fri→Sun)
    const weekOffsetDays = u.track === 'weekend' ? 2 : 3;
    const examDay = new Date(modInfo.s2.getTime() + weekOffsetDays * 86400000);

    const rng = makeRng(hash(`iba-final-exam:${s.studentId}:${s.assignmentId}`));
    // Treat examDay's UTC Y/M/D as the exam's Toronto calendar day.
    const ey = examDay.getUTCFullYear();
    const em = examDay.getUTCMonth();
    const ed = examDay.getUTCDate();
    // Total minutes from midnight at which the student submits (Toronto wall clock).
    const startMin = u.start.h * 60 + u.start.m;
    const offsetMin = meta.durationMin * 0.60 + rng() * (meta.durationMin * 0.4 + 5);
    const totalMin = startMin + Math.floor(offsetMin);
    const wallH = Math.floor(totalMin / 60);
    const wallM = totalMin % 60;
    const submittedAt = torontoWallToUtc(ey, em, ed, wallH, wallM, Math.floor(rng() * 60));
    plans.push({ id: s.id, newSubmittedAt: submittedAt, label: u.label, assignment: meta.title, batch: u.batchCode, examDay });
  }

  console.log(`Planned updates: ${plans.length} (skipped ${skipped})\n`);
  console.log(`Sample (${Math.min(SAMPLE_LIMIT, plans.length)} rows):`);
  for (const p of plans.slice(0, SAMPLE_LIMIT)) {
    const tp = torontoParts(p.newSubmittedAt);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${tp.y}-${pad(tp.m + 1)}-${pad(tp.d)} ${pad(tp.h)}:${pad(tp.min)} ET`;
    console.log(`  ${p.label.padEnd(28).slice(0, 28)} | batch=${(p.batch ?? '-').padEnd(10)} | examDay=${p.examDay.toISOString().slice(0, 10)} | submit=${ts} | ${p.assignment}`);
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
      if (done % 200 === 0) console.log(`  ${done}/${plans.length}`);
    }
  };
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`  ${done}/${plans.length}\nDone.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
