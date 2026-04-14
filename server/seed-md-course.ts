import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { name: 'Health & Safety, Sanitation & Infection Prevention', weight: 4.04, hours: 50, assignments: [
    { title: 'Health & Safety, Sanitation & Infection Prevention - Final', points: 40 },
    { title: 'Health & Safety, Sanitation & Infection Prevention - Participation', points: 10 },
    { title: 'Health & Safety, Sanitation & Infection Prevention - Practical', points: 50 },
  ]},
  { name: 'Nail Care', weight: 10.08, hours: 125, assignments: [
    { title: 'Nail Care - Final', points: 50 },
    { title: 'Nail Care - Participation', points: 10 },
    { title: 'Nail Care - Practical 1', points: 10 },
    { title: 'Nail Care - Practical 2', points: 10 },
    { title: 'Nail Care - Midterm', points: 20 },
  ]},
  { name: 'Facials/Skincare', weight: 24.19, hours: 300, assignments: [
    { title: 'Facials/Skincare - Final', points: 40 },
    { title: 'Facials/Skincare - Participation', points: 10 },
    { title: 'Facials/Skincare - Practical', points: 30 },
    { title: 'Facials/Skincare - Midterm', points: 20 },
  ]},
  { name: 'Waxing', weight: 10.48, hours: 130, assignments: [
    { title: 'Waxing - Final', points: 40 },
    { title: 'Waxing - Participation', points: 10 },
    { title: 'Waxing - Practical', points: 30 },
    { title: 'Waxing - Midterm', points: 20 },
  ]},
  { name: 'Makeup Artistry', weight: 9.68, hours: 120, assignments: [
    { title: 'Makeup Artistry - Final', points: 40 },
    { title: 'Makeup Artistry - Participation', points: 10 },
    { title: 'Makeup Artistry - Practical', points: 30 },
    { title: 'Makeup Artistry - Midterm', points: 20 },
  ]},
  { name: 'Body Treatments Aromatherapy/ Body Wraps & Exfoliation', weight: 6.05, hours: 75, assignments: [
    { title: 'Body Treatments Aromatherapy/ Body Wraps & Exfoliation - Final', points: 40 },
    { title: 'Body Treatments Aromatherapy/ Body Wraps & Exfoliation - Participation', points: 10 },
    { title: 'Body Treatments Aromatherapy/ Body Wraps & Exfoliation - Practical', points: 30 },
    { title: 'Body Treatments Aromatherapy/ Body Wraps & Exfoliation - Midterm', points: 20 },
  ]},
  { name: 'Body Relaxing Massage', weight: 8.06, hours: 100, assignments: [
    { title: 'Body Relaxing Massage - Final', points: 40 },
    { title: 'Body Relaxing Massage - Participation', points: 10 },
    { title: 'Body Relaxing Massage - Practical', points: 30 },
    { title: 'Body Relaxing Massage - Midterm', points: 20 },
  ]},
  { name: 'Employment Preparation, Soft Skills & Business Skills', weight: 8.06, hours: 100, assignments: [
    { title: 'Employment Preparation, Soft Skills & Business Skills - Final', points: 40 },
    { title: 'Employment Preparation, Soft Skills & Business Skills - Participation', points: 10 },
    { title: 'Employment Preparation, Soft Skills & Business Skills - Assignment', points: 30 },
    { title: 'Employment Preparation, Soft Skills & Business Skills - Midterm', points: 20 },
  ]},
  { name: 'Chemical Peels', weight: 4.84, hours: 60, assignments: [
    { title: 'Chemical Peels - Final', points: 50 },
    { title: 'Chemical Peels - Participation', points: 10 },
    { title: 'Chemical Peels - Practical', points: 40 },
  ]},
  { name: 'Photo Rejuvenation', weight: 4.84, hours: 60, assignments: [
    { title: 'Photo Rejuvenation - Final', points: 50 },
    { title: 'Photo Rejuvenation - Participation', points: 10 },
    { title: 'Photo Rejuvenation - Practical', points: 40 },
  ]},
  { name: 'Microdermabrasion', weight: 4.84, hours: 60, assignments: [
    { title: 'Microdermabrasion - Final', points: 50 },
    { title: 'Microdermabrasion - Participation', points: 10 },
    { title: 'Microdermabrasion - Practical', points: 40 },
  ]},
  { name: 'Laser/Light Hair Removal', weight: 4.84, hours: 60, assignments: [
    { title: 'Laser/Light Hair Removal - Final', points: 50 },
    { title: 'Laser/Light Hair Removal - Participation', points: 10 },
    { title: 'Laser/Light Hair Removal - Practical', points: 40 },
  ]},
];

async function seed() {
  console.log('Creating Medical Aesthetics course with 12 modules...\n');
  const course = await prisma.course.upsert({
    where: { code: 'MD' },
    update: {},
    create: {
      name: 'Medical Aesthetics Diploma Program', code: 'MD',
      description: 'Medical Aesthetics — Total Hours: 1,240 | 12 Modules.',
      color: '#BF4F00', status: 'PUBLISHED', term: 'MD Program', subAccount: 'TAHA College',
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
    console.log(`  ✓ Module ${i+1}: ${mod.name} @ ${mod.weight}%`);
  }
  console.log(`\nDone! ${total} assignments created.`);
}
seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
