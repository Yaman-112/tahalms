import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { createAuditLog } from './audit';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// ─── STUDENT IMPORT ─────────────────────────────────────
// Excel headers: Student Name, VNumber, EP(Email Id), Username(Email Id),
//   Contact No., Address, Campus, Start Date, Finish Date, Program,
//   Campus Status, AM/PM, Password, Admission Rep
export async function importStudents(
  buffer: Buffer,
  uploadedById: string,
  batchId: string
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const prepared = await Promise.all(
      batch.map(async (row, idx) => {
        const rowNum = i + idx + 2;

        // Parse "Student Name" → firstName + lastName
        const fullName = (row['Student Name'] || row['student name'] || row['StudentName'] || '').toString().trim();
        const vNumber = (row['VNumber'] || row['vnumber'] || row['V Number'] || '').toString().trim();
        const email = (row['EP(Email Id)'] || row['EP (Email Id)'] || row['email'] || row['Email'] || '').toString().trim().toLowerCase();
        const username = (row['Username(Email Id)'] || row['Username (Email Id)'] || row['username'] || '').toString().trim().toLowerCase();
        const contactNo = (row['Contact No.'] || row['Contact No'] || row['contact_no'] || row['Phone'] || '').toString().trim();
        const address = (row['Address'] || row['address'] || '').toString().trim();
        const campus = (row['Campus'] || row['campus'] || '').toString().trim();
        const startDateStr = (row['Start Date'] || row['start_date'] || '').toString().trim();
        const finishDateStr = (row['Finish Date'] || row['finish_date'] || '').toString().trim();
        const program = (row['Program'] || row['program'] || '').toString().trim();
        const campusStatus = (row['Campus Status'] || row['campus_status'] || '').toString().trim();
        const shift = (row['AM/PM'] || row['am/pm'] || row['Shift'] || '').toString().trim();
        const password = (row['Password'] || row['password'] || '').toString().trim();
        const admissionRep = (row['Admission Rep'] || row['admission_rep'] || '').toString().trim();

        // Split full name into first and last
        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Need at least a name and either email or username
        const effectiveEmail = email || username;
        if (!fullName || !effectiveEmail) {
          result.errors.push({ row: rowNum, message: `Missing required fields (Student Name and EP(Email Id) or Username)` });
          result.failed++;
          return null;
        }

        const passwordHash = await bcrypt.hash(password || 'TahaCollege2026!', 10);

        const startDate = startDateStr ? new Date(startDateStr) : null;
        const finishDate = finishDateStr ? new Date(finishDateStr) : null;

        return {
          rowNum,
          email: effectiveEmail,
          username: username || null,
          passwordHash,
          firstName,
          lastName,
          vNumber: vNumber || null,
          contactNo: contactNo || null,
          address: address || null,
          campus: campus || null,
          startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
          finishDate: finishDate && !isNaN(finishDate.getTime()) ? finishDate : null,
          program: program || null,
          campusStatus: campusStatus || null,
          shift: shift || null,
          admissionRep: admissionRep || null,
        };
      })
    );

    const valid = prepared.filter(Boolean) as NonNullable<(typeof prepared)[number]>[];

    for (const student of valid) {
      try {
        // Use upsert on email — duplicate emails just update the existing record
        const user = await prisma.user.upsert({
          where: { email: student.email },
          update: {
            firstName: student.firstName,
            lastName: student.lastName,
            passwordHash: student.passwordHash,
            username: student.username,
            vNumber: student.vNumber,
            contactNo: student.contactNo,
            address: student.address,
            campus: student.campus,
            startDate: student.startDate,
            finishDate: student.finishDate,
            program: student.program,
            campusStatus: student.campusStatus,
            shift: student.shift,
            admissionRep: student.admissionRep,
          },
          create: {
            email: student.email,
            username: student.username,
            passwordHash: student.passwordHash,
            firstName: student.firstName,
            lastName: student.lastName,
            role: 'STUDENT',
            vNumber: student.vNumber,
            contactNo: student.contactNo,
            address: student.address,
            campus: student.campus,
            startDate: student.startDate,
            finishDate: student.finishDate,
            program: student.program,
            campusStatus: student.campusStatus,
            shift: student.shift,
            admissionRep: student.admissionRep,
          },
        });

        result.success++;

        // Log progress every 500 students
        if (result.success % 500 === 0) {
          console.log(`Import progress: ${result.success} students imported...`);
        }
      } catch (err: any) {
        result.errors.push({ row: student.rowNum, message: err.message });
        result.failed++;
      }
    }
  }

  return result;
}

// ─── COURSE IMPORT ──────────────────────────────────────
// Expected columns: name, code, term, status, color, sub_account
export async function importCourses(
  buffer: Buffer,
  uploadedById: string,
  batchId: string
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const name = (row.name || row.Name || row['Course Name'] || '').toString().trim();
    const code = (row.code || row.Code || row['SIS ID'] || row.sis_id || '').toString().trim();
    const term = (row.term || row.Term || 'Default Term').toString().trim();
    const status = (row.status || row.Status || 'PUBLISHED').toString().trim().toUpperCase();
    const color = (row.color || row.Color || '#2D3B45').toString().trim();
    const subAccount = (row.sub_account || row.SubAccount || row['Sub Account'] || 'TAHA College').toString().trim();

    if (!name || !code) {
      result.errors.push({ row: rowNum, message: 'Missing required fields (name, code)' });
      result.failed++;
      continue;
    }

    try {
      const course = await prisma.course.upsert({
        where: { code },
        update: { name, term, status: status === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED', color, subAccount },
        create: { name, code, term, status: status === 'PUBLISHED' ? 'PUBLISHED' : 'UNPUBLISHED', color, subAccount },
      });

      await createAuditLog({
        tableName: 'courses',
        recordId: course.id,
        action: 'BACKDATE_IMPORT',
        newValues: { name, code, term, status },
        changedById: uploadedById,
        reason: `Import batch ${batchId}`,
      });

      result.success++;
    } catch (err: any) {
      result.errors.push({ row: rowNum, message: err.message });
      result.failed++;
    }
  }

  return result;
}

// ─── ASSIGNMENT IMPORT ──────────────────────────────────
// Expected columns: course_code, title, type, points, due_date
export async function importAssignments(
  buffer: Buffer,
  uploadedById: string,
  batchId: string
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const courseCode = (row.course_code || row.CourseCode || row['Course Code'] || '').toString().trim();
    const title = (row.title || row.Title || '').toString().trim();
    const type = (row.type || row.Type || 'ASSIGNMENT').toString().trim().toUpperCase();
    const points = parseFloat(row.points || row.Points || '0');
    const dueDateStr = (row.due_date || row.DueDate || row['Due Date'] || '').toString().trim();

    if (!courseCode || !title) {
      result.errors.push({ row: rowNum, message: 'Missing required fields (course_code, title)' });
      result.failed++;
      continue;
    }

    const course = await prisma.course.findUnique({ where: { code: courseCode } });
    if (!course) {
      result.errors.push({ row: rowNum, message: `Course not found: ${courseCode}` });
      result.failed++;
      continue;
    }

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    if (dueDateStr && isNaN(dueDate!.getTime())) {
      result.errors.push({ row: rowNum, message: `Invalid date: ${dueDateStr}` });
      result.failed++;
      continue;
    }

    try {
      const assignment = await prisma.assignment.create({
        data: {
          courseId: course.id,
          title,
          type: type === 'QUIZ' ? 'QUIZ' : 'ASSIGNMENT',
          points,
          dueDate,
        },
      });

      await createAuditLog({
        tableName: 'assignments',
        recordId: assignment.id,
        action: 'BACKDATE_IMPORT',
        newValues: { courseCode, title, type, points, dueDate: dueDateStr },
        changedById: uploadedById,
        reason: `Import batch ${batchId}`,
      });

      result.success++;
    } catch (err: any) {
      result.errors.push({ row: rowNum, message: err.message });
      result.failed++;
    }
  }

  return result;
}

// ─── ENROLLMENT IMPORT ──────────────────────────────────
// Expected columns: student_email, course_code, role (optional)
export async function importEnrollments(
  buffer: Buffer,
  uploadedById: string,
  batchId: string
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const email = (row.student_email || row.email || row.Email || '').toString().trim().toLowerCase();
    const courseCode = (row.course_code || row.CourseCode || row['Course Code'] || '').toString().trim();
    const role = (row.role || row.Role || 'STUDENT').toString().trim().toUpperCase();

    if (!email || !courseCode) {
      result.errors.push({ row: rowNum, message: 'Missing required fields (student_email, course_code)' });
      result.failed++;
      continue;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      result.errors.push({ row: rowNum, message: `User not found: ${email}` });
      result.failed++;
      continue;
    }

    const course = await prisma.course.findUnique({ where: { code: courseCode } });
    if (!course) {
      result.errors.push({ row: rowNum, message: `Course not found: ${courseCode}` });
      result.failed++;
      continue;
    }

    try {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        update: { role: role === 'TEACHER' ? 'TEACHER' : 'STUDENT' },
        create: {
          userId: user.id,
          courseId: course.id,
          role: role === 'TEACHER' ? 'TEACHER' : 'STUDENT',
        },
      });

      result.success++;
    } catch (err: any) {
      result.errors.push({ row: rowNum, message: err.message });
      result.failed++;
    }
  }

  return result;
}

// ─── GRADES / SUBMISSIONS IMPORT ────────────────────────
// Expected columns: student_email, course_code, assignment_title, score, status, date
export async function importGrades(
  buffer: Buffer,
  uploadedById: string,
  batchId: string
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });

  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const email = (row.student_email || row.email || row.Email || '').toString().trim().toLowerCase();
    const courseCode = (row.course_code || row.CourseCode || '').toString().trim();
    const assignmentTitle = (row.assignment_title || row.AssignmentTitle || row['Assignment'] || '').toString().trim();
    const score = row.score !== undefined && row.score !== '' ? parseFloat(row.score || row.Score) : null;
    const status = (row.status || row.Status || 'GRADED').toString().trim().toUpperCase();
    const dateStr = (row.date || row.Date || '').toString().trim();

    if (!email || !courseCode || !assignmentTitle) {
      result.errors.push({ row: rowNum, message: 'Missing required fields (student_email, course_code, assignment_title)' });
      result.failed++;
      continue;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      result.errors.push({ row: rowNum, message: `Student not found: ${email}` });
      result.failed++;
      continue;
    }

    const course = await prisma.course.findUnique({ where: { code: courseCode } });
    if (!course) {
      result.errors.push({ row: rowNum, message: `Course not found: ${courseCode}` });
      result.failed++;
      continue;
    }

    const assignment = await prisma.assignment.findFirst({
      where: { courseId: course.id, title: assignmentTitle },
    });
    if (!assignment) {
      result.errors.push({ row: rowNum, message: `Assignment not found: "${assignmentTitle}" in ${courseCode}` });
      result.failed++;
      continue;
    }

    const date = dateStr ? new Date(dateStr) : null;

    const validStatuses = ['MISSING', 'SUBMITTED', 'GRADED'];
    const normalizedStatus = validStatuses.includes(status) ? status : 'GRADED';

    try {
      const submission = await prisma.submission.upsert({
        where: {
          assignmentId_studentId: { assignmentId: assignment.id, studentId: user.id },
        },
        update: {
          score,
          status: normalizedStatus as any,
          date,
        },
        create: {
          assignmentId: assignment.id,
          studentId: user.id,
          score,
          status: normalizedStatus as any,
          date,
        },
      });

      await createAuditLog({
        tableName: 'submissions',
        recordId: submission.id,
        action: 'BACKDATE_IMPORT',
        newValues: { email, courseCode, assignmentTitle, score, status: normalizedStatus, date: dateStr },
        changedById: uploadedById,
        reason: `Import batch ${batchId}`,
      });

      result.success++;
    } catch (err: any) {
      result.errors.push({ row: rowNum, message: err.message });
      result.failed++;
    }
  }

  return result;
}
