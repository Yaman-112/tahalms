import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clear() {
  const sub = await prisma.submission.deleteMany();
  const assign = await prisma.assignment.deleteMany();
  const prog = await prisma.studentProgress.deleteMany();
  const enroll = await prisma.enrollment.deleteMany();
  const batch = await prisma.batch.deleteMany();
  const mod = await prisma.module.deleteMany();
  const events = await prisma.calendarEvent.deleteMany();
  const courses = await prisma.course.deleteMany();

  console.log('Deleted:');
  console.log(`  Courses: ${courses.count}`);
  console.log(`  Batches: ${batch.count}`);
  console.log(`  Modules: ${mod.count}`);
  console.log(`  Assignments: ${assign.count}`);
  console.log(`  Enrollments: ${enroll.count}`);
  console.log(`  Calendar Events: ${events.count}`);
  console.log('\nAll courses removed. Users preserved.');
}

clear().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
