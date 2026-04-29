import 'dotenv/config';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const SECRET = process.env.PROD_JWT_SECRET!;
const ORIGIN = process.env.PROD_ORIGIN || 'https://smile.tahacollege.ca';
const SCOPE = [
  '11729','11738','12158','12437','12504','12505','12518','12583','12781',
  '12791','12804','12841','12895','12901','12928','12935','13072','13075',
  '13106','13110','13183','13190','13278','13386','13418','13575','13647',
  '13878','13903','13918','13919','13990',
];

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const students = await prisma.user.findMany({
    where: { vNumber: { in: SCOPE }, role: 'STUDENT' },
    select: { id: true, vNumber: true, firstName: true, lastName: true, email: true },
    orderBy: { vNumber: 'asc' },
  });

  console.log(`vNumber\tName\tEmail\tURL`);
  for (const s of students) {
    const token = jwt.sign({ userId: s.id, role: 'STUDENT' }, SECRET, { expiresIn: '60d' });
    const url = `${ORIGIN}/access/${token}`;
    const name = `${s.firstName} ${s.lastName}`.trim();
    console.log(`${s.vNumber}\t${name}\t${s.email}\t${url}`);
  }
  console.error(`\n✅ Minted ${students.length} share links (60-day expiry)`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
