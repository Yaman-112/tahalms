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
  'Training & Development in Hospitality Industry',
  'Managing Technology in Hospitality Industry',
  'International & Canadian Tourism',
  'Introduction to Hospitality & Tourism',
  'Managing Front Office Operations',
  'House Keeping',
  'Food & Beverage Management',
  'Hospitality Law',
];

async function seed() {
  console.log('Creating Hospitality course with 24 modules...\n');

  const course = await prisma.course.upsert({
    where: { code: 'HT' },
    update: {},
    create: {
      name: 'Hospitality and Tourism',
      code: 'HT',
      description: 'Hospitality — Total Hours: 960 | 24 Modules | One Group Per Module.',
      color: '#C23C2D',
      status: 'PUBLISHED',
      term: 'HT Program',
      subAccount: 'TAHA College',
    },
  });
  console.log(`✓ Course: ${course.name} (${course.code})\n`);

  let totalAssignments = 0;

  for (let i = 0; i < MODULES.length; i++) {
    const name = MODULES[i];

    const existingMod = await prisma.module.findFirst({ where: { courseId: course.id, name } });
    if (!existingMod) {
      await prisma.module.create({
        data: { courseId: course.id, name, weight: 4.17, hours: 40, position: i + 1, published: true },
      });
    }

    const assignments = [
      { title: `${name} - Final`, points: 90 },
      { title: `${name} - Participation`, points: 10 },
    ];

    for (const asn of assignments) {
      const existing = await prisma.assignment.findFirst({ where: { courseId: course.id, title: asn.title } });
      if (!existing) {
        await prisma.assignment.create({
          data: { courseId: course.id, title: asn.title, type: 'ASSIGNMENT', points: asn.points, published: true },
        });
        totalAssignments++;
      }
    }

    console.log(`  ✓ Module ${i + 1}: ${name} @ 4.17% — Final (90pts), Participation (10pts)`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Hospitality Course Setup Complete:`);
  console.log(`  • 24 Modules (total 960 hours)`);
  console.log(`  • ${totalAssignments} Assignments`);
  console.log(`  • Total weight: 100%`);
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
