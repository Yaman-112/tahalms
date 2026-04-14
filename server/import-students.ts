import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Excel serial date to JS Date
function excelDateToDate(serial: number): Date | null {
  if (!serial || typeof serial !== 'number') return null;
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + serial * 86400000);
}

async function importStudents() {
  const wb = XLSX.readFile('/Users/yaman/Downloads/Taha_student_data.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  console.log(`Importing ${rows.length} students...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      try {
        const email = (row['Username(Email Id)'] || row['EP(Email Id)'] || '').toString().trim().toLowerCase();
        if (!email) {
          skipped++;
          continue;
        }

        const studentName = (row['Student Name'] || '').toString().trim();
        const nameParts = studentName.split(/\s+/);
        const firstName = nameParts[0] || 'Student';
        const lastName = nameParts.slice(1).join(' ') || '';

        const password = (row['Password'] || 'default123').toString().trim();
        const passwordHash = await bcrypt.hash(password, 10);

        const vNumber = (row['VNumber'] || '').toString().trim();
        const contactNo = row['Contact No.'] ? row['Contact No.'].toString().trim() : null;
        const address = (row['Address'] || '').toString().trim() || null;
        const campus = (row['Campus'] || '').toString().trim() || null;
        const program = (row['Program'] || '').toString().trim() || null;
        const campusStatus = (row['Campus Status'] || '').toString().trim() || null;
        const shift = (row['AM/PM'] || '').toString().trim() || null;
        const admissionRep = (row['Admission Rep'] || '').toString().trim() || null;
        const username = (row['Username(Email Id)'] || '').toString().trim() || null;

        const startDate = excelDateToDate(row['Start Date']);
        const finishDate = excelDateToDate(row['Finish Date']);

        // Upsert - update if email exists, create if not
        await prisma.user.upsert({
          where: { email },
          update: {
            firstName,
            lastName,
            vNumber,
            contactNo,
            address,
            campus,
            program,
            campusStatus,
            shift,
            admissionRep,
            username,
            startDate,
            finishDate,
          },
          create: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: 'STUDENT',
            vNumber,
            contactNo,
            address,
            campus,
            program,
            campusStatus,
            shift,
            admissionRep,
            username,
            startDate,
            finishDate,
            isActive: true,
          },
        });

        created++;
      } catch (err: any) {
        errors++;
        if (errors <= 10) {
          console.error(`  Error for row ${i}: ${err.message}`);
        }
      }
    }

    // Progress update every batch
    const progress = Math.min(i + BATCH_SIZE, rows.length);
    process.stdout.write(`\r  Processed: ${progress}/${rows.length} (created/updated: ${created}, skipped: ${skipped}, errors: ${errors})`);
  }

  console.log(`\n\n─────────────────────────────────────────`);
  console.log(`Import complete!`);
  console.log(`  Created/Updated: ${created}`);
  console.log(`  Skipped (no email): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`\nStudents can login with their email and the password from the sheet.`);
}

importStudents()
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
