// Hairstyling (HAIR) program rotation. Single track. The last 4 modules
// share a 6/15/2026 start with no individual end dates and are modeled as
// parallel running ~12 weeks (estimated end 9/7/2026).

export type HairWindow = { start: Date; end: Date; module: string };

const RAW: Array<[string, string, string]> = [
  ['8/4/2025',   '9/8/2025',   'Ethics, Regulations and Policy'],
  ['9/8/2025',   '11/3/2025',  'Health and Safety'],
  ['11/3/2025',  '12/1/2025',  'Entrepreneurial Skills'],
  ['12/1/2025',  '1/12/2026',  'Professional Development'],
  ['1/12/2026',  '2/16/2026',  'Client Service'],
  ['2/16/2026',  '3/23/2026',  'Preparatory Procedures and Treatments'],
  ['3/23/2026',  '5/18/2026',  'Haircutting'],
  ['5/18/2026',  '6/15/2026',  'Styling Hair'],
  // Final 4 modules run parallel from 6/15 -> ~9/7
  ['6/15/2026',  '9/7/2026',   'Permanent Wave Hair'],
  ['6/15/2026',  '9/7/2026',   'Color and Lightener'],
  ['6/15/2026',  '9/7/2026',   'Chemically Relaxing Hair'],
  ['6/15/2026',  '9/7/2026',   'Hair Additions'],
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const HAIR_WINDOWS: HairWindow[] = RAW
  .map(([s, e, m]) => ({ start: parseMdy(s), end: parseMdy(e), module: m }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

const NAME_MAP: Record<string, string> = {
  'ethics, regulations and policy':         'Ethics, Regulations and Policy',
  'health and safety':                      'Health and Safety',
  'entrepreneurial skills':                 'Entrepreneurial Skills',
  'professional development':               'Professional Development',
  'client service':                         'Client Service',
  'preparatory procedures and treatments':  'Preparatory Procedures and Treatments',
  'haircutting':                            'Cut Hair',
  'styling hair':                           'Style Hair',
  'permanent wave hair':                    'Permanent Wave Hair',
  'color and lightener':                    'Colour and Lighten Hair',
  'chemically relaxing hair':               'Chemically Relax Hair',
  'hair additions':                         'Hair Additions',
};

export function hairDbModuleName(scheduleName: string): string | null {
  return NAME_MAP[scheduleName.toLowerCase().trim()] ?? null;
}
