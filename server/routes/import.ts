import { Router } from 'express';
import multer from 'multer';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { importStudents, importCourses, importAssignments, importEnrollments, importGrades } from '../services/excel-import';
import { importCourseFromDocx } from '../services/docx-import';
import { success, error } from '../utils/response';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

// All import routes require admin
router.use(authenticate, requireRole('ADMIN'));

// POST /api/import/course-docx — upload .docx course setup guide
// Query param: ?code=IBACOOP06 (required — the course SIS code)
router.post('/course-docx', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    const courseCode = req.query.code as string || req.body.code;

    if (!file) {
      return error(res, 'No file uploaded');
    }
    if (!courseCode) {
      return error(res, 'Course code is required. Pass ?code=YOUR_CODE');
    }

    const batch = await prisma.importBatch.create({
      data: {
        uploadedById: req.user!.userId,
        fileName: file.originalname,
        status: 'PROCESSING',
      },
    });

    const result = await importCourseFromDocx(file.buffer, req.user!.userId, batch.id, courseCode);

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        recordCount: result.modulesCreated + result.assignmentsCreated,
        status: result.errors.length > 0 && result.modulesCreated === 0 ? 'FAILED' : 'COMPLETED',
        errorLog: result.errors.length > 0 ? result.errors : undefined,
        completedAt: new Date(),
      },
    });

    return success(res, {
      batchId: batch.id,
      courseName: result.courseName,
      courseCode: result.courseCode,
      modulesCreated: result.modulesCreated,
      assignmentsCreated: result.assignmentsCreated,
      errors: result.errors,
    });
  } catch (err) {
    console.error('DOCX import error:', err);
    return error(res, 'DOCX import failed', 500);
  }
});

// POST /api/import/:type — upload Excel and import
// type: students | courses | assignments | enrollments | grades
router.post('/:type', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { type } = req.params;
    const file = req.file;

    if (!file) {
      return error(res, 'No file uploaded');
    }

    const validTypes = ['students', 'courses', 'assignments', 'enrollments', 'grades'];
    if (!validTypes.includes(type)) {
      return error(res, `Invalid import type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Create import batch record
    const batch = await prisma.importBatch.create({
      data: {
        uploadedById: req.user!.userId,
        fileName: file.originalname,
        status: 'PROCESSING',
      },
    });

    // Run import
    const importFn = {
      students: importStudents,
      courses: importCourses,
      assignments: importAssignments,
      enrollments: importEnrollments,
      grades: importGrades,
    }[type]!;

    const result = await importFn(file.buffer, req.user!.userId, batch.id);

    // Update batch with results
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        recordCount: result.success + result.failed,
        status: result.failed > 0 && result.success === 0 ? 'FAILED' : 'COMPLETED',
        errorLog: result.errors.length > 0 ? result.errors : undefined,
        completedAt: new Date(),
      },
    });

    return success(res, {
      batchId: batch.id,
      fileName: file.originalname,
      imported: result.success,
      failed: result.failed,
      errors: result.errors.slice(0, 50), // Return first 50 errors
      totalErrors: result.errors.length,
    });
  } catch (err) {
    console.error('Import error:', err);
    return error(res, 'Import failed', 500);
  }
});

// GET /api/import/batches — list import history
router.get('/', async (req: AuthRequest, res) => {
  try {
    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        uploadedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return success(res, batches);
  } catch (err) {
    console.error('List batches error:', err);
    return error(res, 'Failed to list import batches', 500);
  }
});

// GET /api/import/batches/:id — get import batch details
router.get('/batches/:id', async (req: AuthRequest, res) => {
  try {
    const batch = await prisma.importBatch.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!batch) {
      return error(res, 'Batch not found', 404);
    }

    return success(res, batch);
  } catch (err) {
    console.error('Get batch error:', err);
    return error(res, 'Failed to get batch', 500);
  }
});

export default router;
