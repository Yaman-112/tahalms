import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export type Track = 'weekday' | 'weekend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_PATH = path.join(__dirname, '..', 'data', 'HT-Schedule.txt');

// module name (lowercased, stripped) -> first session start (Date)
type TrackMap = Map<string, Date>;

let weekdayFirst: TrackMap | null = null;
let weekendFirst: TrackMap | null = null;

function normalizeModuleName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/&/g, 'and');
}

function parseUsDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const mo = parseInt(m[1], 10) - 1;
  const da = parseInt(m[2], 10);
  let yr = parseInt(m[3], 10);
  if (yr < 100) yr += 2000;
  return new Date(Date.UTC(yr, mo, da));
}

function load() {
  if (weekdayFirst && weekendFirst) return;
  weekdayFirst = new Map();
  weekendFirst = new Map();

  if (!fs.existsSync(SCHEDULE_PATH)) return;
  const raw = fs.readFileSync(SCHEDULE_PATH, 'utf8');
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const [dateStr, labelRaw] = line.split(/\s+(.*)/, 2);
    if (!dateStr || !labelRaw) continue;
    const date = parseUsDate(dateStr);
    if (!date) continue;
    const m = labelRaw.match(/^(Weekday|Weekend)\s*-\s*(.+)$/i);
    if (!m) continue;
    const track = m[1].toLowerCase() as Track;
    const moduleName = m[2].trim();
    if (/^winter break$/i.test(moduleName)) continue;
    const key = normalizeModuleName(moduleName);
    const target = track === 'weekend' ? weekendFirst! : weekdayFirst!;
    const prev = target.get(key);
    if (!prev || date < prev) target.set(key, date);
  }
}

export function detectHtTrack(classDays: string | null | undefined): Track {
  if (!classDays) return 'weekday';
  const s = classDays.toLowerCase();
  if (/(friday|saturday|sunday|weekend)/.test(s) && !/monday.*thursday/.test(s)) return 'weekend';
  return 'weekday';
}

export function getHtFirstSessionDate(moduleName: string, track: Track): Date | null {
  load();
  const map = track === 'weekend' ? weekendFirst! : weekdayFirst!;
  return map.get(normalizeModuleName(moduleName)) ?? null;
}
