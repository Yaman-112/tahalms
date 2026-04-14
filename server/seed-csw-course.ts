import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Pattern A: Final 90 + Participation 10
// Pattern B: Final 50 + Participation 10 + Assignment 40
const A = (n: string) => [{ title: `${n} - Final`, points: 90 }, { title: `${n} - Participation`, points: 10 }];
const B = (n: string) => [{ title: `${n} - Final`, points: 50 }, { title: `${n} - Participation`, points: 10 }, { title: `${n} - Assignment`, points: 40 }];

const MODULES = [
  { name: 'Essential Skills', weight: 3.70, hours: 40, assignments: A('Essential Skills') },
  { name: 'Microsoft Windows', weight: 3.70, hours: 40, assignments: A('Microsoft Windows') },
  { name: 'Inclusive Communication Skills', weight: 7.41, hours: 80, assignments: B('Inclusive Communication Skills') },
  { name: 'Introduction to Community Service Work', weight: 5.56, hours: 60, assignments: B('Introduction to Community Service Work') },
  { name: 'Employment Achievement Strategies', weight: 3.70, hours: 40, assignments: A('Employment Achievement Strategies') },
  { name: 'Basic Business Communications', weight: 3.70, hours: 40, assignments: A('Basic Business Communications') },
  { name: 'Harm Reduction and Crisis Intervention', weight: 5.56, hours: 60, assignments: B('Harm Reduction and Crisis Intervention') },
  { name: 'Introduction to Sociology', weight: 3.70, hours: 40, assignments: A('Introduction to Sociology') },
  { name: 'Mental Health & Addictions', weight: 9.26, hours: 100, assignments: B('Mental Health & Addictions') },
  { name: 'Populations at Risk', weight: 7.41, hours: 80, assignments: B('Populations at Risk') },
  { name: 'Support Resources & Community Capacity Building', weight: 5.56, hours: 60, assignments: B('Support Resources & Community Capacity Building') },
  { name: 'Law for Support Workers', weight: 5.56, hours: 60, assignments: B('Law for Support Workers') },
  { name: 'Self Care and Team Building', weight: 3.70, hours: 40, assignments: A('Self Care and Team Building') },
  { name: 'Basic Counselling Techniques', weight: 5.56, hours: 60, assignments: B('Basic Counselling Techniques') },
  { name: 'Solution-Focused Intervention Techniques', weight: 3.70, hours: 40, assignments: A('Solution-Focused Intervention Techniques') },
  { name: 'Family Development, Functions, and Social Issues', weight: 7.41, hours: 80, assignments: B('Family Development, Functions, and Social Issues') },
  { name: 'Introduction to Psychology', weight: 5.56, hours: 60, assignments: B('Introduction to Psychology') },
  { name: 'Professional Documentation & Case Management', weight: 1.85, hours: 20, assignments: A('Professional Documentation & Case Management') },
  { name: 'Behaviour Modification', weight: 7.41, hours: 80, assignments: B('Behaviour Modification') },
];

async function seed() {
  console.log('Creating CSW course with 19 modules...\n');
  const course = await prisma.course.upsert({
    where: { code: 'CSW' },
    update: {},
    create: {
      name: 'Community Service Worker', code: 'CSW',
      description: 'Community Service Worker — Total Hours: 1,080 | 19 Modules.',
      color: '#D64309', status: 'PUBLISHED', term: 'CSW Program', subAccount: 'TAHA College',
    },
  });
  console.log(`✓ Course: ${course.name} (${course.code})\n`);
  let total = 0;
  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];
    const em = await prisma.module.findFirst({ where: { courseId: course.id, name: mod.name } });
    if (!em) await prisma.module.create({ data: { courseId: course.id, name: mod.name, weight: mod.weight, hours: mod.hours, position: i + 1, published: true } });
    for (const a of mod.assignments) {
      const ex = await prisma.assignment.findFirst({ where: { courseId: course.id, title: a.title } });
      if (!ex) { await prisma.assignment.create({ data: { courseId: course.id, title: a.title, type: 'ASSIGNMENT', points: a.points, published: true } }); total++; }
    }
    const pts = mod.assignments.map(a => `${a.title.split(' - ').pop()} (${a.points}pts)`).join(', ');
    console.log(`  ✓ Module ${i+1}: ${mod.name} @ ${mod.weight}% — ${pts}`);
  }
  console.log(`\nDone! ${total} assignments created.`);
}
seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
