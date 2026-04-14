import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import fs from 'fs';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Parse a question bank txt file — supports two formats:
// Format 1 (MD): "1. Question\nA) Option\nAnswer: A"
// Format 2 (ECA): "Q1. Question\n   A) Option\n  *B) Correct option"
function parseQuestionBank(content: string) {
  const lines = content.split('\n');
  const questions: any[] = [];
  let current: any = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Skip comment/header lines
    if (line.startsWith('#') || line.startsWith('Module ') || line.startsWith('Final Exam') || line.startsWith('Midterm')) continue;
    // Skip point info lines
    if (/^\d+ Questions/.test(line)) continue;

    // New question: "1. Question" or "Q1. Question" or "Q1) Question"
    const qMatch = line.match(/^Q?(\d+)[\.\)]\s+(.+)/);
    if (qMatch) {
      if (current) questions.push(current);
      let text = qMatch[2];
      // Remove [GEN] tag
      text = text.replace(/^\[GEN\]\s*/, '');
      current = { text, options: [], correctIndex: -1 };
      continue;
    }

    // Option with * prefix (correct answer): "  *A) Option text"
    const starOptMatch = rawLine.match(/^\s*\*([A-F])\)\s+(.+)/);
    if (starOptMatch && current) {
      current.correctIndex = current.options.length;
      current.options.push({ label: starOptMatch[1], text: starOptMatch[2] });
      continue;
    }

    // Regular option: "A) Option" or "   A) Option"
    const optMatch = rawLine.match(/^\s*([A-F])\)\s+(.+)/);
    if (optMatch && current) {
      current.options.push({ label: optMatch[1], text: optMatch[2] });
      continue;
    }

    // Answer line: "Answer: A"
    const ansMatch = line.match(/^Answer:\s*([A-F])/);
    if (ansMatch && current) {
      const correctLabel = ansMatch[1];
      current.correctIndex = current.options.findIndex((o: any) => o.label === correctLabel);
      continue;
    }
  }
  if (current) questions.push(current);

  return questions;
}

async function importQuestionBank(filePath: string, courseCode: string, moduleName: string, assignmentTitle: string) {
  console.log(`Importing: ${assignmentTitle}`);
  console.log(`  Course: ${courseCode}, Module: ${moduleName}\n`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const questions = parseQuestionBank(content);
  console.log(`  Parsed ${questions.length} questions\n`);

  // Find the course
  const course = await prisma.course.findUnique({ where: { code: courseCode } });
  if (!course) { console.error(`Course not found: ${courseCode}`); process.exit(1); }

  // Find or create the assignment
  let assignment = await prisma.assignment.findFirst({
    where: { courseId: course.id, title: assignmentTitle },
  });

  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: assignmentTitle,
        type: 'QUIZ',
        format: 'MCQ',
        points: questions.length * 2,
        published: true,
        showResults: true,
        description: `${moduleName} — ${questions.length} questions`,
      },
    });
    console.log(`  Created assignment: ${assignmentTitle}`);
  } else {
    // Update format to MCQ
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { format: 'MCQ', type: 'QUIZ', points: questions.length * 2, showResults: true },
    });
    console.log(`  Updated existing assignment: ${assignmentTitle}`);
  }

  // Delete old questions
  await prisma.question.deleteMany({ where: { assignmentId: assignment.id } });

  // Create questions
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.question.create({
      data: {
        assignmentId: assignment.id,
        type: 'MCQ',
        text: q.text,
        points: 2,
        position: i + 1,
        required: true,
        options: {
          create: q.options.map((opt: any, j: number) => ({
            text: opt.text,
            isCorrect: j === q.correctIndex,
            position: j + 1,
          })),
        },
      },
    });
  }

  console.log(`  ✓ Imported ${questions.length} MCQ questions (${questions.length * 2} points)`);
}

// Get args
const filePath = process.argv[2];
const courseCode = process.argv[3];
const moduleName = process.argv[4];
const assignmentTitle = process.argv[5];

if (!filePath || !courseCode || !moduleName || !assignmentTitle) {
  console.log('Usage: npx tsx server/import-question-bank.ts <file> <courseCode> <moduleName> <assignmentTitle>');
  process.exit(1);
}

importQuestionBank(filePath, courseCode, moduleName, assignmentTitle)
  .then(() => { console.log('\nDone!'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
