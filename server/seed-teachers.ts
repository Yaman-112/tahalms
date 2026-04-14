import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEACHERS = [
  { name: 'Kanchan', email: 'kanchan@tahacollege.ca' },
  { name: 'Mathi', email: 'mathis@tahacollege.ca' },
  { name: 'IRO', email: 'iro@tahacollege.ca' },
  { name: 'Preyal', email: 'preyal@tahacollege.ca' },
  { name: 'Moin', email: 'moin@tahacollege.ca' },
  { name: 'Shreenath', email: 'shreenathkv@tahacollege.ca' },
  { name: 'Anu', email: 'anu@tahacollege.ca' },
  { name: 'Vasu', email: 'vasu@tahacollege.ca' },
  { name: 'Akshay', email: 'akshay@tahacollege.ca' },
  { name: 'Aakanksha Bhadkaria', email: 'aakanksha@tahacollege.ca' },
  { name: 'Manika', email: 'manika@tahacollege.ca' },
  { name: 'Komathy', email: 'komathy@tahacollege.ca' },
  { name: 'Sherry Nandha', email: 'sherry.nandha@tahacollege.ca' },
  { name: 'Tanushree Chakraborty', email: 'tanushree@tahacollege.ca' },
  { name: 'Rashmi', email: 'rashmi@tahacollege.ca' },
  { name: 'Shipra', email: 'shipra@tahacollege.ca' },
  { name: 'Simerjit', email: 'simerjit@tahacollege.ca' },
  { name: 'Banusha', email: 'banusha@tahacollege.ca' },
  { name: 'Thurshiga', email: 'thurshiga@tahacollege.ca' },
  { name: 'Chandan', email: 'chandan@tahacollege.ca' },
  { name: 'Vino', email: 'vino@tahacollege.ca' },
  { name: 'Kalaimagal', email: 'kalaimagal@tahacollege.ca' },
  { name: 'Monica Dahiya', email: 'monica@tahacollege.ca' },
  { name: 'Shivanka Badwall', email: 'shivanka@tahacollege.ca' },
  { name: 'Gaurav', email: 'gaurav.laha@tahacollege.ca' },
  { name: 'Roshan', email: 'roshan@tahacollege.ca' },
  { name: 'Ratinder', email: 'ratinder@tahacollege.ca' },
  { name: 'Kulsoom Khurram', email: 'kulsoom@tahacollege.ca' },
];

async function seedTeachers() {
  console.log('Creating 28 teacher accounts...\n');

  const passwordHash = await bcrypt.hash('Taha@2025', 10);

  for (const t of TEACHERS) {
    const nameParts = t.name.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    await prisma.user.upsert({
      where: { email: t.email.toLowerCase() },
      update: {
        firstName,
        lastName,
        role: 'TEACHER',
      },
      create: {
        email: t.email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: 'TEACHER',
        isActive: true,
      },
    });

    console.log(`  ✓ ${t.name} (${t.email})`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Created 28 teachers. Password for all: Taha@2025`);
}

seedTeachers()
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
