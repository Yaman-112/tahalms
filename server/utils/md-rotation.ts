// MD (Medical Aesthetics Diploma) rotation. Single track. The final 5 modules
// share a 6/22/2026 start with no end date in the source — treated as
// parallel running through ~9/14/2026 (estimated ~12 weeks).

export type MdWindow = { start: Date; end: Date; module: string };

const RAW: Array<[string, string, string]> = [
  ['8/11/2025',  '9/2/2025',   'Health & Safety, Sanitation & Infection Prevention'],
  ['9/2/2025',   '10/14/2025', 'Nail Care'],
  ['10/14/2025', '11/24/2025', 'Makeup Artistry'],
  ['11/24/2025', '3/23/2026',  'Facials/Skincare'],
  ['3/23/2026',  '3/31/2026',  'Microdermabrasion'],
  ['3/31/2026',  '5/18/2026',  'Waxing'],
  ['5/18/2026',  '6/22/2026',  'Body Relaxing Massage'],
  // Final 5 modules run in parallel 6/22 -> ~9/14 (estimated)
  ['6/22/2026',  '9/14/2026',  'Chemical Peels'],
  ['6/22/2026',  '9/14/2026',  'Body Treatments Aromatherapy/ Body Wraps & Exfoliation'],
  ['6/22/2026',  '9/14/2026',  'Employment Preparation, Soft Skills & Business Skills'],
  ['6/22/2026',  '9/14/2026',  'Photo Rejuvenation'],
  ['6/22/2026',  '9/14/2026',  'Laser/Light Hair Removal'],
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const MD_WINDOWS: MdWindow[] = RAW
  .map(([s, e, m]) => ({ start: parseMdy(s), end: parseMdy(e), module: m }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());
