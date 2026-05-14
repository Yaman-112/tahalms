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
        targets: { select: { kind: true, targetId: true } },
        ...(role === 'STUDENT' ? {
          submissions: { where: { studentId: userId }, select: { id: true, status: true, score: true, submittedAt: true, isLate: true } },
        } : {}),
      },
    });

    // Targeted-visibility filter for students: if an assignment has any
    // AssignmentTarget rows it's no longer course-wide; only students who
    // match a BATCH or STUDENT target see it.
    if (role === 'STUDENT' && assignments.length > 0) {
      const targeted = assignments.filter(a => a.targets.length > 0);
      if (targeted.length > 0) {
        const enrolls = await prisma.enrollment.findMany({
          where: { userId, courseId: { in: [...new Set(targeted.map(a => a.courseId))] } },
          select: { batchCode: true },
        });
        const myBatches = new Set(enrolls.map(e => e.batchCode).filter(Boolean) as string[]);
        assignments = assignments.filter(a => {
          if (a.targets.length === 0) return true; // course-wide
          return a.targets.some(t =>
            (t.kind === 'BATCH' && t.targetId && myBatches.has(t.targetId)) ||
            (t.kind === 'STUDENT' && t.targetId === userId)
          );
        });
      }
    }

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

// POST /api/assignments/banks — create an empty question bank (an unpublished
// assignment that holds questions only; not assigned to students). Teachers
// can create banks for any course they teach a batch in.
router.post('/banks', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { courseId, moduleId, title, format } = req.body || {};
    if (!courseId || !title?.trim()) return error(res, 'courseId and title are required');

    if (req.user!.role === 'TEACHER') {
      const teaches = await prisma.batch.findFirst({
        where: { teacherId: req.user!.userId, courseId },
        select: { id: true },
      });
      if (!teaches) return error(res, 'Not authorized for this course', 403);
    }

    const fmt = ['FILE','MCQ','THEORY','MIXED'].includes((format || '').toUpperCase()) ? (format as string).toUpperCase() : 'MCQ';

    const bank = await prisma.assignment.create({
      data: {
        courseId,
        moduleId: moduleId || null,
        title: title.trim(),
        type: 'QUIZ',
        format: fmt as any,
        points: 0,
        published: false,
      },
      select: { id: true, title: true, courseId: true, moduleId: true, format: true, points: true },
    });
    return success(res, bank, 201);
  } catch (err) {
    console.error('Create bank error:', err);
    return error(res, 'Failed to create bank', 500);
  }
});

// GET /api/assignments/banks?courseId=xxx
// Registered BEFORE /:id so Express doesn't match "banks" as an id param.
router.get('/banks', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const where: any = { questions: { some: {} } };
    if (courseId) where.courseId = courseId;
    const banks = await prisma.assignment.findMany({
      where,
      orderBy: { title: 'asc' },
      select: {
        id: true, title: true, type: true, format: true, points: true,
        moduleId: true,
        module: { select: { id: true, name: true, position: true } },
        course: { select: { id: true, code: true, name: true } },
        _count: { select: { questions: true } },
      },
    });
    return success(res, banks);
  } catch (err) {
    console.error('List banks error:', err);
    return error(res, 'Failed to list question banks', 500);
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
        targets: { select: { kind: true, targetId: true } },
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

    // Targeted-visibility check for students: if assignment has targets,
    // student must be in batch list OR student list to load it.
    if (req.user!.role === 'STUDENT' && assignment.targets.length > 0) {
      const myEnrolls = await prisma.enrollment.findMany({
        where: { userId: req.user!.userId, courseId: assignment.courseId },
        select: { batchCode: true },
      });
      const myBatches = new Set(myEnrolls.map(e => e.batchCode).filter(Boolean) as string[]);
      const allowed = assignment.targets.some(t =>
        (t.kind === 'BATCH' && t.targetId && myBatches.has(t.targetId)) ||
        (t.kind === 'STUDENT' && t.targetId === req.user!.userId)
      );
      if (!allowed) return error(res, 'Assignment not found', 404);
    }

    let visibleSubmissions: any[] = assignment.submissions;

    // For non-student viewers, if assignment is targeted, hide submissions
    // from anyone outside the target audience.
    if (req.user!.role !== 'STUDENT' && assignment.targets.length > 0 && visibleSubmissions.length > 0) {
      const batchTargets = assignment.targets.filter(t => t.kind === 'BATCH').map(t => t.targetId);
      const studentTargets = new Set(assignment.targets.filter(t => t.kind === 'STUDENT').map(t => t.targetId));
      let batchStudentIds = new Set<string>();
      if (batchTargets.length > 0) {
        const inBatch = await prisma.enrollment.findMany({
          where: { batchCode: { in: batchTargets }, courseId: assignment.courseId, role: 'STUDENT' },
          select: { userId: true },
        });
        batchStudentIds = new Set(inBatch.map(e => e.userId));
      }
      visibleSubmissions = visibleSubmissions.filter(s =>
        studentTargets.has(s.studentId) || batchStudentIds.has(s.studentId)
      );
    }

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
    const { courseId, moduleId, assessmentKind, title, description, type, points, dueDate, instructions, allowedFormats, maxFileSize } = req.body;

    if (!courseId || !title) {
      return error(res, 'courseId and title are required');
    }

    // Per-module / per-kind point cap enforcement.
    // If the module has any budget rows, the caller MUST specify a moduleId AND
    // an assessmentKind, and the requested points must fit in the remaining budget.
    const kindUpper = (assessmentKind || '').toString().toUpperCase();
    const validKind = ['FINAL', 'PARTICIPATION', 'ASSIGNMENT', 'QUIZ'].includes(kindUpper) ? kindUpper : null;
    const ptsNum = parseFloat(points) || 0;
    if (moduleId) {
      const budgetCount = await prisma.moduleAssessmentBudget.count({ where: { moduleId } });
      if (budgetCount > 0) {
        if (!validKind) {
          return error(res, 'assessmentKind is required for this module (FINAL, PARTICIPATION, ASSIGNMENT, or QUIZ)');
        }
        const budget = await prisma.moduleAssessmentBudget.findUnique({
          where: { moduleId_kind: { moduleId, kind: validKind as any } },
        });
        if (!budget) {
          return error(res, `Module does not allow assessment kind "${validKind}"`);
        }
        const used = await prisma.assignment.aggregate({
          where: { moduleId, assessmentKind: validKind as any },
          _sum: { points: true },
        });
        const usedPts = used._sum.points || 0;
        const remaining = budget.maxPoints - usedPts;
        if (ptsNum > remaining + 0.001) {
          return error(res, `Points (${ptsNum}) exceed remaining budget for ${validKind} (${remaining} of ${budget.maxPoints} left)`);
        }
      }
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
        moduleId: moduleId || null,
        assessmentKind: validKind as any,
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

    // Optional targets: req.body.targetBatches and req.body.targetStudents may
    // be JSON-stringified arrays (multipart) or arrays (json). Empty/absent
    // means course-wide visibility.
    const parseList = (v: any): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(Boolean);
      try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(Boolean) : []; } catch { return []; }
    };
    let targetBatches = parseList(req.body.targetBatches);
    const targetStudents = parseList(req.body.targetStudents);

    if (req.user!.role === 'TEACHER' && targetBatches.length > 0) {
      const owned = await prisma.batch.findMany({
        where: { courseId, teacherId: req.user!.userId, batchCode: { in: targetBatches } },
        select: { batchCode: true },
      });
      const ownedSet = new Set(owned.map(b => b.batchCode));
      const rejected = targetBatches.filter(b => !ownedSet.has(b));
      if (rejected.length > 0) {
        return error(res, `Not allowed to target batches: ${rejected.join(', ')}`, 403);
      }
      targetBatches = [...ownedSet];
    }

    if (targetBatches.length > 0 || targetStudents.length > 0) {
      await prisma.assignmentTarget.createMany({
        data: [
          ...targetBatches.map((b: string) => ({ assignmentId: assignment.id, kind: 'BATCH' as const, targetId: b })),
          ...targetStudents.map((u: string) => ({ assignmentId: assignment.id, kind: 'STUDENT' as const, targetId: u })),
        ],
        skipDuplicates: true,
      });
    }

    await createAuditLog({
      tableName: 'assignments',
      recordId: assignment.id,
      action: 'INSERT',
      newValues: { courseId, title, type, points, dueDate, targetBatches, targetStudents },
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

// GET /api/assignments/:id/questions — full question + option list, for the
// "pick questions from this bank" UI.
router.get('/:id/questions', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { assignmentId: req.params.id },
      orderBy: { position: 'asc' },
      include: { options: { orderBy: { position: 'asc' } } },
    });
    return success(res, questions);
  } catch (err) {
    console.error('List bank questions error:', err);
    return error(res, 'Failed to list questions', 500);
  }
});

// POST /api/assignments/from-bank
// Creates a new assignment by copying selected questions out of an existing
// "bank" assignment (sourceAssignmentId), into a new course-targeted or
// batch-/student-targeted assignment.
router.post('/from-bank', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const {
      sourceAssignmentId, questionIds, courseId, moduleId, assessmentKind, title, description, type, format,
      points, dueDate, instructions, timeLimit, shuffleQuestions, showResults,
      negativeMarking, targetBatches, targetStudents,
    } = req.body;

    if (!sourceAssignmentId || !Array.isArray(questionIds) || questionIds.length === 0) {
      return error(res, 'sourceAssignmentId and a non-empty questionIds[] are required');
    }
    if (!courseId || !title) return error(res, 'courseId and title are required');

    const source = await prisma.assignment.findUnique({
      where: { id: sourceAssignmentId },
      include: { questions: { include: { options: true } } },
    });
    if (!source) return error(res, 'Source assignment not found', 404);
    if (source.courseId !== courseId) {
      return error(res, 'Source assignment must belong to the same course');
    }

    const chosenSet = new Set<string>(questionIds);
    const chosen = source.questions.filter(q => chosenSet.has(q.id));
    if (chosen.length === 0) return error(res, 'No matching questions in the source assignment');

    const totalPoints = typeof points === 'number'
      ? points
      : chosen.reduce((s, q) => s + (q.points || 0), 0);

    // Per-module / per-kind point cap enforcement (same as POST /).
    const kindUpper = (assessmentKind || '').toString().toUpperCase();
    const validKind = ['FINAL', 'PARTICIPATION', 'ASSIGNMENT', 'QUIZ'].includes(kindUpper) ? kindUpper : null;
    if (moduleId) {
      const budgetCount = await prisma.moduleAssessmentBudget.count({ where: { moduleId } });
      if (budgetCount > 0) {
        if (!validKind) return error(res, 'assessmentKind is required for this module');
        const budget = await prisma.moduleAssessmentBudget.findUnique({
          where: { moduleId_kind: { moduleId, kind: validKind as any } },
        });
        if (!budget) return error(res, `Module does not allow assessment kind "${validKind}"`);
        const used = await prisma.assignment.aggregate({
          where: { moduleId, assessmentKind: validKind as any },
          _sum: { points: true },
        });
        const usedPts = used._sum.points || 0;
        const remaining = budget.maxPoints - usedPts;
        if (totalPoints > remaining + 0.001) {
          return error(res, `Points (${totalPoints}) exceed remaining budget for ${validKind} (${remaining} of ${budget.maxPoints} left)`);
        }
      }
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        courseId,
        moduleId: moduleId || null,
        assessmentKind: validKind as any,
        title,
        description: description || null,
        type: type?.toUpperCase() === 'QUIZ' ? 'QUIZ' : 'ASSIGNMENT',
        format: format && ['FILE','MCQ','THEORY','MIXED'].includes(format.toUpperCase())
          ? format.toUpperCase() as any
          : 'MCQ',
        points: totalPoints,
        dueDate: dueDate ? new Date(dueDate) : null,
        instructions: instructions || null,
        timeLimit: typeof timeLimit === 'number' ? timeLimit : null,
        shuffleQuestions: !!shuffleQuestions,
        showResults: showResults !== undefined ? !!showResults : true,
        negativeMarking: typeof negativeMarking === 'number' ? negativeMarking : 0,
      },
    });

    // Copy questions and their options
    for (let i = 0; i < chosen.length; i++) {
      const q = chosen[i];
      const newQ = await prisma.question.create({
        data: {
          assignmentId: newAssignment.id,
          type: q.type,
          text: q.text,
          points: q.points,
          position: i,
          required: q.required,
          explanation: q.explanation,
          wordLimit: q.wordLimit,
        },
      });
      if (q.options.length > 0) {
        await prisma.questionOption.createMany({
          data: q.options.map(o => ({
            questionId: newQ.id,
            text: o.text,
            isCorrect: o.isCorrect,
            position: o.position,
          })),
        });
      }
    }

    // Targets
    const batches = Array.isArray(targetBatches) ? targetBatches.filter(Boolean) : [];
    const students = Array.isArray(targetStudents) ? targetStudents.filter(Boolean) : [];
    if (batches.length > 0 || students.length > 0) {
      await prisma.assignmentTarget.createMany({
        data: [
          ...batches.map((b: string) => ({ assignmentId: newAssignment.id, kind: 'BATCH' as const, targetId: b })),
          ...students.map((u: string) => ({ assignmentId: newAssignment.id, kind: 'STUDENT' as const, targetId: u })),
        ],
        skipDuplicates: true,
      });
    }

    await createAuditLog({
      tableName: 'assignments',
      recordId: newAssignment.id,
      action: 'INSERT',
      newValues: { courseId, title, sourceAssignmentId, questionCount: chosen.length, targetBatches: batches, targetStudents: students },
      changedById: req.user!.userId,
      ipAddress: req.ip,
    });

    return success(res, { ...newAssignment, questionCount: chosen.length }, 201);
  } catch (err) {
    console.error('from-bank error:', err);
    return error(res, 'Failed to create assignment from bank', 500);
  }
});

// GET /api/assignments/:id/targets — list current targets (teacher/admin)
router.get('/:id/targets', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const targets = await prisma.assignmentTarget.findMany({
      where: { assignmentId: req.params.id },
      orderBy: [{ kind: 'asc' }, { targetId: 'asc' }],
    });
    return success(res, targets);
  } catch (err) {
    console.error('List targets error:', err);
    return error(res, 'Failed to list targets', 500);
  }
});

// PUT /api/assignments/:id/targets — replace the target set (teacher/admin)
router.put('/:id/targets', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { targetBatches, targetStudents } = req.body;
    const batches = Array.isArray(targetBatches) ? targetBatches.filter(Boolean) : [];
    const students = Array.isArray(targetStudents) ? targetStudents.filter(Boolean) : [];

    await prisma.assignmentTarget.deleteMany({ where: { assignmentId: req.params.id } });
    if (batches.length > 0 || students.length > 0) {
      await prisma.assignmentTarget.createMany({
        data: [
          ...batches.map((b: string) => ({ assignmentId: req.params.id, kind: 'BATCH' as const, targetId: b })),
          ...students.map((u: string) => ({ assignmentId: req.params.id, kind: 'STUDENT' as const, targetId: u })),
        ],
        skipDuplicates: true,
      });
    }
    return success(res, { message: 'Targets updated', batches: batches.length, students: students.length });
  } catch (err) {
    console.error('Update targets error:', err);
    return error(res, 'Failed to update targets', 500);
  }
});

export default router;
