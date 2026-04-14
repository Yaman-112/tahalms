import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface Assignment { title: string; points: number; }
interface ModuleData { name: string; weight: number; hours: number; assignments: Assignment[]; }

const MODULES: ModuleData[] = [
  { name: 'Ethics, Regulations and Policy', weight: 1.00, hours: 15, assignments: [
    { title: 'Ethics, Regulations and Policy - Final', points: 90 },
    { title: 'Ethics, Regulations and Policy - Participation', points: 10 },
  ]},
  { name: 'Health and Safety', weight: 4.00, hours: 60, assignments: [
    { title: 'Health and Safety - Final', points: 50 },
    { title: 'Health and Safety - Participation', points: 10 },
    { title: 'Health and Safety - Practical', points: 40 },
  ]},
  { name: 'Entrepreneurial Skills', weight: 6.00, hours: 90, assignments: [
    { title: 'Entrepreneurial Skills - Final', points: 50 },
    { title: 'Entrepreneurial Skills - Participation', points: 10 },
    { title: 'Entrepreneurial Skills - Practical', points: 40 },
  ]},
  { name: 'Professional Development', weight: 1.00, hours: 15, assignments: [
    { title: 'Professional Development - Final', points: 40 },
    { title: 'Professional Development - Participation', points: 10 },
    { title: 'Professional Development - Midterm', points: 20 },
    { title: 'Professional Development - Practical', points: 30 },
  ]},
  { name: 'Client Service', weight: 2.00, hours: 30, assignments: [
    { title: 'Client Service - Final', points: 50 },
    { title: 'Client Service - Participation', points: 10 },
    { title: 'Client Service - Practical', points: 40 },
  ]},
  { name: 'Preparatory Procedures and Treatments', weight: 6.00, hours: 90, assignments: [
    { title: 'Preparatory Procedures and Treatments - Final', points: 40 },
    { title: 'Preparatory Procedures and Treatments - Participation', points: 10 },
    { title: 'Preparatory Procedures and Treatments - Midterm', points: 20 },
    { title: 'Preparatory Procedures and Treatments - Practical', points: 30 },
  ]},
  { name: 'Cut Hair', weight: 17.00, hours: 255, assignments: [
    { title: 'Cut Hair - Final', points: 40 },
    { title: 'Cut Hair - Participation', points: 10 },
    { title: 'Cut Hair - Midterm', points: 20 },
    { title: 'Cut Hair - Practical 1', points: 10 },
    { title: 'Cut Hair - Practical 2', points: 10 },
    { title: 'Cut Hair - Practical 3', points: 10 },
  ]},
  { name: 'Style Hair', weight: 17.00, hours: 255, assignments: [
    { title: 'Style Hair - Final', points: 40 },
    { title: 'Style Hair - Participation', points: 10 },
    { title: 'Style Hair - Midterm', points: 20 },
    { title: 'Style Hair - Practical 1', points: 10 },
    { title: 'Style Hair - Practical 2', points: 10 },
    { title: 'Style Hair - Practical 3', points: 10 },
  ]},
  { name: 'Permanent Wave Hair', weight: 11.00, hours: 165, assignments: [
    { title: 'Permanent Wave Hair - Final', points: 40 },
    { title: 'Permanent Wave Hair - Participation', points: 10 },
    { title: 'Permanent Wave Hair - Midterm', points: 20 },
    { title: 'Permanent Wave Hair - Practical 1', points: 10 },
    { title: 'Permanent Wave Hair - Practical 2', points: 10 },
    { title: 'Permanent Wave Hair - Practical 3', points: 10 },
  ]},
  { name: 'Colour and Lighten Hair', weight: 22.00, hours: 330, assignments: [
    { title: 'Colour and Lighten Hair - Final', points: 40 },
    { title: 'Colour and Lighten Hair - Participation', points: 10 },
    { title: 'Colour and Lighten Hair - Midterm', points: 20 },
    { title: 'Colour and Lighten Hair - Practical 1', points: 10 },
    { title: 'Colour and Lighten Hair - Practical 2', points: 10 },
    { title: 'Colour and Lighten Hair - Practical 3', points: 10 },
  ]},
  { name: 'Chemically Relax Hair', weight: 8.00, hours: 120, assignments: [
    { title: 'Chemically Relax Hair - Final', points: 40 },
    { title: 'Chemically Relax Hair - Participation', points: 10 },
    { title: 'Chemically Relax Hair - Midterm', points: 20 },
    { title: 'Chemically Relax Hair - Practical 1', points: 10 },
    { title: 'Chemically Relax Hair - Practical 2', points: 10 },
    { title: 'Chemically Relax Hair - Practical 3', points: 10 },
  ]},
  { name: 'Hair Additions', weight: 5.00, hours: 75, assignments: [
    { title: 'Hair Additions - Final', points: 40 },
    { title: 'Hair Additions - Participation', points: 10 },
    { title: 'Hair Additions - Midterm', points: 20 },
    { title: 'Hair Additions - Practical', points: 30 },
  ]},
];

async function seed() {
  console.log('Creating Hairstyling course with 12 modules...\n');

  const course = await prisma.course.upsert({
    where: { code: 'HAIR' },
    update: {},
    create: {
      name: 'Hairstyling',
      code: 'HAIR',
      description: 'Hairstyling — Total Hours: 1,500 | 12 Modules | One Group Per Module.',
      color: '#6B3FA0',
      status: 'PUBLISHED',
      term: 'Hairstyling Program',
      subAccount: 'TAHA College',
    },
  });
  console.log(`✓ Course: ${course.name} (${course.code})\n`);

  let totalAssignments = 0;

  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];

    const existingMod = await prisma.module.findFirst({
      where: { courseId: course.id, name: mod.name },
    });
    if (!existingMod) {
      await prisma.module.create({
        data: { courseId: course.id, name: mod.name, weight: mod.weight, hours: mod.hours, position: i + 1, published: true },
      });
    }

    for (const asn of mod.assignments) {
      const existing = await prisma.assignment.findFirst({
        where: { courseId: course.id, title: asn.title },
      });
      if (!existing) {
        await prisma.assignment.create({
          data: { courseId: course.id, title: asn.title, type: 'ASSIGNMENT', points: asn.points, published: true },
        });
        totalAssignments++;
      }
    }

    const pts = mod.assignments.map(a => `${a.title.split(' - ')[1]} (${a.points}pts)`).join(', ');
    console.log(`  ✓ Module ${i + 1}: ${mod.name} @ ${mod.weight}% — ${pts}`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Hairstyling Course Setup Complete:`);
  console.log(`  • 12 Modules (total 1,500 hours)`);
  console.log(`  • ${totalAssignments} Assignments`);
  console.log(`  • Total weight: 100%`);
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
