import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { name: 'Microsoft Office Suite', weight: 30.61, hours: 300, assignments: [
    { title: 'Microsoft Office Suite - Final', points: 50 },
    { title: 'Microsoft Office Suite - Participation', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 1', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 2', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 3', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 4', points: 10 },
  ]},
  { name: 'English Fundamentals', weight: 2.04, hours: 20, assignments: [
    { title: 'English Fundamentals - Final', points: 90 },
    { title: 'English Fundamentals - Participation', points: 10 },
  ]},
  { name: 'Business Communications', weight: 12.24, hours: 120, assignments: [
    { title: 'Business Communications - Final', points: 90 },
    { title: 'Business Communications - Participation', points: 10 },
  ]},
  { name: 'Accounting', weight: 12.24, hours: 120, assignments: [
    { title: 'Accounting - Final', points: 50 },
    { title: 'Accounting - Participation', points: 10 },
    { title: 'Accounting - Assignment', points: 40 },
  ]},
  { name: 'Office Administration', weight: 14.29, hours: 140, assignments: [
    { title: 'Office Administration - Final', points: 50 },
    { title: 'Office Administration - Participation', points: 10 },
    { title: 'Office Administration - Assignment', points: 40 },
  ]},
  { name: 'Customer Service', weight: 10.20, hours: 100, assignments: [
    { title: 'Customer Service - Final', points: 50 },
    { title: 'Customer Service - Participation', points: 10 },
    { title: 'Customer Service - Assignment', points: 40 },
  ]},
  { name: 'Job Search Strategies', weight: 2.04, hours: 20, assignments: [
    { title: 'Job Search Strategies - Final', points: 90 },
    { title: 'Job Search Strategies - Participation', points: 10 },
  ]},
  { name: 'Intercultural Communication', weight: 4.08, hours: 40, assignments: [
    { title: 'Intercultural Communication - Final', points: 90 },
    { title: 'Intercultural Communication - Participation', points: 10 },
  ]},
  { name: 'Business Ethics', weight: 4.08, hours: 40, assignments: [
    { title: 'Business Ethics - Final', points: 90 },
    { title: 'Business Ethics - Participation', points: 10 },
  ]},
  { name: 'Introduction to HRM', weight: 4.08, hours: 40, assignments: [
    { title: 'Introduction to HRM - Final', points: 90 },
    { title: 'Introduction to HRM - Participation', points: 10 },
  ]},
  { name: 'Business Law', weight: 4.08, hours: 40, assignments: [
    { title: 'Business Law - Final', points: 90 },
    { title: 'Business Law - Participation', points: 10 },
  ]},
];

async function seed() {
  console.log('Creating OA course with 11 modules...\n');
  const course = await prisma.course.upsert({
    where: { code: 'OA' },
    update: {},
    create: {
      name: 'Office Administration Assistant', code: 'OA',
      description: 'Office Administration Assistance — Total Hours: 980 | 11 Modules.',
      color: '#1A6B5A', status: 'PUBLISHED', term: 'OA Program', subAccount: 'TAHA College',
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
