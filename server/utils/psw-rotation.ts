// PSW (Personal Support Worker) program rotation schedule.
// Single-track program. Each entry has explicit start + end. Two modules run
// in parallel from 11/3/2025 -> 1/26/2026 (Assisting the Family, Growth and
// Development AND Assisting the Dying Person), per the official schedule.

export type PswWindow = { start: Date; end: Date; module: string };

const RAW: Array<[string, string, string]> = [
  ['5/14/2025',  '5/28/2025',  'PSW Foundations'],
  ['5/28/2025',  '6/2/2025',   'Safety and Mobility'],
  ['6/2/2025',   '6/16/2025',  'Body Systems'],
  ['6/16/2025',  '6/23/2025',  'Assisting with Personal Hygiene'],
  ['6/23/2025',  '9/15/2025',  'Abuse and Neglect'],
  ['9/15/2025',  '10/20/2025', 'Household Management, Nutrition and Hydration'],
  ['10/20/2025', '11/3/2025',  'Care Planning / Restorative Care / Documentation / Working in the Community'],
  ['11/3/2025',  '1/26/2026',  'Assisting the Family, Growth and Development'],
  ['11/3/2025',  '1/26/2026',  'Assisting the Dying Person'], // parallel
  ['1/26/2026',  '2/23/2026',  'Assisting with Medications'],
  ['2/23/2026',  '3/9/2026',   'Cognitive / Mental Health Issues and Brain Injuries'],
  ['3/9/2026',   '3/16/2026',  'Health Conditions'],
  ['3/16/2026',  '3/23/2026',  'Gentle Persuasive Approaches in Dementia Care'],
  ['3/23/2026',  '6/23/2026',  'Clinical Placement (Facility)'],
  ['6/23/2026',  '9/15/2026',  'Clinical Placement (Community)'], // end estimated (~12 weeks)
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const PSW_WINDOWS: PswWindow[] = RAW
  .map(([s, e, m]) => ({ start: parseMdy(s), end: parseMdy(e), module: m }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());
