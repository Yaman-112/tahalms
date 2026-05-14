import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/questions/banks — admin overview of all assignments with questions, grouped by course
router.get('/banks', requireRole('ADMIN'), async (_req: AuthRequest, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { questions: { some: {} } },
      select: {
        id: true, title: true, format: true, points: true, published: true,
        course: { select: { id: true, code: true, name: true } },
        questions: { select: { type: true, points: true } },
      },
      orderBy: [{ course: { code: 'asc' } }, { title: 'asc' }],
    });
    const byCourse = new Map<string, { id: string; code: string; name: string; assignments: any[] }>();
    for (const a of assignments) {
      const key = a.course.id;
      if (!byCourse.has(key)) byCourse.set(key, { id: a.course.id, code: a.course.code, name: a.course.name, assignments: [] });
      const qCount = a.questions.length;
      const mcq = a.questions.filter(q => q.type === 'MCQ').length;
      const theory = a.questions.filter(q => q.type === 'THEORY').length;
      const qPoints = a.questions.reduce((s, q) => s + (q.points || 0), 0);
      byCourse.get(key)!.assignments.push({
        id: a.id, title: a.title, format: a.format, points: a.points, published: a.published,
        questionCount: qCount, mcqCount: mcq, theoryCount: theory, questionPoints: qPoints,
      });
    }
    const out = Array.from(byCourse.values()).map(c => ({
      ...c,
      assignmentCount: c.assignments.length,
      totalQuestions: c.assignments.reduce((s, a) => s + a.questionCount, 0),
    }));
    return success(res, out);
  } catch (err) {
    console.error('Get question banks error:', err);
    return error(res, 'Failed to get question banks', 500);
  }
});

// GET /api/questions?assignmentId= — get questions for an assignment
router.get('/', async (req: AuthRequest, res) => {
  try {
    const assignmentId = req.query.assignmentId as string;
    if (!assignmentId) return error(res, 'assignmentId is required');

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return error(res, 'Assignment not found', 404);

    const { role, userId } = req.user!;

    const questions = await prisma.question.findMany({
      where: { assignmentId },
      orderBy: { position: 'asc' },
      include: {
        options: { orderBy: { position: 'asc' } },
        // Include student's own answers if student
        ...(role === 'STUDENT' ? {
          answers: { where: { studentId: userId } },
        } : {
          answers: true,
        }),
      },
    });

    // For students: hide correct answers if assignment hasn't been graded
    if (role === 'STUDENT') {
      const submission = await prisma.submission.findUnique({
        where: { assignmentId_studentId: { assignmentId, studentId: userId } },
      });
      const isGraded = submission?.status === 'GRADED';

      const sanitized = questions.map(q => ({
        ...q,
        options: q.options.map(o => ({
          ...o,
          // Only show isCorrect after grading if showResults is on
          isCorrect: (isGraded && assignment.showResults) ? o.isCorrect : undefined,
        })),
        explanation: (isGraded && assignment.showResults) ? q.explanation : undefined,
      }));

      return success(res, sanitized);
    }

    return success(res, questions);
  } catch (err) {
    console.error('Get questions error:', err);
    return error(res, 'Failed to get questions', 500);
  }
});

// POST /api/questions — create/update questions for an assignment (teacher/admin)
router.post('/', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { assignmentId, questions } = req.body;
    if (!assignmentId || !questions || !Array.isArray(questions)) {
      return error(res, 'assignmentId and questions array are required');
    }

    // Delete existing questions and recreate (simpler than diffing)
    await prisma.question.deleteMany({ where: { assignmentId } });

    const created = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const question = await prisma.question.create({
        data: {
          assignmentId,
          type: q.type === 'THEORY' ? 'THEORY' : 'MCQ',
          text: q.text,
          points: parseFloat(q.points) || 1,
          position: i + 1,
          required: q.required !== false,
          explanation: q.explanation || null,
          wordLimit: q.wordLimit ? parseInt(q.wordLimit) : null,
          options: q.type === 'MCQ' && q.options ? {
            create: q.options.map((opt: any, j: number) => ({
              text: opt.text,
              isCorrect: !!opt.isCorrect,
              position: j + 1,
            })),
          } : undefined,
        },
        include: { options: true },
      });
      created.push(question);
    }

    // Update assignment total points
    const totalPoints = created.reduce((sum, q) => sum + q.points, 0);
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { points: totalPoints },
    });

    return success(res, created, 201);
  } catch (err) {
    console.error('Create questions error:', err);
    return error(res, 'Failed to create questions', 500);
  }
});

// POST /api/questions/append — append questions to a bank without deleting
// existing ones. Permission: ADMIN, or a TEACHER who teaches the bank's course.
router.post('/append', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { assignmentId, questions } = req.body;
    if (!assignmentId || !Array.isArray(questions) || questions.length === 0) {
      return error(res, 'assignmentId and a non-empty questions[] are required');
    }
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, courseId: true, points: true },
    });
    if (!assignment) return error(res, 'Assignment not found', 404);

    if (req.user!.role === 'TEACHER') {
      const teaches = await prisma.batch.findFirst({
        where: { teacherId: req.user!.userId, courseId: assignment.courseId },
        select: { id: true },
      });
      if (!teaches) return error(res, 'Not authorized for this course', 403);
    }

    const last = await prisma.question.findFirst({
      where: { assignmentId }, orderBy: { position: 'desc' }, select: { position: true },
    });
    let pos = (last?.position || 0) + 1;

    const created = [];
    let addedPoints = 0;
    for (const q of questions) {
      if (!q.text?.trim()) continue;
      const points = parseFloat(q.points) || 1;
      const isMcq = q.type === 'MCQ';
      const newQ = await prisma.question.create({
        data: {
          assignmentId,
          type: isMcq ? 'MCQ' : 'THEORY',
          text: q.text,
          points,
          position: pos++,
          required: q.required !== false,
          explanation: q.explanation || null,
          wordLimit: q.wordLimit ? parseInt(q.wordLimit) : null,
          options: isMcq && Array.isArray(q.options) ? {
            create: q.options.map((opt: any, j: number) => ({
              text: String(opt.text || ''),
              isCorrect: !!opt.isCorrect,
              position: j + 1,
            })),
          } : undefined,
        },
        include: { options: true },
      });
      created.push(newQ);
      addedPoints += points;
    }

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { points: (assignment.points || 0) + addedPoints },
    });

    return success(res, { added: created.length, addedPoints }, 201);
  } catch (err) {
    console.error('Append questions error:', err);
    return error(res, 'Failed to append questions', 500);
  }
});

// PATCH /api/questions/:id — update one question (text / points / options / etc.)
router.patch('/:id', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const q = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { assignment: { select: { id: true, courseId: true, points: true } }, options: true },
    });
    if (!q) return error(res, 'Question not found', 404);

    if (req.user!.role === 'TEACHER') {
      const teaches = await prisma.batch.findFirst({
        where: { teacherId: req.user!.userId, courseId: q.assignment.courseId },
        select: { id: true },
      });
      if (!teaches) return error(res, 'Not authorized for this course', 403);
    }

    const { text, points, explanation, wordLimit, required, options } = req.body || {};
    const data: any = {};
    if (typeof text === 'string') data.text = text;
    if (typeof points !== 'undefined') data.points = parseFloat(points) || 0;
    if (typeof explanation !== 'undefined') data.explanation = explanation || null;
    if (typeof wordLimit !== 'undefined') data.wordLimit = wordLimit ? parseInt(wordLimit) : null;
    if (typeof required !== 'undefined') data.required = !!required;

    const oldPoints = q.points || 0;
    const updated = await prisma.question.update({ where: { id: q.id }, data });

    // If the caller supplied an options array, replace all options for an MCQ.
    if (Array.isArray(options) && q.type === 'MCQ') {
      await prisma.questionOption.deleteMany({ where: { questionId: q.id } });
      if (options.length > 0) {
        await prisma.questionOption.createMany({
          data: options.map((o: any, j: number) => ({
            questionId: q.id,
            text: String(o.text || ''),
            isCorrect: !!o.isCorrect,
            position: j + 1,
          })),
        });
      }
    }

    // Update the parent assignment's total points if question points changed.
    if (typeof points !== 'undefined') {
      const delta = (parseFloat(points) || 0) - oldPoints;
      if (delta !== 0) {
        await prisma.assignment.update({
          where: { id: q.assignment.id },
          data: { points: Math.max(0, (q.assignment.points || 0) + delta) },
        });
      }
    }

    return success(res, updated);
  } catch (err) {
    console.error('Update question error:', err);
    return error(res, 'Failed to update question', 500);
  }
});

// DELETE /api/questions/:id — remove a question (cascades to options + answers).
router.delete('/:id', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const q = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { assignment: { select: { id: true, courseId: true, points: true } } },
    });
    if (!q) return error(res, 'Question not found', 404);

    if (req.user!.role === 'TEACHER') {
      const teaches = await prisma.batch.findFirst({
        where: { teacherId: req.user!.userId, courseId: q.assignment.courseId },
        select: { id: true },
      });
      if (!teaches) return error(res, 'Not authorized for this course', 403);
    }

    await prisma.question.delete({ where: { id: q.id } });
    await prisma.assignment.update({
      where: { id: q.assignment.id },
      data: { points: Math.max(0, (q.assignment.points || 0) - (q.points || 0)) },
    });
    return success(res, { id: q.id });
  } catch (err) {
    console.error('Delete question error:', err);
    return error(res, 'Failed to delete question', 500);
  }
});

// POST /api/questions/submit — student submits answers
router.post('/submit', async (req: AuthRequest, res) => {
  try {
    const { assignmentId, answers } = req.body;
    const studentId = req.user!.userId;

    if (!assignmentId || !answers || !Array.isArray(answers)) {
      return error(res, 'assignmentId and answers array are required');
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { questions: { include: { options: true } } },
    });
    if (!assignment) return error(res, 'Assignment not found', 404);

    // Create or get submission
    const now = new Date();
    const isLate = assignment.dueDate ? now > assignment.dueDate : false;

    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      update: { status: 'SUBMITTED', submittedAt: now, date: now, isLate },
      create: { assignmentId, studentId, status: 'SUBMITTED', submittedAt: now, date: now, isLate },
    });

    // Delete old answers for this submission
    await prisma.studentAnswer.deleteMany({
      where: { submissionId: submission.id, studentId },
    });

    // Process each answer
    let mcqScore = 0;
    let mcqTotal = 0;
    let theoryTotal = 0;
    const savedAnswers = [];

    for (const ans of answers) {
      const question = assignment.questions.find(q => q.id === ans.questionId);
      if (!question) continue;

      let isCorrect: boolean | null = null;
      let pointsAwarded: number | null = null;

      if (question.type === 'MCQ') {
        mcqTotal += question.points;
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = correctOption?.id === ans.selectedOptionId;

        if (isCorrect) {
          pointsAwarded = question.points;
          mcqScore += question.points;
        } else {
          pointsAwarded = -(assignment.negativeMarking || 0);
          mcqScore -= (assignment.negativeMarking || 0);
        }
      } else {
        // Theory — will be graded manually
        theoryTotal += question.points;
        pointsAwarded = null;
      }

      const saved = await prisma.studentAnswer.create({
        data: {
          questionId: ans.questionId,
          studentId,
          submissionId: submission.id,
          selectedOptionId: ans.selectedOptionId || null,
          textAnswer: ans.textAnswer || null,
          isCorrect,
          pointsAwarded,
        },
      });
      savedAnswers.push(saved);
    }

    // If all questions are MCQ, auto-grade the submission
    if (theoryTotal === 0 && mcqTotal > 0) {
      const finalScore = Math.max(0, mcqScore);
      await prisma.submission.update({
        where: { id: submission.id },
        data: { score: finalScore, status: 'GRADED', feedback: `Auto-graded: ${finalScore}/${mcqTotal} points` },
      });
    } else if (mcqTotal > 0) {
      // Mixed: set partial score from MCQ, status stays SUBMITTED for theory grading
      await prisma.submission.update({
        where: { id: submission.id },
        data: { score: Math.max(0, mcqScore) },
      });
    }

    return success(res, {
      submission,
      answers: savedAnswers,
      mcqScore: Math.max(0, mcqScore),
      mcqTotal,
      theoryTotal,
      autoGraded: theoryTotal === 0,
    }, 201);
  } catch (err) {
    console.error('Submit answers error:', err);
    return error(res, 'Failed to submit answers', 500);
  }
});

// PATCH /api/questions/grade-theory — teacher grades theory answers
router.patch('/grade-theory', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { submissionId, grades } = req.body;
    // grades: [{ answerId, pointsAwarded, feedback }]

    if (!submissionId || !grades || !Array.isArray(grades)) {
      return error(res, 'submissionId and grades array are required');
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { answers: true },
    });
    if (!submission) return error(res, 'Submission not found', 404);

    // Update each theory answer
    for (const g of grades) {
      await prisma.studentAnswer.update({
        where: { id: g.answerId },
        data: {
          pointsAwarded: parseFloat(g.pointsAwarded) || 0,
          feedback: g.feedback || null,
        },
      });
    }

    // Recalculate total score
    const allAnswers = await prisma.studentAnswer.findMany({
      where: { submissionId },
    });
    const totalScore = allAnswers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: Math.max(0, totalScore),
        status: 'GRADED',
        gradedById: req.user!.userId,
        feedback: `Total: ${Math.max(0, totalScore)} points`,
      },
    });

    return success(res, { totalScore: Math.max(0, totalScore) });
  } catch (err) {
    console.error('Grade theory error:', err);
    return error(res, 'Failed to grade theory answers', 500);
  }
});

export default router;
