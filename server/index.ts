import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import assignmentRoutes from './routes/assignments';
import submissionRoutes from './routes/submissions';
import messageRoutes from './routes/messages';
import calendarRoutes from './routes/calendar';
import importRoutes from './routes/import';
import batchRoutes from './routes/batches';
import enrollmentRoutes from './routes/enrollments';
import progressRoutes from './routes/progress';
import dashboardRoutes from './routes/dashboard';
import questionRoutes from './routes/questions';
import fileRoutes from './routes/files';
import analyticsRoutes from './routes/analytics';
import moduleRoutes from './routes/modules';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Block all writes from AUDITOR accounts (read-only enforcement).
// Auth routes (login/logout/refresh) are mounted before this guard.
app.use('/api/auth', authRoutes);

import jwt from 'jsonwebtoken';
app.use((req, res, next) => {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next();
  const header = req.headers.authorization;
  let token: string | undefined;
  if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
  else if (req.query.token) token = req.query.token as string;
  if (!token) return next();
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (p?.actualRole === 'AUDITOR') {
      return res.status(403).json({ success: false, error: 'Read-only auditor account' });
    }
  } catch { /* let downstream auth handle invalid tokens */ }
  next();
});

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/import', importRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api', fileRoutes);

// Magic share-link landing page. Drops the JWT into localStorage and
// redirects to "/" so the existing SPA boots as that user. Works with any
// frontend build (no client-side change required).
app.get('/access/:token', (req, res) => {
  const token = String(req.params.token || '');
  // Light validation — only allow JWT-shaped strings.
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return res.status(400).send('Invalid token');
  }
  res.set('Cache-Control', 'no-store');
  res.send(`<!doctype html><meta charset="utf-8"><title>Loading…</title>
<script>
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.setItem('accessToken', ${JSON.stringify(token)});
  } catch (e) {}
  location.replace('/');
</script>`);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
