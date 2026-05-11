import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadCourseFile, UPLOAD_DIR } from '../middleware/upload';
import { success, error } from '../utils/response';

const router = Router();

// Permission: can the user read files in this course?
async function canRead(userId: string, role: string, courseId: string): Promise<boolean> {
  if (role === 'ADMIN') return true;
  const teaching = await prisma.batch.findFirst({ where: { courseId, teacherId: userId }, select: { id: true } });
  if (teaching) return true;
  const enrolled = await prisma.enrollment.findFirst({ where: { courseId, userId }, select: { id: true } });
  return !!enrolled;
}

// Permission: can the user upload/delete files in this course?
async function canManage(userId: string, role: string, courseId: string): Promise<boolean> {
  if (role === 'ADMIN') return true;
  const teaching = await prisma.batch.findFirst({ where: { courseId, teacherId: userId }, select: { id: true } });
  return !!teaching;
}

// GET /api/courses/:courseId/files — list files (optional ?folder= filter)
router.get('/courses/:courseId/files', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const { role, userId } = req.user!;
    if (!(await canRead(userId, role, courseId))) return error(res, 'Not authorized', 403);

    const folder = req.query.folder as string | undefined;
    const files = await prisma.courseFile.findMany({
      where: { courseId, ...(folder !== undefined ? { folder } : {}) },
      orderBy: [{ folder: 'asc' }, { fileName: 'asc' }],
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
        module: { select: { id: true, name: true } },
      },
    });
    return success(res, files);
  } catch (err) {
    console.error('List course files error:', err);
    return error(res, 'Failed to list files', 500);
  }
});

// POST /api/courses/:courseId/files — upload one file (multipart)
router.post('/courses/:courseId/files', authenticate, (req, res, next) => {
  uploadCourseFile.single('file')(req, res, err => {
    if (err) return error(res, err.message, 400);
    next();
  });
}, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const { role, userId } = req.user!;
    if (!(await canManage(userId, role, courseId))) return error(res, 'Not authorized', 403);
    if (!req.file) return error(res, 'No file uploaded');

    const { folder = '', description, moduleId } = req.body as { folder?: string; description?: string; moduleId?: string };

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) return error(res, 'Course not found', 404);

    const destDir = path.join(UPLOAD_DIR, 'course-files', courseId);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const stored = `${randomUUID()}-${safeName}`;
    const absPath = path.join(destDir, stored);
    fs.writeFileSync(absPath, req.file.buffer);
    const relPath = path.relative(UPLOAD_DIR, absPath);

    const created = await prisma.courseFile.create({
      data: {
        courseId,
        moduleId: moduleId || null,
        uploadedById: userId,
        fileName: req.file.originalname,
        folder,
        filePath: relPath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        description: description || null,
      },
    });

    return success(res, created, 201);
  } catch (err) {
    console.error('Upload course file error:', err);
    return error(res, 'Failed to upload file', 500);
  }
});

// GET /api/courses/:courseId/files/:fileId/share-link — mint a public, no-auth
// link for a file. Teachers/admins only. The link uses a JWT signed with the
// same secret so anyone with the URL can download.
router.get('/courses/:courseId/files/:fileId/share-link', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId, fileId } = req.params;
    const { role, userId } = req.user!;
    if (!(await canManage(userId, role, courseId))) return error(res, 'Not authorized', 403);

    const file = await prisma.courseFile.findFirst({ where: { id: fileId, courseId } });
    if (!file) return error(res, 'File not found', 404);

    const token = jwt.sign({ fileId, courseId, kind: 'file-share' }, process.env.JWT_SECRET!, { expiresIn: '365d' });
    return success(res, { url: `/api/file-share/${token}` });
  } catch (err) {
    console.error('Share-link error:', err);
    return error(res, 'Failed to mint share link', 500);
  }
});

// GET /file-share/:token — public, no-auth download via signed token.
router.get('/file-share/:token', async (req, res) => {
  try {
    const payload = jwt.verify(String(req.params.token || ''), process.env.JWT_SECRET!) as any;
    if (payload?.kind !== 'file-share' || !payload.fileId || !payload.courseId) {
      return res.status(400).send('Invalid share link');
    }
    const file = await prisma.courseFile.findFirst({ where: { id: payload.fileId, courseId: payload.courseId } });
    if (!file) return res.status(404).send('File not found');
    const abs = path.resolve(UPLOAD_DIR, file.filePath);
    if (!fs.existsSync(abs)) return res.status(404).send('File missing on disk');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`);
    res.sendFile(abs);
  } catch {
    return res.status(400).send('Invalid or expired share link');
  }
});

// GET /api/courses/:courseId/files/:fileId/download
router.get('/courses/:courseId/files/:fileId/download', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId, fileId } = req.params;
    const { role, userId } = req.user!;
    if (!(await canRead(userId, role, courseId))) return error(res, 'Not authorized', 403);

    const file = await prisma.courseFile.findFirst({ where: { id: fileId, courseId } });
    if (!file) return error(res, 'File not found', 404);

    const abs = path.resolve(UPLOAD_DIR, file.filePath);
    if (!fs.existsSync(abs)) return error(res, 'File missing on disk', 404);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName.replace(/"/g, '')}"`);
    res.sendFile(abs);
  } catch (err) {
    console.error('Download course file error:', err);
    return error(res, 'Failed to download', 500);
  }
});

// DELETE /api/courses/:courseId/files/:fileId
router.delete('/courses/:courseId/files/:fileId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId, fileId } = req.params;
    const { role, userId } = req.user!;

    const file = await prisma.courseFile.findFirst({ where: { id: fileId, courseId } });
    if (!file) return error(res, 'File not found', 404);

    const isAdmin = role === 'ADMIN';
    const isUploader = file.uploadedById === userId;
    if (!isAdmin && !isUploader) return error(res, 'Not authorized', 403);

    const abs = path.resolve(UPLOAD_DIR, file.filePath);
    if (fs.existsSync(abs)) {
      try { fs.unlinkSync(abs); } catch (e) { console.warn('unlink failed:', e); }
    }
    await prisma.courseFile.delete({ where: { id: fileId } });
    return success(res, { message: 'Deleted' });
  } catch (err) {
    console.error('Delete course file error:', err);
    return error(res, 'Failed to delete', 500);
  }
});

// PATCH /api/courses/:courseId/files/:fileId — rename file
router.patch('/courses/:courseId/files/:fileId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId, fileId } = req.params;
    const { role, userId } = req.user!;
    const { fileName, folder } = req.body ?? {};

    const file = await prisma.courseFile.findFirst({ where: { id: fileId, courseId } });
    if (!file) return error(res, 'File not found', 404);

    const isAdmin = role === 'ADMIN';
    const isUploader = file.uploadedById === userId;
    if (!isAdmin && !isUploader) return error(res, 'Not authorized', 403);

    const data: { fileName?: string; folder?: string } = {};
    if (typeof fileName === 'string' && fileName.trim().length > 0) {
      data.fileName = fileName.trim();
    }
    if (typeof folder === 'string') {
      data.folder = folder.trim();
    }
    if (Object.keys(data).length === 0) return error(res, 'Nothing to update');

    const updated = await prisma.courseFile.update({ where: { id: fileId }, data });
    return success(res, updated);
  } catch (err) {
    console.error('Rename course file error:', err);
    return error(res, 'Failed to rename', 500);
  }
});

export default router;
