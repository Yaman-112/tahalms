import mammoth from 'mammoth';
import prisma from '../db';
import { createAuditLog } from './audit';

interface DocxImportResult {
  courseName: string;
  courseCode: string;
  modulesCreated: number;
  assignmentsCreated: number;
  errors: string[];
}

/**
 * Parses a Canvas Setup Guide (.docx) and creates:
 * - 1 Course (upserts by code)
 * - N Modules (assignment groups)
 * - Assignments per module (parsed from Step 3 section)
 */
export async function importCourseFromDocx(
  buffer: Buffer,
  uploadedById: string,
  batchId: string,
  courseCode: string,
): Promise<DocxImportResult> {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result: DocxImportResult = {
    courseName: '',
    courseCode: courseCode,
    modulesCreated: 0,
    assignmentsCreated: 0,
    errors: [],
  };

  // --- Extract course name (line after "Canvas LMS Setup Guide") ---
  let courseName = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('canvas lms setup guide')) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j] && !lines[j].toLowerCase().startsWith('total hours')) {
          courseName = lines[j];
          break;
        }
      }
      break;
    }
  }
  if (!courseName) courseName = 'Imported Course';
  result.courseName = courseName;

  // --- Extract total hours ---
  let totalHours = 0;
  for (const line of lines) {
    const hoursMatch = line.match(/Total Hours:\s*([\d,]+)/i);
    if (hoursMatch) {
      totalHours = parseInt(hoursMatch[1].replace(/,/g, ''));
      break;
    }
  }

  // --- Parse modules and assignments from "Step 3" section ---
  // Each module block starts with "Module N: Name"
  // Assignments are lines like "Module Name - Type\nN pts"
  interface ParsedModule {
    name: string;
    weight: string;
    hours: number | null;
    assignments: { title: string; points: number; type: string }[];
  }

  const modules: ParsedModule[] = [];
  let currentModule: ParsedModule | null = null;

  // Find Step 3 section
  let step3Start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^Step 3/i)) {
      step3Start = i;
      break;
    }
  }

  if (step3Start === -1) {
    // Fallback: try to parse from Step 2 table instead
    return parseFromStep2Table(lines, courseCode, courseName, totalHours, uploadedById, batchId, result);
  }

  for (let i = step3Start; i < lines.length; i++) {
    const line = lines[i];

    // Match "Module N: Name" pattern
    const moduleMatch = line.match(/^Module\s+\d+:\s+(.+)/i);
    if (moduleMatch) {
      if (currentModule) modules.push(currentModule);

      const name = moduleMatch[1].trim();

      // Look for weight and hours in the next few lines: "Group Weight: X% | Hours: N"
      let weight = '';
      let hours: number | null = null;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const wMatch = lines[j].match(/Group Weight:\s*([\d.]+%)/i);
        if (wMatch) { weight = wMatch[1]; }
        const hMatch = lines[j].match(/Hours:\s*(\d+)/i);
        if (hMatch) { hours = parseInt(hMatch[1]); }
        if (wMatch || hMatch) break;
      }

      currentModule = { name, weight, hours, assignments: [] };
      continue;
    }

    // Match assignment lines: "Name - Type" followed by "N pts"
    // Supports: Final, Participation, Assignment, Quiz, Midterm, Theory, Practical, etc.
    if (currentModule && line.match(/\s*-\s*(Final|Participation|Assignment\s*\d*|Quiz|Midterm|Attendance|Test|Exam|Project|Theory\s*\d*|Practical)/i)) {
      const title = line;

      // Look for points in next few lines
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const ptsMatch = lines[j].match(/^(\d+)\s*pts?/i);
        if (ptsMatch) {
          const points = parseInt(ptsMatch[1]);

          // Determine assignment type
          let type: string = 'ASSIGNMENT';
          if (title.match(/quiz/i)) type = 'QUIZ';
          if (title.match(/final|exam|test|midterm|theory/i)) type = 'ASSIGNMENT';

          currentModule.assignments.push({ title, points, type });
          break;
        }
      }
    }

    // Stop at verification/checklist section
    if (line.match(/^Final Verification/i) || line.match(/^Step 4/i)) break;
  }

  if (currentModule && currentModule.assignments.length > 0) {
    modules.push(currentModule);
  }

  // If Step 3 parser found nothing, fall back to Step 2 table parser
  if (modules.length === 0) {
    return parseFromStep2Table(lines, courseCode, courseName, totalHours, uploadedById, batchId, result);
  }

  // --- Create course ---
  return await createCourseAndModules(modules, courseCode, courseName, totalHours, uploadedById, batchId, result);
}

/**
 * Fallback: parse from the Step 2 table (used for simpler course docs)
 */
async function parseFromStep2Table(
  lines: string[],
  courseCode: string,
  courseName: string,
  totalHours: number,
  uploadedById: string,
  batchId: string,
  result: DocxImportResult,
): Promise<DocxImportResult> {
  interface ParsedModule {
    name: string;
    weight: string;
    hours: number | null;
    assignments: { title: string; points: number; type: string }[];
  }

  const modules: ParsedModule[] = [];
  const weightPattern = /^(\d+\.?\d*)\s*%$/;

  // Only parse the Step 2 table section — stop before Step 3, examples, verification
  let tableStart = 0;
  let tableEnd = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^Step 2/i)) tableStart = i;
    if (lines[i].match(/^Step 3/i) || lines[i].match(/^Final Verification/i) || lines[i].match(/^Example/i)) {
      tableEnd = i;
      break;
    }
  }

  for (let i = tableStart; i < tableEnd; i++) {
    const line = lines[i];

    // A module name is a line followed by a weight percentage
    if (i + 1 < tableEnd) {
      let isModule = false;
      let weight = '';
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        const wMatch = lines[i + j].match(/^(\d+\.?\d*)\s*%$/);
        if (wMatch) {
          isModule = true;
          weight = wMatch[0];
          break;
        }
      }

      if (isModule) {
        const cleanName = line.replace(/[-\s]+$/, '').trim();
        if (
          cleanName &&
          cleanName !== 'Assignment Group (Module)' &&
          cleanName !== 'Weight' &&
          cleanName !== 'TOTAL' &&
          cleanName !== '# Items' &&
          cleanName !== 'Assignments Inside (pts)' &&
          !cleanName.startsWith('Step ') &&
          !cleanName.startsWith('Final (') &&
          !cleanName.startsWith('Participation (') &&
          !cleanName.match(/^\d+$/) &&
          !cleanName.match(/^\d+\.?\d*\s*%$/) &&
          !cleanName.includes('[Module Name]') &&
          !cleanName.startsWith('Total') &&
          !cleanName.startsWith('Module Total') &&
          cleanName.length > 2
        ) {
          // Check if this module already exists
          if (!modules.find(m => m.name === cleanName)) {
            // Parse assignments from "Assignments Inside" column
            // Look for patterns like "Final (90 pts), Participation (10 pts)"
            let assignments: { title: string; points: number; type: string }[] = [];
            for (let j = 1; j <= 6 && i + j < lines.length; j++) {
              const assLine = lines[i + j];
              const assMatches = [...assLine.matchAll(/(Final|Participation|Assignment\s*\d*|Quiz|Midterm|Attendance|Theory\s*\d*|Practical)\s*\((\d+)\s*pts?\)/gi)];
              if (assMatches.length > 0) {
                for (const m of assMatches) {
                  const typeName = m[1];
                  const points = parseInt(m[2]);
                  assignments.push({
                    title: `${cleanName} - ${typeName}`,
                    points,
                    type: typeName.toLowerCase() === 'quiz' ? 'QUIZ' : 'ASSIGNMENT',
                  });
                }
                break;
              }
            }

            // If no assignments found from table, default to Final + Participation
            if (assignments.length === 0) {
              assignments = [
                { title: `${cleanName} - Final`, points: 90, type: 'ASSIGNMENT' },
                { title: `${cleanName} - Participation`, points: 10, type: 'ASSIGNMENT' },
              ];
            }

            // Try to find hours for this module from Step 3 section
            let modHours: number | null = null;
            for (let k = 0; k < lines.length; k++) {
              if (lines[k].match(new RegExp(`^Module\\s+\\d+:\\s+${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))) {
                for (let h = k + 1; h < Math.min(k + 5, lines.length); h++) {
                  const hMatch = lines[h].match(/Hours:\s*(\d+)/i);
                  if (hMatch) { modHours = parseInt(hMatch[1]); break; }
                }
                break;
              }
            }

            modules.push({ name: cleanName, weight, hours: modHours, assignments });
          }
        }
      }
    }
  }

  return await createCourseAndModules(modules, courseCode, courseName, totalHours, uploadedById, batchId, result);
}

/**
 * Shared: creates course, modules, and assignments in the database
 */
async function createCourseAndModules(
  modules: { name: string; weight: string; hours: number | null; assignments: { title: string; points: number; type: string }[] }[],
  courseCode: string,
  courseName: string,
  totalHours: number,
  uploadedById: string,
  batchId: string,
  result: DocxImportResult,
): Promise<DocxImportResult> {
  // Create/update course
  let course;
  try {
    course = await prisma.course.upsert({
      where: { code: courseCode },
      update: {
        name: courseName,
        description: `${courseName} — ${totalHours} total hours, ${modules.length} modules.`,
      },
      create: {
        name: courseName,
        code: courseCode,
        status: 'PUBLISHED',
        description: `${courseName} — ${totalHours} total hours, ${modules.length} modules.`,
      },
    });

    await createAuditLog({
      tableName: 'courses',
      recordId: course.id,
      action: 'BACKDATE_IMPORT',
      newValues: { name: courseName, code: courseCode, totalHours, moduleCount: modules.length },
      changedById: uploadedById,
      reason: `DOCX import batch ${batchId}`,
    });
  } catch (err: any) {
    result.errors.push(`Failed to create course: ${err.message}`);
    return result;
  }

  // Create modules and assignments
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];

    try {
      const weightNum = mod.weight ? parseFloat(mod.weight.replace('%', '')) : null;

      await prisma.module.create({
        data: {
          courseId: course.id,
          name: mod.name,
          weight: weightNum && !isNaN(weightNum) ? weightNum : null,
          hours: mod.hours,
          position: i + 1,
          published: true,
        },
      });
      result.modulesCreated++;

      for (const assignment of mod.assignments) {
        await prisma.assignment.create({
          data: {
            courseId: course.id,
            title: assignment.title,
            type: assignment.type === 'QUIZ' ? 'QUIZ' : 'ASSIGNMENT',
            points: assignment.points,
            published: true,
          },
        });
        result.assignmentsCreated++;
      }
    } catch (err: any) {
      result.errors.push(`Module "${mod.name}": ${err.message}`);
    }
  }

  return result;
}
