import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface AuthPayload {
  userId: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Support token via Authorization header or query param (for iframes/file downloads)
  let token: string | undefined;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}
