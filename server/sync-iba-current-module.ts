// Computes per-student "current module" for IBA enrollments using the
// official two-track rotation schedule (server/utils/iba-schedule.ts).
// Default: dry-run (prints proposed changes, writes nothing).
// Pass --apply to write enrollment.currentModuleId for each IBA enrollment.
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { ibaTrackForBatch, getIbaCurrentSession } from './utils/iba-schedule.js';

const APPLY = process.argv.includes('--apply');
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:vTfaPkADzStasUDwfWnwGtWXZrndPNPL@monorail.proxy.rlwy.net:20759/railway',
  max: 5,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

(async () => {
  const course = await prisma.course.findFirst({
    where: { code: 'IBA' },
    include: { modules: true },
  });
  if (!course) { console.log('IBA course not found'); await prisma.$disconnect(); await pool.end(); return; }

  // Index modules by normalized name for matching against schedule strings.
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const modByName = new Map<string, typeof course.modules[number]>();
  for (const m of course.modules) modByName.set(norm(m.name), m);

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  const now = new Date();
  console.log(`IBA enrollments: ${enrollments.length}`);
  console.log(`Today (UTC): ${now.toISOString().slice(0, 10)}`);
  console.log(`Mode: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN (no writes)'}\n`);

  let changed = 0, unchanged = 0, missingMod = 0, breakNow = 0;
  const summary: Record<string, number> = {};

  for (const e of enrollments) {
    const track = ibaTrackForBatch(e.batchCode);
    const session = getIbaCurrentSession(track, now);
    if (!session) { missingMod++; continue; }
    if (/winter break/i.test(session.module)) { breakNow++; continue; }
    const mod = modByName.get(norm(session.module));
    if (!mod) { missingMod++; continue; }

    summary[session.module] = (summary[session.module] ?? 0) + 1;
    const before = e.currentModuleId;
    if (before === mod.id) { unchanged++; continue; }

    changed++;
    if (changed <= 25) {
      const name = `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim();
      console.log(`  [${track.padEnd(7)}] ${e.batchCode?.padEnd(13) ?? ''} ${name.padEnd(28)} ${e.user.email?.padEnd(35) ?? ''} → ${session.module}`);
    }

    if (APPLY) {
      await prisma.enrollment.update({
        where: { id: e.id },
        data: { currentModuleId: mod.id },
      });
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  changed:        ${changed}${changed > 25 ? ' (only first 25 listed above)' : ''}`);
  console.log(`  unchanged:      ${unchanged}`);
  console.log(`  on winter break: ${breakNow}`);
  console.log(`  no schedule match: ${missingMod}`);
  console.log(`\n=== Module distribution today ===`);
  for (const [k, v] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(40)} ${v}`);
  }

  await prisma.$disconnect();
  await pool.end();
})();
