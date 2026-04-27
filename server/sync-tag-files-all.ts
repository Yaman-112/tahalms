// Tag every TAHA CourseFile with a module heading (best-effort) by:
// 1. Direct module-name match: if a file's name contains the literal module
//    name (case-insensitive), assign that module.
// 2. Per-course aliases: hard-coded keyword rules for common publisher codes.
// Files that don't match any rule are left unassigned.
//
// Default: dry-run. Pass --apply to write.
import 'dotenv/config';
import pg from 'pg';

const APPLY = process.argv.includes('--apply');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 4,
});

// Per-course alias rules. (regex, target module DB name).
const ALIASES: Record<string, Array<[RegExp, string]>> = {
  IBA: [
    [/MKTG|marketing/i,                        'Fundamentals of Marketing'],
    [/OSCM|Collier/i,                          'Operations Research'],
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
  ],
  HT: [
    [/MKTG|marketing/i,                        'Fundamentals of Marketing'],
    [/OSCM|Collier/i,                          'Operations Research'],
    [/microeconomics|micro\s*economics/i,      'Micro Economics'],
    [/macroeconomics|macro\s*economics/i,      'Macro Economics'],
    [/statistics/i,                            'Statistics for Business'],
    [/business\s*ethics/i,                     'Business Ethics'],
    [/HRM|human\s*resource/i,                  'Introduction to HRM'],
    [/accounting/i,                            'Fundamentals of Accounting'],
    [/listening|english\s*fundamentals|IELTS/i,'English Fundamentals'],
    [/CBL4e|business\s*law/i,                  'Business Law'],
    [/management\s*fundamentals/i,             'Management Fundamentals'],
    [/sales\s*management/i,                    'Sales Management'],
    [/project\s*management/i,                  'Project Management'],
    [/strategic\s*management/i,                'Strategic Management'],
    [/organi[sz]ational\s*behaviour/i,         'Organizational Behaviour'],
    [/computer\s*application/i,                'Computer Applications in Business'],
    [/hospitality\s*law/i,                     'Hospitality Law'],
    [/front\s*office/i,                        'Managing Front Office Operations'],
    [/house\s*keeping|housekeeping/i,          'House Keeping'],
    [/food.*beverage|f.?b\b/i,                 'Food & Beverage Management'],
    [/training.*development/i,                 'Training & Development in Hospitality Industry'],
    [/managing\s*technology/i,                 'Managing Technology in Hospitality Industry'],
    [/canadian\s*tourism|international.*tourism/i, 'International & Canadian Tourism'],
    [/hospitality.*tourism|tourism.*hospitality/i, 'Introduction to Hospitality & Tourism'],
  ],
  AC: [
    [/excel/i,             'Microsoft Excel 1 and Excel 2'],
    [/powerpoint|pptx?$/i, 'Microsoft Powerpoint'],
    [/outlook/i,           'Microsoft Outlook'],
    [/windows/i,           'Microsoft Windows'],
    [/word/i,              'Microsoft Word 2'],
    [/quickbooks/i,        'Computerized Accounting with Quickbooks'],
    [/sage\s*50|sage\s*300|sage50|sage300/i, 'Computerized Accounting with Sage50/Sage300'],
    [/payroll.*1|payroll\s*fundamentals\s*1/i, 'Payroll Fundamentals 1'],
    [/payroll.*2|payroll\s*fundamentals\s*2/i, 'Payroll Fundamental 2'],
    [/income\s*tax|tax/i, 'Canadian Income Tax'],
    [/bookkeep|book\s*keep|accounting\s*fundamentals/i, 'Accounting Fundamentals and Book Keeping'],
    [/job\s*search/i,      'Job Search'],
    [/office\s*procedure/i,'Office Procedures'],
  ],
  MOA: [
    [/excel/i,                'Microsoft Office Suite'],
    [/powerpoint/i,           'Microsoft Office Suite'],
    [/outlook/i,              'Microsoft Office Suite'],
    [/windows/i,              'Microsoft Office Suite'],
    [/access/i,               'Microsoft Office Suite'],
    [/word/i,                 'Microsoft Office Suite'],
    [/anatomy|physiology/i,   'Anatomy and Physiology'],
    [/medical\s*terminology/i,'Medical Terminology'],
    [/transcription/i,        'Medical Transcription'],
    [/ohip|coding/i,          'Medical Coding & OHIP Billing'],
    [/business\s*communication/i, 'Business Communication'],
    [/job\s*search|job\s*strategy/i, 'Job Search Strategies'],
    [/office\s*procedure|administr/i, 'Medical Office Procedure'],
  ],
};

(async () => {
  const courses = await pool.query<{ id: string; code: string; name: string }>(`SELECT id, code, name FROM courses ORDER BY code`);
  const grand = { assigned: 0, unchanged: 0, unmatched: 0 };

  for (const c of courses.rows) {
    const mods = await pool.query<{ id: string; name: string; position: number }>(
      `SELECT id, name, position FROM modules WHERE course_id = $1`, [c.id]
    );
    if (mods.rows.length === 0) continue;
    const modIdByName = new Map<string, string>();
    for (const m of mods.rows) modIdByName.set(m.name.trim().toLowerCase(), m.id);
    const moduleNames = mods.rows
      .map(m => ({ id: m.id, name: m.name }))
      .sort((a, b) => b.name.length - a.name.length); // longer names first

    const aliases = ALIASES[c.code] || [];

    const files = await pool.query<{ id: string; file_name: string; module_id: string | null }>(
      `SELECT id, file_name, module_id FROM course_files WHERE course_id = $1 ORDER BY file_name`, [c.id]
    );
    if (files.rows.length === 0) continue;

    let assigned = 0, unchanged = 0, unmatched = 0;
    for (const f of files.rows) {
      let targetId: string | null = null;
      // 1) Direct: longest matching module name in filename
      for (const m of moduleNames) {
        if (f.file_name.toLowerCase().includes(m.name.toLowerCase())) { targetId = m.id; break; }
      }
      // 2) Per-course alias rules
      if (!targetId) {
        for (const [re, name] of aliases) {
          if (re.test(f.file_name)) {
            const id = modIdByName.get(name.toLowerCase());
            if (id) { targetId = id; break; }
          }
        }
      }
      if (!targetId) { unmatched++; continue; }
      if (f.module_id === targetId) { unchanged++; continue; }
      if (APPLY) await pool.query(`UPDATE course_files SET module_id = $1 WHERE id = $2`, [targetId, f.id]);
      assigned++;
    }
    console.log(`[${c.code.padEnd(5)}] ${c.name.slice(0, 35).padEnd(35)} files=${String(files.rows.length).padStart(3)}  assigned=${String(assigned).padStart(3)}  unchanged=${String(unchanged).padStart(3)}  unmatched=${String(unmatched).padStart(3)}`);
    grand.assigned += assigned;
    grand.unchanged += unchanged;
    grand.unmatched += unmatched;
  }

  console.log(`\n=== Total: assigned=${grand.assigned} unchanged=${grand.unchanged} unmatched=${grand.unmatched} ===`);
  if (!APPLY) console.log('DRY-RUN. Re-run with --apply to write.');
  await pool.end();
})();
