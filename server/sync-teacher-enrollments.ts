import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function sync() {
  console.log('Syncing teacher enrollments from batches...\n');

  // Get all batches with their teacher and course
  const batches = await prisma.batch.findMany({
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      course: { select: { id: true, name: true } },
    },
  });

  // Deduplicate by teacher+course
  const seen = new Set<string>();
  let created = 0;

  for (const batch of batches) {
    const key = `${batch.teacherId}-${batch.courseId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId_batchCode: {
            userId: batch.teacherId,
            courseId: batch.courseId,
            batchCode: batch.batchCode,
          },
        },
        update: { role: 'TEACHER' },
        create: {
          userId: batch.teacherId,
          courseId: batch.courseId,
          role: 'TEACHER',
          batchCode: batch.batchCode,
        },
      });
      created++;
      console.log(`  ✓ ${batch.teacher.firstName} ${batch.teacher.lastName} → ${batch.course.name} (${batch.batchCode})`);
    } catch (err: any) {
      // Try without batchCode if unique constraint fails
      try {
        await prisma.enrollment.create({
          data: {
            userId: batch.teacherId,
            courseId: batch.courseId,
            role: 'TEACHER',
            batchCode: batch.batchCode,
          },
        });
        created++;
        console.log(`  ✓ ${batch.teacher.firstName} ${batch.teacher.lastName} → ${batch.course.name} (${batch.batchCode})`);
      } catch {
        console.log(`  - Already enrolled: ${batch.teacher.firstName} → ${batch.course.name}`);
      }
    }
  }

  console.log(`\nDone! Created ${created} teacher enrollments from ${batches.length} batches.`);
}

sync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
