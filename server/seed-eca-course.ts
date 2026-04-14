import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ModuleData {
  name: string;
  weight: number;
  hours: number;
  assignments: { title: string; points: number; type: 'ASSIGNMENT' | 'QUIZ' }[];
}

const MODULES: ModuleData[] = [
  {
    name: 'Foundations of Early Childhood Education', weight: 9.00, hours: 90,
    assignments: [
      { title: 'Foundations of Early Childhood Education - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Foundations of Early Childhood Education - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Foundations of Early Childhood Education - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Foundations of Early Childhood Education - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Communications', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Communications - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Communications - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Communications - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Communications - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Infant and Child Development', weight: 9.00, hours: 90,
    assignments: [
      { title: 'Infant and Child Development - Final', points: 40, type: 'ASSIGNMENT' },
      { title: 'Infant and Child Development - Assignment 1', points: 30, type: 'ASSIGNMENT' },
      { title: 'Infant and Child Development - Assignment 2', points: 30, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Observation Skills', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Observation Skills - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Observation Skills - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Observation Skills - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Observation Skills - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Health, Safety and Nutrition', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Health, Safety and Nutrition - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Health, Safety and Nutrition - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Health, Safety and Nutrition - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Health, Safety and Nutrition - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Child, Family and Community', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Child, Family and Community - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Child, Family and Community - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Child, Family and Community - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Child, Family and Community - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Practicum I', weight: 12.50, hours: 125,
    assignments: [
      { title: 'Practicum I - Final', points: 100, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Introduction to Sociology', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Introduction to Sociology - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Introduction to Sociology - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Introduction to Sociology - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Introduction to Sociology - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Play-Based Early Learning Strategies', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Play-Based Early Learning Strategies - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Play-Based Early Learning Strategies - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Play-Based Early Learning Strategies - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Play-Based Early Learning Strategies - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Language and Literacy', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Language and Literacy - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Language and Literacy - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Language and Literacy - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Language and Literacy - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Introduction to Psychology', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Introduction to Psychology - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Introduction to Psychology - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Introduction to Psychology - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Introduction to Psychology - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Guiding Children\'s Behaviour', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Guiding Children\'s Behaviour - Final', points: 30, type: 'ASSIGNMENT' },
      { title: 'Guiding Children\'s Behaviour - Assignment 1', points: 30, type: 'ASSIGNMENT' },
      { title: 'Guiding Children\'s Behaviour - Assignment 2', points: 40, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Creating Inclusive Programs', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Creating Inclusive Programs - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Creating Inclusive Programs - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Creating Inclusive Programs - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Creating Inclusive Programs - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Special Needs', weight: 4.50, hours: 45,
    assignments: [
      { title: 'Special Needs - Final', points: 25, type: 'ASSIGNMENT' },
      { title: 'Special Needs - Assignment 1', points: 25, type: 'ASSIGNMENT' },
      { title: 'Special Needs - Assignment 2', points: 25, type: 'ASSIGNMENT' },
      { title: 'Special Needs - Midterm', points: 25, type: 'ASSIGNMENT' },
    ],
  },
  {
    name: 'Practicum II', weight: 20.00, hours: 200,
    assignments: [
      { title: 'Practicum II - Final', points: 100, type: 'ASSIGNMENT' },
    ],
  },
];

async function seedECA() {
  console.log('Creating ECA course with 15 modules...\n');

  // Create course
  const course = await prisma.course.upsert({
    where: { code: 'ECA' },
    update: {},
    create: {
      name: 'NACC Early Childhood Assistant',
      code: 'ECA',
      description: 'Early Childhood Assistant (ECA) — Total Hours: 1,000 | 15 Modules | One Group Per Module.',
      color: '#127A2C',
      status: 'PUBLISHED',
      term: 'ECA Program',
      subAccount: 'TAHA College',
    },
  });
  console.log(`✓ Course: ${course.name} (${course.code})\n`);

  let totalAssignments = 0;

  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];

    // Create module
    const existingMod = await prisma.module.findFirst({
      where: { courseId: course.id, name: mod.name },
    });
    if (!existingMod) {
      await prisma.module.create({
        data: {
          courseId: course.id,
          name: mod.name,
          weight: mod.weight,
          hours: mod.hours,
          position: i + 1,
          published: true,
        },
      });
    }

    // Create assignments
    for (const asn of mod.assignments) {
      const existing = await prisma.assignment.findFirst({
        where: { courseId: course.id, title: asn.title },
      });
      if (!existing) {
        await prisma.assignment.create({
          data: {
            courseId: course.id,
            title: asn.title,
            type: asn.type,
            points: asn.points,
            published: true,
          },
        });
        totalAssignments++;
      }
    }

    const pts = mod.assignments.map(a => `${a.title.split(' - ')[1]} (${a.points}pts)`).join(', ');
    console.log(`  ✓ Module ${i + 1}: ${mod.name} @ ${mod.weight}% — ${pts}`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`ECA Course Setup Complete:`);
  console.log(`  • 1 Course: NACC Early Childhood Assistant`);
  console.log(`  • 15 Modules (total 1,000 hours)`);
  console.log(`  • ${totalAssignments} Assignments`);
  console.log(`  • Total weight: 100%`);
}

seedECA()
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
