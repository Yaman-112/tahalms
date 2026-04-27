// MOA progress sync (parallel filler + program, single track).
import 'dotenv/config';
import pg from 'pg';
import { MOA_SESSIONS, moaDbModuleName } from './utils/moa-rotation.js';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 4,
});

(async () => {
  const t0 = Date.now();
  const courseRow = await pool.query<{ id: string }>(`SELECT id FROM courses WHERE code='MOA' LIMIT 1`);
  if (!courseRow.rows[0]) { console.log('MOA not found'); await pool.end(); return; }
  const courseId = courseRow.rows[0].id;

  const modulesRes = await pool.query<{ id: string; name: string; position: number }>(
    `SELECT id, name, position FROM modules WHERE course_id = $1`, [courseId]
  );
  const modByExactName = new Map<string, { id: string; name: string; position: number }>();
  for (const m of modulesRes.rows) modByExactName.set(m.name, m);
  const resolveModule = (scheduleName: string) => {
    const dbName = moaDbModuleName(scheduleName);
    return dbName ? (modByExactName.get(dbName) || null) : null;
  };

  type Window = { moduleId: string; start: Date; end: Date };
  const fillerWindows: Window[] = [];
  for (let i = 0; i < MOA_SESSIONS.length; i++) {
    const s = MOA_SESSIONS[i];
    if (!s.filler) continue;
    if (/winter break/i.test(s.filler)) continue;
    const next = MOA_SESSIONS[i + 1];
    const end = next ? next.start : new Date(s.start.getTime() + 7 * 86400000);
    const mod = resolveModule(s.filler);
    if (!mod) continue;
    fillerWindows.push({ moduleId: mod.id, start: s.start, end });
  }

  const programWindows: Window[] = [];
  let i = 0;
  while (i < MOA_SESSIONS.length) {
    const s = MOA_SESSIONS[i];
    if (/winter break/i.test(s.program)) { i++; continue; }
    let j = i + 1;
    while (j < MOA_SESSIONS.length && MOA_SESSIONS[j].program === s.program) j++;
    const end = j < MOA_SESSIONS.length
      ? MOA_SESSIONS[j].start
      : new Date(MOA_SESSIONS[j - 1].start.getTime() + 7 * 86400000);
    const mod = resolveModule(s.program);
    if (mod) programWindows.push({ moduleId: mod.id, start: s.start, end });
    i = j;
  }

  const unresolved = new Set<string>();
  for (const s of MOA_SESSIONS) {
    if (s.filler && !/winter break/i.test(s.filler) && !resolveModule(s.filler)) unresolved.add(s.filler);
    if (!/winter break/i.test(s.program) && !resolveModule(s.program)) unresolved.add(s.program);
  }
  if (unresolved.size) console.log('Unresolved schedule names:', [...unresolved]);

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
  console.log(`Total MOA enrollments with startDate: ${enrRes.rows.length}`);
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

    const apply = (windows: Window[], setCurrent: boolean): string | null => {
      let current: string | null = null;
      for (const w of windows) {
        if (w.end <= start) continue;
        if (w.start > now) continue;
        const effStart = w.start > start ? w.start : start;
        const prev = rowMap.get(w.moduleId);
        if (!prev) continue;
        if (w.end <= now) {
          const prevStart = prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS' ? prev.startedAt : null;
          const prevEnd = prev.status === 'COMPLETED' ? prev.completedAt : null;
          prev.status = 'COMPLETED';
          prev.startedAt = prevStart && prevStart < effStart ? prevStart : effStart;
          prev.completedAt = prevEnd && prevEnd > w.end ? prevEnd : w.end;
        } else {
          const prevStart = prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS' ? prev.startedAt : null;
          prev.status = 'IN_PROGRESS';
          prev.startedAt = prevStart && prevStart < effStart ? prevStart : effStart;
          prev.completedAt = null;
          if (setCurrent) current = w.moduleId;
        }
      }
      return current;
    };

    apply(fillerWindows, false);
    const programCurrent = apply(programWindows, true);

    for (const [moduleId, row] of rowMap) {
      if (row.status !== 'NOT_STARTED') continue;
      const nexts = [...programWindows, ...fillerWindows]
        .filter(w => w.moduleId === moduleId && w.start > now)
        .map(w => w.start.getTime());
      if (nexts.length) row.startedAt = new Date(Math.min(...nexts));
    }

    for (const r of rowMap.values()) allRows.push(r);
    currentByEnrollment.set(e.id, programCurrent);
  }

  let comp = 0, inp = 0, ns = 0;
  for (const r of allRows) {
    if (r.status === 'COMPLETED') comp++;
    else if (r.status === 'IN_PROGRESS') inp++;
    else ns++;
  }
  console.log(`Prepared ${allRows.length} progress rows + ${currentByEnrollment.size} enrollment updates.`);
  console.log(`Status totals: COMPLETED=${comp} IN_PROGRESS=${inp} NOT_STARTED=${ns}`);

  const byCurrent: Record<string, number> = {};
  for (const [, mid] of currentByEnrollment) {
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

  const CHUNK = 500;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let k = 0; k < allRows.length; k += CHUNK) {
      const batch = allRows.slice(k, k + CHUNK);
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
      console.log(`  upserted progress rows: ${Math.min(k + CHUNK, allRows.length)} / ${allRows.length}`);
    }

    const enrEntries = [...currentByEnrollment.entries()];
    for (let k = 0; k < enrEntries.length; k += CHUNK) {
      const batch = enrEntries.slice(k, k + CHUNK);
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
      console.log(`  updated currentModuleId: ${Math.min(k + CHUNK, enrEntries.length)} / ${enrEntries.length}`);
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
