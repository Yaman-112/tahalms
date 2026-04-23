import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_PATH = path.join(__dirname, '..', 'data', 'CSW-Schedule.txt');

export type Session = { date: Date; module: string };

let sessions: Session[] | null = null;

function normalize(name: string): string {
  // Strip "(M##)" suffix; lowercase; squash whitespace; normalize ampersands/commas.
  return name
    .replace(/\s*\(M\d+\)\s*$/i, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/&/g, 'and');
}

function parseUsDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let yr = parseInt(m[3], 10);
  if (yr < 100) yr += 2000;
  return new Date(Date.UTC(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10)));
}

function load() {
  if (sessions) return sessions;
  sessions = [];
  if (!fs.existsSync(SCHEDULE_PATH)) return sessions;
  const raw = fs.readFileSync(SCHEDULE_PATH, 'utf8');
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [dateStr, ...rest] = line.split(/\s+/);
    const label = rest.join(' ').trim();
    const date = parseUsDate(dateStr);
    if (!date || !label) continue;
    if (/^winter break$/i.test(label.replace(/\s*\(.+\)\s*$/, '').trim())) continue;
    sessions.push({ date, module: normalize(label) });
  }
  sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return sessions;
}

/** First session on/after startDate for any module. */
export function findCswStartIndex(startDate: Date): number {
  const s = load();
  for (let i = 0; i < s.length; i++) if (s[i].date >= startDate) return i;
  return -1;
}

/**
 * Returns the student's rotation: the first N (default 19) unique modules on/after their startDate.
 * Keys are normalized module names.
 */
export function getCswRotation(startDate: Date, limit = 19): Map<string, Date> {
  const s = load();
  const start = findCswStartIndex(startDate);
  const out = new Map<string, Date>();
  if (start < 0) return out;
  for (let i = start; i < s.length && out.size < limit; i++) {
    if (!out.has(s[i].module)) out.set(s[i].module, s[i].date);
  }
  return out;
}

/** First session date for `moduleName` that is on/after startDate. Null if none found. */
export function getCswFirstSessionDateForStudent(moduleName: string, startDate: Date): Date | null {
  const s = load();
  const start = findCswStartIndex(startDate);
  if (start < 0) return null;
  const key = normalize(moduleName);
  for (let i = start; i < s.length; i++) {
    if (s[i].module === key) return s[i].date;
  }
  return null;
}

/**
 * Returns the module's full run for this student: the first session on/after startDate and the
 * last consecutive session of the same module (before the rotation moves to a different module).
 */
export function getCswModuleRun(moduleName: string, startDate: Date): { first: Date; last: Date } | null {
  const s = load();
  const start = findCswStartIndex(startDate);
  if (start < 0) return null;
  const key = normalize(moduleName);
  let firstIdx = -1;
  for (let i = start; i < s.length; i++) {
    if (s[i].module === key) { firstIdx = i; break; }
  }
  if (firstIdx < 0) return null;
  let lastIdx = firstIdx;
  for (let i = firstIdx + 1; i < s.length; i++) {
    if (s[i].module === key) lastIdx = i;
    else break;
  }
  return { first: s[firstIdx].date, last: s[lastIdx].date };
}

/** Normalize helper exported for callers that compare against module names. */
export function normalizeCswModuleName(name: string): string {
  return normalize(name);
}
