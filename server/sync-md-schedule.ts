import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// MD Schedule - last 4 modules don't have dates, estimate from Chemical Peels end
// Chemical Peels starts 6/22, each of the remaining modules ~3-4 weeks
const SCHEDULE: [string, string][] = [
  ['2025-08-11', 'Health & Safety, Sanitation & Infection Prevention'],
  ['2025-09-02', 'Nail Care'],
  ['2025-10-14', 'Makeup Artistry'],
  ['2025-11-24', 'Facials/Skincare'],
  ['2026-03-23', 'Microdermabrasion'],
  ['2026-03-31', 'Waxing'],
  ['2026-05-18', 'Body Relaxing Massage'],
  ['2026-06-22', 'Chemical Peels'],
  ['2026-07-20', 'Body Treatments Aromatherapy/ Body Wraps & Exfoliation'],
  ['2026-08-17', 'Employment Preparation, Soft Skills & Business Skills'],
  ['2026-09-14', 'Photo Rejuvenation'],
  ['2026-10-12', 'Laser/Light Hair Removal'],
];

async function sync() {
  console.log('Syncing MD module schedule...\n');

  const course = await prisma.course.findUnique({ where: { code: 'MD' } });
  if (!course) { console.error('MD course not found!'); process.exit(1); }

  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
  console.log(`Found ${modules.length} modules in MD\n`);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  await prisma.calendarEvent.deleteMany({
    where: { courseId: course.id, description: { startsWith: 'MD Schedule:' } },
  });

  let updated = 0, eventCount = 0;

  for (let i = 0; i < SCHEDULE.length; i++) {
    const [dateStr, name] = SCHEDULE[i];
    const startDate = new Date(dateStr + 'T00:00:00');

    const mod = modules.find(m => m.name === name);
    if (!mod) {
      console.log(`  ⚠ No module for: ${name}`);
      continue;
    }

    await prisma.module.update({ where: { id: mod.id }, data: { startDate } });
    updated++;
    console.log(`  ✓ ${mod.name} — starts ${startDate.toISOString().split('T')[0]}`);

    // End date = next module start - 1 day, or +4 weeks for last
    let endDate: Date;
    if (i < SCHEDULE.length - 1) {
      endDate = new Date(SCHEDULE[i + 1][0] + 'T00:00:00');
      endDate.setDate(endDate.getDate() - 1);
    } else {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 27);
    }

    await prisma.calendarEvent.create({
      data: {
        title: `MD — ${mod.name}`,
        description: `MD Schedule: ${mod.name}`,
        startTime: new Date(dateStr + 'T09:00:00'),
        endTime: new Date(endDate.toISOString().split('T')[0] + 'T17:00:00'),
        courseId: course.id,
        createdById: admin!.id,
      },
    });
    eventCount++;
  }

  console.log(`\n  Created ${eventCount} calendar events`);
  console.log(`\n✓ MD Schedule synced: ${updated} modules updated`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
