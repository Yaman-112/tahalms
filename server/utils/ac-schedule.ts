import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_PATH = path.join(__dirname, '..', 'data', 'AC-Schedule.txt');

// Maps schedule-side module name → canonical DB module name.
const SCHEDULE_TO_DB: Record<string, string> = {
  'ms word': 'Microsoft Word 2',
  'ms excel': 'Microsoft Excel 1 and Excel 2',
  'ms outlook': 'Microsoft Outlook',
  'ms powerpoint': 'Microsoft Powerpoint',
  'ms windows': 'Microsoft Windows',
  'payroll fundamentals 1': 'Payroll Fundamentals 1',
  'payroll fundamentals 2': 'Payroll Fundamental 2', // DB typo
  'office procedure': 'Office Procedures',
  'job search strategies': 'Job Search',
  'computerized accounting with sage 50': 'Computerized Accounting with Sage50/Sage300',
  'computerized accounting with sage 300': 'Computerized Accounting with Sage50/Sage300',
  'compterized accounting with sage 50': 'Computerized Accounting with Sage50/Sage300', // typo in user's schedule
  'income tax theory and practice': 'Canadian Income Tax',
  'accounting fundamentals and bookkeeping': 'Accounting Fundamentals and Book Keeping',
  'computerized accounting with quickbooks': 'Computerized Accounting with Quickbooks',
};

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Convert a schedule label to its canonical DB module name (or null if unknown). */
export function scheduleToDbModule(label: string): string | null {
  return SCHEDULE_TO_DB[normKey(label)] ?? null;
}

export type Session = { date: Date; modules: string[] }; // canonical DB module names for that week

let sessions: Session[] | null = null;

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
    if (!rawLine.trim()) continue;
    const parts = rawLine.split('\t');
    const dateStr = parts[0]?.trim();
    const date = dateStr ? parseUsDate(dateStr) : null;
    if (!date) continue;
    const labels = parts.slice(1).map(s => s.trim()).filter(Boolean);
    const mods: string[] = [];
    for (const label of labels) {
      if (/^winter break$/i.test(label)) continue;
      const db = scheduleToDbModule(label);
      if (db && !mods.includes(db)) mods.push(db);
    }
    sessions.push({ date, modules: mods });
  }
  sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return sessions;
}

function findStartIndex(startDate: Date): number {
  const s = load();
  for (let i = 0; i < s.length; i++) if (s[i].date >= startDate) return i;
  return -1;
}

/**
 * Returns map of DB module name → first session date on/after student's startDate.
 * Walks enough sessions to cover all 13 unique modules.
 */
export function getAcRotation(startDate: Date, limit = 13): Map<string, Date> {
  const s = load();
  const start = findStartIndex(startDate);
  const out = new Map<string, Date>();
  if (start < 0) return out;
  for (let i = start; i < s.length && out.size < limit; i++) {
    for (const m of s[i].modules) if (!out.has(m)) out.set(m, s[i].date);
  }
  return out;
}

/** First session date for a given DB module name on/after student's startDate. */
export function getAcFirstSessionDateForStudent(dbModuleName: string, startDate: Date): Date | null {
  const rot = getAcRotation(startDate);
  return rot.get(dbModuleName) ?? null;
}

/**
 * Returns the module's full run for this student: the first session date on/after startDate where
 * the module appears, and the last session date where it still appears before the rotation leaves
 * it permanently. Only sessions within the 13 modules the student is enrolled in (via rotation) are
 * considered, so later re-appearances in future course cycles are excluded.
 */
export function getAcModuleRun(dbModuleName: string, startDate: Date): { first: Date; last: Date } | null {
  const s = load();
  const start = findStartIndex(startDate);
  if (start < 0) return null;
  // Find the student's enrollment end: the week that introduces their 13th unique module.
  const seen = new Set<string>();
  let endIdx = s.length - 1;
  for (let i = start; i < s.length; i++) {
    for (const m of s[i].modules) seen.add(m);
    if (seen.size >= 13) { endIdx = i; break; }
  }
  let firstIdx = -1, lastIdx = -1;
  for (let i = start; i <= endIdx; i++) {
    if (s[i].modules.includes(dbModuleName)) {
      if (firstIdx < 0) firstIdx = i;
      lastIdx = i;
    }
  }
  if (firstIdx < 0) return null;
  return { first: s[firstIdx].date, last: s[lastIdx].date };
}
