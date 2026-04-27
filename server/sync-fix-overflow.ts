// Fix every assignment whose stored points are below the highest student score:
// new_points = max(current_points, ceil(max_score / 10) * 10).
// Submissions are not touched. Default: dry-run. Pass --apply to write.
import 'dotenv/config';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 2,
});

(async () => {
  const r = await pool.query<{ assignment_id: string; course_code: string; title: string;
                                old_points: number; max_score: number; n_overflow: number }>(`
    SELECT
      a.id   AS assignment_id,
      c.code AS course_code,
      a.title,
      a.points AS old_points,
      MAX(s.score)::float AS max_score,
      COUNT(*)::int AS n_overflow
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN courses c ON c.id = a.course_id
    WHERE s.score IS NOT NULL
      AND a.points IS NOT NULL
      AND a.points > 0
      AND s.score > a.points
    GROUP BY a.id, c.code, a.title, a.points
    ORDER BY c.code, a.title
  `);

  const updates = r.rows.map(row => {
    const newPts = Math.max(Number(row.old_points), Math.ceil(row.max_score / 10) * 10);
    return { ...row, new_points: newPts };
  });

  console.log(`Assignments to fix: ${updates.length}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);
  for (const u of updates) {
    console.log(`  [${u.course_code.padEnd(5)}] ${u.title.slice(0, 60).padEnd(60)} ${String(u.old_points).padStart(5)} -> ${String(u.new_points).padStart(5)}  (max=${u.max_score}, n=${u.n_overflow})`);
  }

  if (!APPLY) { console.log('\nDRY-RUN. Re-run with --apply to write.'); await pool.end(); return; }

  for (const u of updates) {
    await pool.query(`UPDATE assignments SET points = $1 WHERE id = $2`, [u.new_points, u.assignment_id]);
  }
  console.log(`\nApplied ${updates.length} updates.`);
  await pool.end();
})();
