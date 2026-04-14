import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';
import {
  generateBatchCode,
  getJoinModulePosition,
  initializeStudentProgress,
  recalculateStudentProgress,
  recalculateBatchProgress,
  getCohortProgress,
  getBatchStatus,
  findOrCreateMidCourseBatch,
} from '../services/progress';

const router = Router();
router.use(authenticate);

// ─── SMART ENROLLMENT ───────────────────────────────────

// POST /api/progress/enroll — smart enrollment
// Body: { userId, batchCode, autoSubBatch?: boolean }
// When autoSubBatch is true, mid-course students are auto-assigned to a sub-batch
router.post('/enroll', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { userId, batchCode, autoSubBatch } = req.body;

    if (!userId || !batchCode) {
      return error(res, 'userId and batchCode are required');
    }

    // Find batch
    const batch = await prisma.batch.findUnique({
      where: { batchCode },
      include: { course: true },
    });
    if (!batch) return error(res, `Batch not found: ${batchCode}`, 404);

    let targetBatchId = batch.id;
    let targetBatchCode = batchCode;
    let position: number;
    let moduleId: string | null;
    let isMidCourse = false;
    let parentBatchCode: string | null = null;

    if (autoSubBatch) {
      // Auto-assign sub-batch for mid-course students
      const result = await findOrCreateMidCourseBatch(batch.id);
      targetBatchId = result.batch.id;
      targetBatchCode = result.batch.batchCode;
      position = result.joinPosition;
      moduleId = result.moduleId;
      isMidCourse = result.isMidCourse;
      parentBatchCode = isMidCourse ? batchCode : null;
    } else {
      // Direct enrollment into specified batch
      const joinInfo = await getJoinModulePosition(batch.id);
      position = joinInfo.position;
      moduleId = joinInfo.moduleId;
      isMidCourse = position > 1;
    }

    // Create/update enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId_batchCode: { userId, courseId: batch.courseId, batchCode: targetBatchCode } },
      update: {
        joinedModulePosition: position,
        currentModuleId: moduleId,
      },
      create: {
        userId,
        courseId: batch.courseId,
        role: 'STUDENT',
        batchCode: targetBatchCode,
        joinedModulePosition: position,
        currentModuleId: moduleId,
      },
    });

    // Initialize progress records
    await initializeStudentProgress(enrollment.id, targetBatchId, batch.courseId, position);

    return success(res, {
      enrollmentId: enrollment.id,
      batchCode: targetBatchCode,
      parentBatchCode,
      joinedModulePosition: position,
      currentModuleId: moduleId,
      isMidCourseJoin: isMidCourse,
    }, 201);
  } catch (err: any) {
    console.error('Smart enroll error:', err);
    return error(res, 'Enrollment failed', 500);
  }
});

// ─── AUTO CREATE BATCH (new instructor) ─────────────────

// POST /api/progress/create-batch — create batch with auto-generated ID
router.post('/create-batch', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { courseId, teacherId, courseCodePrefix, startDate, durationWeeks, campus, classTime, classDays, maxStudents } = req.body;

    if (!courseId || !teacherId) {
      return error(res, 'courseId and teacherId are required');
    }

    // Get teacher info for batch code generation
    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) return error(res, 'Teacher not found', 404);

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return error(res, 'Course not found', 404);

    const prefix = courseCodePrefix || course.code;
    const batchCode = await generateBatchCode(prefix, teacher.firstName, teacher.lastName);

    const start = startDate ? new Date(startDate) : null;
    const weeks = durationWeeks || null;
    const end = start && weeks ? new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000) : null;

    const batch = await prisma.batch.create({
      data: {
        batchCode,
        courseId,
        teacherId,
        courseCode: prefix,
        startDate: start,
        endDate: end,
        durationWeeks: weeks,
        status: start ? getBatchStatus(start, end) : 'UPCOMING',
        campus: campus || null,
        classTime: classTime || null,
        classDays: classDays || null,
        maxStudents: maxStudents || null,
      },
      include: {
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return success(res, batch, 201);
  } catch (err: any) {
    console.error('Create batch error:', err);
    return error(res, 'Failed to create batch', 500);
  }
});

// ─── ASSIGN INSTRUCTOR (idempotent batch creation) ──────

// POST /api/progress/assign-instructor — assign instructor to course, auto-creates batch if needed
router.post('/assign-instructor', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { courseId, teacherId, startDate, durationWeeks, campus, classTime, classDays, maxStudents } = req.body;

    if (!courseId || !teacherId) {
      return error(res, 'courseId and teacherId are required');
    }

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) return error(res, 'Teacher not found', 404);

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return error(res, 'Course not found', 404);

    // Check if a PRIMARY batch already exists for this course + teacher
    const existing = await prisma.batch.findFirst({
      where: { courseId, teacherId, batchType: 'PRIMARY' },
      include: {
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (existing) {
      return success(res, { ...existing, alreadyExisted: true });
    }

    // Generate batch code and create
    const batchCode = await generateBatchCode(course.code, teacher.firstName, teacher.lastName);

    const start = startDate ? new Date(startDate) : null;
    const weeks = durationWeeks || null;
    const end = start && weeks ? new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000) : null;

    const batch = await prisma.batch.create({
      data: {
        batchCode,
        courseId,
        teacherId,
        courseCode: course.code,
        startDate: start,
        endDate: end,
        durationWeeks: weeks,
        status: start ? getBatchStatus(start, end) : 'UPCOMING',
        campus: campus || null,
        classTime: classTime || null,
        classDays: classDays || null,
        maxStudents: maxStudents || null,
        batchType: 'PRIMARY',
      },
      include: {
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return success(res, { ...batch, alreadyExisted: false }, 201);
  } catch (err: any) {
    console.error('Assign instructor error:', err);
    return error(res, 'Failed to assign instructor', 500);
  }
});

// ─── UPDATE BATCH ───────────────────────────────────────

// PATCH /api/progress/batch/:batchCode — update batch details
router.patch('/batch/:batchCode', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { batchCode } = req.params;
    const { startDate, durationWeeks, campus, classTime, classDays, maxStudents, teacherId } = req.body;

    const existing = await prisma.batch.findUnique({ where: { batchCode } });
    if (!existing) return error(res, 'Batch not found', 404);

    const updates: any = {};
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (durationWeeks !== undefined) updates.durationWeeks = durationWeeks;
    if (campus !== undefined) updates.campus = campus;
    if (classTime !== undefined) updates.classTime = classTime;
    if (classDays !== undefined) updates.classDays = classDays;
    if (maxStudents !== undefined) updates.maxStudents = maxStudents;
    if (teacherId !== undefined) updates.teacherId = teacherId;

    // Recalculate end date and status
    const start = updates.startDate || existing.startDate;
    const weeks = updates.durationWeeks || existing.durationWeeks;
    if (start && weeks) {
      updates.endDate = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
      updates.status = getBatchStatus(start, updates.endDate);
    }

    const batch = await prisma.batch.update({
      where: { batchCode },
      data: updates,
      include: {
        course: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return success(res, batch);
  } catch (err: any) {
    console.error('Update batch error:', err);
    return error(res, 'Failed to update batch', 500);
  }
});

// ─── PROGRESS ENDPOINTS ─────────────────────────────────

// GET /api/progress/batch/:batchCode — cohort progress report
router.get('/batch/:batchCode', async (req: AuthRequest, res) => {
  try {
    const batch = await prisma.batch.findUnique({ where: { batchCode: req.params.batchCode } });
    if (!batch) return error(res, 'Batch not found', 404);

    const cohort = await getCohortProgress(batch.id);
    if (!cohort) return error(res, 'Failed to get cohort progress', 500);

    return success(res, cohort);
  } catch (err: any) {
    console.error('Cohort progress error:', err);
    return error(res, 'Failed to get progress', 500);
  }
});

// GET /api/progress/student/:userId — all courses progress for a student
router.get('/student/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Students can only see their own progress
    if (req.user!.role === 'STUDENT' && req.user!.userId !== userId) {
      return error(res, 'Access denied', 403);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, name: true, code: true, color: true, modules: { orderBy: { position: 'asc' } } },
        },
        studentProgress: {
          orderBy: { moduleId: 'asc' },
        },
      },
    });

    const result = enrollments.map(e => {
      const joinPos = e.joinedModulePosition || 1;
      const modules = e.course.modules.map(mod => {
        const progress = e.studentProgress.find(p => p.moduleId === mod.id);
        return {
          moduleId: mod.id,
          name: mod.name,
          position: mod.position,
          weight: mod.weight,
          hours: mod.hours,
          status: progress?.status || (mod.position < joinPos ? 'SKIPPED' : 'NOT_STARTED'),
          score: progress?.moduleScore,
          startedAt: progress?.startedAt,
          completedAt: progress?.completedAt,
        };
      });

      return {
        enrollmentId: e.id,
        batchCode: e.batchCode,
        course: { id: e.course.id, name: e.course.name, code: e.course.code, color: e.course.color },
        joinedModulePosition: joinPos,
        overallProgress: e.overallProgress || 0,
        overallGrade: e.overallGrade || 0,
        modules,
      };
    });

    return success(res, result);
  } catch (err: any) {
    console.error('Student progress error:', err);
    return error(res, 'Failed to get student progress', 500);
  }
});

// POST /api/progress/recalculate/:batchCode — recalculate all progress for a batch
router.post('/recalculate/:batchCode', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const updated = await recalculateBatchProgress(req.params.batchCode);
    return success(res, { updated, batchCode: req.params.batchCode });
  } catch (err: any) {
    console.error('Recalculate error:', err);
    return error(res, 'Failed to recalculate', 500);
  }
});

// GET /api/progress/overview — admin overview of all student progress
router.get('/overview', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const now = new Date();

    // Get all courses with modules (ordered by date)
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        modules: { orderBy: { startDate: 'asc' } },
        _count: { select: { enrollments: true, assignments: true } },
      },
    });

    // Get all enrollments with student info
    const enrollments = await prisma.enrollment.findMany({
      where: { role: 'STUDENT' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, vNumber: true, campus: true, program: true } },
        course: { select: { id: true, name: true, code: true, color: true } },
      },
    });

    // Get submission counts per student per course
    const submissions = await prisma.submission.groupBy({
      by: ['studentId', 'assignmentId'],
      where: { status: { in: ['SUBMITTED', 'GRADED'] } },
    });

    // Get assignments per course
    const assignments = await prisma.assignment.findMany({
      select: { id: true, courseId: true },
    });
    const assignmentsByCourse = new Map<string, string[]>();
    for (const a of assignments) {
      if (!assignmentsByCourse.has(a.courseId)) assignmentsByCourse.set(a.courseId, []);
      assignmentsByCourse.get(a.courseId)!.push(a.id);
    }

    // Build submission lookup: studentId -> Set of assignmentIds submitted
    const submissionLookup = new Map<string, Set<string>>();
    for (const s of submissions) {
      if (!submissionLookup.has(s.studentId)) submissionLookup.set(s.studentId, new Set());
      submissionLookup.get(s.studentId)!.add(s.assignmentId);
    }

    // Compute per-course progress summary
    const courseProgress = courses.map(course => {
      const totalModules = course.modules.length;
      const completedModules = course.modules.filter(m => m.startDate && new Date(m.startDate) < now).length;
      const currentModule = course.modules.find(m => {
        if (!m.startDate) return false;
        const mStart = new Date(m.startDate);
        const idx = course.modules.indexOf(m);
        const nextMod = course.modules[idx + 1];
        const mEnd = nextMod?.startDate ? new Date(nextMod.startDate) : new Date(mStart.getTime() + 14 * 86400000);
        return now >= mStart && now < mEnd;
      });

      const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
      const courseAssignmentIds = assignmentsByCourse.get(course.id) || [];
      const totalAssignments = courseAssignmentIds.length;

      const students = courseEnrollments.map(e => {
        const studentSubs = submissionLookup.get(e.userId) || new Set();
        const completedAssignments = courseAssignmentIds.filter(aid => studentSubs.has(aid)).length;
        const progressPct = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

        return {
          id: e.userId,
          firstName: e.user.firstName,
          lastName: e.user.lastName,
          email: e.user.email,
          vNumber: e.user.vNumber,
          campus: e.user.campus,
          batchCode: e.batchCode,
          enrolledAt: e.enrolledAt,
          startDate: e.startDate,
          completedAssignments,
          totalAssignments,
          progressPct,
        };
      });

      return {
        id: course.id,
        name: course.name,
        code: course.code,
        color: course.color,
        totalModules,
        completedModules,
        currentModule: currentModule?.name || null,
        progressPct: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        totalStudents: courseEnrollments.length,
        totalAssignments,
        students,
      };
    });

    return success(res, {
      totalStudents: enrollments.length,
      totalCourses: courses.length,
      courseProgress,
    });
  } catch (err: any) {
    console.error('Progress overview error:', err);
    return error(res, 'Failed to get progress overview', 500);
  }
});

export default router;
