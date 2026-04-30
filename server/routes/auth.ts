import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return error(res, 'Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return error(res, 'Invalid credentials', 401);
    }

    // AUDITOR is exposed to the frontend as ADMIN (so the admin UI renders),
    // but the backend uses actualRole + scope for read-only access + filtering.
    const exposedRole = user.role === 'AUDITOR' ? 'ADMIN' : user.role;
    const tokenPayload: any = { userId: user.id, role: exposedRole };
    if (user.role === 'AUDITOR') {
      tokenPayload.actualRole = 'AUDITOR';
      tokenPayload.scope = (user as any).scopedStudentIds || [];
    }

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: exposedRole,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed', 500);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return error(res, 'Refresh token required');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      return error(res, 'Invalid or expired refresh token', 401);
    }

    const exposedRole = stored.user.role === 'AUDITOR' ? 'ADMIN' : stored.user.role;
    const tokenPayload: any = { userId: stored.user.id, role: exposedRole };
    if (stored.user.role === 'AUDITOR') {
      tokenPayload.actualRole = 'AUDITOR';
      tokenPayload.scope = (stored.user as any).scopedStudentIds || [];
    }
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    return success(res, { accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return error(res, 'Token refresh failed', 500);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId: req.user!.userId },
      });
    }
    return success(res, { message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    return error(res, 'Logout failed', 500);
  }
});

// GET /api/auth/me — get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        startDate: true,
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Mask AUDITOR as ADMIN for the frontend, but expose isAuditor so
    // the UI can hide auditor-irrelevant fields (active/inactive status,
    // suspend buttons, etc.) without leaking the masked role.
    if (user.role === 'AUDITOR') {
      return success(res, { ...user, role: 'ADMIN', isAuditor: true });
    }
    return success(res, user);
  } catch (err) {
    console.error('Get me error:', err);
    return error(res, 'Failed to get user', 500);
  }
});

export default router;
