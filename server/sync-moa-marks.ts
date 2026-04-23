import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';
import XLSX from 'xlsx';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { getMoaRotation } from './utils/moa-schedule.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const CSV = process.argv.find(a => a.startsWith('--csv='))?.slice('--csv='.length) ?? '/Users/yaman/Downloads/Canvas submission 3/MOA.csv';
const WRITE = process.argv.includes('--write');

function normName(s: string | null | undefined): string { return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' '); }
function cleanTitle(s: string): string { return s.replace(/\n/g, '').trim(); }

function aliasTitle(csvTitle: string, dbTitles: Set<string>): string[] {
  let t = csvTitle;
  t = t.replace(/^Medical Office Procedures /, 'Medical Office Procedure ');
  t = t.replace(/^Buisness Communication /, 'Business Communication ');
  t = t.replace(/^OHIP Billing and Medical Coding /, 'Medical Coding & OHIP Billing ');
  t = t.replace(/^Anatomy & Physiology /, 'Anatomy and Physiology ');
  t = t.replace(/^Microssoft Suite /, 'Microsoft Office Suite ');
  // For modules with "Assignment 1" / "Assignment 2" in DB, map bare "Assignment" → Assignment 1
  if (/ - Assignment$/.test(t)) {
    const a1 = t.replace(/ - Assignment$/, ' - Assignment 1');
    if (dbTitles.has(a1) && !dbTitles.has(t)) return [a1];
  }
  return [t];
}

async function main() {
  const wb = XLSX.read(fs.readFileSync(CSV), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
  const headerRow = rows[0].map(cleanTitle);
  const dataRows = rows.slice(3).filter(r => r[2] && r[3]);
  const colAssignments: { col: number; title: string }[] = [];
  for (let i = 6; i < headerRow.length; i++) if (headerRow[i]) colAssignments.push({ col: i, title: headerRow[i] });
  console.log(`CSV: ${dataRows.length} students, ${colAssignments.length} assignment cols`);

  const course = await prisma.course.findUnique({
    where: { code: 'MOA' },
    include: { assignments: { select: { id: true, title: true } }, modules: { select: { id: true, name: true } } },
  });
  if (!course) { console.error('MOA not found'); process.exit(1); }
  const dbAssignByTitle = new Map(course.assignments.map(a => [a.title, a]));
  const dbTitleSet = new Set(dbAssignByTitle.keys());

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolveModule = (title: string) =>
    sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;
  const moduleNameForAssignment = new Map<string, string>();
  for (const a of course.assignments) { const m = resolveModule(a.title); if (m) moduleNameForAssignment.set(a.id, m.name); }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, role: 'STUDENT' },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
  const byName = new Map<string, typeof enrollments[number][]>();
  for (const e of enrollments) {
    const nk = normName(`${e.user.firstName} ${e.user.lastName}`);
    if (!byName.has(nk)) byName.set(nk, []);
    byName.get(nk)!.push(e);
  }

  const existing = await prisma.submission.findMany({ where: { assignment: { courseId: course.id } }, select: { id: true, studentId: true, assignmentId: true, score: true } });
  const subMap = new Map<string, typeof existing[number]>();
  for (const s of existing) subMap.set(`${s.studentId}|${s.assignmentId}`, s);

  type Plan = { studentId: string; assignmentId: string; score: number; isCreate: boolean; oldScore: number | null; studentLabel: string; assignmentTitle: string };
  const plans: Plan[] = [];
  let matched = 0, ambiguous = 0, unmatched: string[] = [];
  let preStart = 0, noStart = 0;
  const unmappedAssignments = new Set<string>();

  for (const r of dataRows) {
    const first = r[2]?.toString().trim();
    const last = r[3]?.toString().trim();
    const nk = normName(`${first} ${last}`);
    const cands = byName.get(nk) ?? [];
    let e: typeof enrollments[number] | undefined;
    if (cands.length === 1) { e = cands[0]; matched++; }
    else if (cands.length > 1) { ambiguous++; continue; }
    else { unmatched.push(`${first} ${last}`); continue; }

    if (!e.startDate) { noStart++; continue; }
    const rotation = new Set(getMoaRotation(e.startDate).keys());

    for (const col of colAssignments) {
      const raw = r[col.col];
      if (raw === '' || raw == null) continue;
      const score = parseFloat(String(raw));
      if (!Number.isFinite(score)) continue;

      const candidates = aliasTitle(col.title, dbTitleSet);
      const dbTitle = candidates.find(t => dbAssignByTitle.has(t));
      if (!dbTitle) { unmappedAssignments.add(`${col.title} → tried ${candidates.join(', ')}`); continue; }
      const a = dbAssignByTitle.get(dbTitle)!;

      const modName = moduleNameForAssignment.get(a.id);
      if (modName && !rotation.has(modName)) { preStart++; continue; }

      const key = `${e.userId}|${a.id}`;
      const ex = subMap.get(key);
      if (ex && ex.score === score) continue;
      plans.push({
        studentId: e.userId, assignmentId: a.id, score,
        isCreate: !ex, oldScore: ex?.score ?? null,
        studentLabel: `${e.user.firstName} ${e.user.lastName}`, assignmentTitle: a.title,
      });
    }
  }

  console.log(`\nMatches: unique=${matched}, ambiguous=${ambiguous}, unmatched=${unmatched.length}`);
  if (unmatched.length) { console.log(`  unmatched:`); for (const u of unmatched) console.log(`    ${u}`); }
  if (unmappedAssignments.size) { console.log(`  Unmapped:`); for (const t of unmappedAssignments) console.log(`    ${t}`); }
  console.log(`\nRule B skips:   ${preStart}`);
  console.log(`No-start skips: ${noStart}`);
  console.log(`\nPlanned changes: ${plans.length}  (${plans.filter(p => p.isCreate).length} creates, ${plans.filter(p => !p.isCreate).length} updates)`);
  console.log(`\nSample (first 10):`);
  for (const p of plans.slice(0, 10)) {
    console.log(`  ${p.studentLabel.padEnd(24).slice(0, 24)} | ${p.assignmentTitle.padEnd(54).slice(0, 54)} | ${p.isCreate ? 'CREATE' : `UPDATE old=${p.oldScore}`} → ${p.score}`);
  }

  if (!WRITE) { console.log('\nDRY RUN — re-run with --write.'); await pool.end(); return; }

  const now = new Date();
  let cursor = 0, done = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++; if (i >= plans.length) return;
      const p = plans[i];
      await prisma.submission.upsert({
        where: { assignmentId_studentId: { assignmentId: p.assignmentId, studentId: p.studentId } },
        update: { score: p.score, status: 'GRADED', date: now },
        create: { studentId: p.studentId, assignmentId: p.assignmentId, score: p.score, status: 'GRADED', date: now },
      });
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${plans.length}`);
    }
  };
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`  ${done}/${plans.length}\nDone.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
