import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
  // Create missing courses that had duplicate codes
  const missing = [
    { name: 'Macro Economics', code: 'IBA-MACRO', color: '#0770A2' },
    { name: 'Strategic Management', code: 'IBA-STMG', color: '#6B3FA0' },
  ];

  for (const m of missing) {
    const exists = await prisma.course.findFirst({ where: { name: m.name } });
    if (exists) {
      console.log(`${m.name} already exists (${exists.code})`);
      continue;
    }

    const course = await prisma.course.create({
      data: {
        name: m.name,
        code: m.code,
        color: m.color,
        status: 'PUBLISHED',
        term: 'IBA Program',
        subAccount: 'TAHA College',
        description: `IBA Program — ${m.name}`,
      },
    });
    console.log(`Created: ${m.name} (${m.code})`);

    // Create module
    await prisma.module.create({
      data: {
        courseId: course.id,
        name: m.name,
        weight: 4.17,
        hours: 40,
        position: 0,
        published: true,
      },
    });

    // Create assignments
    await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: `${m.name} - Final`,
        description: `Final assessment for ${m.name}. Weight: 90% of module (4.17% of course).`,
        type: 'ASSIGNMENT',
        points: 90,
        published: true,
      },
    });

    await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: `${m.name} - Participation`,
        description: `Participation assessment for ${m.name}. Weight: 10% of module (4.17% of course).`,
        type: 'ASSIGNMENT',
        points: 10,
        published: true,
      },
    });

    console.log(`  ✓ ${m.name}: Final (90 pts) + Participation (10 pts)`);
  }
}

fix()
  .then(() => { console.log('Done!'); process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
