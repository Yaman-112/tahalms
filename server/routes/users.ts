import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { authenticate, requireRole, denyAuditor, isAuditor, auditorScope, AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/audit';
import { success, error } from '../utils/response';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users — list users (admin only, with pagination)
router.get('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const searchId = req.query.searchId as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role.toUpperCase();

    // Auditor can only see their scoped students (and never other admins/teachers).
    const scope = auditorScope(req);
    if (scope !== null) {
      where.role = 'STUDENT';
      where.vNumber = { in: scope };
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (searchId) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { id: { contains: searchId, mode: 'insensitive' } },
            { vNumber: { contains: searchId, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isActive: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, { users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List users error:', err);
    return error(res, 'Failed to list users', 500);
  }
});

// GET /api/users/:id — get user profile with enrollments (admin only)
router.get('/:id', requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, username: true, firstName: true, lastName: true,
        role: true, isActive: true, vNumber: true, contactNo: true, address: true,
        campus: true, startDate: true, finishDate: true, program: true,
        campusStatus: true, shift: true, admissionRep: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true, name: true, code: true,
                modules: { select: { id: true, name: true, position: true, startDate: true, hours: true }, orderBy: { position: 'asc' } },
              },
            },
            studentProgress: { select: { moduleId: true, status: true, startedAt: true, completedAt: true } },
          },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    });

    if (!user) return error(res, 'User not found', 404);

    // Auditor scope check: must be a STUDENT and their vNumber must be in scope.
    const scope = auditorScope(req);
    if (scope !== null) {
      if (user.role !== 'STUDENT' || !user.vNumber || !scope.includes(user.vNumber)) {
        return error(res, 'User not found', 404);
      }
    }

    return success(res, user);
  } catch (err) {
    console.error('Get user error:', err);
    return error(res, 'Failed to get user', 500);
  }
});

// POST /api/users — create a user (admin only)
router.post('/', requireRole('ADMIN'), denyAuditor, async (req: AuthRequest, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return error(res, 'All fields are required: email, password, firstName, lastName, role');
    }

    const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      return error(res, 'Role must be STUDENT, TEACHER, or ADMIN');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      tableName: 'users',
      recordId: user.id,
      action: 'INSERT',
      newValues: { email, firstName, lastName, role: role.toUpperCase() },
      changedById: req.user!.userId,
      reason: 'Admin created user',
      ipAddress: req.ip,
    });

    return success(res, user, 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error(res, 'Failed to create user', 500);
  }
});

// PATCH /api/users/:id — update a user (admin only)
router.patch('/:id', requireRole('ADMIN'), denyAuditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'User not found', 404);
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const oldValues = {
      firstName: existing.firstName,
      lastName: existing.lastName,
      role: existing.role,
      isActive: existing.isActive,
    };

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    await createAuditLog({
      tableName: 'users',
      recordId: id,
      action: 'UPDATE',
      oldValues,
      newValues: updateData,
      changedById: req.user!.userId,
      reason: 'Admin updated user',
      ipAddress: req.ip,
    });

    return success(res, user);
  } catch (err) {
    console.error('Update user error:', err);
    return error(res, 'Failed to update user', 500);
  }
});

// DELETE /api/users/:id — deactivate user (admin only, soft delete)
router.delete('/:id', requireRole('ADMIN'), denyAuditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      tableName: 'users',
      recordId: id,
      action: 'DELETE',
      oldValues: { isActive: true },
      newValues: { isActive: false },
      changedById: req.user!.userId,
      reason: 'Admin deactivated user',
      ipAddress: req.ip,
    });

    return success(res, { message: 'User deactivated' });
  } catch (err) {
    console.error('Delete user error:', err);
    return error(res, 'Failed to deactivate user', 500);
  }
});

export default router;
