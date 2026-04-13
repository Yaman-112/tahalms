import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';
import { upload, UPLOAD_DIR } from '../middleware/upload';

const router = Router();
router.use(authenticate);

// GET /api/assignments?courseId= — list assignments
router.get('/', async (req: AuthRequest, res) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const { role, userId } = req.user!;

    let where: any = {};
    if (courseId) {
      where.courseId = courseId;
    } else if (role !== 'ADMIN') {
      where.course = { enrollments: { some: { userId } } };
    }

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
        _count: { select: { submissions: true } },
        ...(role === 'STUDENT' ? {
          submissions: { where: { studentId: userId }, select: { id: true, status: true, score: true, submittedAt: true, isLate: true } },
        } : {}),
      },
    });

    return success(res, assignments);
  } catch (err) {
    console.error('List assignments error:', err);
    return error(res, 'Failed to list assignments', 500);
  }
});

// GET /api/assignments/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
        submissions: req.user!.role !== 'STUDENT'
          ? {
              include: {
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            }
          : { where: { studentId: req.user!.userId } },
      },
    });

    if (!assignment) return error(res, 'Assignment not found', 404);
    return success(res, assignment);
  } catch (err) {
    console.error('Get assignment error:', err);
    return error(res, 'Failed to get assignment', 500);
  }
});

// GET /api/assignments/:id/attachment — serve teacher's PDF
router.get('/:id/attachment', async (req: AuthRequest, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment?.attachmentPath) return error(res, 'No attachment found', 404);

    const filePath = path.resolve(assignment.attachmentPath);
    if (!fs.existsSync(filePath)) return error(res, 'File not found on disk', 404);

    res.setHeader('Content-Disposition', `inline; filename="${assignment.attachmentName || 'attachment.pdf'}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Serve attachment error:', err);
    return error(res, 'Failed to serve attachment', 500);
  }
});

// POST /api/assignments — create with optional file (teacher/admin)
router.post('/', requireRole('ADMIN', 'TEACHER'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { courseId, title, description, type, points, dueDate, instructions, allowedFormats, maxFileSize } = req.body;

    if (!courseId || !title) {
      return error(res, 'courseId and title are required');
    }

    // Move file to assignments subdirectory
    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (req.file) {
      const destDir = path.join(UPLOAD_DIR, 'assignments');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, req.file.filename);
      fs.renameSync(req.file.path, destPath);
      attachmentPath = destPath;
      attachmentName = req.file.originalname;
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title,
        description: description || null,
        type: type?.toUpperCase() === 'QUIZ' ? 'QUIZ' : 'ASSIGNMENT',
        points: parseFloat(points) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        instructions: instructions || null,
        attachmentPath,
        attachmentName,
        allowedFormats: allowedFormats || 'pdf,doc,docx',
        maxFileSize: parseInt(maxFileSize) || 10,
      },
    });

    await createAuditLog({
      tableName: 'assignments',
      recordId: assignment.id,
      action: 'INSERT',
      newValues: { courseId, title, type, points, dueDate },
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, assignment, 201);
  } catch (err) {
    console.error('Create assignment error:', err);
    return error(res, 'Failed to create assignment', 500);
  }
});

// PATCH /api/assignments/:id — update with optional file replacement (teacher/admin)
router.patch('/:id', requireRole('ADMIN', 'TEACHER'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Assignment not found', 404);

    const updates: any = { ...req.body };
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
    if (updates.points) updates.points = parseFloat(updates.points);
    if (updates.maxFileSize) updates.maxFileSize = parseInt(updates.maxFileSize);
    if (updates.published !== undefined) updates.published = updates.published === 'true' || updates.published === true;

    // Handle file replacement
    if (req.file) {
      // Delete old file
      if (existing.attachmentPath && fs.existsSync(existing.attachmentPath)) {
        fs.unlinkSync(existing.attachmentPath);
      }
      const destDir = path.join(UPLOAD_DIR, 'assignments');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const destPath = path.join(destDir, req.file.filename);
      fs.renameSync(req.file.path, destPath);
      updates.attachmentPath = destPath;
      updates.attachmentName = req.file.originalname;
    }

    // Remove non-schema fields
    delete updates.file;
    delete updates.courseId;

    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: updates,
    });

    await createAuditLog({
      tableName: 'assignments',
      recordId: req.params.id,
      action: 'UPDATE',
      oldValues: existing,
      newValues: updates,
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, assignment);
  } catch (err) {
    console.error('Update assignment error:', err);
    return error(res, 'Failed to update assignment', 500);
  }
});

// DELETE /api/assignments/:id/attachment — remove attachment only
router.delete('/:id/attachment', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return error(res, 'Assignment not found', 404);

    if (assignment.attachmentPath && fs.existsSync(assignment.attachmentPath)) {
      fs.unlinkSync(assignment.attachmentPath);
    }

    await prisma.assignment.update({
      where: { id: req.params.id },
      data: { attachmentPath: null, attachmentName: null },
    });

    return success(res, { message: 'Attachment removed' });
  } catch (err) {
    console.error('Delete attachment error:', err);
    return error(res, 'Failed to delete attachment', 500);
  }
});

export default router;
