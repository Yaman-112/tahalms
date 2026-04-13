import prisma from '../db';

/**
 * Calculate which module position is currently active for a batch
 * based on startDate and durationWeeks
 */
export function getCurrentModulePosition(
  batchStartDate: Date,
  durationWeeks: number,
  totalModules: number
): number {
  const now = new Date();
  if (now < batchStartDate) return 0; // not started yet

  const msElapsed = now.getTime() - batchStartDate.getTime();
  const weeksElapsed = msElapsed / (7 * 24 * 60 * 60 * 1000);
  const weeksPerModule = durationWeeks / totalModules;
  const currentPos = Math.floor(weeksElapsed / weeksPerModule) + 1;

  return Math.min(currentPos, totalModules);
}

/**
 * Determine batch status based on dates
 */
export function getBatchStatus(startDate: Date | null, endDate: Date | null): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' {
  if (!startDate) return 'UPCOMING';
  const now = new Date();
  if (now < startDate) return 'UPCOMING';
  if (endDate && now > endDate) return 'COMPLETED';
  return 'ACTIVE';
}

/**
 * Auto-generate a batch code when a new instructor is added
 * Format: {CoursePrefix}-{InstructorInitials}-{Sequence}
 */
export async function generateBatchCode(
  courseCodePrefix: string,
  teacherFirstName: string,
  teacherLastName: string
): Promise<string> {
  // Build initials: first 3 chars of last name (or first name if no last name)
  const name = teacherLastName && teacherLastName !== teacherFirstName
    ? teacherLastName : teacherFirstName;
  const initials = name.substring(0, 3).toUpperCase();
  const prefix = `${courseCodePrefix}-${initials}`;

  // Find existing batches with this prefix to determine sequence
  const existing = await prisma.batch.findMany({
    where: { batchCode: { startsWith: prefix } },
    select: { batchCode: true },
    orderBy: { batchCode: 'desc' },
  });

  let seq = 1;
  if (existing.length > 0) {
    // Extract the highest sequence number
    for (const b of existing) {
      const match = b.batchCode.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= seq) seq = num + 1;
      }
    }
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * Generate a mid-course sub-batch code: {parentBatchCode}-{Mon}-{001}
 */
export async function generateMidCourseBatchCode(parentBatchCode: string): Promise<string> {
  const monthAbbr = new Date().toLocaleString('en-US', { month: 'short' }); // Jan, Feb, ...
  const prefix = `${parentBatchCode}-${monthAbbr}`;

  const existing = await prisma.batch.findMany({
    where: { batchCode: { startsWith: prefix } },
    select: { batchCode: true },
    orderBy: { batchCode: 'desc' },
  });

  let seq = 1;
  for (const b of existing) {
    const match = b.batchCode.match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= seq) seq = num + 1;
    }
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * Find or create a mid-course sub-batch for enrollment.
 * - If course not started → returns parent batch (pre-start enrollment)
 * - If mid-course → finds/creates a MID_COURSE sub-batch
 */
export async function findOrCreateMidCourseBatch(parentBatchId: string): Promise<{
  batch: { id: string; batchCode: string; courseId: string };
  joinPosition: number;
  moduleId: string | null;
  isMidCourse: boolean;
}> {
  const parentBatch = await prisma.batch.findUnique({
    where: { id: parentBatchId },
    include: {
      course: { include: { modules: { orderBy: { position: 'asc' } } } },
      teacher: true,
    },
  });

  if (!parentBatch) throw new Error('Batch not found');

  // Determine join position
  const { position, moduleId } = await getJoinModulePosition(parentBatchId);

  // Pre-start: student joins the parent batch directly
  if (position <= 1) {
    return {
      batch: { id: parentBatch.id, batchCode: parentBatch.batchCode, courseId: parentBatch.courseId },
      joinPosition: position,
      moduleId,
      isMidCourse: false,
    };
  }

  // Mid-course: look for an existing sub-batch for this month with capacity
  const monthAbbr = new Date().toLocaleString('en-US', { month: 'short' });
  const subBatchPrefix = `${parentBatch.batchCode}-${monthAbbr}`;

  const existingSubBatch = await prisma.batch.findFirst({
    where: {
      parentBatchCode: parentBatch.batchCode,
      batchType: 'MID_COURSE',
      batchCode: { startsWith: subBatchPrefix },
    },
    include: { _count: { select: { studentProgress: true } } },
  });

  // Reuse existing sub-batch if it has capacity (or no limit set)
  if (existingSubBatch) {
    const maxStudents = existingSubBatch.maxStudents || 999;
    const enrolled = await prisma.enrollment.count({ where: { batchCode: existingSubBatch.batchCode } });
    if (enrolled < maxStudents) {
      return {
        batch: { id: existingSubBatch.id, batchCode: existingSubBatch.batchCode, courseId: existingSubBatch.courseId },
        joinPosition: position,
        moduleId,
        isMidCourse: true,
      };
    }
  }

  // Create new sub-batch
  const newCode = await generateMidCourseBatchCode(parentBatch.batchCode);
  const newBatch = await prisma.batch.create({
    data: {
      batchCode: newCode,
      courseId: parentBatch.courseId,
      teacherId: parentBatch.teacherId,
      courseCode: parentBatch.courseCode,
      startDate: new Date(),
      endDate: parentBatch.endDate,
      durationWeeks: parentBatch.durationWeeks,
      status: 'ACTIVE',
      campus: parentBatch.campus,
      classTime: parentBatch.classTime,
      classDays: parentBatch.classDays,
      maxStudents: parentBatch.maxStudents,
      batchType: 'MID_COURSE',
      parentBatchCode: parentBatch.batchCode,
    },
  });

  return {
    batch: { id: newBatch.id, batchCode: newBatch.batchCode, courseId: newBatch.courseId },
    joinPosition: position,
    moduleId,
    isMidCourse: true,
  };
}

/**
 * Smart enrollment: determine which module a student should start from
 */
export async function getJoinModulePosition(
  batchId: string
): Promise<{ position: number; moduleId: string | null }> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      course: {
        include: { modules: { orderBy: { position: 'asc' } } },
      },
    },
  });

  if (!batch || !batch.course.modules.length) {
    return { position: 1, moduleId: null };
  }

  const modules = batch.course.modules;

  // If batch hasn't started or no start date, join from module 1
  if (!batch.startDate || new Date() < batch.startDate) {
    return { position: 1, moduleId: modules[0].id };
  }

  const totalModules = modules.length;
  const durationWeeks = batch.durationWeeks || 52;
  const currentPos = getCurrentModulePosition(batch.startDate, durationWeeks, totalModules);
  const moduleIdx = Math.min(currentPos - 1, modules.length - 1);

  return {
    position: Math.max(1, currentPos),
    moduleId: modules[moduleIdx]?.id || null,
  };
}

/**
 * Initialize StudentProgress records for a new enrollment
 */
export async function initializeStudentProgress(
  enrollmentId: string,
  batchId: string,
  courseId: string,
  joinedModulePosition: number
): Promise<void> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
  });

  const progressData = modules.map(mod => ({
    enrollmentId,
    batchId,
    moduleId: mod.id,
    status: mod.position < joinedModulePosition
      ? 'NOT_STARTED' as const  // modules before join point — student missed these
      : mod.position === joinedModulePosition
        ? 'IN_PROGRESS' as const
        : 'NOT_STARTED' as const,
    startedAt: mod.position === joinedModulePosition ? new Date() : null,
  }));

  // Use createMany, skip duplicates
  for (const p of progressData) {
    await prisma.studentProgress.upsert({
      where: { enrollmentId_moduleId: { enrollmentId: p.enrollmentId, moduleId: p.moduleId } },
      update: {},
      create: p,
    });
  }
}

/**
 * Recalculate a student's overall progress and grade
 */
export async function recalculateStudentProgress(enrollmentId: string): Promise<{
  overallProgress: number;
  overallGrade: number;
  currentModuleId: string | null;
}> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      studentProgress: true,
      course: {
        include: { modules: { orderBy: { position: 'asc' } } },
      },
    },
  });

  if (!enrollment) return { overallProgress: 0, overallGrade: 0, currentModuleId: null };

  const joinPos = enrollment.joinedModulePosition || 1;
  const applicableModules = enrollment.course.modules.filter(m => m.position >= joinPos);
  const totalApplicable = applicableModules.length || 1;

  const completedProgress = enrollment.studentProgress.filter(p => p.status === 'COMPLETED');
  const inProgressMod = enrollment.studentProgress.find(p => p.status === 'IN_PROGRESS');

  const overallProgress = (completedProgress.length / totalApplicable) * 100;

  // Calculate weighted grade from completed modules
  let weightedGrade = 0;
  for (const p of completedProgress) {
    const mod = enrollment.course.modules.find(m => m.id === p.moduleId);
    if (mod && mod.weight && p.moduleScore !== null) {
      weightedGrade += (p.moduleScore / 100) * mod.weight;
    }
  }

  const currentModuleId = inProgressMod?.moduleId || completedProgress[completedProgress.length - 1]?.moduleId || null;

  // Update enrollment
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { overallProgress, overallGrade: weightedGrade, currentModuleId },
  });

  return { overallProgress, overallGrade: weightedGrade, currentModuleId };
}

/**
 * Recalculate all students' progress in a batch
 */
export async function recalculateBatchProgress(batchCode: string): Promise<number> {
  const enrollments = await prisma.enrollment.findMany({
    where: { batchCode },
    select: { id: true },
  });

  let updated = 0;
  for (const e of enrollments) {
    await recalculateStudentProgress(e.id);
    updated++;
  }

  return updated;
}

/**
 * Get cohort progress summary for a batch
 */
export async function getCohortProgress(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      course: { include: { modules: { orderBy: { position: 'asc' } } } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!batch) return null;

  const modules = batch.course.modules;
  const totalModules = modules.length;
  const durationWeeks = batch.durationWeeks || 52;

  // Current active module
  const currentPos = batch.startDate
    ? getCurrentModulePosition(batch.startDate, durationWeeks, totalModules)
    : 0;

  // Get all progress records for this batch
  const allProgress = await prisma.studentProgress.findMany({
    where: { batchId: batch.id },
    include: {
      enrollment: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, vNumber: true } },
        },
      },
    },
  });

  // Get enrollment count
  const enrollmentCount = await prisma.enrollment.count({
    where: { batchCode: batch.batchCode },
  });

  // Build per-module stats
  const moduleStats = modules.map(mod => {
    const modProgress = allProgress.filter(p => p.moduleId === mod.id);
    return {
      moduleId: mod.id,
      moduleName: mod.name,
      position: mod.position,
      weight: mod.weight,
      hours: mod.hours,
      isActive: mod.position === currentPos,
      isPast: mod.position < currentPos,
      isFuture: mod.position > currentPos,
      completed: modProgress.filter(p => p.status === 'COMPLETED').length,
      inProgress: modProgress.filter(p => p.status === 'IN_PROGRESS').length,
      notStarted: modProgress.filter(p => p.status === 'NOT_STARTED').length,
      totalStudents: enrollmentCount,
    };
  });

  // Build per-student progress
  const studentMap: Record<string, any> = {};
  for (const p of allProgress) {
    const uid = p.enrollment.user.id;
    if (!studentMap[uid]) {
      studentMap[uid] = {
        user: p.enrollment.user,
        enrollmentId: p.enrollmentId,
        joinedAt: null,
        modules: [],
        completedCount: 0,
        overallProgress: 0,
        overallGrade: 0,
      };
    }
    studentMap[uid].modules.push({
      moduleId: p.moduleId,
      status: p.status,
      score: p.moduleScore,
    });
    if (p.status === 'COMPLETED') studentMap[uid].completedCount++;
  }

  // Calculate per-student stats
  const students = Object.values(studentMap).map((s: any) => {
    const enrollment = allProgress.find(p => p.enrollmentId === s.enrollmentId)?.enrollment;
    const joinPos = enrollment?.joinedModulePosition || 1;
    const applicable = totalModules - (joinPos - 1);
    s.joinedAt = joinPos;
    s.overallProgress = applicable > 0 ? (s.completedCount / applicable) * 100 : 0;
    return s;
  });

  return {
    batch: {
      id: batch.id,
      batchCode: batch.batchCode,
      courseName: batch.course.name,
      courseCode: batch.courseCode,
      teacher: batch.teacher,
      startDate: batch.startDate,
      endDate: batch.endDate,
      durationWeeks: batch.durationWeeks,
      status: batch.startDate ? getBatchStatus(batch.startDate, batch.endDate) : 'UPCOMING',
      campus: batch.campus,
      classTime: batch.classTime,
    },
    currentModulePosition: currentPos,
    totalModules,
    totalStudents: enrollmentCount,
    moduleStats,
    students,
  };
}
