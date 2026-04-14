import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import XLSX from 'xlsx';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Map batch course codes to DB course codes
const COURSE_CODE_MAP: Record<string, string> = {
  'AC': 'AC', 'ACE': 'AC', 'ACW': 'AC',
  'CSW': 'CSW', 'CSWE': 'CSW',
  'ECA': 'ECA',
  'HD': 'HAIR',
  'HT': 'HT', 'HTE': 'HT', 'HTW': 'HT',
  'HTCOOP': 'HT', 'HTECOOP': 'HT', 'HTWCOOP': 'HT',
  'IBA': 'IBA', 'IBAE': 'IBA', 'IBAW': 'IBA',
  'IBA64': 'IBA', 'IBAE64': 'IBA', 'IBAW64': 'IBA',
  'MD': 'MD',
  'MOE': 'MOA',
  'OA34': 'OA', 'OAE34': 'OA',
  'PSW': 'PSW',
};

const INSTRUCTOR_EMAIL_MAP: Record<string, string> = {
  'mathi': 'mathis@tahacollege.ca',
  'anu': 'anu@tahacollege.ca',
  'thursiga': 'thurshiga@tahacollege.ca',
  'thurshiga': 'thurshiga@tahacollege.ca',
  'kalaimagal': 'kalaimagal@tahacollege.ca',
  'kanchan': 'kanchan@tahacollege.ca',
  'vasu': 'vasu@tahacollege.ca',
  'akshay': 'akshay@tahacollege.ca',
  'preyal': 'preyal@tahacollege.ca',
  'moin': 'moin@tahacollege.ca',
  'shreenath': 'shreenathkv@tahacollege.ca',
  'sreenath': 'shreenathkv@tahacollege.ca',
  'iro': 'iro@tahacollege.ca',
  'aakanksha': 'aakanksha@tahacollege.ca',
  'manika': 'manika@tahacollege.ca',
  'komathy': 'komathy@tahacollege.ca',
  'sherry': 'sherry.nandha@tahacollege.ca',
  'tanushree': 'tanushree@tahacollege.ca',
  'rashmi': 'rashmi@tahacollege.ca',
  'shipra': 'shipra@tahacollege.ca',
  'simerjit': 'simerjit@tahacollege.ca',
  'banusha': 'banusha@tahacollege.ca',
  'chandan': 'chandan@tahacollege.ca',
  'vino': 'vino@tahacollege.ca',
  'monica': 'monica@tahacollege.ca',
  'shivanka': 'shivanka@tahacollege.ca',
  'gaurav': 'gaurav.laha@tahacollege.ca',
  'roshan': 'roshan@tahacollege.ca',
  'ratinder': 'ratinder@tahacollege.ca',
  'kulsoom': 'kulsoom@tahacollege.ca',
  'ronia': 'iro@tahacollege.ca', // fallback
};

async function importBatches() {
  const wb = XLSX.readFile('/Users/yaman/Downloads/1.Batch--Instructors--Timings-Zoom mappings---Time (1) (1).xlsx');
  const ws = wb.Sheets['Instructor Records'];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  console.log(`Processing ${rows.length} batch records...\n`);

  // Get all courses from DB
  const allCourses = await prisma.course.findMany();
  const courseMap = new Map(allCourses.map(c => [c.code, c.id]));
  console.log('Courses in DB:', [...courseMap.keys()].join(', '));

  // Check if PSW course needs to be created
  if (!courseMap.has('PSW')) {
    const psw = await prisma.course.create({
      data: {
        name: 'Personal Support Worker', code: 'PSW',
        description: 'Personal Support Worker 2022 Distance Education',
        color: '#8B4513', status: 'PUBLISHED', term: 'PSW Program', subAccount: 'TAHA College',
      },
    });
    courseMap.set('PSW', psw.id);
    console.log('  Created PSW course');
  }

  // Get admin as fallback teacher
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  let created = 0, skipped = 0, errors = 0;
  const processedBatches = new Set<string>();

  for (const row of rows) {
    const batchCode = (row['Batch Code'] || '').toString().trim();
    const sheetCourseCode = (row['Course Code'] || '').toString().trim();
    const instructorName = (row['Instructor'] || '').toString().trim();
    const batchType = (row['Batch Type'] || '').toString().trim();

    if (!batchCode || !sheetCourseCode || processedBatches.has(batchCode)) { skipped++; continue; }
    processedBatches.add(batchCode);

    // Map to DB course code
    const dbCourseCode = COURSE_CODE_MAP[sheetCourseCode];
    if (!dbCourseCode) { console.log(`  ⚠ No mapping for course code: ${sheetCourseCode}`); errors++; continue; }

    const courseId = courseMap.get(dbCourseCode);
    if (!courseId) { console.log(`  ⚠ Course not in DB: ${dbCourseCode} (batch: ${batchCode})`); errors++; continue; }

    // Find teacher
    const email = INSTRUCTOR_EMAIL_MAP[instructorName.toLowerCase()];
    let teacherId: string | null = null;
    if (email) {
      const teacher = await prisma.user.findUnique({ where: { email } });
      if (teacher) teacherId = teacher.id;
    }
    if (!teacherId) teacherId = admin!.id;

    // Determine schedule
    let classTime = '', classDays = '';
    if (batchType === 'Morning') { classTime = '9:30 AM - 2:30 PM'; classDays = 'Mon-Fri'; }
    else if (batchType === 'Evening') { classTime = '5:00 PM - 10:00 PM'; classDays = 'Mon-Fri'; }
    else if (batchType === 'Weekend') { classTime = '9:00 AM - 5:00 PM'; classDays = 'Fri-Sun'; }

    try {
      await prisma.batch.upsert({
        where: { batchCode },
        update: { courseId, teacherId, courseCode: sheetCourseCode, classTime, classDays, status: 'ACTIVE' },
        create: { batchCode, courseId, teacherId, courseCode: sheetCourseCode, classTime, classDays, batchType: batchType.toUpperCase() || 'PRIMARY', status: 'ACTIVE' },
      });
      created++;
      console.log(`  ✓ ${batchCode} — ${instructorName} (${batchType}) → ${dbCourseCode}`);
    } catch (err: any) {
      errors++;
      console.log(`  ✗ ${batchCode}: ${err.message.slice(0, 80)}`);
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Batches created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

importBatches().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
