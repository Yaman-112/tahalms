// CSW progress sync (single-track rotation).
// Walks each enrollment's startDate -> today across the CSW schedule and
// writes studentProgress + enrollment.currentModuleId, mirroring the IBA
// sync pattern. NOT_STARTED modules get startedAt = next future occurrence
// in the rotation so the timeline orders by when they'll next be taught.
//
// Default: dry-run. Pass --apply to write. Pass --force to also process
// enrollments whose currentModuleId is already set.

import 'dotenv/config';
import pg from 'pg';
import { CSW_SESSIONS } from './utils/csw-rotation.js';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 4,
});

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

(async () => {
  const t0 = Date.now();
  const courseRow = await pool.query<{ id: string }>(`SELECT id FROM courses WHERE code='CSW' LIMIT 1`);
  if (!courseRow.rows[0]) { console.log('CSW not found'); await pool.end(); return; }
  const courseId = courseRow.rows[0].id;

  const modulesRes = await pool.query<{ id: string; name: string; position: number }>(
    `SELECT id, name, position FROM modules WHERE course_id = $1`, [courseId]
  );
  const modByName = new Map<string, { id: string; name: string; position: number }>();
  for (const m of modulesRes.rows) modByName.set(norm(m.name), m);

  const enrRes = await pool.query<{
    id: string; user_id: string; batch_code: string | null;
    start_date: Date | null; current_module_id: string | null;
  }>(
    `SELECT id, user_id, batch_code, start_date, current_module_id
       FROM enrollments
       WHERE course_id = $1 AND start_date IS NOT NULL`, [courseId]
  );

  const existingProgress = await pool.query<{ enrollment_id: string; batch_id: string }>(
    `SELECT DISTINCT enrollment_id, batch_id FROM student_progress
       WHERE enrollment_id IN (SELECT id FROM enrollments WHERE course_id = $1)`, [courseId]
  );
  const batchIdByEnrollment = new Map<string, string>();
  for (const r of existingProgress.rows) batchIdByEnrollment.set(r.enrollment_id, r.batch_id);

  const batchesRes = await pool.query<{ id: string; batch_code: string }>(
    `SELECT id, batch_code FROM batches WHERE course_id = $1`, [courseId]
  );
  const batchIdByCode = new Map<string, string>();
  for (const b of batchesRes.rows) batchIdByCode.set(b.batch_code, b.id);
  const fallbackBatchId = batchesRes.rows[0]?.id ?? '';

  const now = new Date();
  const targets = FORCE ? enrRes.rows : enrRes.rows.filter(e => !e.current_module_id);
  console.log(`Total CSW enrollments with startDate: ${enrRes.rows.length}`);
  console.log(`To process: ${targets.length} ${FORCE ? '(force)' : '(remaining only)'}`);
  console.log(`Today (UTC): ${now.toISOString().slice(0, 10)}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);

  type Row = { enrollmentId: string; moduleId: string; batchId: string;
               status: 'COMPLETED'|'IN_PROGRESS'|'NOT_STARTED';
               startedAt: Date | null; completedAt: Date | null };
  const allRows: Row[] = [];
  const currentByEnrollment = new Map<string, string | null>();

  for (const e of targets) {
    const start = new Date(e.start_date!);
    const batchId = batchIdByEnrollment.get(e.id) || (e.batch_code && batchIdByCode.get(e.batch_code)) || fallbackBatchId;
    if (!batchId) continue;

    const rowMap = new Map<string, Row>();
    for (const m of modulesRes.rows) {
      rowMap.set(m.id, { enrollmentId: e.id, moduleId: m.id, batchId, status: 'NOT_STARTED', startedAt: null, completedAt: null });
    }

    let currentModuleId: string | null = null;
    for (const s of CSW_SESSIONS) {
      if (s.end <= start) continue;
      if (s.start > now) continue;
      if (/winter break/i.test(s.module)) continue;
      const mod = modByName.get(norm(s.module));
      if (!mod) continue;
      const effStart = s.start > start ? s.start : start;
      const prev = rowMap.get(mod.id)!;

      if (s.end <= now) {
        const prevStart = prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS' ? prev.startedAt : null;
        const prevEnd = prev.status === 'COMPLETED' ? prev.completedAt : null;
        prev.status = 'COMPLETED';
        prev.startedAt = prevStart && prevStart < effStart ? prevStart : effStart;
        prev.completedAt = prevEnd && prevEnd > s.end ? prevEnd : s.end;
      } else {
        const prevStart = prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS' ? prev.startedAt : null;
        prev.status = 'IN_PROGRESS';
        prev.startedAt = prevStart && prevStart < effStart ? prevStart : effStart;
        prev.completedAt = null;
        currentModuleId = mod.id;
      }
    }

    // Future rotation date for any module still NOT_STARTED.
    for (const [moduleId, row] of rowMap) {
      if (row.status !== 'NOT_STARTED') continue;
      const moduleName = modulesRes.rows.find(m => m.id === moduleId)?.name;
      if (!moduleName) continue;
      const next = CSW_SESSIONS.find(s =>
        s.start > now &&
        !/winter break/i.test(s.module) &&
        norm(s.module) === norm(moduleName)
      );
      row.startedAt = next ? next.start : null;
    }

    for (const r of rowMap.values()) allRows.push(r);
    currentByEnrollment.set(e.id, currentModuleId);
  }

  // Aggregate stats + sample.
  let comp = 0, inp = 0, ns = 0;
  for (const r of allRows) {
    if (r.status === 'COMPLETED') comp++;
    else if (r.status === 'IN_PROGRESS') inp++;
    else ns++;
  }
  console.log(`Prepared ${allRows.length} progress rows + ${currentByEnrollment.size} enrollment updates.`);
  console.log(`Status totals: COMPLETED=${comp} IN_PROGRESS=${inp} NOT_STARTED=${ns}`);

  // Distribution by today's module
  const byCurrent: Record<string, number> = {};
  for (const [eid, mid] of currentByEnrollment) {
    const m = mid ? modulesRes.rows.find(x => x.id === mid)?.name : '(none)';
    const k = m || '(none)';
    byCurrent[k] = (byCurrent[k] ?? 0) + 1;
  }
  console.log('Current-module distribution today:');
  for (const [k, v] of Object.entries(byCurrent).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(50)} ${v}`);
  }

  if (!APPLY) {
    console.log('\nDRY-RUN. Re-run with --apply to write.');
    await pool.end();
    return;
  }

  // ---------- APPLY ----------
  const CHUNK = 500;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < allRows.length; i += CHUNK) {
      const batch = allRows.slice(i, i + CHUNK);
      const values: string[] = [];
      const params: any[] = [];
      let p = 1;
      for (const r of batch) {
        values.push(`(gen_random_uuid()::text, $${p++}, $${p++}, $${p++}, $${p++}::"ProgressStatus", $${p++}, $${p++})`);
        params.push(r.enrollmentId, r.batchId, r.moduleId, r.status, r.startedAt, r.completedAt);
      }
      await client.query(
        `INSERT INTO student_progress (id, enrollment_id, batch_id, module_id, status, started_at, completed_at)
         VALUES ${values.join(',')}
         ON CONFLICT (enrollment_id, module_id) DO UPDATE SET
           status = EXCLUDED.status,
           started_at = EXCLUDED.started_at,
           completed_at = EXCLUDED.completed_at`,
        params
      );
      console.log(`  upserted progress rows: ${Math.min(i + CHUNK, allRows.length)} / ${allRows.length}`);
    }

    const enrEntries = [...currentByEnrollment.entries()];
    for (let i = 0; i < enrEntries.length; i += CHUNK) {
      const batch = enrEntries.slice(i, i + CHUNK);
      const ids: string[] = [];
      const cases: string[] = [];
      const params: any[] = [];
      let p = 1;
      for (const [eid, mid] of batch) {
        ids.push(`$${p++}`);
        params.push(eid);
        if (mid === null) {
          cases.push(`WHEN id = $${p - 1} THEN NULL`);
        } else {
          cases.push(`WHEN id = $${p - 1} THEN $${p++}::text`);
          params.push(mid);
        }
      }
      await client.query(
        `UPDATE enrollments SET current_module_id = CASE ${cases.join(' ')} END
         WHERE id IN (${ids.join(',')})`,
        params
      );
      console.log(`  updated currentModuleId: ${Math.min(i + CHUNK, enrEntries.length)} / ${enrEntries.length}`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
  await pool.end();
})();
