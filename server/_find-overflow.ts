// Find assignments with at least one submission whose score > assignment.points.
// Outputs both a console summary and a CSV with all overflow rows.
import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 2,
});

(async () => {
  const r = await pool.query(`
    SELECT
      c.code AS course_code,
      c.name AS course_name,
      a.id   AS assignment_id,
      a.title AS assignment_title,
      a.points AS assignment_points,
      COUNT(*)::int AS overflow_subs,
      MAX(s.score)::float AS max_score,
      MIN(s.score)::float AS min_overflow_score
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN courses c ON c.id = a.course_id
    WHERE s.score IS NOT NULL
      AND a.points IS NOT NULL
      AND a.points > 0
      AND s.score > a.points
    GROUP BY c.code, c.name, a.id, a.title, a.points
    ORDER BY c.code, overflow_subs DESC
  `);

  console.log(`Assignments with overflow: ${r.rows.length}`);
  console.log();
  // Per-course summary
  const byCourse: Record<string, { assignments: number; subs: number }> = {};
  for (const row of r.rows) {
    const c = row.course_code;
    if (!byCourse[c]) byCourse[c] = { assignments: 0, subs: 0 };
    byCourse[c].assignments++;
    byCourse[c].subs += row.overflow_subs;
  }
  console.log('Per-course summary:');
  for (const [c, v] of Object.entries(byCourse).sort((a, b) => b[1].subs - a[1].subs)) {
    console.log(`  ${c.padEnd(6)} ${String(v.assignments).padStart(3)} assignments, ${String(v.subs).padStart(4)} overflow submissions`);
  }

  console.log('\nTop 30 overflow assignments:');
  for (const row of r.rows.slice(0, 30)) {
    console.log(`  [${row.course_code.padEnd(5)}] ${row.assignment_title.slice(0, 60).padEnd(60)} pts=${String(row.assignment_points).padStart(5)}  max=${String(row.max_score).padStart(5)}  n=${row.overflow_subs}`);
  }

  // Detailed CSV: each overflow submission
  const det = await pool.query(`
    SELECT
      c.code AS course_code,
      a.title AS assignment_title,
      a.points AS assignment_points,
      u.first_name, u.last_name, u.email, u.v_number,
      s.score,
      s.id AS submission_id,
      s.status::text
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN courses c ON c.id = a.course_id
    JOIN users u ON u.id = s.student_id
    WHERE s.score IS NOT NULL
      AND a.points IS NOT NULL
      AND a.points > 0
      AND s.score > a.points
    ORDER BY c.code, a.title, s.score DESC
  `);

  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = ['course_code,assignment_title,assignment_points,roll_number,student_name,email,score,status,submission_id'];
  for (const r of det.rows) {
    const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();
    lines.push([r.course_code, r.assignment_title, r.assignment_points, r.v_number, name, r.email, r.score, r.status, r.submission_id].map(esc).join(','));
  }
  const out = '/Users/yaman/Downloads/tahacanvas-main/overflow-assignments.csv';
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`\nWrote ${det.rows.length} detailed rows -> ${out}`);

  await pool.end();
})();
