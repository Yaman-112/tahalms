// Per-student IBA progress sync.
//
// For each IBA enrollment with a non-null enrollment.startDate:
//   - Walk the IBA rotation schedule (server/utils/iba-schedule.ts) on the
//     student's track (weekday vs weekend) from enrollment.startDate → today.
//   - Each session whose window has fully ended before today → that module
//     becomes COMPLETED for the student, with startedAt = session start,
//     completedAt = session end.
//   - The session whose window contains today → that module becomes
//     IN_PROGRESS for the student, with startedAt = session start,
//     completedAt = null. Also written to enrollment.currentModuleId.
//   - Every other module in the IBA course (modules they missed before
//     joining, plus modules still in the future) → NOT_STARTED with
//     startedAt = null, completedAt = null.
//
// Default mode: dry-run (no DB writes). Pass --apply to actually write.
// Always snapshots pre-write state to a CSV first when applying.

import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  IBA_SESSIONS,
  ibaTrackForBatch,
  type IbaTrack,
} from './utils/iba-schedule.js';

const APPLY = process.argv.includes('--apply');
const DEBUG_EMAIL = process.argv.find(a => a.startsWith('--debug='))?.slice('--debug='.length);

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 5,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

type Plan = {
  enrollmentId: string;
  batchId: string;
  email: string | null;
  name: string;
  batchCode: string | null;
  track: IbaTrack;
  startDate: Date;
  currentModuleId: string | null;
  // moduleId → { status, startedAt, completedAt }
  rows: Map<string, { status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'; startedAt: Date | null; completedAt: Date | null }>;
};

(async () => {
  const course = await prisma.course.findFirst({
    where: { code: 'IBA' },
    include: { modules: true },
  });
  if (!course) { console.log('IBA course not found'); await prisma.$disconnect(); await pool.end(); return; }

  const modByName = new Map<string, typeof course.modules[number]>();
  for (const m of course.modules) modByName.set(norm(m.name), m);

  // Build per-track session windows once.
  const sessionsByTrack: Record<IbaTrack, Array<{ start: Date; end: Date; module: string }>> = {
    weekday: [], weekend: [],
  };
  for (const t of ['weekday', 'weekend'] as IbaTrack[]) {
    const ts = IBA_SESSIONS.filter(s => s.track === t);
    for (let i = 0; i < ts.length; i++) {
      const s = ts[i];
      const next = ts[i + 1];
      const end = next ? next.start : new Date(s.start.getTime() + 7 * 86400000);
      sessionsByTrack[t].push({ start: s.start, end, module: s.module });
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id, startDate: { not: null } },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });
  const totalIBA = await prisma.enrollment.count({ where: { courseId: course.id } });

  // Snapshot existing progress for these enrollments (for backup + delta).
  const existingProgress = await prisma.studentProgress.findMany({
    where: { enrollmentId: { in: enrollments.map(e => e.id) } },
  });
  const progressByEnroll = new Map<string, typeof existingProgress>();
  for (const p of existingProgress) {
    const arr = progressByEnroll.get(p.enrollmentId) ?? [];
    arr.push(p);
    progressByEnroll.set(p.enrollmentId, arr);
  }

  const now = new Date();
  console.log(`IBA enrollments total: ${totalIBA}`);
  console.log(`  with startDate (will sync): ${enrollments.length}`);
  console.log(`  without startDate (skipped): ${totalIBA - enrollments.length}`);
  console.log(`Today (UTC): ${now.toISOString().slice(0, 10)}`);
  console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN'}\n`);

  const plans: Plan[] = [];
  let unmatchedSession = 0;

  for (const e of enrollments) {
    const track = ibaTrackForBatch(e.batchCode);
    const start = e.startDate!;
    const sessions = sessionsByTrack[track];

    // Walk sessions from enrollment.startDate forward.
    const rows = new Map<string, { status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'; startedAt: Date | null; completedAt: Date | null }>();
    // Pre-fill all course modules as NOT_STARTED.
    for (const m of course.modules) {
      rows.set(m.id, { status: 'NOT_STARTED', startedAt: null, completedAt: null });
    }

    let currentModuleId: string | null = null;
    for (const s of sessions) {
      // Ignore sessions that ended before the student joined.
      if (s.end <= start) continue;
      // Ignore future sessions that start strictly after today (those stay NOT_STARTED).
      if (s.start > now) continue;
      // Skip winter breaks — they're not modules.
      if (/winter break/i.test(s.module)) continue;

      const mod = modByName.get(norm(s.module));
      if (!mod) { unmatchedSession++; continue; }

      // Effective start for the student: max(session.start, enrollment.startDate).
      const effStart = s.start > start ? s.start : start;

      const prev = rows.get(mod.id);
      if (s.end <= now) {
        // Completed session. Modules occupy two consecutive weekly entries per
        // delivery, so merge: earliest startedAt + latest completedAt.
        const prevStart = prev && (prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS') ? prev.startedAt : null;
        const prevEnd = prev?.status === 'COMPLETED' ? prev.completedAt : null;
        const merged = {
          status: 'COMPLETED' as const,
          startedAt: prevStart && prevStart < effStart ? prevStart : effStart,
          completedAt: prevEnd && prevEnd > s.end ? prevEnd : s.end,
        };
        rows.set(mod.id, merged);
      } else {
        // s.start <= now < s.end → current. Preserve earliest started if the
        // module already had week 1 logged as completed earlier.
        const prevStart = prev && (prev.status === 'COMPLETED' || prev.status === 'IN_PROGRESS') ? prev.startedAt : null;
        rows.set(mod.id, {
          status: 'IN_PROGRESS',
          startedAt: prevStart && prevStart < effStart ? prevStart : effStart,
          completedAt: null,
        });
        currentModuleId = mod.id;
      }
    }

    plans.push({
      enrollmentId: e.id,
      batchId: progressByEnroll.get(e.id)?.[0]?.batchId ?? '', // fallback set below
      email: e.user.email,
      name: `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim(),
      batchCode: e.batchCode,
      track,
      startDate: start,
      currentModuleId,
      rows,
    });
  }

  // Aggregate stats.
  let totalCompleted = 0, totalInProgress = 0, totalNotStarted = 0;
  for (const p of plans) {
    for (const v of p.rows.values()) {
      if (v.status === 'COMPLETED') totalCompleted++;
      else if (v.status === 'IN_PROGRESS') totalInProgress++;
      else totalNotStarted++;
    }
  }
  console.log('Aggregate progress rows after sync:');
  console.log(`  COMPLETED   : ${totalCompleted}`);
  console.log(`  IN_PROGRESS : ${totalInProgress}`);
  console.log(`  NOT_STARTED : ${totalNotStarted}`);
  console.log(`  unmatched schedule modules: ${unmatchedSession}`);

  // Show one sample plan in detail (Lucky if present, else first).
  const sample =
    plans.find(p => p.email?.toLowerCase() === 'luckymore181@gmail.com') ?? plans[0];
  if (sample) {
    console.log(`\n=== Sample plan: ${sample.name} <${sample.email}>  batch=${sample.batchCode}  track=${sample.track}  start=${sample.startDate.toISOString().slice(0,10)} ===`);
    const modById = new Map(course.modules.map(m => [m.id, m]));
    const ordered = [...sample.rows.entries()].sort(([a], [b]) =>
      (modById.get(a)?.position ?? 0) - (modById.get(b)?.position ?? 0)
    );
    for (const [mid, v] of ordered) {
      const m = modById.get(mid);
      const cur = sample.currentModuleId === mid ? ' ← CURRENT' : '';
      console.log(`  pos=${String(m?.position).padStart(2)} ${m?.name?.padEnd(40)} ${v.status.padEnd(12)} started=${v.startedAt?.toISOString().slice(0,10) ?? '—'} completed=${v.completedAt?.toISOString().slice(0,10) ?? '—'}${cur}`);
    }
  }

  if (DEBUG_EMAIL) {
    const p = plans.find(x => x.email?.toLowerCase() === DEBUG_EMAIL.toLowerCase());
    if (!p) console.log(`\nNo plan for --debug=${DEBUG_EMAIL}`);
  }

  if (!APPLY) {
    console.log('\nDRY-RUN complete. Re-run with --apply to write.');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  // ---------- APPLY ----------
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `/Users/yaman/Downloads/tahacanvas-main/iba-progress-backup-${ts}.csv`;
  const csvEsc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = ['enrollment_id,module_id,status,started_at,completed_at,module_score,batch_id,id'];
  for (const p of existingProgress) {
    lines.push([
      p.enrollmentId, p.moduleId, p.status,
      p.startedAt?.toISOString() ?? '', p.completedAt?.toISOString() ?? '',
      p.moduleScore ?? '', p.batchId, p.id,
    ].map(csvEsc).join(','));
  }
  fs.writeFileSync(backupPath, lines.join('\n'));
  console.log(`\nBackup written: ${backupPath} (${existingProgress.length} rows)`);

  // For each plan, upsert each module row.
  // Need a batchId per enrollment. Use existing progress row's batchId, or look up Batch.
  const batchByCode = new Map<string, string>();
  const batches = await prisma.batch.findMany({ where: { courseId: course.id } });
  for (const b of batches) batchByCode.set(b.batchCode, b.id);

  let writes = 0;
  for (const p of plans) {
    let batchId = p.batchId;
    if (!batchId) batchId = (p.batchCode && batchByCode.get(p.batchCode)) || '';
    if (!batchId) {
      // fallback: pick any batch in this course (shouldn't normally hit)
      batchId = batches[0]?.id ?? '';
    }

    for (const [moduleId, v] of p.rows) {
      await prisma.studentProgress.upsert({
        where: { enrollmentId_moduleId: { enrollmentId: p.enrollmentId, moduleId } },
        update: { status: v.status, startedAt: v.startedAt, completedAt: v.completedAt },
        create: { enrollmentId: p.enrollmentId, moduleId, batchId, status: v.status, startedAt: v.startedAt, completedAt: v.completedAt },
      });
      writes++;
    }

    await prisma.enrollment.update({
      where: { id: p.enrollmentId },
      data: { currentModuleId: p.currentModuleId },
    });
  }

  console.log(`\nApplied. studentProgress upserts: ${writes}. enrollment.currentModuleId updates: ${plans.length}.`);
  await prisma.$disconnect();
  await pool.end();
})();
