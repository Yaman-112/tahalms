import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function arg(name: string): string | undefined {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const COURSE_CODE = arg('course');
const SRC_FOLDER = arg('folder');
const UPLOADED_BY = arg('uploader') || process.env.BACKFILL_ADMIN_ID;
const WRITE = process.argv.includes('--write');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const REMOTE_URL = arg('remote');
const REMOTE_EMAIL = arg('email');
const REMOTE_PASSWORD = arg('password') || process.env.REMOTE_ADMIN_PASSWORD;

if (!COURSE_CODE || !SRC_FOLDER) {
  console.error('Usage: --course=<CODE> --folder=<absolute path> [--write] [--uploader=<userId>]');
  process.exit(1);
}

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};

function* walk(dir: string, base: string = dir): Generator<{ abs: string; rel: string; folder: string; name: string }> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs, base);
    else if (entry.isFile()) {
      const rel = path.relative(base, abs);
      const folder = path.dirname(rel) === '.' ? '' : path.dirname(rel);
      yield { abs, rel, folder, name: entry.name };
    }
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function loginRemote(baseUrl: string, email: string, password: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const body: any = await res.json();
  const token = body?.data?.accessToken || body?.accessToken;
  if (!token) throw new Error(`Login response missing accessToken: ${JSON.stringify(body)}`);
  return token;
}

async function uploadRemote(baseUrl: string, token: string, courseId: string, file: { abs: string; name: string; folder: string }): Promise<void> {
  const fd = new FormData();
  const buf = fs.readFileSync(file.abs);
  fd.append('file', new Blob([buf]), file.name);
  if (file.folder) fd.append('folder', file.folder);
  const res = await fetch(`${baseUrl}/api/courses/${courseId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload failed for ${file.name}: ${res.status} ${await res.text()}`);
}

async function run() {
  const isRemote = !!REMOTE_URL;
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN'}${isRemote ? ' (REMOTE)' : ' (LOCAL)'}`);
  console.log(`Source: ${SRC_FOLDER}`);
  if (isRemote) console.log(`Remote: ${REMOTE_URL}`);
  else console.log(`Upload dir: ${UPLOAD_DIR}`);

  const course = await prisma.course.findUnique({ where: { code: COURSE_CODE } });
  if (!course) { console.error(`Course ${COURSE_CODE} not found`); process.exit(1); }
  console.log(`Course: ${course.code} — ${course.name} (${course.id})`);

  const files = Array.from(walk(SRC_FOLDER!));
  const totalBytes = files.reduce((s, f) => s + fs.statSync(f.abs).size, 0);
  console.log(`Found ${files.length} files (${formatBytes(totalBytes)})\n`);

  let remoteToken: string | null = null;
  if (isRemote && WRITE) {
    if (!REMOTE_EMAIL || !REMOTE_PASSWORD) {
      console.error('ERROR: --remote requires --email=<admin> and --password=<pw> (or REMOTE_ADMIN_PASSWORD env)');
      process.exit(1);
    }
    console.log(`Logging in to ${REMOTE_URL}...`);
    remoteToken = await loginRemote(REMOTE_URL!, REMOTE_EMAIL, REMOTE_PASSWORD);
    console.log('Authenticated.\n');
  }

  const destBase = path.join(UPLOAD_DIR, 'course-files', course.id);
  if (WRITE && !isRemote && !fs.existsSync(destBase)) fs.mkdirSync(destBase, { recursive: true });

  let saved = 0, bytesDone = 0;
  const t0 = Date.now();
  for (const f of files) {
    const stat = fs.statSync(f.abs);
    const ext = path.extname(f.name).toLowerCase();
    const mime = MIME_BY_EXT[ext] || 'application/octet-stream';

    console.log(`  ${WRITE ? '>' : '·'} ${f.folder ? f.folder + '/' : ''}${f.name}  (${formatBytes(stat.size)})`);

    if (WRITE) {
      if (isRemote) {
        await uploadRemote(REMOTE_URL!, remoteToken!, course.id, { abs: f.abs, name: f.name, folder: f.folder });
      } else {
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storedName = `${randomUUID()}-${safeName}`;
        const dest = path.join(destBase, storedName);
        const rel = path.relative(UPLOAD_DIR, dest);
        fs.copyFileSync(f.abs, dest);
        await prisma.courseFile.create({
          data: {
            courseId: course.id,
            fileName: f.name,
            folder: f.folder,
            filePath: rel,
            fileSize: stat.size,
            mimeType: mime,
            uploadedById: UPLOADED_BY || null,
          },
        });
      }
      saved++;
    }
    bytesDone += stat.size;
  }

  const dur = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone. ${WRITE ? `Saved ${saved}/${files.length} files (${formatBytes(bytesDone)}) in ${dur}s${isRemote ? ` to ${REMOTE_URL}` : ` to DB + ${destBase}`}` : 'DRY RUN — re-run with --write to commit.'}`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
