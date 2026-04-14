import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  'Business Law', 'Statistics for Business', 'English Fundamentals',
  'Computer Applications in Business', 'Sales Management', 'Business Ethics',
  'Macro Economics', 'Fundamentals of Marketing', 'Introduction to HRM',
  'Fundamentals of Accounting', 'Project Management', 'Strategic Management',
  'Operations Research', 'Organizational Behaviour', 'Micro Economics',
  'Management Fundamentals', 'International Business Strategy',
  'Intercultural Communication', 'Leadership', 'International Banking & Finance',
  'International Law', 'Entrepreneurship', 'E Commerce & Digital Marketing',
  'Cross Cultural Management',
];

async function seed() {
  console.log('Creating IBA course with 24 modules...\n');
  const course = await prisma.course.upsert({
    where: { code: 'IBA' },
    update: {},
    create: {
      name: 'International Business Administration', code: 'IBA',
      description: 'International Business Administration — Total Hours: 960 | 24 Modules.',
      color: '#0B5394', status: 'PUBLISHED', term: 'IBA Program', subAccount: 'TAHA College',
    },
  });
  console.log(`✓ Course: ${course.name} (${course.code})\n`);
  let total = 0;
  for (let i = 0; i < MODULES.length; i++) {
    const name = MODULES[i];
    const em = await prisma.module.findFirst({ where: { courseId: course.id, name } });
    if (!em) await prisma.module.create({ data: { courseId: course.id, name, weight: 4.17, hours: 40, position: i + 1, published: true } });
    const assignments = [
      { title: `${name} - Final`, points: 90 },
      { title: `${name} - Participation`, points: 10 },
    ];
    for (const a of assignments) {
      const ex = await prisma.assignment.findFirst({ where: { courseId: course.id, title: a.title } });
      if (!ex) { await prisma.assignment.create({ data: { courseId: course.id, title: a.title, type: 'ASSIGNMENT', points: a.points, published: true } }); total++; }
    }
    console.log(`  ✓ Module ${i+1}: ${name} @ 4.17% — Final (90pts), Participation (10pts)`);
  }
  console.log(`\nDone! ${total} assignments created.`);
}
seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
