import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const course = await prisma.course.findUnique({ where: { code: 'MD' } });
  if (!course) { console.log('MD not found'); process.exit(1); }

  const assignments = await prisma.assignment.findMany({
    where: { courseId: course.id },
    include: { _count: { select: { questions: true } } },
  });

  console.log('MD Assignments:');
  for (const a of assignments) {
    console.log(`  ${a.title} — format: ${a.format}, type: ${a.type}, points: ${a.points}, questions: ${a._count.questions}`);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
