// Best-effort tagging of IBA TAHA files with their module heading.
// Uses confident filename keyword rules. Files that don't match any rule
// are left unassigned (module_id stays NULL).
// Default: dry-run. Pass --apply to write.

import 'dotenv/config';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 2,
});

// (regex, target module name) — first match wins.
const RULES: Array<[RegExp, string]> = [
  [/MKTG|marketing/i,                        'Fundamentals of Marketing'],
  [/OSCM|operations\s*research|Collier/i,    'Operations Research'],
  [/microeconomics|micro\s*economics/i,      'Micro Economics'],
  [/macroeconomics|macro\s*economics/i,      'Macro Economics'],
  [/cross[-\s]*cultural/i,                   'Cross Cultural Management'],
  [/statistics/i,                            'Statistics for Business'],
  [/business\s*ethics/i,                     'Business Ethics'],
  [/international\s*law/i,                   'International Law'],
  [/international\s*business\s*strategy/i,   'International Business Strategy'],
  [/management\s*fundamentals/i,             'Management Fundamentals'],
  [/sales\s*management/i,                    'Sales Management'],
  [/HRM|human\s*resource/i,                  'Introduction to HRM'],
  [/accounting/i,                            'Fundamentals of Accounting'],
  [/listening|english\s*fundamentals|IELTS/i,'English Fundamentals'],
  [/CBL4e|business\s*law/i,                  'Business Law'],
  [/leadership/i,                            'Leadership'],
  [/intercultural/i,                         'Intercultural Communication'],
  [/entrepreneur/i,                          'Entrepreneurship'],
  [/project\s*management/i,                  'Project Management'],
  [/strategic\s*management/i,                'Strategic Management'],
  [/organi[sz]ational\s*behaviour/i,         'Organizational Behaviour'],
  [/banking|finance/i,                       'International Banking & Finance'],
  [/e[\s-]*commerce|digital\s*marketing/i,   'E Commerce & Digital Marketing'],
  [/computer\s*application/i,                'Computer Applications in Business'],
];

(async () => {
  const c = await pool.query<{ id: string }>(`SELECT id FROM courses WHERE code='IBA'`);
  if (!c.rows[0]) { console.log('IBA not found'); await pool.end(); return; }
  const courseId = c.rows[0].id;

  const mods = await pool.query<{ id: string; name: string }>(`SELECT id, name FROM modules WHERE course_id = $1`, [courseId]);
  const modIdByName = new Map<string, string>();
  for (const m of mods.rows) modIdByName.set(m.name.trim().toLowerCase(), m.id);

  const files = await pool.query<{ id: string; file_name: string; module_id: string | null }>(
    `SELECT id, file_name, module_id FROM course_files WHERE course_id = $1 ORDER BY file_name`,
    [courseId]
  );

  console.log(`IBA files: ${files.rows.length}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);

  let assigned = 0, unchanged = 0, skipped = 0;
  const summary: Record<string, number> = {};
  const unmatched: string[] = [];

  for (const f of files.rows) {
    let target: string | null = null;
    for (const [re, name] of RULES) {
      if (re.test(f.file_name)) { target = name; break; }
    }
    if (!target) { unmatched.push(f.file_name); skipped++; continue; }
    const mid = modIdByName.get(target.toLowerCase());
    if (!mid) { unmatched.push(`${f.file_name}  (no module "${target}")`); skipped++; continue; }
    summary[target] = (summary[target] ?? 0) + 1;
    if (f.module_id === mid) { unchanged++; continue; }
    if (APPLY) await pool.query(`UPDATE course_files SET module_id = $1 WHERE id = $2`, [mid, f.id]);
    assigned++;
  }

  console.log('Assigned per module:');
  for (const [k, v] of Object.entries(summary).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(40)} ${v}`);

  console.log(`\n=== Summary ===`);
  console.log(`  assigned:   ${assigned}`);
  console.log(`  unchanged:  ${unchanged}`);
  console.log(`  unmatched:  ${skipped}`);
  if (unmatched.length) {
    console.log('\nUnmatched files (left without module):');
    for (const s of unmatched) console.log(`  - ${s}`);
  }
  if (!APPLY) console.log('\nDRY-RUN. Re-run with --apply to write.');
  await pool.end();
})();
