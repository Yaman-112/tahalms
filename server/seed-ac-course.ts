import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { name: 'Microsoft Windows', weight: 1.96, hours: 20, assignments: [
    { title: 'Microsoft Windows - Final', points: 90 },
    { title: 'Microsoft Windows - Participation', points: 10 },
  ]},
  { name: 'Microsoft Word 2', weight: 1.96, hours: 20, assignments: [
    { title: 'Microsoft Word 2 - Final', points: 90 },
    { title: 'Microsoft Word 2 - Participation', points: 10 },
  ]},
  { name: 'Accounting Fundamentals and Book Keeping', weight: 23.53, hours: 240, assignments: [
    { title: 'Accounting Fundamentals and Book Keeping - Final', points: 50 },
    { title: 'Accounting Fundamentals and Book Keeping - Participation', points: 10 },
    { title: 'Accounting Fundamentals and Book Keeping - Assignment', points: 30 },
    { title: 'Accounting Fundamentals and Book Keeping - Quiz', points: 10 },
  ]},
  { name: 'Computerized Accounting with Quickbooks', weight: 11.76, hours: 120, assignments: [
    { title: 'Computerized Accounting with Quickbooks - Final', points: 50 },
    { title: 'Computerized Accounting with Quickbooks - Participation', points: 10 },
    { title: 'Computerized Accounting with Quickbooks - Assignment', points: 30 },
    { title: 'Computerized Accounting with Quickbooks - Quiz', points: 10 },
  ]},
  { name: 'Computerized Accounting with Sage50/Sage300', weight: 21.57, hours: 220, assignments: [
    { title: 'Computerized Accounting with Sage50/Sage300 - Final', points: 50 },
    { title: 'Computerized Accounting with Sage50/Sage300 - Participation', points: 10 },
    { title: 'Computerized Accounting with Sage50/Sage300 - Assignment', points: 30 },
    { title: 'Computerized Accounting with Sage50/Sage300 - Quiz', points: 10 },
  ]},
  { name: 'Payroll Fundamentals 1', weight: 4.90, hours: 50, assignments: [
    { title: 'Payroll Fundamentals 1 - Final', points: 50 },
    { title: 'Payroll Fundamentals 1 - Participation', points: 10 },
    { title: 'Payroll Fundamentals 1 - Assignment', points: 40 },
  ]},
  { name: 'Payroll Fundamental 2', weight: 4.90, hours: 50, assignments: [
    { title: 'Payroll Fundamental 2 - Final', points: 50 },
    { title: 'Payroll Fundamental 2 - Participation', points: 10 },
    { title: 'Payroll Fundamental 2 - Assignment', points: 40 },
  ]},
  { name: 'Canadian Income Tax', weight: 7.84, hours: 80, assignments: [
    { title: 'Canadian Income Tax - Final', points: 50 },
    { title: 'Canadian Income Tax - Participation', points: 10 },
    { title: 'Canadian Income Tax - Assignment', points: 30 },
    { title: 'Canadian Income Tax - Quiz', points: 10 },
  ]},
  { name: 'Job Search', weight: 1.96, hours: 20, assignments: [
    { title: 'Job Search - Final', points: 90 },
    { title: 'Job Search - Participation', points: 10 },
  ]},
  { name: 'Microsoft Excel 1 and Excel 2', weight: 5.88, hours: 60, assignments: [
    { title: 'Microsoft Excel 1 and Excel 2 - Final', points: 50 },
    { title: 'Microsoft Excel 1 and Excel 2 - Participation', points: 10 },
    { title: 'Microsoft Excel 1 and Excel 2 - Assignment', points: 40 },
  ]},
  { name: 'Microsoft Powerpoint', weight: 1.96, hours: 20, assignments: [
    { title: 'Microsoft Powerpoint - Final', points: 90 },
    { title: 'Microsoft Powerpoint - Participation', points: 10 },
  ]},
  { name: 'Microsoft Outlook', weight: 1.96, hours: 20, assignments: [
    { title: 'Microsoft Outlook - Final', points: 90 },
    { title: 'Microsoft Outlook - Participation', points: 10 },
  ]},
  { name: 'Office Procedures', weight: 9.80, hours: 100, assignments: [
    { title: 'Office Procedures - Final', points: 50 },
    { title: 'Office Procedures - Participation', points: 10 },
    { title: 'Office Procedures - Assignment', points: 40 },
  ]},
];

async function seed() {
  console.log('Creating Accounting course with 13 modules...\n');
  const course = await prisma.course.upsert({
    where: { code: 'AC' },
    update: {},
    create: {
      name: 'Accounting, Payroll, Business & Tax', code: 'AC',
      description: 'Accounting, Payroll, Business & Tax — Total Hours: 1,020 | 13 Modules.',
      color: '#0770A2', status: 'PUBLISHED', term: 'AC Program', subAccount: 'TAHA College',
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
      if (!ex) { await prisma.assignment.create({ data: { courseId: course.id, title: a.title, type: a.title.includes('Quiz') ? 'QUIZ' : 'ASSIGNMENT', points: a.points, published: true } }); total++; }
    }
    const pts = mod.assignments.map(a => `${a.title.split(' - ').pop()} (${a.points}pts)`).join(', ');
    console.log(`  ✓ Module ${i+1}: ${mod.name} @ ${mod.weight}% — ${pts}`);
  }
  console.log(`\nDone! ${total} assignments created.`);
}
seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
