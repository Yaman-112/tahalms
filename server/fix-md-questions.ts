import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const dbUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fix() {
  const assignment = await prisma.assignment.findUnique({
    where: { id: 'cmnxhv6x70002upua8kzmee23' },
    include: { questions: { orderBy: { position: 'asc' }, include: { options: true } } },
  });

  if (!assignment) { console.log('Not found'); process.exit(1); }

  console.log(`Assignment: ${assignment.title}`);
  console.log(`Questions: ${assignment.questions.length}`);

  // Delete all and re-import cleanly with just 45
  await prisma.question.deleteMany({ where: { assignmentId: assignment.id } });
  console.log('Deleted all questions. Re-importing...');

  // Re-read the file and import
  const fs = await import('fs');
  const content = fs.readFileSync('/Users/yaman/Downloads/MD_Question_Banks/01_Health_Safety_Sanitation_Infection_Control_Final.txt', 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  const questions: any[] = [];
  let current: any = null;

  for (const line of lines) {
    if (line.startsWith('Module ') || line.startsWith('Final Exam')) continue;
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      if (current) questions.push(current);
      current = { text: qMatch[2], options: [], correctIndex: -1 };
      continue;
    }
    const optMatch = line.match(/^([A-F])\)\s+(.+)/);
    if (optMatch && current) {
      current.options.push({ label: optMatch[1], text: optMatch[2] });
      continue;
    }
    const ansMatch = line.match(/^Answer:\s*([A-F])/);
    if (ansMatch && current) {
      current.correctIndex = current.options.findIndex((o: any) => o.label === ansMatch[1]);
      continue;
    }
  }
  if (current) questions.push(current);

  console.log(`Parsed ${questions.length} questions`);

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

  console.log(`✓ Imported ${questions.length} questions cleanly`);
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
