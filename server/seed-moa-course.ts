import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { name: 'Microsoft Office Suite', weight: 20.00, hours: 160, assignments: [
    { title: 'Microsoft Office Suite - Final', points: 50 },
    { title: 'Microsoft Office Suite - Participation', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 1', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 2', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 3', points: 10 },
    { title: 'Microsoft Office Suite - Assignment 4', points: 10 },
  ]},
  { name: 'Business Communication', weight: 10.00, hours: 80, assignments: [
    { title: 'Business Communication - Final', points: 30 },
    { title: 'Business Communication - Participation', points: 10 },
    { title: 'Business Communication - Assignment', points: 30 },
    { title: 'Business Communication - Midterm', points: 30 },
  ]},
  { name: 'Medical Office Procedure', weight: 28.75, hours: 230, assignments: [
    { title: 'Medical Office Procedure - Final', points: 30 },
    { title: 'Medical Office Procedure - Participation', points: 10 },
    { title: 'Medical Office Procedure - Assignment', points: 30 },
    { title: 'Medical Office Procedure - Midterm', points: 30 },
  ]},
  { name: 'Medical Terminology', weight: 10.00, hours: 80, assignments: [
    { title: 'Medical Terminology - Final', points: 30 },
    { title: 'Medical Terminology - Participation', points: 10 },
    { title: 'Medical Terminology - Assignment', points: 30 },
    { title: 'Medical Terminology - Midterm', points: 30 },
  ]},
  { name: 'Anatomy and Physiology', weight: 13.75, hours: 110, assignments: [
    { title: 'Anatomy and Physiology - Final', points: 30 },
    { title: 'Anatomy and Physiology - Participation', points: 10 },
    { title: 'Anatomy and Physiology - Assignment', points: 30 },
    { title: 'Anatomy and Physiology - Midterm', points: 30 },
  ]},
  { name: 'Medical Transcription', weight: 7.50, hours: 60, assignments: [
    { title: 'Medical Transcription - Final', points: 30 },
    { title: 'Medical Transcription - Participation', points: 10 },
    { title: 'Medical Transcription - Assignment 1', points: 30 },
    { title: 'Medical Transcription - Assignment 2', points: 30 },
  ]},
  { name: 'Medical Coding & OHIP Billing', weight: 7.50, hours: 60, assignments: [
    { title: 'Medical Coding & OHIP Billing - Final', points: 50 },
    { title: 'Medical Coding & OHIP Billing - Participation', points: 10 },
    { title: 'Medical Coding & OHIP Billing - Assignment 1', points: 20 },
    { title: 'Medical Coding & OHIP Billing - Assignment 2', points: 20 },
  ]},
  { name: 'Job Search Strategies', weight: 2.50, hours: 20, assignments: [
    { title: 'Job Search Strategies - Final', points: 90 },
    { title: 'Job Search Strategies - Participation', points: 10 },
  ]},
];

async function seed() {
  console.log('Creating MOA course with 8 modules...\n');
  const course = await prisma.course.upsert({
    where: { code: 'MOA' },
    update: {},
    create: {
      name: 'Medical Office Administration', code: 'MOA',
      description: 'Medical Office Assistance — Total Hours: 800 | 8 Modules.',
      color: '#7B2D8E', status: 'PUBLISHED', term: 'MOA Program', subAccount: 'TAHA College',
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
