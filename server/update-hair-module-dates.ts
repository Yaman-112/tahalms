import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const WRITE = process.argv.includes('--write');

// Schedule name → DB name
const SCHEDULE: { date: string; dbName: string }[] = [
  { date: '2025-08-04', dbName: 'Ethics, Regulations and Policy' },
  { date: '2025-09-08', dbName: 'Health and Safety' },
  { date: '2025-11-03', dbName: 'Entrepreneurial Skills' },
  { date: '2025-12-01', dbName: 'Professional Development' },
  { date: '2026-01-12', dbName: 'Client Service' },
  { date: '2026-02-16', dbName: 'Preparatory Procedures and Treatments' },
  { date: '2026-03-23', dbName: 'Cut Hair' },
  { date: '2026-05-18', dbName: 'Style Hair' },
  { date: '2026-06-15', dbName: 'Permanent Wave Hair' },
  // Modules without dates in schedule — left NULL:
  //   Colour and Lighten Hair, Chemically Relax Hair, Hair Additions
];

async function main() {
  const course = await prisma.course.findUnique({ where: { code: 'HAIR' }, include: { modules: true } });
  if (!course) { console.error('HAIR not found'); process.exit(1); }

  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN'}\n`);
  for (const s of SCHEDULE) {
    const mod = course.modules.find(m => m.name === s.dbName);
    if (!mod) { console.log(`  MISSING MODULE in DB: ${s.dbName}`); continue; }
    const target = new Date(`${s.date}T00:00:00Z`);
    const current = mod.startDate?.toISOString().slice(0, 10) ?? 'NULL';
    console.log(`  ${mod.name.padEnd(42)}  ${current} → ${s.date}`);
    if (WRITE) await prisma.module.update({ where: { id: mod.id }, data: { startDate: target } });
  }

  if (!WRITE) console.log('\nDRY RUN — re-run with --write.');
  else console.log('\nDone.');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
