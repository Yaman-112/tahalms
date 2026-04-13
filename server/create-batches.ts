import 'dotenv/config';
import prisma from './db';

// Map course names to our DB course codes
const courseMap: Record<string, string> = {
  'Accounting, Payroll, Business AND Tax': 'AC01',
  'Community Service Worker': 'CSW01',
  'NACC Early Childhood Assistant': 'NACC-ECA01',
  'Hairstyling': 'HD01',
  'Hospitality and Tourism': 'HT01',
  'Hospitality and Tourism (coop)': 'HT-COOP01',
  'International Business Administration': 'IBA01',
  'International Business Administration (Coop)': 'IBA-COOP-2026',
  'Medical Aesthetics Diploma Program': 'MADP01',
  'Medical Office Administration': 'MOA01',
  'Office Administration Assistant': 'OAA01',
  'Personal Support Worker 2022 Distance Education': 'PSW-DE01',
};

// Map teacher first names to emails (handle name variations)
const teacherMap: Record<string, string> = {
  'Kanchan': 'kanchan@tahacollege.ca',
  'Mathi': 'mathis@tahacollege.ca',
  'Iro': 'iro@tahacollege.ca',
  'IRO': 'iro@tahacollege.ca',
  'Ronia': 'iro@tahacollege.ca', // Ronia might be Iro or a new teacher
  'Preyal': 'preyal@tahacollege.ca',
  'Moin': 'moin@tahacollege.ca',
  'Sreenath': 'shreenathkv@tahacollege.ca',
  'Shreenath': 'shreenathkv@tahacollege.ca',
  'Anu': 'anu@tahacollege.ca',
  'Vasu': 'vasu@tahacollege.ca',
  'Akshay': 'akshay@tahacollege.ca',
  'Aakanksha': 'aakanksha@tahacollege.ca',
  'Manika': 'manika@tahacollege.ca',
  'Komathy': 'komathy@tahacollege.ca',
  'Sherry': 'sherry.nandha@tahacollege.ca',
  'Tanushree': 'tanushree@tahacollege.ca',
  'Rashmi': 'rashmi@tahacollege.ca',
  'Shipra': 'shipra@tahacollege.ca',
  'Simerjit': 'simerjit@tahacollege.ca',
  'Banusha': 'banusha@tahacollege.ca',
  'Thursiga': 'thurshiga@tahacollege.ca',
  'Thurshiga': 'thurshiga@tahacollege.ca',
  'Chandan': 'chandan@tahacollege.ca',
  'Vino': 'vino@tahacollege.ca',
  'Kalaimagal': 'kalaimagal@tahacollege.ca',
  'Monica': 'monica@tahacollege.ca',
  'Shivanka': 'shivanka@tahacollege.ca',
  'Gaurav': 'gaurav.laha@tahacollege.ca',
  'Roshan': 'roshan@tahacollege.ca',
  'Ratinder': 'ratinder@tahacollege.ca',
  'Kulsoom': 'kulsoom@tahacollege.ca',
};

const batches = [
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'AC', teacher: 'Mathi', batch: 'AC01' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'AC', teacher: 'Anu', batch: 'AC02' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'AC', teacher: 'Thursiga', batch: 'AC03' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'AC', teacher: 'Chandan', batch: 'AC04' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'AC', teacher: 'Banusha', batch: 'AC06' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'AC', teacher: 'Simerjit', batch: 'AC07' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Mathi', batch: 'ACE01' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Anu', batch: 'ACE02' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Sreenath', batch: 'ACE03' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Vino', batch: 'ACE04' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Thursiga', batch: 'ACE05' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Chandan', batch: 'ACE06' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Simerjit', batch: 'ACE07' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Banusha', batch: 'ACE08' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACE', teacher: 'Kalaimagal', batch: 'ACE09' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACW', teacher: 'Anu', batch: 'ACW02' },
  { course: 'Accounting, Payroll, Business AND Tax', codePrefix: 'ACW', teacher: 'Sreenath', batch: 'ACW03' },
  { course: 'Community Service Worker', codePrefix: 'CSW', teacher: 'Manika', batch: 'CSW01' },
  { course: 'Community Service Worker', codePrefix: 'CSW', teacher: 'Ratinder', batch: 'CSW02' },
  { course: 'Community Service Worker', codePrefix: 'CSW', teacher: 'Vasu', batch: 'CSW03' },
  { course: 'Community Service Worker', codePrefix: 'CSW', teacher: 'Kulsoom', batch: 'CSW04' },
  { course: 'Community Service Worker', codePrefix: 'CSWE', teacher: 'Manika', batch: 'CSWE01' },
  { course: 'Community Service Worker', codePrefix: 'CSWE', teacher: 'Ratinder', batch: 'CSWE02' },
  { course: 'Community Service Worker', codePrefix: 'CSWE', teacher: 'Vasu', batch: 'CSWE03' },
  { course: 'Community Service Worker', codePrefix: 'CSWE', teacher: 'Kulsoom', batch: 'CSWE04' },
  { course: 'NACC Early Childhood Assistant', codePrefix: 'ECA', teacher: 'Kanchan', batch: 'ECA01' },
  { course: 'Hairstyling', codePrefix: 'HD', teacher: 'Iro', batch: 'HD01' },
  { course: 'Hairstyling', codePrefix: 'HD', teacher: 'Ronia', batch: 'HD02' },
  { course: 'Hospitality and Tourism', codePrefix: 'HT', teacher: 'Akshay', batch: 'HT01' },
  { course: 'Hospitality and Tourism', codePrefix: 'HT', teacher: 'Shipra', batch: 'HT02' },
  { course: 'Hospitality and Tourism', codePrefix: 'HT', teacher: 'Sreenath', batch: 'HT03' },
  { course: 'Hospitality and Tourism', codePrefix: 'HT', teacher: 'Rashmi', batch: 'HT04' },
  { course: 'Hospitality and Tourism', codePrefix: 'HT', teacher: 'Aakanksha', batch: 'HT05' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTCOOP', teacher: 'Akshay', batch: 'HTCOOP01' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTCOOP', teacher: 'Shipra', batch: 'HTCOOP02' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTCOOP', teacher: 'Sreenath', batch: 'HTCOOP03' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTCOOP', teacher: 'Rashmi', batch: 'HTCOOP04' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTCOOP', teacher: 'Aakanksha', batch: 'HTCOOP05' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Akshay', batch: 'HTE01' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Shipra', batch: 'HTE02' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Sreenath', batch: 'HTE03' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Sherry', batch: 'HTE04' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Rashmi', batch: 'HTE05' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Tanushree', batch: 'HTE06' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTE', teacher: 'Aakanksha', batch: 'HTE07' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Akshay', batch: 'HTECOOP01' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Shipra', batch: 'HTECOOP02' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Sreenath', batch: 'HTECOOP03' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Sherry', batch: 'HTECOOP04' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Rashmi', batch: 'HTECOOP05' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Tanushree', batch: 'HTECOOP06' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTECOOP', teacher: 'Aakanksha', batch: 'HTECOOP07' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTW', teacher: 'Akshay', batch: 'HTW01' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTW', teacher: 'Rashmi', batch: 'HTW02' },
  { course: 'Hospitality and Tourism', codePrefix: 'HTW', teacher: 'Tanushree', batch: 'HTW03' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTWCOOP', teacher: 'Akshay', batch: 'HTWCOOP01' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTWCOOP', teacher: 'Rashmi', batch: 'HTWCOOP02' },
  { course: 'Hospitality and Tourism (coop)', codePrefix: 'HTWCOOP', teacher: 'Tanushree', batch: 'HTWCOOP03' },
  { course: 'International Business Administration', codePrefix: 'IBA', teacher: 'Akshay', batch: 'IBA01' },
  { course: 'International Business Administration', codePrefix: 'IBA', teacher: 'Shipra', batch: 'IBA02' },
  { course: 'International Business Administration', codePrefix: 'IBA', teacher: 'Rashmi', batch: 'IBA03' },
  { course: 'International Business Administration', codePrefix: 'IBA', teacher: 'Sreenath', batch: 'IBA04' },
  { course: 'International Business Administration', codePrefix: 'IBA', teacher: 'Aakanksha', batch: 'IBA05' },
  { course: 'International Business Administration', codePrefix: 'IBA', teacher: 'Monica', batch: 'IBA06' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBA64', teacher: 'Akshay', batch: 'IBACOOP01' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBA64', teacher: 'Shipra', batch: 'IBACOOP02' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBA64', teacher: 'Rashmi', batch: 'IBACOOP03' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBA64', teacher: 'Sreenath', batch: 'IBACOOP04' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBA64', teacher: 'Aakanksha', batch: 'IBACOOP05' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBA64', teacher: 'Monica', batch: 'IBACOOP06' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Akshay', batch: 'IBAE01' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Shipra', batch: 'IBAE02' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Rashmi', batch: 'IBAE03' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Sherry', batch: 'IBAE04' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Aakanksha', batch: 'IBAE05' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Monica', batch: 'IBAE06' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Gaurav', batch: 'IBAE07' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Simerjit', batch: 'IBAE09' },
  { course: 'International Business Administration', codePrefix: 'IBAE', teacher: 'Shivanka', batch: 'IBAE10' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Akshay', batch: 'IBAECOOP01' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Shipra', batch: 'IBAECOOP02' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Rashmi', batch: 'IBAECOOP03' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Sherry', batch: 'IBAECOOP04' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Aakanksha', batch: 'IBAECOOP05' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Monica', batch: 'IBAECOOP06' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Gaurav', batch: 'IBAECOOP07' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Simerjit', batch: 'IBAECOOP09' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAE64', teacher: 'Shivanka', batch: 'IBAECOOP10' },
  { course: 'International Business Administration', codePrefix: 'IBAW', teacher: 'Akshay', batch: 'IBAW01' },
  { course: 'International Business Administration', codePrefix: 'IBAW', teacher: 'Rashmi', batch: 'IBAW02' },
  { course: 'International Business Administration', codePrefix: 'IBAW', teacher: 'Shivanka', batch: 'IBAW03' },
  { course: 'International Business Administration', codePrefix: 'IBAW', teacher: 'Monica', batch: 'IBAW04' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAW64', teacher: 'Akshay', batch: 'IBAWCOOP01' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAW64', teacher: 'Rashmi', batch: 'IBAWCOOP02' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAW64', teacher: 'Shivanka', batch: 'IBAWCOOP03' },
  { course: 'International Business Administration (Coop)', codePrefix: 'IBAW64', teacher: 'Monica', batch: 'IBAWCOOP04' },
  { course: 'Medical Aesthetics Diploma Program', codePrefix: 'MD', teacher: 'Preyal', batch: 'MD01' },
  { course: 'Medical Aesthetics Diploma Program', codePrefix: 'MD', teacher: 'Roshan', batch: 'MD02' },
  { course: 'Medical Office Administration', codePrefix: 'MOE', teacher: 'Moin', batch: 'MOE01' },
  { course: 'Office Administration Assistant', codePrefix: 'OA34', teacher: 'Sreenath', batch: 'OA34' },
  { course: 'Office Administration Assistant', codePrefix: 'OAE34', teacher: 'Sreenath', batch: 'OAE34' },
  { course: 'Personal Support Worker 2022 Distance Education', codePrefix: 'PSW', teacher: 'Komathy', batch: 'PSW01' },
  { course: 'Personal Support Worker 2022 Distance Education', codePrefix: 'PSW', teacher: 'Moin', batch: 'PSW02' },
  { course: 'Personal Support Worker 2022 Distance Education', codePrefix: 'PSW', teacher: 'Moin', batch: 'PSWW02' },
];

async function createBatches() {
  console.log(`Creating ${batches.length} batches...\n`);

  // Pre-fetch all courses and teachers
  const courses = await prisma.course.findMany();
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' } });

  let created = 0, skipped = 0, errors: string[] = [];

  for (const b of batches) {
    // Find course
    const dbCourseCode = courseMap[b.course];
    if (!dbCourseCode) {
      errors.push(`No course mapping for: ${b.course}`);
      skipped++;
      continue;
    }
    const course = courses.find(c => c.code === dbCourseCode);
    if (!course) {
      errors.push(`Course not found in DB: ${dbCourseCode} (${b.course})`);
      skipped++;
      continue;
    }

    // Find teacher
    const teacherEmail = teacherMap[b.teacher];
    if (!teacherEmail) {
      errors.push(`No teacher mapping for: ${b.teacher} (batch ${b.batch})`);
      skipped++;
      continue;
    }
    const teacher = teachers.find(t => t.email === teacherEmail);
    if (!teacher) {
      errors.push(`Teacher not found in DB: ${teacherEmail} (${b.teacher})`);
      skipped++;
      continue;
    }

    try {
      await prisma.batch.upsert({
        where: { batchCode: b.batch },
        update: {
          courseId: course.id,
          teacherId: teacher.id,
          courseCode: b.codePrefix,
        },
        create: {
          batchCode: b.batch,
          courseId: course.id,
          teacherId: teacher.id,
          courseCode: b.codePrefix,
        },
      });
      created++;
      console.log(`  ${b.batch}: ${b.course} → ${b.teacher}`);
    } catch (err: any) {
      errors.push(`${b.batch}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

createBatches().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
