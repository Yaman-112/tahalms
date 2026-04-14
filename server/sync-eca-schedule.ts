import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Map schedule names to DB module names
const NAME_MAP: Record<string, string> = {
  'ECED1020: Observation Skills': 'Observation Skills',
  'ECED1030: Health Safety and Nutrition': 'Health, Safety and Nutrition',
  'ECED1050: Play-Based Early Learning Strategies': 'Play-Based Early Learning Strategies',
  'ECED1040: Child, Family and Community': 'Child, Family and Community',
  'SOCI1000: Introduction to Sociology': 'Introduction to Sociology',
  'ECED1060: Language and Literacy': 'Language and Literacy',
  'PSYC1000: Introduction to Psychology': 'Introduction to Psychology',
  'ECED1070: Guiding Children\'s Behavior': 'Guiding Children\'s Behaviour',
  'COMM1010: Communications': 'Communications',
  'ECED1090: Special Needs': 'Special Needs',
  'ECED1010: Foundations of Early Childhood Education': 'Foundations of Early Childhood Education',
  'PSYC1030: Infant and Child Development': 'Infant and Child Development',
  'ECED1080: Creating Inclusive Environments': 'Creating Inclusive Programs',
  'Practicum': 'Practicum I',
};

const SCHEDULE: [string, string][] = [
  ['2026-02-23', 'ECED1020: Observation Skills'],
  ['2026-03-10', 'ECED1030: Health Safety and Nutrition'],
  ['2026-03-25', 'ECED1050: Play-Based Early Learning Strategies'],
  ['2026-04-09', 'ECED1040: Child, Family and Community'],
  ['2026-04-28', 'SOCI1000: Introduction to Sociology'],
  ['2026-05-13', 'ECED1060: Language and Literacy'],
  ['2026-05-28', 'PSYC1000: Introduction to Psychology'],
  ['2026-06-12', 'ECED1070: Guiding Children\'s Behavior'],
  ['2026-06-30', 'COMM1010: Communications'],
  ['2026-07-16', 'ECED1090: Special Needs'],
  ['2026-08-03', 'ECED1010: Foundations of Early Childhood Education'],
  ['2026-09-03', 'PSYC1030: Infant and Child Development'],
  ['2026-10-06', 'ECED1080: Creating Inclusive Environments'],
  ['2026-10-19', 'Practicum'],
];

async function sync() {
  console.log('Syncing ECA module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'ECA' } });
  if (!course) { console.error('ECA course not found!'); process.exit(1); }

  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${modules.length} modules in ECA\n`);

  let updated = 0;
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // Delete old events
  await prisma.calendarEvent.deleteMany({
    where: { courseId: course.id, description: { startsWith: 'ECA Schedule:' } },
  });

  let eventCount = 0;

  for (let i = 0; i < SCHEDULE.length; i++) {
    const [dateStr, scheduleName] = SCHEDULE[i];
    const dbName = NAME_MAP[scheduleName] || scheduleName;
    const startDate = new Date(dateStr + 'T00:00:00');

    // Calculate end date (next module's start - 1 day, or +2 weeks for last)
    let endDate: Date;
    if (i < SCHEDULE.length - 1) {
      endDate = new Date(SCHEDULE[i + 1][0] + 'T00:00:00');
      endDate.setDate(endDate.getDate() - 1);
    } else {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 60); // Practicum ~8 weeks
    }

    const mod = modules.find(m => m.name === dbName);
    if (!mod) {
      console.log(`  ⚠ No module for: ${dbName} (${scheduleName})`);
      continue;
    }

    await prisma.module.update({
      where: { id: mod.id },
      data: { startDate },
    });
    updated++;
    console.log(`  ✓ ${mod.name} — starts ${startDate.toISOString().split('T')[0]}`);

    // Create calendar event
    await prisma.calendarEvent.create({
      data: {
        title: `ECA — ${mod.name}`,
        description: `ECA Schedule: ${mod.name}`,
        startTime: new Date(dateStr + 'T09:00:00'),
        endTime: new Date(endDate.toISOString().split('T')[0] + 'T17:00:00'),
        courseId: course.id,
        createdById: admin!.id,
      },
    });
    eventCount++;
  }

  // Practicum II starts after Practicum I
  const practicumII = modules.find(m => m.name === 'Practicum II');
  if (practicumII) {
    const pIIStart = new Date('2026-12-20T00:00:00');
    await prisma.module.update({ where: { id: practicumII.id }, data: { startDate: pIIStart } });
    updated++;
    console.log(`  ✓ Practicum II — starts 2026-12-20 (estimated)`);
  }

  console.log(`\n  Created ${eventCount} calendar events`);
  console.log(`\n✓ ECA Schedule synced: ${updated} modules updated`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
