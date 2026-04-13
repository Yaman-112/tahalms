import { Router } from 'express';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/calendar — get events for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;
    const start = req.query.start as string | undefined;
    const end = req.query.end as string | undefined;

    let where: any = {};

    if (role !== 'ADMIN') {
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

    // Tag schedule vs regular events
    const events = rawEvents.map(e => ({
      ...e,
      type: e.description?.startsWith('IBA Schedule:') ? 'schedule' as const : 'event' as const,
      track: e.description?.startsWith('IBA Schedule:')
        ? e.description.replace('IBA Schedule: ', '')
        : undefined,
    }));

    // Also get assignments with due dates as calendar events
    let assignmentWhere: any = { dueDate: { not: null } };
    if (role !== 'ADMIN') {
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
