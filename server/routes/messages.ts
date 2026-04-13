import { Router } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// GET /api/messages — inbox for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const folder = req.query.folder as string || 'inbox';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    let messages;
    let total: number;

    if (folder === 'sent') {
      [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { senderId: userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
            recipients: {
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
            course: { select: { id: true, name: true, code: true } },
          },
        }),
        prisma.message.count({ where: { senderId: userId } }),
      ]);
    } else {
      const recipientEntries = await prisma.messageRecipient.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { message: { createdAt: 'desc' } },
        include: {
          message: {
            include: {
              sender: { select: { id: true, firstName: true, lastName: true } },
              recipients: {
                include: { user: { select: { id: true, firstName: true, lastName: true } } },
              },
              course: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      messages = recipientEntries.map(r => ({
        ...r.message,
        read: r.read,
        starred: r.starred,
        recipientId: r.id,
      }));
      total = await prisma.messageRecipient.count({ where: { userId } });
    }

    return success(res, { messages, total, page, limit });
  } catch (err) {
    console.error('List messages error:', err);
    return error(res, 'Failed to list messages', 500);
  }
});

// GET /api/messages/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        recipients: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        course: { select: { id: true, name: true, code: true } },
      },
    });

    if (!message) return error(res, 'Message not found', 404);

    // Mark as read
    await prisma.messageRecipient.updateMany({
      where: { messageId: message.id, userId: req.user!.userId },
      data: { read: true },
    });

    return success(res, message);
  } catch (err) {
    console.error('Get message error:', err);
    return error(res, 'Failed to get message', 500);
  }
});

// POST /api/messages — send a message
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { recipientIds, subject, body, courseId } = req.body;

    if (!recipientIds?.length || !subject || !body) {
      return error(res, 'recipientIds, subject, and body are required');
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.userId,
        subject,
        body,
        courseId: courseId || null,
        recipients: {
          create: recipientIds.map((id: string) => ({ userId: id })),
        },
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        recipients: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    return success(res, message, 201);
  } catch (err) {
    console.error('Send message error:', err);
    return error(res, 'Failed to send message', 500);
  }
});

// PATCH /api/messages/:id/star — toggle star
router.patch('/:id/star', async (req: AuthRequest, res) => {
  try {
    const recipient = await prisma.messageRecipient.findFirst({
      where: { messageId: req.params.id, userId: req.user!.userId },
    });

    if (!recipient) return error(res, 'Message not found', 404);

    const updated = await prisma.messageRecipient.update({
      where: { id: recipient.id },
      data: { starred: !recipient.starred },
    });

    return success(res, updated);
  } catch (err) {
    console.error('Star message error:', err);
    return error(res, 'Failed to star message', 500);
  }
});

export default router;
