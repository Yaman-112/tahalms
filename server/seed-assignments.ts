import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Use Railway public URL if provided, otherwise local
const dbUrl = process.argv[2] || process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// All 24 IBA modules
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

async function seedAssignments() {
  console.log('Seeding assignments from IBA Canvas Setup Guide...\n');

  // Get all courses
  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses in database.\n`);

  let totalCreated = 0;

  for (const moduleName of MODULES) {
    // Find matching course (fuzzy match on name)
    const course = courses.find(c =>
      c.name.toLowerCase() === moduleName.toLowerCase() ||
      c.name.toLowerCase().replace(/[^a-z]/g, '').includes(moduleName.toLowerCase().replace(/[^a-z]/g, ''))
    );

    if (!course) {
      console.log(`  ⚠ No course found for: ${moduleName}`);
      continue;
    }

    // Create or update Module record (for progress tracking)
    const existingModule = await prisma.module.findFirst({
      where: { courseId: course.id, name: moduleName },
    });

    if (!existingModule) {
      await prisma.module.create({
        data: {
          courseId: course.id,
          name: moduleName,
          weight: 4.17,
          hours: 40,
          position: MODULES.indexOf(moduleName) + 1,
          published: true,
        },
      });
    }

    // Create Final assignment (90 pts)
    const finalTitle = `${moduleName} - Final`;
    const existingFinal = await prisma.assignment.findFirst({
      where: { courseId: course.id, title: finalTitle },
    });

    if (!existingFinal) {
      await prisma.assignment.create({
        data: {
          courseId: course.id,
          title: finalTitle,
          description: `Final assessment for ${moduleName}. Weight: 90% of module (4.17% of course).`,
          type: 'ASSIGNMENT',
          points: 90,
          published: true,
        },
      });
      totalCreated++;
    }

    // Create Participation assignment (10 pts)
    const partTitle = `${moduleName} - Participation`;
    const existingPart = await prisma.assignment.findFirst({
      where: { courseId: course.id, title: partTitle },
    });

    if (!existingPart) {
      await prisma.assignment.create({
        data: {
          courseId: course.id,
          title: partTitle,
          description: `Participation assessment for ${moduleName}. Weight: 10% of module (4.17% of course).`,
          type: 'ASSIGNMENT',
          points: 10,
          published: true,
        },
      });
      totalCreated++;
    }

    console.log(`  ✓ ${moduleName}: Final (90 pts) + Participation (10 pts)`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Created ${totalCreated} assignments across 24 modules.`);
  console.log(`Total assignments: 48 (24 Finals + 24 Participations)`);
  console.log(`Each module: 4.17% weight, 100 pts total (90 + 10)`);
  console.log(`Course total: 100% (24 × 4.17%)`);
}

seedAssignments()
  .then(() => {
    console.log('\nAssignment seeding completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
