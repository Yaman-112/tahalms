import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';
import XLSX from 'xlsx';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const CSV = process.argv.find(a => a.startsWith('--csv='))?.slice('--csv='.length) ?? '/Users/yaman/Downloads/Canvas submission 3/ECA.csv';
const WRITE = process.argv.includes('--write');

function normName(s: string | null | undefined): string { return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' '); }
function cleanTitle(s: string): string { return s.replace(/\n/g, '').trim(); }

// Fix known spelling divergences between CSV and DB.
function aliasTitle(csvTitle: string): string {
  let t = csvTitle.replace(/Guiding Childrens Behaviour/gi, "Guiding Children's Behaviour");
  // CSV "Xxx - Assignment" → DB "Xxx - Assignment 1"
  t = t.replace(/ - Assignment$/, ' - Assignment 1');
  // CSV "Practicum I" / "Practicum II" → DB "Practicum I - Final" / "Practicum II - Final"
  if (/^Practicum (I|II)$/.test(t)) t = `${t} - Final`;
  return t;
}

async function main() {
  const wb = XLSX.read(fs.readFileSync(CSV), { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false });
  const headerRow = rows[0].map(cleanTitle);
  const dataRows = rows.slice(3).filter(r => r[2]); // Full Name
  const colAssignments: { col: number; title: string }[] = [];
  for (let i = 3; i < headerRow.length; i++) {
    if (headerRow[i]) colAssignments.push({ col: i, title: headerRow[i] });
  }
  console.log(`CSV: ${dataRows.length} students, ${colAssignments.length} assignment columns`);

  const course = await prisma.course.findUnique({
    where: { code: 'ECA' },
    include: {
      assignments: { select: { id: true, title: true } },
      modules: { select: { id: true, name: true, startDate: true } },
    },
  });
  if (!course) { console.error('ECA not found'); process.exit(1); }

  const sortedModules = [...course.modules].sort((a, b) => b.name.length - a.name.length);
  const resolveModule = (title: string) =>
    sortedModules.find(m => title === m.name || title.startsWith(`${m.name} - `) || title.includes(m.name)) ?? null;

  const dbAssignByTitle = new Map(course.assignments.map(a => [a.title, a]));
  const moduleStartByAssignment = new Map<string, Date>();
  for (const a of course.assignments) {
    const m = resolveModule(a.title);
    if (m?.startDate) moduleStartByAssignment.set(a.id, m.startDate);
  }

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

  const existing = await prisma.submission.findMany({
    where: { assignment: { courseId: course.id } },
    select: { id: true, studentId: true, assignmentId: true, score: true },
  });
  const subMap = new Map<string, typeof existing[number]>();
  for (const s of existing) subMap.set(`${s.studentId}|${s.assignmentId}`, s);

  type Plan = { studentId: string; assignmentId: string; score: number; isCreate: boolean; oldScore: number | null; studentLabel: string; assignmentTitle: string };
  const plans: Plan[] = [];
  let matched = 0, ambiguous = 0, unmatched: string[] = [];
  let skippedPreStart = 0, skippedNonNumeric = 0, skippedNoStart = 0;
  const unmappedAssignments = new Set<string>();

  for (const r of dataRows) {
    const fullName = String(r[2] ?? '').trim();
    const nk = normName(fullName);
    const cands = byName.get(nk) ?? [];
    let e: typeof enrollments[number] | undefined;
    if (cands.length === 1) { e = cands[0]; matched++; }
    else if (cands.length > 1) { ambiguous++; continue; }
    else { unmatched.push(fullName); continue; }

    if (!e.startDate) { skippedNoStart++; continue; }
    const studentStartKey = e.startDate.toISOString().slice(0, 10);

    for (const col of colAssignments) {
      const raw = r[col.col];
      if (raw === '' || raw == null) continue;
      const score = parseFloat(String(raw));
      if (!Number.isFinite(score)) { skippedNonNumeric++; continue; }

      const title = aliasTitle(col.title);
      const a = dbAssignByTitle.get(title);
      if (!a) { unmappedAssignments.add(title); continue; }

      // Rule B: module startDate before student startDate (date-only compare)
      const ms = moduleStartByAssignment.get(a.id);
      if (ms && ms.toISOString().slice(0, 10) < studentStartKey) { skippedPreStart++; continue; }

      const key = `${e.userId}|${a.id}`;
      const ex = subMap.get(key);
      if (ex && ex.score === score) continue;
      plans.push({
        studentId: e.userId,
        assignmentId: a.id,
        score,
        isCreate: !ex,
        oldScore: ex?.score ?? null,
        studentLabel: `${e.user.firstName} ${e.user.lastName}`,
        assignmentTitle: a.title,
      });
    }
  }

  console.log(`\nMatches: unique=${matched}, ambiguous=${ambiguous}, unmatched=${unmatched.length}`);
  if (unmatched.length) { console.log(`  unmatched:`); for (const u of unmatched) console.log(`    ${u}`); }
  if (unmappedAssignments.size) { console.log(`  Assignment columns not in DB:`); for (const t of unmappedAssignments) console.log(`    ${t}`); }
  console.log(`\nRule B skips:    ${skippedPreStart}`);
  console.log(`Non-numeric skips (PASS/INC): ${skippedNonNumeric}`);
  console.log(`No-start skips:  ${skippedNoStart}`);
  console.log(`\nPlanned changes: ${plans.length}`);
  const creates = plans.filter(p => p.isCreate).length;
  console.log(`  creates: ${creates}   updates: ${plans.length - creates}`);

  console.log(`\nSample (first 8):`);
  for (const p of plans.slice(0, 8)) {
    console.log(`  ${p.studentLabel.padEnd(26).slice(0, 26)} | ${p.assignmentTitle.padEnd(50).slice(0, 50)} | ${p.isCreate ? 'CREATE' : `UPDATE old=${p.oldScore}`} → ${p.score}`);
  }

  if (!WRITE) { console.log('\nDRY RUN — re-run with --write.'); await pool.end(); return; }

  const now = new Date();
  let cursor = 0, done = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= plans.length) return;
      const p = plans[i];
      await prisma.submission.upsert({
        where: { assignmentId_studentId: { assignmentId: p.assignmentId, studentId: p.studentId } },
        update: { score: p.score, status: 'GRADED', date: now },
        create: { studentId: p.studentId, assignmentId: p.assignmentId, score: p.score, status: 'GRADED', date: now },
      });
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${plans.length}`);
    }
  };
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`  ${done}/${plans.length}\nDone.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
