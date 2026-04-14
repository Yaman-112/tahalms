import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// AC has two tracks running in parallel: Filler (MS Office) and Program modules
// Map schedule names to DB module names
const NAME_MAP: Record<string, string> = {
  'MS Word': 'Microsoft Word 2',
  'MS Excel': 'Microsoft Excel 1 and Excel 2',
  'MS Outlook': 'Microsoft Outlook',
  'MS PowerPoint': 'Microsoft Powerpoint',
  'MS Windows': 'Microsoft Windows',
  'Payroll Fundamentals 1': 'Payroll Fundamentals 1',
  'Payroll Fundamentals 2': 'Payroll Fundamental 2',
  'Office Procedure': 'Office Procedures',
  'Job Search Strategies': 'Job Search',
  'Computerized Accounting with Sage 50': 'Computerized Accounting with Sage50/Sage300',
  'Compterized Accounting with Sage 50': 'Computerized Accounting with Sage50/Sage300', // typo in schedule
  'Computerized Accounting with Sage 300': 'Computerized Accounting with Sage50/Sage300',
  'Income Tax Theory and Practice': 'Canadian Income Tax',
  'Accounting Fundamentals and Bookkeeping': 'Accounting Fundamentals and Book Keeping',
  'Computerized Accounting with Quickbooks': 'Computerized Accounting with Quickbooks',
};

// Program modules with start dates and weeks
const PROGRAM_SCHEDULE: [string, string][] = [
  ['2025-08-04', 'Payroll Fundamentals 1'], ['2025-08-11', 'Payroll Fundamentals 1'],
  ['2025-08-18', 'Payroll Fundamentals 2'], ['2025-08-25', 'Payroll Fundamentals 2'],
  ['2025-09-01', 'Payroll Fundamentals 2'],
  ['2025-09-08', 'Office Procedure'], ['2025-09-15', 'Office Procedure'], ['2025-09-22', 'Office Procedure'],
  ['2025-09-29', 'Office Procedure'], ['2025-10-06', 'Office Procedure'],
  ['2025-10-13', 'Job Search Strategies'],
  ['2025-10-20', 'Computerized Accounting with Sage 50'], ['2025-10-27', 'Computerized Accounting with Sage 50'],
  ['2025-11-03', 'Computerized Accounting with Sage 50'], ['2025-11-10', 'Computerized Accounting with Sage 50'],
  ['2025-11-17', 'Computerized Accounting with Sage 50'], ['2025-11-24', 'Computerized Accounting with Sage 50'],
  ['2025-12-01', 'Computerized Accounting with Sage 50'],
  ['2025-12-08', 'Computerized Accounting with Sage 300'], ['2025-12-15', 'Computerized Accounting with Sage 300'],
  ['2025-12-29', 'Computerized Accounting with Sage 300'], ['2026-01-05', 'Computerized Accounting with Sage 300'],
  ['2026-01-12', 'Income Tax Theory and Practice'], ['2026-01-19', 'Income Tax Theory and Practice'],
  ['2026-01-26', 'Income Tax Theory and Practice'], ['2026-02-02', 'Income Tax Theory and Practice'],
  ['2026-02-09', 'Accounting Fundamentals and Bookkeeping'], ['2026-02-16', 'Accounting Fundamentals and Bookkeeping'],
  ['2026-02-23', 'Accounting Fundamentals and Bookkeeping'], ['2026-03-02', 'Accounting Fundamentals and Bookkeeping'],
  ['2026-03-09', 'Accounting Fundamentals and Bookkeeping'], ['2026-03-16', 'Accounting Fundamentals and Bookkeeping'],
  ['2026-03-23', 'Accounting Fundamentals and Bookkeeping'], ['2026-03-30', 'Accounting Fundamentals and Bookkeeping'],
  ['2026-04-06', 'Accounting Fundamentals and Bookkeeping'], ['2026-04-13', 'Accounting Fundamentals and Bookkeeping'],
  ['2026-04-20', 'Accounting Fundamentals and Bookkeeping'], ['2026-04-27', 'Accounting Fundamentals and Bookkeeping'],
  ['2026-05-04', 'Computerized Accounting with Quickbooks'], ['2026-05-11', 'Computerized Accounting with Quickbooks'],
  ['2026-05-18', 'Computerized Accounting with Quickbooks'], ['2026-05-25', 'Computerized Accounting with Quickbooks'],
  ['2026-06-01', 'Computerized Accounting with Quickbooks'], ['2026-06-08', 'Computerized Accounting with Quickbooks'],
  ['2026-06-15', 'Payroll Fundamentals 1'], ['2026-06-22', 'Payroll Fundamentals 1'],
  ['2026-06-29', 'Payroll Fundamentals 2'], ['2026-07-06', 'Payroll Fundamentals 2'],
  ['2026-07-13', 'Payroll Fundamentals 2'],
  ['2026-07-20', 'Office Procedure'], ['2026-07-27', 'Office Procedure'],
  ['2026-08-03', 'Office Procedure'], ['2026-08-10', 'Office Procedure'], ['2026-08-17', 'Office Procedure'],
  ['2026-08-24', 'Job Search Strategies'],
  ['2026-08-31', 'Compterized Accounting with Sage 50'], ['2026-09-07', 'Compterized Accounting with Sage 50'],
  ['2026-09-14', 'Compterized Accounting with Sage 50'], ['2026-09-21', 'Compterized Accounting with Sage 50'],
  ['2026-09-28', 'Compterized Accounting with Sage 50'], ['2026-10-05', 'Compterized Accounting with Sage 50'],
  ['2026-10-12', 'Compterized Accounting with Sage 50'],
  ['2026-10-19', 'Computerized Accounting with Sage 300'], ['2026-10-26', 'Computerized Accounting with Sage 300'],
  ['2026-11-02', 'Computerized Accounting with Sage 300'], ['2026-11-09', 'Computerized Accounting with Sage 300'],
  ['2026-11-16', 'Income Tax Theory and Practice'], ['2026-11-23', 'Income Tax Theory and Practice'],
  ['2026-11-30', 'Income Tax Theory and Practice'], ['2026-12-07', 'Income Tax Theory and Practice'],
];

// Filler (MS Office) modules
const FILLER_SCHEDULE: [string, string][] = [
  ['2025-08-04', 'MS Word'], ['2025-08-18', 'MS Excel'], ['2025-09-01', 'MS Outlook'],
  ['2025-09-08', 'MS PowerPoint'], ['2025-09-15', 'MS Windows'], ['2025-09-22', 'MS Word'],
  ['2025-10-06', 'MS Excel'], ['2025-10-20', 'MS Outlook'], ['2025-10-27', 'MS PowerPoint'],
  ['2025-11-03', 'MS Windows'], ['2025-11-10', 'MS Word'], ['2025-11-17', 'MS Excel'],
  ['2025-12-08', 'MS Outlook'], ['2025-12-15', 'MS PowerPoint'], ['2025-12-29', 'MS Windows'],
  ['2026-01-05', 'MS Word'], ['2026-01-12', 'MS Excel'], ['2026-02-02', 'MS Outlook'],
  ['2026-02-09', 'MS PowerPoint'], ['2026-02-16', 'MS Windows'], ['2026-02-23', 'MS Word'],
  ['2026-03-09', 'MS Excel'], ['2026-03-23', 'MS Outlook'], ['2026-03-30', 'MS PowerPoint'],
  ['2026-04-06', 'MS Windows'], ['2026-04-13', 'MS Word'], ['2026-04-20', 'MS Excel'],
  ['2026-05-11', 'MS Outlook'], ['2026-05-18', 'MS PowerPoint'], ['2026-05-25', 'MS Windows'],
  ['2026-06-01', 'MS Word'], ['2026-06-08', 'MS Excel'], ['2026-06-29', 'MS Outlook'],
  ['2026-07-06', 'MS PowerPoint'], ['2026-07-13', 'MS Windows'], ['2026-07-20', 'MS Word'],
  ['2026-07-27', 'MS Excel'], ['2026-08-17', 'MS Outlook'], ['2026-08-24', 'MS PowerPoint'],
  ['2026-08-31', 'MS Windows'], ['2026-09-07', 'MS Word'], ['2026-09-14', 'MS Excel'],
  ['2026-10-05', 'MS Outlook'], ['2026-10-12', 'MS PowerPoint'], ['2026-10-19', 'MS Windows'],
  ['2026-10-26', 'MS Word'], ['2026-11-02', 'MS Excel'], ['2026-11-23', 'MS Outlook'],
  ['2026-11-30', 'MS PowerPoint'], ['2026-12-07', 'MS Windows'],
];

async function sync() {
  console.log('Syncing AC module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'AC' } });
  if (!course) { console.error('AC course not found!'); process.exit(1); }

  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${modules.length} modules in AC\n`);

  // Combine all schedule rows
  const allRows = [...PROGRAM_SCHEDULE, ...FILLER_SCHEDULE];

  // Group by mapped module name
  const moduleSchedule = new Map<string, Date[]>();
  for (const [dateStr, scheduleName] of allRows) {
    const dbName = NAME_MAP[scheduleName] || scheduleName;
    const date = new Date(dateStr + 'T00:00:00');
    if (!moduleSchedule.has(dbName)) moduleSchedule.set(dbName, []);
    moduleSchedule.get(dbName)!.push(date);
  }

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
    where: { courseId: course.id, description: { startsWith: 'AC Schedule:' } },
  });

  // Group program schedule into events
  const sorted = [...PROGRAM_SCHEDULE].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
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
    if (name.includes('WINTER')) continue;
    const end = new Date(start); end.setDate(end.getDate() + (weeks * 7) - 1); end.setHours(17);
    await prisma.calendarEvent.create({
      data: { title: `AC — ${name}`, description: `AC Schedule: ${weeks} week(s)`, startTime: start, endTime: end, courseId: course.id, createdById: admin!.id },
    });
    eventCount++;
  }

  console.log(`  Created ${eventCount} calendar events`);
  console.log(`\n✓ AC Schedule synced: ${updated} modules updated`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
