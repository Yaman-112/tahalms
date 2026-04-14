import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clear() {
  console.log('Clearing all data except admin user...\n');

  // Delete in order to respect foreign keys
  const submissions = await prisma.submission.deleteMany();
  console.log(`  Deleted ${submissions.count} submissions`);

  const assignments = await prisma.assignment.deleteMany();
  console.log(`  Deleted ${assignments.count} assignments`);

  const progress = await prisma.studentProgress.deleteMany();
  console.log(`  Deleted ${progress.count} student progress records`);

  const enrollments = await prisma.enrollment.deleteMany();
  console.log(`  Deleted ${enrollments.count} enrollments`);

  const batches = await prisma.batch.deleteMany();
  console.log(`  Deleted ${batches.count} batches`);

  const modules = await prisma.module.deleteMany();
  console.log(`  Deleted ${modules.count} modules`);

  const events = await prisma.calendarEvent.deleteMany();
  console.log(`  Deleted ${events.count} calendar events`);

  const messages = await prisma.messageRecipient.deleteMany();
  await prisma.message.deleteMany();
  console.log(`  Deleted messages`);

  const courses = await prisma.course.deleteMany();
  console.log(`  Deleted ${courses.count} courses`);

  // Delete all non-admin users
  const nonAdmins = await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } },
  });
  console.log(`  Deleted ${nonAdmins.count} non-admin users`);

  console.log('\n✓ Database cleared. Admin user preserved.');
}

clear()
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
