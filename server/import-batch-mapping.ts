import 'dotenv/config';
import XLSX from 'xlsx';
import prisma from './db';

// Map program names to our DB course codes
const courseMap: Record<string, string> = {
  'Accounting, Payroll, Business AND Tax': 'AC01',
  'Accounting, Payroll, Business and Tax': 'AC01',
  'Community Service Worker': 'CSW01',
  'NACC Early Childhood Assistant': 'NACC-ECA01',
  'Early Childhood Assistant': 'NACC-ECA01',
  'Hairstyling': 'HD01',
  'Hospitality and Tourism': 'HT01',
  'Hospitality and Tourism (Coop)': 'HT-COOP01',
  'Hospitality and Tourism (coop)': 'HT-COOP01',
  'International Business Administration': 'IBA01',
  'International Business Administration (Coop)': 'IBA-COOP-2026',
  'International Business Administration (Co-op)': 'IBA-COOP-2026',
  'Medical Aesthetics Diploma Program': 'MADP01',
  'Medical Aesthetics': 'MADP01',
  'Medical Office Administration': 'MOA01',
  'Office Administration Assistant': 'OAA01',
  'Office Administration': 'OAA01',
  'Personal Support Worker 2022 Distance Education': 'PSW-DE01',
  'Personal Support Worker': 'PSW-DE01',
  'PSW': 'PSW-DE01',
};

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

async function importBatchMapping() {
  const wb = XLSX.readFile('/Users/yaman/Downloads/Student_Batch_Mapping.xlsx');
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });

  console.log(`Processing ${rows.length} rows...\n`);

  // Pre-fetch courses and users
  const courses = await prisma.course.findMany();
  const allUsers = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, email: true } });
  const emailToId: Record<string, string> = {};
  allUsers.forEach(u => { emailToId[u.email.toLowerCase()] = u.id; });

  let enrolled = 0, skipped = 0, noEmail = 0, noCourse = 0, noUser = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = (row['Email Address'] || '').toString().trim().toLowerCase();
    const programName = (row['Program Name'] || '').toString().trim();
    const batchCode = (row['Batch Name'] || '').toString().trim();
    const status = (row['Last Status'] || '').toString().trim();

    if (!email) { noEmail++; continue; }

    // Find course
    const dbCourseCode = courseMap[programName];
    if (!dbCourseCode) {
      if (i < 5) console.log(`  No course mapping for: "${programName}"`);
      noCourse++;
      continue;
    }
    const course = courses.find(c => c.code === dbCourseCode);
    if (!course) { noCourse++; continue; }

    // Find student
    const userId = emailToId[email];
    if (!userId) {
      noUser++;
      continue;
    }

    try {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId_batchCode: {
            userId,
            courseId: course.id,
            batchCode: batchCode || null as any,
          },
        },
        update: {
          campus: row['Campus'] || null,
          classDays: row['Class Schedule Days'] || null,
          classTime: row['Class Time'] || null,
          schoolBreak: row['School Break'] || null,
          startDate: parseDate(row['Start Date']),
          endDate: parseDate(row['End date']),
          midpointDate: parseDate(row['Midpoint Start date']),
          studyHours: parseNumber(row['Course Study Hours']) as number | null,
          studyWeeks: parseNumber(row['Course Study Weeks']) as number | null,
          totalFees: parseNumber(row['Total Fees']),
          contractSent: row['Contract sent to Student'] || null,
          contractSigned: row['Contract Signed By Student'] || null,
          signedByCollege: row['Signed By College Rep'] || null,
          registrationStatus: row['Student Registration Statuses'] || null,
          lastStatus: status || null,
          lastRemarks: row['Last Remarks'] || null,
          lastUpdatedOn: row['Last Updated On'] || null,
        },
        create: {
          userId,
          courseId: course.id,
          role: 'STUDENT',
          batchCode: batchCode || null,
          campus: row['Campus'] || null,
          classDays: row['Class Schedule Days'] || null,
          classTime: row['Class Time'] || null,
          schoolBreak: row['School Break'] || null,
          startDate: parseDate(row['Start Date']),
          endDate: parseDate(row['End date']),
          midpointDate: parseDate(row['Midpoint Start date']),
          studyHours: parseNumber(row['Course Study Hours']) as number | null,
          studyWeeks: parseNumber(row['Course Study Weeks']) as number | null,
          totalFees: parseNumber(row['Total Fees']),
          contractSent: row['Contract sent to Student'] || null,
          contractSigned: row['Contract Signed By Student'] || null,
          signedByCollege: row['Signed By College Rep'] || null,
          registrationStatus: row['Student Registration Statuses'] || null,
          lastStatus: status || null,
          lastRemarks: row['Last Remarks'] || null,
          lastUpdatedOn: row['Last Updated On'] || null,
        },
      });

      enrolled++;
      if (enrolled % 500 === 0) console.log(`  Progress: ${enrolled} enrolled...`);
    } catch (err: any) {
      errors++;
      if (errors <= 5) console.log(`  Error row ${i + 2}: ${err.message.slice(0, 100)}`);
    }
  }

  console.log(`\nDone!`);
  console.log(`  Enrolled: ${enrolled}`);
  console.log(`  Skipped (no email): ${noEmail}`);
  console.log(`  Skipped (no course match): ${noCourse}`);
  console.log(`  Skipped (student not in DB): ${noUser}`);
  console.log(`  Errors: ${errors}`);
}

importBatchMapping().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
