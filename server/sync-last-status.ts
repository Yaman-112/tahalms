import 'dotenv/config';
import XLSX from 'xlsx';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 10 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const XLS_PATH = process.argv.find(a => a.endsWith('.xls') || a.endsWith('.xlsx'))
  || '/Users/yaman/Downloads/Student_Lists_260423054956.xls';
const WRITE = process.argv.includes('--write');

function norm(v: any): string {
  return String(v ?? '').trim();
}

async function main() {
  const wb = XLSX.readFile(XLS_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
  console.log(`Loaded ${rows.length} rows from ${XLS_PATH}`);

  // Build vNumber → userId map (one vNumber can map to multiple user rows)
  const users = await prisma.user.findMany({
    where: { vNumber: { not: null } },
    select: { id: true, vNumber: true },
  });
  const vNumberToUserIds = new Map<string, string[]>();
  for (const u of users) {
    const key = norm(u.vNumber).toLowerCase();
    if (!key) continue;
    const list = vNumberToUserIds.get(key) ?? [];
    list.push(u.id);
    vNumberToUserIds.set(key, list);
  }
  console.log(`Indexed ${users.length} users with vNumber (${vNumberToUserIds.size} unique vNumbers)`);

  let matched = 0;
  let updated = 0;
  let noUser = 0;
  let noEnroll = 0;
  let userStatusUpdated = 0;
  const statusCounts: Record<string, number> = {};
  // Track the status to apply to each user (first matched row per vNumber wins).
  const userStatusToApply = new Map<string, string>();

  for (const row of rows) {
    const studentId = norm(row['Student ID']);
    const courseCode = norm(row['Course Code']);
    const batchName = norm(row['Batch Name']);
    const lastStatus = norm(row['Last Status']);
    if (!studentId || !lastStatus) continue;

    const userIds = vNumberToUserIds.get(studentId.toLowerCase());
    if (!userIds || userIds.length === 0) { noUser++; continue; }

    // Capture user-level status (first row per user wins).
    for (const uid of userIds) {
      if (!userStatusToApply.has(uid)) userStatusToApply.set(uid, lastStatus);
    }

    // Find enrollments for these users. Prefer exact match on batchCode, then courseCode.
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: { in: userIds },
        ...(batchName ? { batchCode: batchName } : {}),
      },
      select: { id: true, batchCode: true, courseId: true },
    });

    let targets = enrollments;
    if (targets.length === 0 && courseCode) {
      // Fall back to matching via course.courseCode prefix
      targets = await prisma.enrollment.findMany({
        where: {
          userId: { in: userIds },
          course: { is: { code: courseCode } },
        },
        select: { id: true, batchCode: true, courseId: true },
      });
    }

    if (targets.length === 0) { noEnroll++; continue; }

    matched += targets.length;
    statusCounts[lastStatus] = (statusCounts[lastStatus] || 0) + targets.length;

    if (WRITE) {
      await prisma.enrollment.updateMany({
        where: { id: { in: targets.map(t => t.id) } },
        data: { lastStatus },
      });
      updated += targets.length;
    }
  }

  // Apply user-level campusStatus
  if (WRITE) {
    for (const [uid, status] of userStatusToApply) {
      await prisma.user.update({ where: { id: uid }, data: { campusStatus: status } });
      userStatusUpdated++;
    }
  } else {
    userStatusUpdated = userStatusToApply.size;
  }

  console.log('\n=== Summary ===');
  console.log('Rows processed:', rows.length);
  console.log('Enrollments matched:', matched);
  console.log('Enrollments updated:', updated, WRITE ? '(written)' : '(dry-run, pass --write to commit)');
  console.log('User campusStatus updated:', userStatusUpdated, WRITE ? '(written)' : '(would write)');
  console.log('Rows with no matching user (by Student ID):', noUser);
  console.log('Rows with no matching enrollment:', noEnroll);
  console.log('Status distribution applied:');
  for (const [k, v] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(32)} ${v}`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
