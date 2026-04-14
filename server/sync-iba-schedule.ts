import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Parse IBA schedule — each row is 1 week. Group consecutive weeks per module.
const RAW_ROWS: [string, string][] = [
  ['2025-08-04', 'Macro Economics'], ['2025-08-11', 'Macro Economics'],
  ['2025-08-18', 'Computer Applications in Business'], ['2025-08-25', 'Computer Applications in Business'],
  ['2025-09-01', 'Business Law'], ['2025-09-08', 'Business Law'],
  ['2025-09-15', 'Business Ethics'], ['2025-09-22', 'Business Ethics'],
  ['2025-09-29', 'English Fundamentals'], ['2025-10-06', 'English Fundamentals'],
  ['2025-10-13', 'Statistics for Business'], ['2025-10-20', 'Statistics for Business'],
  ['2025-10-27', 'Fundamentals of Accounting'], ['2025-11-03', 'Fundamentals of Accounting'],
  ['2025-11-10', 'Strategic Management'], ['2025-11-17', 'Strategic Management'],
  ['2025-11-24', 'International Law'], ['2025-12-01', 'International Law'],
  ['2025-11-28', 'Introduction to HRM'], ['2025-12-05', 'Introduction to HRM'],
  ['2025-12-08', 'E Commerce & Digital Marketing'], ['2025-12-15', 'E Commerce & Digital Marketing'],
  ['2025-12-12', 'Management Fundamentals'], ['2025-12-19', 'Management Fundamentals'],
  ['2025-12-29', 'Leadership'], ['2026-01-05', 'Leadership'],
  ['2026-01-02', 'Sales Management'], ['2026-01-09', 'Sales Management'],
  ['2026-01-12', 'Intercultural Communication'], ['2026-01-19', 'Intercultural Communication'],
  ['2026-01-16', 'Project Management'], ['2026-01-23', 'Project Management'],
  ['2026-01-26', 'Cross Cultural Management'], ['2026-02-02', 'Cross Cultural Management'],
  ['2026-01-30', 'Fundamentals of Marketing'], ['2026-02-06', 'Fundamentals of Marketing'],
  ['2026-02-09', 'International Business Strategy'], ['2026-02-16', 'International Business Strategy'],
  ['2026-02-13', 'Operations Research'], ['2026-02-20', 'Operations Research'],
  ['2026-02-23', 'International Banking & Finance'], ['2026-03-02', 'International Banking & Finance'],
  ['2026-02-27', 'Organizational Behaviour'], ['2026-03-06', 'Organizational Behaviour'],
  ['2026-03-09', 'Entrepreneurship'], ['2026-03-16', 'Entrepreneurship'],
  ['2026-03-13', 'Strategic Management'], ['2026-03-20', 'Strategic Management'],
  ['2026-03-23', 'Introduction to HRM'], ['2026-03-30', 'Introduction to HRM'],
  ['2026-03-27', 'Micro Economics'], ['2026-04-03', 'Micro Economics'],
  ['2026-04-06', 'Management Fundamentals'], ['2026-04-13', 'Management Fundamentals'],
  ['2026-04-10', 'Macro Economics'], ['2026-04-17', 'Macro Economics'],
  ['2026-04-20', 'Sales Management'], ['2026-04-27', 'Sales Management'],
  ['2026-04-24', 'Statistics for Business'], ['2026-05-01', 'Statistics for Business'],
  ['2026-05-04', 'Project Management'], ['2026-05-11', 'Project Management'],
  ['2026-05-08', 'Fundamentals of Accounting'], ['2026-05-15', 'Fundamentals of Accounting'],
  ['2026-05-18', 'Fundamentals of Marketing'], ['2026-05-25', 'Fundamentals of Marketing'],
  ['2026-05-22', 'Computer Applications in Business'], ['2026-05-29', 'Computer Applications in Business'],
  ['2026-06-01', 'Operations Research'], ['2026-06-08', 'Operations Research'],
  ['2026-06-05', 'Business Law'], ['2026-06-12', 'Business Law'],
  ['2026-06-15', 'Organizational Behaviour'], ['2026-06-22', 'Organizational Behaviour'],
  ['2026-06-19', 'Business Ethics'], ['2026-06-26', 'Business Ethics'],
  ['2026-06-29', 'Micro Economics'], ['2026-07-06', 'Micro Economics'],
  ['2026-07-03', 'English Fundamentals'], ['2026-07-10', 'English Fundamentals'],
  ['2026-07-13', 'Macro Economics'], ['2026-07-20', 'Macro Economics'],
  ['2026-07-17', 'International Law'], ['2026-07-24', 'International Law'],
  ['2026-07-27', 'Computer Applications in Business'], ['2026-08-03', 'Computer Applications in Business'],
  ['2026-07-31', 'E Commerce & Digital Marketing'], ['2026-08-07', 'E Commerce & Digital Marketing'],
  ['2026-08-10', 'Business Law'], ['2026-08-17', 'Business Law'],
  ['2026-08-14', 'Leadership'], ['2026-08-21', 'Leadership'],
  ['2026-08-24', 'Business Ethics'], ['2026-08-31', 'Business Ethics'],
  ['2026-08-28', 'Entrepreneurship'], ['2026-09-04', 'Entrepreneurship'],
  ['2026-09-07', 'English Fundamentals'], ['2026-09-14', 'English Fundamentals'],
  ['2026-09-11', 'Intercultural Communication'], ['2026-09-18', 'Intercultural Communication'],
  ['2026-09-21', 'Statistics for Business'], ['2026-09-28', 'Statistics for Business'],
  ['2026-09-25', 'Cross Cultural Management'], ['2026-10-02', 'Cross Cultural Management'],
  ['2026-10-05', 'Fundamentals of Accounting'], ['2026-10-12', 'Fundamentals of Accounting'],
  ['2026-10-09', 'International Business Strategy'], ['2026-10-16', 'International Business Strategy'],
  ['2026-10-19', 'Strategic Management'], ['2026-10-26', 'Strategic Management'],
  ['2026-10-23', 'International Banking & Finance'], ['2026-10-30', 'International Banking & Finance'],
  ['2026-11-02', 'International Law'], ['2026-11-09', 'International Law'],
  ['2026-11-16', 'E Commerce & Digital Marketing'], ['2026-11-23', 'E Commerce & Digital Marketing'],
  ['2026-11-30', 'Leadership'], ['2026-12-07', 'Leadership'],
  ['2026-12-14', 'Intercultural Communication'], ['2026-12-21', 'Intercultural Communication'],
  ['2027-01-04', 'Cross Cultural Management'], ['2027-01-11', 'Cross Cultural Management'],
  ['2027-01-18', 'International Business Strategy'], ['2027-01-25', 'International Business Strategy'],
  ['2027-02-01', 'International Banking & Finance'], ['2027-02-08', 'International Banking & Finance'],
  ['2027-02-15', 'Entrepreneurship'], ['2027-02-22', 'Entrepreneurship'],
];

async function sync() {
  console.log('Syncing IBA module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'IBA' } });
  if (!course) { console.error('IBA course not found!'); process.exit(1); }

  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${modules.length} modules in IBA\n`);

  // Group rows by module name, find the nearest upcoming start date for each
  const moduleSchedule = new Map<string, Date[]>();
  for (const [dateStr, name] of RAW_ROWS) {
    const date = new Date(dateStr + 'T00:00:00');
    if (!moduleSchedule.has(name)) moduleSchedule.set(name, []);
    moduleSchedule.get(name)!.push(date);
  }

  // For each module, use the earliest date from the current/upcoming cycle (2026+)
  let updated = 0;
  for (const mod of modules) {
    const dates = moduleSchedule.get(mod.name);
    if (!dates || dates.length === 0) {
      // Try matching with "Organizational Behaviour" vs "Organisational Behaviour"
      const altName = mod.name.replace('Organizational', 'Organisational');
      const altDates = moduleSchedule.get(altName);
      if (!altDates) {
        console.log(`  ⚠ No schedule for: ${mod.name}`);
        continue;
      }
    }

    const allDates = dates || moduleSchedule.get(mod.name.replace('Organizational', 'Organisational')) || [];

    // Find first date in 2026+ for active schedule
    const upcoming = allDates.filter(d => d.getFullYear() >= 2026).sort((a, b) => a.getTime() - b.getTime());
    const startDate = upcoming[0] || allDates.sort((a, b) => a.getTime() - b.getTime())[0];

    if (startDate) {
      await prisma.module.update({
        where: { id: mod.id },
        data: { startDate },
      });
      updated++;
      console.log(`  ✓ ${mod.name} — starts ${startDate.toISOString().split('T')[0]}`);
    }
  }

  // Create calendar events
  console.log('\nCreating calendar events...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  await prisma.calendarEvent.deleteMany({
    where: { courseId: course.id, description: { startsWith: 'IBA Schedule:' } },
  });

  // Group consecutive weeks into single events
  const eventGroups: { name: string; start: Date; weeks: number }[] = [];
  let currentName = '';
  let currentStart: Date | null = null;
  let currentWeeks = 0;

  // Sort all rows by date
  const sorted = [...RAW_ROWS].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  for (const [dateStr, name] of sorted) {
    if (name === currentName) {
      currentWeeks++;
    } else {
      if (currentName && currentStart) {
        eventGroups.push({ name: currentName, start: currentStart, weeks: currentWeeks });
      }
      currentName = name;
      currentStart = new Date(dateStr + 'T09:00:00');
      currentWeeks = 1;
    }
  }
  if (currentName && currentStart) {
    eventGroups.push({ name: currentName, start: currentStart, weeks: currentWeeks });
  }

  let eventCount = 0;
  for (const { name, start, weeks } of eventGroups) {
    if (name === 'WINTER BREAK') continue;
    const end = new Date(start);
    end.setDate(end.getDate() + (weeks * 7) - 1);
    end.setHours(17, 0, 0);

    await prisma.calendarEvent.create({
      data: {
        title: `IBA — ${name}`,
        description: `IBA Schedule: ${weeks} week(s)`,
        startTime: start,
        endTime: end,
        courseId: course.id,
        createdById: admin!.id,
      },
    });
    eventCount++;
  }

  console.log(`  Created ${eventCount} calendar events`);
  console.log(`\n✓ IBA Schedule synced: ${updated} modules updated`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
