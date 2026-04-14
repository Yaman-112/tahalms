import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCHEDULE: [string, string][] = [
  ['2025-05-14', 'PSW Foundations'],
  ['2025-05-28', 'Safety and Mobility'],
  ['2025-06-02', 'Body Systems'],
  ['2025-06-16', 'Assisting with Personal Hygiene'],
  ['2025-06-23', 'Abuse and Neglect'],
  ['2025-09-15', 'Household Management, Nutrition and Hydration'],
  ['2025-10-20', 'Care Planning / Restorative Care / Documentation / Working in the Community'],
  ['2025-11-03', 'Assisting the Family, Growth and Development'],
  ['2025-11-03', 'Assisting the Dying Person'],
  ['2026-01-26', 'Assisting with Medications'],
  ['2026-02-23', 'Cognitive / Mental Health Issues and Brain Injuries'],
  ['2026-03-09', 'Health Conditions'],
  ['2026-03-16', 'Gentle Persuasive Approaches in Dementia Care'],
  ['2026-03-23', 'Clinical Placement (Facility)'],
  ['2026-06-23', 'Clinical Placement (Community)'],
];

async function sync() {
  console.log('Syncing PSW module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'PSW' } });
  if (!course) { console.error('PSW course not found!'); process.exit(1); }

  // Check if modules exist, create if not
  const existingModules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${existingModules.length} existing modules in PSW\n`);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  await prisma.calendarEvent.deleteMany({
    where: { courseId: course.id, description: { startsWith: 'PSW Schedule:' } },
  });

  let updated = 0, created = 0, eventCount = 0;

  for (let i = 0; i < SCHEDULE.length; i++) {
    const [dateStr, name] = SCHEDULE[i];
    const startDate = new Date(dateStr + 'T00:00:00');

    // Find or create module
    let mod = existingModules.find(m => m.name === name);
    if (!mod) {
      mod = await prisma.module.create({
        data: {
          courseId: course.id,
          name,
          position: i + 1,
          published: true,
          startDate,
        },
      });
      created++;
      console.log(`  + Created: ${name} — starts ${startDate.toISOString().split('T')[0]}`);
    } else {
      await prisma.module.update({ where: { id: mod.id }, data: { startDate } });
      updated++;
      console.log(`  ✓ ${name} — starts ${startDate.toISOString().split('T')[0]}`);
    }

    // Calendar event
    let endDate: Date;
    if (i < SCHEDULE.length - 1) {
      endDate = new Date(SCHEDULE[i + 1][0] + 'T00:00:00');
      // Handle same-day starts (Assisting the Family + Assisting the Dying)
      if (endDate.getTime() === startDate.getTime() && i + 2 < SCHEDULE.length) {
        endDate = new Date(SCHEDULE[i + 2][0] + 'T00:00:00');
      }
      endDate.setDate(endDate.getDate() - 1);
    } else {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 60);
    }

    await prisma.calendarEvent.create({
      data: {
        title: `PSW — ${name}`,
        description: `PSW Schedule: ${name}`,
        startTime: new Date(dateStr + 'T09:00:00'),
        endTime: new Date(endDate.toISOString().split('T')[0] + 'T17:00:00'),
        courseId: course.id,
        createdById: admin!.id,
      },
    });
    eventCount++;
  }

  console.log(`\n  Created ${eventCount} calendar events`);
  console.log(`\n✓ PSW Schedule synced: ${created} modules created, ${updated} updated`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
