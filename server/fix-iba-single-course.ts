import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  'Business Law',
  'Statistics for Business',
  'English Fundamentals',
  'Computer Applications in Business',
  'Sales Management',
  'Business Ethics',
  'Macro Economics',
  'Fundamentals of Marketing',
  'Introduction to HRM',
  'Fundamentals of Accounting',
  'Project Management',
  'Strategic Management',
  'Operations Research',
  'Organizational Behaviour',
  'Micro Economics',
  'Management Fundamentals',
  'International Business Strategy',
  'Intercultural Communication',
  'Leadership',
  'International Banking & Finance',
  'International Law',
  'Entrepreneurship',
  'E Commerce & Digital Marketing',
  'Cross Cultural Management',
];

async function fix() {
  console.log('Fixing: Making IBA a single course with 24 modules inside it...\n');

  // 1. Delete all individual module courses (not IBA-PROGRAM)
  //    This cascades to their assignments and modules
  const deleted = await prisma.course.deleteMany({
    where: {
      code: { not: 'IBA-PROGRAM' },
    },
  });
  console.log(`Deleted ${deleted.count} individual courses.\n`);

  // 2. Get the IBA-PROGRAM course
  const ibaCourse = await prisma.course.findUnique({ where: { code: 'IBA-PROGRAM' } });
  if (!ibaCourse) {
    console.error('IBA-PROGRAM course not found!');
    process.exit(1);
  }

  console.log(`IBA Program course: ${ibaCourse.id}\n`);

  // 3. Create 24 modules inside the single IBA course
  for (let i = 0; i < MODULES.length; i++) {
    const moduleName = MODULES[i];

    const existingModule = await prisma.module.findFirst({
      where: { courseId: ibaCourse.id, name: moduleName },
    });

    if (!existingModule) {
      await prisma.module.create({
        data: {
          courseId: ibaCourse.id,
          name: moduleName,
          weight: 4.17,
          hours: 40,
          position: i + 1,
          published: true,
        },
      });
    }

    // Create Final assignment (90 pts)
    const finalTitle = `${moduleName} - Final`;
    const existingFinal = await prisma.assignment.findFirst({
      where: { courseId: ibaCourse.id, title: finalTitle },
    });
    if (!existingFinal) {
      await prisma.assignment.create({
        data: {
          courseId: ibaCourse.id,
          title: finalTitle,
          description: `Final assessment for ${moduleName}. Weight: 90% of module (4.17% of course).`,
          type: 'ASSIGNMENT',
          points: 90,
          published: true,
        },
      });
    }

    // Create Participation assignment (10 pts)
    const partTitle = `${moduleName} - Participation`;
    const existingPart = await prisma.assignment.findFirst({
      where: { courseId: ibaCourse.id, title: partTitle },
    });
    if (!existingPart) {
      await prisma.assignment.create({
        data: {
          courseId: ibaCourse.id,
          title: partTitle,
          description: `Participation assessment for ${moduleName}. Weight: 10% of module (4.17% of course).`,
          type: 'ASSIGNMENT',
          points: 10,
          published: true,
        },
      });
    }

    console.log(`  ✓ Module ${i + 1}: ${moduleName} — Final (90pts) + Participation (10pts)`);
  }

  // Verify
  const moduleCount = await prisma.module.count({ where: { courseId: ibaCourse.id } });
  const assignmentCount = await prisma.assignment.count({ where: { courseId: ibaCourse.id } });
  const courseCount = await prisma.course.count();

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Result:`);
  console.log(`  • Total courses: ${courseCount} (just IBA)`);
  console.log(`  • Modules in IBA: ${moduleCount}`);
  console.log(`  • Assignments in IBA: ${assignmentCount}`);
}

fix()
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
