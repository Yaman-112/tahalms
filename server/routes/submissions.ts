import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db';
import { authenticate, requireRole, auditorScope, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';
import { upload, UPLOAD_DIR } from '../middleware/upload';
import { randomUUID } from 'crypto';

function saveFile(buffer: Buffer, subDir: string, originalName: string): string {
  const dir = path.join(UPLOAD_DIR, subDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(dir, `${randomUUID()}-${safeName}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

const router = Router();
router.use(authenticate);

// GET /api/submissions?studentId=&courseId=&assignmentId=
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;
    const studentId = req.query.studentId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const assignmentId = req.query.assignmentId as string | undefined;

    let where: any = {};
    if (role === 'STUDENT') {
      where.studentId = userId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (assignmentId) where.assignmentId = assignmentId;
    if (courseId) where.assignment = { courseId };

    // Auditors only see submissions from students within their scope.
    const scope = auditorScope(req);
    if (scope !== null) {
      where.student = { role: 'STUDENT', vNumber: { in: scope } };
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        assignment: {
          include: { course: { select: { id: true, name: true, code: true } } },
        },
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        gradedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return success(res, submissions);
  } catch (err) {
    console.error('List submissions error:', err);
    return error(res, 'Failed to list submissions', 500);
  }
});

// POST /api/submissions — submit with file (student)
router.post('/', (req, res, next) => {
  // Only use multer for multipart requests; skip for JSON
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart')) {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
}, async (req: AuthRequest, res) => {
  try {
    const { assignmentId, comment } = req.body;
    const studentId = req.user!.userId;

    if (!assignmentId) return error(res, 'assignmentId is required');

    // Get assignment for validation
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return error(res, 'Assignment not found', 404);

    // Validate file if provided
    let filePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    if (req.file) {
      // Check file extension against allowed formats
      const ext = path.extname(req.file.originalname).toLowerCase().replace(/^\./, '');
      const allowed = assignment.allowedFormats.split(',').map(f => f.trim().toLowerCase().replace(/^\./, ''));
      if (!allowed.includes(ext)) {
        return error(res, `File type .${ext} not allowed. Accepted: ${assignment.allowedFormats}`);
      }

      // Check file size
      const maxBytes = assignment.maxFileSize * 1024 * 1024;
      if (req.file.size > maxBytes) {
        return error(res, `File too large. Max: ${assignment.maxFileSize}MB`);
      }

      // Save to submissions directory
      filePath = saveFile(req.file.buffer, `submissions/${assignmentId}/${studentId}`, req.file.originalname);
      fileName = req.file.originalname;
      fileSize = req.file.size;

      // Delete old file on resubmit
      const existing = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId } },
      });
      if (existing?.filePath && existing.filePath !== destPath && fs.existsSync(existing.filePath)) {
        fs.unlinkSync(existing.filePath);
      }
    }

    // Compute late status
    const now = new Date();
    const isLate = assignment.dueDate ? now > assignment.dueDate : false;

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: {
        status: 'SUBMITTED',
        date: now,
        submittedAt: now,
        isLate,
        comment: comment || null,
        ...(filePath ? { filePath, fileName, fileSize } : {}),
      },
      create: {
        assignmentId,
        studentId,
        status: 'SUBMITTED',
        date: now,
        submittedAt: now,
        isLate,
        comment: comment || null,
        filePath,
        fileName,
        fileSize,
      },
    });

    return success(res, submission, 201);
  } catch (err) {
    console.error('Create submission error:', err);
    return error(res, 'Failed to create submission', 500);
  }
});

// GET /api/submissions/:id/file — serve student's submitted file
router.get('/:id/file', async (req: AuthRequest, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { assignment: { select: { courseId: true } } },
    });

    if (!submission?.filePath) return error(res, 'No file found', 404);

    // Auth check: students can only see their own, teachers/admin can see all
    const { role, userId } = req.user!;
    if (role === 'STUDENT' && submission.studentId !== userId) {
      return error(res, 'Not authorized', 403);
    }

    if (!fs.existsSync(submission.filePath)) return error(res, 'File not found on disk', 404);

    res.setHeader('Content-Disposition', `inline; filename="${submission.fileName || 'submission'}"`);
    res.sendFile(path.resolve(submission.filePath));
  } catch (err) {
    console.error('Serve submission file error:', err);
    return error(res, 'Failed to serve file', 500);
  }
});

// DELETE /api/submissions/:id/file — remove own file (only if not graded)
router.delete('/:id/file', async (req: AuthRequest, res) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return error(res, 'Submission not found', 404);

    if (req.user!.role === 'STUDENT' && submission.studentId !== req.user!.userId) {
      return error(res, 'Not authorized', 403);
    }

    if (submission.status === 'GRADED') {
      return error(res, 'Cannot delete file from a graded submission');
    }

    if (submission.filePath && fs.existsSync(submission.filePath)) {
      fs.unlinkSync(submission.filePath);
    }

    await prisma.submission.update({
      where: { id: req.params.id },
      data: { filePath: null, fileName: null, fileSize: null, status: 'MISSING' },
    });

    return success(res, { message: 'File removed' });
  } catch (err) {
    console.error('Delete submission file error:', err);
    return error(res, 'Failed to delete file', 500);
  }
});

// PATCH /api/submissions/:id/grade — grade a submission (teacher/admin)
router.patch('/:id/grade', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { score, feedback } = req.body;
    const { id } = req.params;

    const existing = await prisma.submission.findUnique({ where: { id } });
    if (!existing) return error(res, 'Submission not found', 404);

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        score,
        feedback,
        status: 'GRADED',
        gradedById: req.user!.userId,
      },
    });

    await createAuditLog({
      tableName: 'submissions',
      recordId: id,
      action: 'UPDATE',
      oldValues: { score: existing.score, status: existing.status },
      newValues: { score, status: 'GRADED', feedback },
      changedById: req.user!.userId,
      reason: 'Grade submission',
      ipAddress: req.ip,
    });

    return success(res, submission);
  } catch (err) {
    console.error('Grade submission error:', err);
    return error(res, 'Failed to grade submission', 500);
  }
});

export default router;
