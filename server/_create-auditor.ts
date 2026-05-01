import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const EMAIL = 'stacy@tahacollege.ca';
const PASSWORD = 'Taha@12345';

// 32 vNumbers (dropped 11386 — not in Canvas; dropped 13752 — exists under vNumber 11952)
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
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  if (existing) {
    const u = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: 'AUDITOR' as any,
        firstName: 'Audit',
        lastName: 'User',
        isActive: true,
        scopedStudentIds: SCOPE,
      },
    });
    console.log(`✏️  Updated existing auditor user: ${u.id}`);
    console.log(`   email=${u.email}  scope=${SCOPE.length} students`);
  } else {
    const u = await prisma.user.create({
      data: {
        email: EMAIL,
        username: EMAIL,
        passwordHash,
        role: 'AUDITOR' as any,
        firstName: 'Audit',
        lastName: 'User',
        isActive: true,
        scopedStudentIds: SCOPE,
      },
    });
    console.log(`✅ Created auditor user: ${u.id}`);
    console.log(`   email=${u.email}  scope=${SCOPE.length} students`);
  }

  // Verify scope intersection with actual student records
  const matched = await prisma.user.findMany({
    where: { vNumber: { in: SCOPE }, role: 'STUDENT' },
    select: { vNumber: true },
  });
  console.log(`\n   ${matched.length}/${SCOPE.length} of the scoped vNumbers exist as STUDENT records`);
  const matchedSet = new Set(matched.map(u => u.vNumber));
  const missing = SCOPE.filter(v => !matchedSet.has(v));
  if (missing.length) console.log(`   not yet on platform: ${missing.join(', ')}`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
