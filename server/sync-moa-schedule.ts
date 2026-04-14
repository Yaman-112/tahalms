import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NAME_MAP: Record<string, string> = {
  'Medical Office Administrations': 'Medical Office Procedure',
  'Business Communication': 'Business Communication',
  'Medical Coding and OHIP Billing': 'Medical Coding & OHIP Billing',
  'Medical Terminology': 'Medical Terminology',
  'Anatomy and Physiology': 'Anatomy and Physiology',
  'Medical Transcription': 'Medical Transcription',
  'Job Strategy': 'Job Search Strategies',
};

// MS Office modules map to Microsoft Office Suite
const MS_MODULES = ['MS Excel', 'MS Powerpoint', 'MS Access', 'MS Word'];

const PROGRAM_ROWS: [string, string][] = [
  ['2025-07-14', 'Medical Office Administrations'],
  ['2025-07-21', 'Business Communication'], ['2025-07-28', 'Business Communication'],
  ['2025-08-04', 'Business Communication'], ['2025-08-11', 'Business Communication'],
  ['2025-08-18', 'Medical Coding and OHIP Billing'], ['2025-08-25', 'Medical Coding and OHIP Billing'],
  ['2025-09-01', 'Medical Coding and OHIP Billing'],
  ['2025-09-08', 'Medical Terminology'], ['2025-09-15', 'Medical Terminology'],
  ['2025-09-22', 'Medical Terminology'], ['2025-09-29', 'Medical Terminology'],
  ['2025-10-06', 'Anatomy and Physiology'], ['2025-10-13', 'Anatomy and Physiology'],
  ['2025-10-20', 'Anatomy and Physiology'], ['2025-10-27', 'Anatomy and Physiology'],
  ['2025-11-03', 'Anatomy and Physiology'],
  ['2025-11-10', 'Medical Transcription'], ['2025-11-17', 'Medical Transcription'],
  ['2025-11-24', 'Medical Transcription'],
  ['2025-12-01', 'Job Strategy'],
  ['2025-12-08', 'Medical Office Administrations'], ['2025-12-15', 'Medical Office Administrations'],
  ['2025-12-29', 'Medical Office Administrations'],
  ['2026-01-05', 'Medical Office Administrations'], ['2026-01-12', 'Medical Office Administrations'],
  ['2026-01-19', 'Medical Office Administrations'], ['2026-01-26', 'Medical Office Administrations'],
  ['2026-02-02', 'Medical Office Administrations'], ['2026-02-09', 'Medical Office Administrations'],
  ['2026-02-16', 'Medical Office Administrations'], ['2026-02-23', 'Medical Office Administrations'],
  // Cycle 2
  ['2026-03-02', 'Business Communication'], ['2026-03-09', 'Business Communication'],
  ['2026-03-16', 'Business Communication'], ['2026-03-23', 'Business Communication'],
  ['2026-03-30', 'Medical Coding and OHIP Billing'], ['2026-04-06', 'Medical Coding and OHIP Billing'],
  ['2026-04-13', 'Medical Coding and OHIP Billing'],
  ['2026-04-20', 'Medical Terminology'], ['2026-04-27', 'Medical Terminology'],
  ['2026-05-04', 'Medical Terminology'], ['2026-05-11', 'Medical Terminology'],
  ['2026-05-18', 'Anatomy and Physiology'], ['2026-05-25', 'Anatomy and Physiology'],
  ['2026-06-01', 'Anatomy and Physiology'], ['2026-06-08', 'Anatomy and Physiology'],
  ['2026-06-15', 'Anatomy and Physiology'],
  ['2026-06-22', 'Medical Transcription'], ['2026-06-29', 'Medical Transcription'],
  ['2026-07-06', 'Medical Transcription'],
  ['2026-07-13', 'Job Strategy'],
  ['2026-07-20', 'Medical Office Administrations'], ['2026-07-27', 'Medical Office Administrations'],
  ['2026-08-03', 'Medical Office Administrations'], ['2026-08-10', 'Medical Office Administrations'],
  ['2026-08-17', 'Medical Office Administrations'], ['2026-08-24', 'Medical Office Administrations'],
  ['2026-08-31', 'Medical Office Administrations'], ['2026-09-07', 'Medical Office Administrations'],
  ['2026-09-14', 'Medical Office Administrations'], ['2026-09-21', 'Medical Office Administrations'],
];

async function sync() {
  console.log('Syncing MOA module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'MOA' } });
  if (!course) { console.error('MOA course not found!'); process.exit(1); }

  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${modules.length} modules in MOA\n`);

  // Group by DB module name, find earliest 2026+ date
  const moduleSchedule = new Map<string, Date[]>();
  for (const [dateStr, scheduleName] of PROGRAM_ROWS) {
    const dbName = NAME_MAP[scheduleName] || scheduleName;
    const date = new Date(dateStr + 'T00:00:00');
    if (!moduleSchedule.has(dbName)) moduleSchedule.set(dbName, []);
    moduleSchedule.get(dbName)!.push(date);
  }

  // MS Office Suite — use first MS module date in 2026
  const msOfficeDates: Date[] = [];
  for (const [dateStr, info] of [
    ['2026-01-05', 'MS Word'], ['2026-01-19', 'MS Excel'], ['2026-02-02', 'MS Powerpoint'],
    ['2026-02-16', 'MS Access'], ['2026-03-02', 'MS Word'], ['2026-03-16', 'MS Excel'],
    ['2026-03-30', 'MS Powerpoint'], ['2026-04-13', 'MS Access'], ['2026-04-27', 'MS Word'],
    ['2026-05-11', 'MS Excel'], ['2026-05-25', 'MS Powerpoint'], ['2026-06-08', 'MS Access'],
    ['2026-06-22', 'MS Word'], ['2026-07-06', 'MS Excel'], ['2026-07-20', 'MS Powerpoint'],
    ['2026-08-03', 'MS Access'], ['2026-08-17', 'MS Word'], ['2026-08-31', 'MS Excel'],
    ['2026-09-14', 'MS Powerpoint'],
  ] as [string, string][]) {
    msOfficeDates.push(new Date(dateStr + 'T00:00:00'));
  }
  moduleSchedule.set('Microsoft Office Suite', msOfficeDates);

  let updated = 0;
  for (const mod of modules) {
    const dates = moduleSchedule.get(mod.name);
    if (!dates) {
      console.log(`  ⚠ No schedule for: ${mod.name}`);
      continue;
    }
    const upcoming = dates.filter(d => d.getFullYear() >= 2026).sort((a, b) => a.getTime() - b.getTime());
    const startDate = upcoming[0] || dates.sort((a, b) => a.getTime() - b.getTime())[0];
    if (startDate) {
      await prisma.module.update({ where: { id: mod.id }, data: { startDate } });
      updated++;
      console.log(`  ✓ ${mod.name} — starts ${startDate.toISOString().split('T')[0]}`);
    }
  }

  // Calendar events
  console.log('\nCreating calendar events...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  await prisma.calendarEvent.deleteMany({
    where: { courseId: course.id, description: { startsWith: 'MOA Schedule:' } },
  });

  const sorted = [...PROGRAM_ROWS].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  const eventGroups: { name: string; start: Date; weeks: number }[] = [];
  let cur = '', curStart: Date | null = null, curWeeks = 0;
  for (const [dateStr, name] of sorted) {
    if (name === cur) { curWeeks++; } else {
      if (cur && curStart) eventGroups.push({ name: cur, start: curStart, weeks: curWeeks });
      cur = name; curStart = new Date(dateStr + 'T09:00:00'); curWeeks = 1;
    }
  }
  if (cur && curStart) eventGroups.push({ name: cur, start: curStart, weeks: curWeeks });

  let eventCount = 0;
  for (const { name, start, weeks } of eventGroups) {
    const dbName = NAME_MAP[name] || name;
    const end = new Date(start); end.setDate(end.getDate() + (weeks * 7) - 1); end.setHours(17);
    await prisma.calendarEvent.create({
      data: { title: `MOA — ${dbName}`, description: `MOA Schedule: ${weeks} week(s)`, startTime: start, endTime: end, courseId: course.id, createdById: admin!.id },
    });
    eventCount++;
  }

  console.log(`  Created ${eventCount} calendar events`);
  console.log(`\n✓ MOA Schedule synced: ${updated} modules updated`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
