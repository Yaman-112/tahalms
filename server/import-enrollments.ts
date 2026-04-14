import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import XLSX from 'xlsx';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COURSE_CODE_MAP: Record<string, string> = {
  'AC': 'AC', 'ACE': 'AC', 'ACW': 'AC',
  'CSW': 'CSW', 'CSWE': 'CSW',
  'ECA': 'ECA', 'HD': 'HAIR',
  'HT': 'HT', 'HTE': 'HT', 'HTW': 'HT',
  'HTCOOP': 'HT', 'HTECOOP': 'HT', 'HTWCOOP': 'HT',
  'IBA': 'IBA', 'IBAE': 'IBA', 'IBAW': 'IBA',
  'IBA64': 'IBA', 'IBAE64': 'IBA', 'IBAW64': 'IBA',
  'MD': 'MD', 'MOE': 'MOA', 'OA34': 'OA', 'OAE34': 'OA', 'PSW': 'PSW',
};

function excelDate(serial: number): Date | null {
  if (!serial || typeof serial !== 'number') return null;
  return new Date(new Date(1899, 11, 30).getTime() + serial * 86400000);
}

async function importEnrollments() {
  const wb = XLSX.readFile('/Users/yaman/Downloads/Student_Batch_Mapping.xlsx');
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`Processing ${rows.length} enrollment records...\n`);

  // Cache courses
  const allCourses = await prisma.course.findMany();
  const courseMap = new Map(allCourses.map(c => [c.code, c.id]));

  // Cache users by email (lowercase)
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const userMap = new Map(allUsers.map(u => [u.email.toLowerCase(), u.id]));
  console.log(`Loaded ${userMap.size} users, ${courseMap.size} courses\n`);

  let created = 0, skipped = 0, errors = 0, notFound = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = (row['Email Address'] || '').toString().trim().toLowerCase();
    const batchCode = (row['Batch Name'] || '').toString().trim();
    const sheetCourseCode = (row['Course Code'] || '').toString().trim();

    if (!email) { skipped++; continue; }

    // Find user
    const userId = userMap.get(email);
    if (!userId) { notFound++; continue; }

    // Find course
    const dbCourseCode = COURSE_CODE_MAP[sheetCourseCode] || sheetCourseCode;
    const courseId = courseMap.get(dbCourseCode);
    if (!courseId) { skipped++; continue; }

    // Parse dates
    const startDate = excelDate(row['Start Date']);
    const endDate = excelDate(row['End date']);
    const midpointDate = excelDate(row['Midpoint Start date']);

    // Parse fields
    const campus = (row['Campus'] || '').toString().trim() || null;
    const classDays = (row['Class Schedule Days'] || '').toString().trim() || null;
    const classTime = (row['Class Time'] || '').toString().trim() || null;
    const schoolBreak = row['School Break'] ? row['School Break'].toString() : null;
    const studyHours = row['Course Study Hours'] ? parseInt(row['Course Study Hours']) : null;
    const studyWeeks = row['Course Study Weeks'] ? parseInt(row['Course Study Weeks']) : null;
    const totalFees = row['Total Fees'] ? parseFloat(row['Total Fees']) : null;
    const contractSent = (row['Contract sent to Student'] || '').toString().trim() || null;
    const contractSigned = (row['Contract Signed By Student'] || '').toString().trim() || null;
    const signedByCollege = (row['Signed By College Rep'] || '').toString().trim() || null;
    const registrationStatus = (row['Last Status'] || '').toString().trim() || null;
    const lastRemarks = (row['Last Remarks'] || '').toString().trim() || null;
    const lastUpdatedOn = (row['Last Updated On'] || '').toString().trim() || null;

    try {
      await prisma.enrollment.upsert({
        where: { userId_courseId_batchCode: { userId, courseId, batchCode: batchCode || null as any } },
        update: {
          campus, classDays, classTime, schoolBreak,
          startDate, endDate, midpointDate,
          studyHours, studyWeeks, totalFees,
          contractSent, contractSigned, signedByCollege,
          registrationStatus, lastRemarks, lastUpdatedOn,
        },
        create: {
          userId, courseId, role: 'STUDENT',
          batchCode: batchCode || null,
          campus, classDays, classTime, schoolBreak,
          startDate, endDate, midpointDate,
          studyHours, studyWeeks, totalFees,
          contractSent, contractSigned, signedByCollege,
          registrationStatus, lastRemarks, lastUpdatedOn,
        },
      });
      created++;
    } catch (err: any) {
      errors++;
      if (errors <= 10) console.log(`  ✗ ${email} (${batchCode}): ${err.message.slice(0, 100)}`);
    }

    if ((i + 1) % 200 === 0) {
      process.stdout.write(`\r  Processed: ${i + 1}/${rows.length} (enrolled: ${created}, skipped: ${skipped}, not found: ${notFound}, errors: ${errors})`);
    }
  }

  console.log(`\r  Processed: ${rows.length}/${rows.length}                                                    `);
  console.log(`\n─────────────────────────────────────────`);
  console.log(`Enrollments created: ${created}`);
  console.log(`Students not found in DB: ${notFound}`);
  console.log(`Skipped (no email/course): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

importEnrollments().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
