// ECA (Early Childcare Assistant) rotation schedule. Single track.
// Each row's window ends at the next row's start.

export type EcaWindow = { start: Date; end: Date; module: string };

const RAW: Array<[string, string, string]> = [
  ['2/23/2026',  '3/10/2026',  'Observation Skills'],
  ['3/10/2026',  '3/25/2026',  'Health Safety and Nutrition'],
  ['3/25/2026',  '4/9/2026',   'Play-Based Early Learning Strategies'],
  ['4/9/2026',   '4/28/2026',  'Child, Family and Community'],
  ['4/28/2026',  '5/13/2026',  'Introduction to Sociology'],
  ['5/13/2026',  '5/28/2026',  'Language and Literacy'],
  ['5/28/2026',  '6/12/2026',  'Introduction to Psychology'],
  ['6/12/2026',  '6/30/2026',  'Guiding Children Behavior'],
  ['6/30/2026',  '7/16/2026',  'Communications'],
  ['7/16/2026',  '8/3/2026',   'Special Needs'],
  ['8/3/2026',   '9/3/2026',   'Foundations of Early Childhood Education'],
  ['9/3/2026',   '10/6/2026',  'Infant and Child Development'],
  ['10/6/2026',  '10/19/2026', 'Creating Inclusive Environments'],
  ['10/19/2026', '11/19/2026', 'Practicum'],   // end estimated (~4 weeks)
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const ECA_WINDOWS: EcaWindow[] = RAW
  .map(([s, e, m]) => ({ start: parseMdy(s), end: parseMdy(e), module: m }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

const NAME_MAP: Record<string, string> = {
  'observation skills':                          'Observation Skills',
  'health safety and nutrition':                 'Health, Safety and Nutrition',
  'play-based early learning strategies':        'Play-Based Early Learning Strategies',
  'child, family and community':                 'Child, Family and Community',
  'introduction to sociology':                   'Introduction to Sociology',
  'language and literacy':                       'Language and Literacy',
  'introduction to psychology':                  'Introduction to Psychology',
  'guiding children behavior':                   "Guiding Children's Behaviour",
  'communications':                              'Communications',
  'special needs':                               'Special Needs',
  'foundations of early childhood education':    'Foundations of Early Childhood Education',
  'infant and child development':                'Infant and Child Development',
  'creating inclusive environments':             'Creating Inclusive Programs',
  'practicum':                                   'Practicum II',
};

export function ecaDbModuleName(scheduleName: string): string | null {
  return NAME_MAP[scheduleName.toLowerCase().trim()] ?? null;
}
