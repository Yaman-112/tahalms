import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface AuthPayload {
  userId: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';   // role as exposed to the frontend
  actualRole?: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'AUDITOR'; // true DB role
  scope?: string[];                         // vNumbers an AUDITOR is limited to
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
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
    // AUDITOR is treated as ADMIN for read access (role=ADMIN in JWT)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

// Reject AUDITOR from any write/mutation endpoint. Mount on POST/PATCH/PUT/DELETE.
export function denyAuditor(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.actualRole === 'AUDITOR') {
    return res.status(403).json({ success: false, error: 'Read-only auditor account' });
  }
  next();
}

// True if this request comes from an auditor with a vNumber scope.
export function isAuditor(req: AuthRequest): boolean {
  return req.user?.actualRole === 'AUDITOR';
}

// Returns vNumber list the auditor is allowed to see, or null if no scope.
export function auditorScope(req: AuthRequest): string[] | null {
  return isAuditor(req) ? (req.user?.scope || []) : null;
}
