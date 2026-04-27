// Apply assignment name + Out-Of corrections from
// "canvas-marks-overflow (corrected).xlsx".
//
// Per row: find assignment by oldTitle in the course, set its title=newTitle
// and points=outOf. Submissions are not touched (FK keeps them attached
// to the same assignment row).
//
// Default: dry-run. Pass --apply to write.

import 'dotenv/config';
import fs from 'fs';
import XLSX from 'xlsx';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const FILE = '/Users/yaman/Downloads/canvas-marks-overflow (corrected).xlsx';
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 4,
});

(async () => {
  const t0 = Date.now();
  const wb = XLSX.read(fs.readFileSync(FILE), { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const arr = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false, defval: '' });

  type Row = { courseCode: string; oldTitle: string; newTitle: string; outOf: number };
  const rows: Row[] = [];
  for (let i = 1; i < arr.length; i++) {
    const r = arr[i];
    if (!r || !r[3]) continue;
    rows.push({
      courseCode: String(r[3] ?? '').trim(),
      oldTitle:   String(r[4] ?? '').trim(),
      newTitle:   String(r[5] ?? '').trim(),
      outOf:      Number(r[7]),
    });
  }
  console.log(`Excel rows: ${rows.length}`);

  // Distinct assignment-level ops keyed by (course, oldTitle).
  const ops = new Map<string, Row>();
  for (const r of rows) {
    const k = `${r.courseCode}::${r.oldTitle}`;
    const existing = ops.get(k);
    if (!existing) ops.set(k, r);
    else if (existing.newTitle !== r.newTitle || existing.outOf !== r.outOf) {
      console.log(`  conflict for ${k}: ${existing.newTitle}/${existing.outOf} vs ${r.newTitle}/${r.outOf}`);
    }
  }
  console.log(`Distinct assignments to update: ${ops.size}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  const courseRes = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM courses`);
  const courseId = new Map<string, string>();
  for (const c of courseRes.rows) courseId.set(c.code, c.id);

  let updated = 0, unchanged = 0, missing = 0;
  const issues: string[] = [];
  const sample: string[] = [];
  const client = await pool.connect();

  try {
    if (APPLY) await client.query('BEGIN');
    for (const op of ops.values()) {
      const cid = courseId.get(op.courseCode);
      if (!cid) { issues.push(`Unknown course code: ${op.courseCode}`); missing++; continue; }

      const cur = await client.query<{ id: string; title: string; points: number }>(
        `SELECT id, title, points FROM assignments WHERE course_id = $1 AND title = $2`,
        [cid, op.oldTitle]
      );
      if (cur.rows.length === 0) { issues.push(`[${op.courseCode}] missing assignment "${op.oldTitle}"`); missing++; continue; }

      // Multiple matches possible if the same title exists more than once; update all.
      let touched = 0;
      for (const a of cur.rows) {
        const sameTitle = a.title === op.newTitle;
        const samePts = Number(a.points) === op.outOf;
        if (sameTitle && samePts) { unchanged++; continue; }
        if (APPLY) {
          await client.query(`UPDATE assignments SET title = $1, points = $2 WHERE id = $3`,
            [op.newTitle, op.outOf, a.id]);
        }
        if (sample.length < 15) sample.push(`[${op.courseCode}] "${a.title}" (${a.points}) -> "${op.newTitle}" (${op.outOf})`);
        touched++;
      }
      updated += touched;
    }
    if (APPLY) await client.query('COMMIT');
  } catch (err) {
    if (APPLY) await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log('=== Summary ===');
  console.log(`  updated:    ${updated}`);
  console.log(`  unchanged:  ${unchanged}`);
  console.log(`  missing:    ${missing}`);
  if (sample.length) {
    console.log('\nSample changes:');
    for (const s of sample) console.log(`  ${s}`);
  }
  if (issues.length) {
    console.log(`\nIssues (${issues.length}):`);
    for (const s of issues.slice(0, 30)) console.log(`  ${s}`);
    if (issues.length > 30) console.log(`  ... and ${issues.length - 30} more`);
  }
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
  if (!APPLY) console.log('DRY-RUN. Re-run with --apply to write.');
  await pool.end();
})();
