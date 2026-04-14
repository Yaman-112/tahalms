import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// CSW Schedule — each entry: [startDate, moduleName, weeks]
const SCHEDULE = [
  ['2025-08-04', 'Basic Counselling Techniques', 3],
  ['2025-08-25', 'Solution-Focused Intervention Techniques', 2],
  ['2025-09-08', 'Family Development, Functions, and Social Issues', 4],
  ['2025-10-06', 'Introduction to Psychology', 3],
  ['2025-10-27', 'Professional Documentation & Case Management', 1],
  ['2025-11-03', 'Behaviour Modification', 4],
  ['2025-12-01', 'Support Resources & Community Capacity Building', 3],
  // Winter Break 12/22 - 12/29
  ['2026-01-05', 'Essential Skills', 2],
  ['2026-01-19', 'Microsoft Windows', 2],
  ['2026-02-02', 'Inclusive Communication Skills', 4],
  ['2026-03-02', 'Introduction to Community Service Work', 3],
  ['2026-03-23', 'Employment Achievement Strategies', 2],
  ['2026-04-06', 'Basic Business Communications', 2],
  ['2026-04-20', 'Harm Reduction and Crisis Intervention', 3],
  ['2026-05-11', 'Introduction to Sociology', 2],
  ['2026-05-25', 'Mental Health & Addictions', 5],
  ['2026-06-29', 'Populations at Risk', 4],
  ['2026-07-27', 'Law for Support Workers', 3],
  ['2026-08-17', 'Self Care and Team Building', 2],
  // Cycle repeats
  ['2026-08-31', 'Basic Counselling Techniques', 3],
  ['2026-09-21', 'Solution-Focused Intervention Techniques', 2],
  ['2026-10-05', 'Family Development, Functions, and Social Issues', 4],
  ['2026-11-02', 'Introduction to Psychology', 3],
] as [string, string, number][];

async function sync() {
  console.log('Syncing CSW module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'CSW' } });
  if (!course) { console.error('CSW course not found!'); process.exit(1); }

  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${modules.length} modules in CSW\n`);

  // For each module, find the FIRST occurrence in the schedule (current/upcoming cycle)
  // Use the latest cycle that starts from 2026 for active students
  const now = new Date();
  const moduleUpdates = new Map<string, { startDate: Date; weeks: number }>();

  for (const [dateStr, name, weeks] of SCHEDULE) {
    const startDate = new Date(dateStr + 'T00:00:00');

    // Find matching module
    const mod = modules.find(m => m.name === name);
    if (!mod) {
      console.log(`  ⚠ No module found for: ${name}`);
      continue;
    }

    // Keep the latest start date for each module (prefer current/upcoming cycle)
    const existing = moduleUpdates.get(mod.id);
    if (!existing || startDate > existing.startDate) {
      moduleUpdates.set(mod.id, { startDate, weeks });
    }
  }

  // Update modules in DB
  let updated = 0;
  for (const [modId, { startDate, weeks }] of moduleUpdates) {
    const mod = modules.find(m => m.id === modId)!;
    await prisma.module.update({
      where: { id: modId },
      data: { startDate },
    });
    updated++;
    console.log(`  ✓ ${mod.name} — starts ${startDate.toISOString().split('T')[0]} (${weeks} weeks)`);
  }

  // Also create calendar events for the schedule
  console.log('\nCreating calendar events...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // Delete old CSW schedule events
  await prisma.calendarEvent.deleteMany({
    where: { courseId: course.id, description: { startsWith: 'CSW Schedule:' } },
  });

  let eventCount = 0;
  for (const [dateStr, name, weeks] of SCHEDULE) {
    if (name === 'Winter Break') continue;
    const startDate = new Date(dateStr + 'T09:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (weeks * 7) - 1);
    endDate.setHours(17, 0, 0);

    await prisma.calendarEvent.create({
      data: {
        title: name,
        description: `CSW Schedule: ${weeks} week(s)`,
        startTime: startDate,
        endTime: endDate,
        courseId: course.id,
        createdById: admin!.id,
      },
    });
    eventCount++;
  }

  // Add Winter Break events
  for (const [dateStr, label] of [['2025-12-22', 'Winter Break'], ['2025-12-29', 'Winter Break']] as [string, string][]) {
    const start = new Date(dateStr + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    await prisma.calendarEvent.create({
      data: {
        title: 'CSW — Winter Break',
        description: 'CSW Schedule: Winter Break',
        startTime: start,
        endTime: end,
        createdById: admin!.id,
      },
    });
    eventCount++;
  }

  console.log(`  Created ${eventCount} calendar events`);

  console.log(`\n─────────────────────────────────────────`);
  console.log(`CSW Schedule synced:`);
  console.log(`  • ${updated} modules updated with start dates`);
  console.log(`  • ${eventCount} calendar events created`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
