import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const WRITE = process.argv.includes('--write');

async function main() {
  const course = await prisma.course.findUnique({ where: { code: 'AC' } });
  if (!course) { console.error('AC not found'); process.exit(1); }

  const targets = await prisma.assignment.findMany({
    where: { courseId: course.id, title: { endsWith: ' - Participation' } },
    include: { _count: { select: { submissions: true, questions: true } } },
    orderBy: { title: 'asc' },
  });

  console.log(`Mode: ${WRITE ? 'WRITE (DESTRUCTIVE)' : 'DRY RUN'}`);
  console.log(`Found ${targets.length} AC Participation assignments:\n`);
  for (const a of targets) {
    console.log(`  [${a.format.padEnd(6)}] ${a.points.toString().padStart(3)} pts  subs=${a._count.submissions.toString().padStart(5)}  q=${a._count.questions.toString().padStart(2)}  — ${a.title}`);
  }

  if (!WRITE) { console.log('\nDRY RUN — re-run with --write to delete.'); await pool.end(); return; }
  if (targets.length === 0) { await pool.end(); return; }

  console.log(`\nDeleting ${targets.length} assignments (cascades submissions + questions)…`);
  const ids = targets.map(a => a.id);
  const res = await prisma.assignment.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${res.count} assignments.`);
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
