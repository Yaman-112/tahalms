import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_PATH = path.join(__dirname, '..', 'data', 'MOA-Schedule.txt');

// Schedule label → canonical DB module name.
const SCHEDULE_TO_DB: Record<string, string> = {
  'medical office administrations': 'Medical Office Procedure',
  'business communication': 'Business Communication',
  'medical coding and ohip billing': 'Medical Coding & OHIP Billing',
  'medical terminology': 'Medical Terminology',
  'anatomy and physiology': 'Anatomy and Physiology',
  'medical transcription': 'Medical Transcription',
  'job strategy': 'Job Search Strategies',
  'ms excel': 'Microsoft Office Suite',
  'ms word': 'Microsoft Office Suite',
  'ms access': 'Microsoft Office Suite',
  'ms powerpoint': 'Microsoft Office Suite',
};

function normKey(s: string): string { return s.trim().toLowerCase().replace(/\s+/g, ' '); }

export function scheduleToDbModule(label: string): string | null {
  return SCHEDULE_TO_DB[normKey(label)] ?? null;
}

export type Session = { date: Date; modules: string[] };
let sessions: Session[] | null = null;

function parseUsDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  let yr = parseInt(m[3], 10); if (yr < 100) yr += 2000;
  return new Date(Date.UTC(yr, parseInt(m[1], 10) - 1, parseInt(m[2], 10)));
}

function load(): Session[] {
  if (sessions) return sessions;
  sessions = [];
  if (!fs.existsSync(SCHEDULE_PATH)) return sessions;
  const raw = fs.readFileSync(SCHEDULE_PATH, 'utf8');
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const date = parts[0] ? parseUsDate(parts[0].trim()) : null;
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

export function getMoaRotation(startDate: Date, limit = 8): Map<string, Date> {
  const s = load();
  const start = findStartIndex(startDate);
  const out = new Map<string, Date>();
  if (start < 0) return out;
  for (let i = start; i < s.length && out.size < limit; i++) {
    for (const m of s[i].modules) if (!out.has(m)) out.set(m, s[i].date);
  }
  return out;
}

export function getMoaFirstSessionDateForStudent(dbModuleName: string, startDate: Date): Date | null {
  return getMoaRotation(startDate).get(dbModuleName) ?? null;
}

export function getMoaModuleRun(dbModuleName: string, startDate: Date, limit = 8): { first: Date; last: Date } | null {
  const s = load();
  const start = findStartIndex(startDate);
  if (start < 0) return null;
  const seen = new Set<string>();
  let endIdx = s.length - 1;
  for (let i = start; i < s.length; i++) {
    for (const m of s[i].modules) seen.add(m);
    if (seen.size >= limit) { endIdx = i; break; }
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
