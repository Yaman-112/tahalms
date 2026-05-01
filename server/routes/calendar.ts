import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/calendar — get events for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId, actualRole, scope } = req.user! as any;
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;

    let where: any = {};

    if (actualRole === 'AUDITOR') {
      // Restrict auditor's calendar to courses where any of their scoped
      // students is enrolled (so it shows only IBA / AC / CSW / etc. that
      // their cohort actually attends).
      where.course = {
        enrollments: { some: { user: { vNumber: { in: (scope as string[]) || [] } } } },
      };
    } else if (role !== 'ADMIN') {
      where.course = { enrollments: { some: { userId } } };
    }

    if (start) where.startTime = { ...(where.startTime || {}), gte: new Date(start) };
    if (end) where.startTime = { ...(where.startTime || {}), lte: new Date(end) };

    const rawEvents = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Determine the student's track from their enrollment batch_code so we
    // only show schedule events for their cohort (Weekday vs Weekend).
    let studentTrack: 'Weekday' | 'Weekend' | null = null;
    if (role === 'STUDENT' || actualRole === 'AUDITOR') {
      const targetUserId = userId; // for auditor we filter by their scoped students separately; for share-link impersonation userId is the student
      const enr = await prisma.enrollment.findFirst({
        where: { userId: targetUserId },
        select: { batchCode: true },
      });
      const bc = (enr?.batchCode || '').toUpperCase();
      if (bc.includes('W')) studentTrack = 'Weekend';
      else studentTrack = 'Weekday';
    }

    // Tag schedule vs regular events
    let events = rawEvents.map(e => ({
      ...e,
      type: e.description?.startsWith('IBA Schedule:') ? 'schedule' as const : 'event' as const,
      track: e.description?.startsWith('IBA Schedule:')
        ? e.description.replace('IBA Schedule: ', '')
        : undefined,
    }));
    // Drop other-track schedule events for students
    if (studentTrack) {
      events = events.filter(e => e.type !== 'schedule' || !e.track || e.track === studentTrack);
    }

    // Also get assignments with due dates as calendar events
    let assignmentWhere: any = { dueDate: { not: null } };
    if (actualRole === 'AUDITOR') {
      assignmentWhere.course = {
        enrollments: { some: { user: { vNumber: { in: (scope as string[]) || [] } } } },
      };
    } else if (role !== 'ADMIN') {
      assignmentWhere.course = { enrollments: { some: { userId } } };
    }
    if (start) assignmentWhere.dueDate = { ...(assignmentWhere.dueDate || {}), gte: new Date(start) };
    if (end) assignmentWhere.dueDate = { ...(assignmentWhere.dueDate || {}), lte: new Date(end) };

    const assignments = await prisma.assignment.findMany({
      where: assignmentWhere,
      include: {
        course: { select: { id: true, name: true, code: true, color: true } },
      },
    });

    const assignmentEvents = assignments.map(a => ({
      id: `assignment-${a.id}`,
      title: a.title,
      startTime: a.dueDate,
      endTime: a.dueDate,
      type: 'assignment' as const,
      course: a.course,
      points: a.points,
      assignmentId: a.id,
    }));

    return success(res, { events, assignmentEvents });
  } catch (err) {
    console.error('List calendar error:', err);
    return error(res, 'Failed to list calendar events', 500);
  }
});

// POST /api/calendar — create event (teacher/admin)
router.post('/', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const { courseId, title, description, startTime, endTime } = req.body;

    if (!title || !startTime) {
      return error(res, 'title and startTime are required');
    }

    const event = await prisma.calendarEvent.create({
      data: {
        courseId: courseId || null,
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        createdById: req.user!.userId,
      },
    });

    return success(res, event, 201);
  } catch (err) {
    console.error('Create event error:', err);
    return error(res, 'Failed to create event', 500);
  }
});

export default router;
