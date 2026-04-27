// Extract from modules_audit.csv only the File-type items, organized as
// (canvas_course_id, canvas_course_name, canvas_module_name, file_title, canvas_file_id, file_url).
import fs from 'fs';

const csv = fs.readFileSync('/Users/yaman/Downloads/tahacanvas-main/modules_audit.csv', 'utf8');
const lines = csv.split('\n');

// Robust CSV parser (handles quoted fields with commas).
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

const header = parseCsvLine(lines[0]);
const idx = (n: string) => header.indexOf(n);
const I = {
  course_id:    idx('course_id'),
  course_name:  idx('course_name'),
  module_id:    idx('module_id'),
  module_name:  idx('module_name'),
  module_position: idx('module_position'),
  item_id:      idx('item_id'),
  item_title:   idx('item_title'),
  item_type:    idx('item_type'),
  item_position: idx('item_position'),
  item_url:     idx('item_url'),
  item_html_url: idx('item_html_url'),
  item_content_id: idx('item_content_id'),
};

type Row = {
  course_id: string; course_name: string;
  module_id: string; module_name: string; module_position: string;
  file_title: string; canvas_file_id: string; canvas_file_url: string;
};
const rows: Row[] = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i]) continue;
  const cols = parseCsvLine(lines[i]);
  if (cols[I.item_type] !== 'File') continue;
  rows.push({
    course_id:       cols[I.course_id],
    course_name:     cols[I.course_name],
    module_id:       cols[I.module_id],
    module_name:     cols[I.module_name],
    module_position: cols[I.module_position],
    file_title:      cols[I.item_title],
    canvas_file_id:  cols[I.item_content_id],
    canvas_file_url: cols[I.item_html_url],
  });
}

// Group: course -> module -> files
const byCourse = new Map<string, { name: string; modules: Map<string, { name: string; position: string; files: Row[] }> }>();
for (const r of rows) {
  if (!byCourse.has(r.course_id)) byCourse.set(r.course_id, { name: r.course_name, modules: new Map() });
  const c = byCourse.get(r.course_id)!;
  if (!c.modules.has(r.module_id)) c.modules.set(r.module_id, { name: r.module_name, position: r.module_position, files: [] });
  c.modules.get(r.module_id)!.files.push(r);
}

// Per-course summary printout
console.log('=== Canvas courses with files (per module heading) ===\n');
const sorted = [...byCourse.values()].sort((a, b) => a.name.localeCompare(b.name));
let totalCourses = 0, totalModules = 0, totalFiles = 0;
for (const c of sorted) {
  let modsWithFiles = 0, courseFileCount = 0;
  for (const m of c.modules.values()) { modsWithFiles++; courseFileCount += m.files.length; }
  if (courseFileCount === 0) continue;
  totalCourses++;
  totalModules += modsWithFiles;
  totalFiles += courseFileCount;
  console.log(`\n[${c.name}]  modules-with-files=${modsWithFiles}  files=${courseFileCount}`);
  const orderedMods = [...c.modules.values()].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  for (const m of orderedMods) {
    console.log(`  pos=${m.position.padStart(2)} ${m.name.padEnd(50)} (${m.files.length} files)`);
    for (const f of m.files.slice(0, 3)) {
      console.log(`        - ${f.file_title}`);
    }
    if (m.files.length > 3) console.log(`        ... +${m.files.length - 3} more`);
  }
}

console.log(`\n=== TOTAL: ${totalCourses} courses, ${totalModules} modules, ${totalFiles} files ===`);

// Detailed CSV output
const csvEsc = (v: any) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const outLines = ['canvas_course_id,canvas_course_name,canvas_module_id,canvas_module_name,canvas_module_position,file_title,canvas_file_id,canvas_file_url'];
for (const r of rows) {
  outLines.push([r.course_id, r.course_name, r.module_id, r.module_name, r.module_position, r.file_title, r.canvas_file_id, r.canvas_file_url].map(csvEsc).join(','));
}
const out = '/Users/yaman/Downloads/tahacanvas-main/canvas-files-by-module.csv';
fs.writeFileSync(out, outLines.join('\n'));
console.log(`\nWrote ${rows.length} rows -> ${out}`);
