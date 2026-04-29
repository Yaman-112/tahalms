import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db';
import { authenticate, requireRole, auditorScope, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';
import { upload, UPLOAD_DIR } from '../middleware/upload';
import { randomUUID } from 'crypto';
import { detectHtTrack, getHtFirstSessionDate } from '../utils/ht-schedule';
import { getCswFirstSessionDateForStudent } from '../utils/csw-schedule';
import { getAcFirstSessionDateForStudent } from '../utils/ac-schedule';
import { getMoaFirstSessionDateForStudent } from '../utils/moa-schedule';

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

    let assignments = await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
        _count: { select: { submissions: true, questions: true } },
        ...(role === 'STUDENT' ? {
          submissions: { where: { studentId: userId }, select: { id: true, status: true, score: true, submittedAt: true, isLate: true } },
        } : {}),
      },
    });

    // HT: hide assignments without an uploaded question bank (no questions attached).
    // FILE-format assignments don't use question banks, so they remain visible.
    assignments = assignments.filter(a =>
      a.course.code !== 'HT' || a.format === 'FILE' || a._count.questions > 0
    );

    // For teacher/admin: compute per-status counts in one grouped query
    const statusByAssignment = new Map<string, { GRADED: number; SUBMITTED: number; MISSING: number }>();
    if (role !== 'STUDENT' && assignments.length > 0) {
      const grouped = await prisma.submission.groupBy({
        by: ['assignmentId', 'status'],
        where: { assignmentId: { in: assignments.map(a => a.id) } },
        _count: { _all: true },
      });
      for (const g of grouped) {
        if (!statusByAssignment.has(g.assignmentId)) {
          statusByAssignment.set(g.assignmentId, { GRADED: 0, SUBMITTED: 0, MISSING: 0 });
        }
        statusByAssignment.get(g.assignmentId)![g.status as 'GRADED' | 'SUBMITTED' | 'MISSING'] = g._count._all;
      }
    }

    const sanitized = assignments.map(({ attachmentPath, ...rest }) => ({
      ...rest,
      hasAttachment: !!attachmentPath,
      submissionStats: statusByAssignment.get(rest.id) || { GRADED: 0, SUBMITTED: 0, MISSING: 0 },
    }));

    return success(res, sanitized);
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
        course: {
          select: {
            id: true, name: true, code: true, color: true,
            modules: { select: { id: true, name: true, position: true, startDate: true } },
          },
        },
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

    let visibleSubmissions: any[] = assignment.submissions;

    // Auditor scope: only include submissions from students in scope.
    const scope = auditorScope(req);
    if (scope !== null) {
      const inScope = await prisma.user.findMany({
        where: { vNumber: { in: scope }, role: 'STUDENT' },
        select: { id: true },
      });
      const inScopeIds = new Set(inScope.map(u => u.id));
      visibleSubmissions = visibleSubmissions.filter(s => inScopeIds.has(s.studentId));
    }
    if (
      req.user!.role !== 'STUDENT' &&
      assignment.course.modules.length > 0 &&
      visibleSubmissions.length > 0
    ) {
      const sortedModules = [...assignment.course.modules].sort((a, b) => b.name.length - a.name.length);
      const assignmentModule = sortedModules.find(m =>
        assignment.title === m.name ||
        assignment.title.startsWith(`${m.name} - `) ||
        assignment.title.includes(m.name)
      );

      if (assignmentModule) {
        const studentIds = visibleSubmissions.map(s => s.studentId);
        const enrollments = await prisma.enrollment.findMany({
          where: { courseId: assignment.courseId, userId: { in: studentIds }, role: 'STUDENT' },
          select: { userId: true, startDate: true, classDays: true },
        });
        type UserSched = { start: Date | null; classDays: string | null };
        const schedByUser = new Map<string, UserSched>();
        for (const e of enrollments) {
          const prev = schedByUser.get(e.userId);
          if (!prev) { schedByUser.set(e.userId, { start: e.startDate, classDays: e.classDays }); continue; }
          if (e.startDate && (!prev.start || e.startDate < prev.start)) {
            schedByUser.set(e.userId, { start: e.startDate, classDays: e.classDays });
          }
        }

        const courseCode = assignment.course.code;
        const fallbackModuleStart = assignmentModule.startDate;

        visibleSubmissions = visibleSubmissions
          // Rule B: assignment's module ran before the student's startDate → hide student.
          .filter(s => {
            const u = schedByUser.get(s.studentId);
            if (!u || !u.start) return true; // no startDate recorded → don't hide
            let moduleStart: Date | null = fallbackModuleStart ?? null;
            if (courseCode === 'HT') {
              moduleStart = getHtFirstSessionDate(assignmentModule.name, detectHtTrack(u.classDays)) ?? fallbackModuleStart;
            } else if (courseCode === 'CSW') {
              moduleStart = getCswFirstSessionDateForStudent(assignmentModule.name, u.start) ?? fallbackModuleStart;
            } else if (courseCode === 'AC') {
              moduleStart = getAcFirstSessionDateForStudent(assignmentModule.name, u.start) ?? fallbackModuleStart;
            } else if (courseCode === 'MOA') {
              moduleStart = getMoaFirstSessionDateForStudent(assignmentModule.name, u.start) ?? fallbackModuleStart;
            }
            if (!moduleStart) return true;
            return moduleStart >= u.start;
          })
          // Rule A: score = 0 → keep the student visible as GRADED, but blank out submission-log fields.
          .map(s => {
            if (s.score !== 0) return s;
            return {
              ...s,
              status: 'GRADED',
              submittedAt: null,
              isLate: false,
              filePath: null,
              fileName: null,
              comment: null,
            };
          });
      }
    }

    // Don't expose server file paths to client
    const { attachmentPath, ...rest } = assignment;
    const sanitized = {
      ...rest,
      hasAttachment: !!attachmentPath,
      submissions: visibleSubmissions.map((s: any) => {
        const { filePath, ...subRest } = s;
        return { ...subRest, hasFile: !!filePath };
      }),
    };

    return success(res, sanitized);
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

    // Save file to assignments subdirectory
    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    if (req.file) {
      attachmentPath = saveFile(req.file.buffer, 'assignments', req.file.originalname);
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
      if (existing.attachmentPath && fs.existsSync(existing.attachmentPath)) {
        fs.unlinkSync(existing.attachmentPath);
      }
      updates.attachmentPath = saveFile(req.file.buffer, 'assignments', req.file.originalname);
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
