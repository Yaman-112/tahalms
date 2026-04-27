// CSW program rotation schedule.
// Single-track program. Each session has a start date and runs until the
// next session's start. Modules repeat ~13 months later for late joiners.

export type CswSession = {
  start: Date;
  end: Date;
  module: string; // canonical module name (without trailing "(M##)")
};

const RAW: Array<[string, string, string]> = [
  // start, end, module name (use 'WINTER BREAK' to mark a non-teaching gap)
  ['8/4/2025',   '8/25/2025',  'Basic Counselling Techniques'],
  ['8/25/2025',  '9/8/2025',   'Solution-Focused Intervention Techniques'],
  ['9/8/2025',   '10/6/2025',  'Family Development, Functions, and Social Issues'],
  ['10/6/2025',  '10/27/2025', 'Introduction to Psychology'],
  ['10/27/2025', '11/3/2025',  'Professional Documentation & Case Management'],
  ['11/3/2025',  '12/1/2025',  'Behaviour Modification'],
  ['12/1/2025',  '12/22/2025', 'Support Resources & Community Capacity Building'],
  ['12/22/2025', '1/5/2026',   'WINTER BREAK'],
  ['1/5/2026',   '1/19/2026',  'Essential Skills'],
  ['1/19/2026',  '2/2/2026',   'Microsoft Windows'],
  ['2/2/2026',   '3/2/2026',   'Inclusive Communication Skills'],
  ['3/2/2026',   '3/23/2026',  'Introduction to Community Service Work'],
  ['3/23/2026',  '4/6/2026',   'Employment Achievement Strategies'],
  ['4/6/2026',   '4/20/2026',  'Basic Business Communications'],
  ['4/20/2026',  '5/11/2026',  'Harm Reduction and Crisis Intervention'],
  ['5/11/2026',  '5/25/2026',  'Introduction to Sociology'],
  ['5/25/2026',  '6/29/2026',  'Mental Health & Addictions'],
  ['6/29/2026',  '7/27/2026',  'Populations at Risk'],
  ['7/27/2026',  '8/17/2026',  'Law for Support Workers'],
  ['8/17/2026',  '8/31/2026',  'Self Care and Team Building'],
  ['8/31/2026',  '9/21/2026',  'Basic Counselling Techniques'],                   // repeat
  ['9/21/2026',  '10/5/2026',  'Solution-Focused Intervention Techniques'],        // repeat
  ['10/5/2026',  '11/2/2026',  'Family Development, Functions, and Social Issues'],// repeat
  ['11/2/2026',  '11/23/2026', 'Introduction to Psychology'],                      // repeat
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const CSW_SESSIONS: CswSession[] = RAW
  .map(([s, e, mod]) => ({ start: parseMdy(s), end: parseMdy(e), module: mod }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

export function getCswCurrentSession(at: Date): CswSession | null {
  const t = at.getTime();
  for (const s of CSW_SESSIONS) {
    if (t >= s.start.getTime() && t < s.end.getTime()) return s;
  }
  return null;
}

export function getCswCurrentModule(at: Date): string | null {
  const s = getCswCurrentSession(at);
  if (!s) return null;
  if (/winter break/i.test(s.module)) return null;
  return s.module;
}
