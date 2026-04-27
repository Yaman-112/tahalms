// MOA (Medical Office Administration) program rotation schedule.
// Parallel structure: each weekly session may have a 1-week MS-Office filler
// AND a multi-week program module. Single track.
//
// Schedule->DB name mapping is required because the spreadsheet uses slightly
// different names than the DB module table (e.g. "MS Excel" -> the single
// "Microsoft Office Suite" module covering all MS-Office fillers).

export type MoaSession = { start: Date; filler: string | null; program: string };

const RAW: Array<[string, string | null, string]> = [
  ['7/14/2025',  'MS Excel',      'Medical Office Administrations'],
  ['7/21/2025',  null,            'Business Communication'],
  ['7/28/2025',  'MS Powerpoint', 'Business Communication'],
  ['8/4/2025',   null,            'Business Communication'],
  ['8/11/2025',  'MS Access',     'Business Communication'],
  ['8/18/2025',  null,            'Medical Coding and OHIP Billing'],
  ['8/25/2025',  'MS Word',       'Medical Coding and OHIP Billing'],
  ['9/1/2025',   null,            'Medical Coding and OHIP Billing'],
  ['9/8/2025',   'MS Excel',      'Medical Terminology'],
  ['9/15/2025',  null,            'Medical Terminology'],
  ['9/22/2025',  'MS Powerpoint', 'Medical Terminology'],
  ['9/29/2025',  null,            'Medical Terminology'],
  ['10/6/2025',  'MS Access',     'Anatomy and Physiology'],
  ['10/13/2025', null,            'Anatomy and Physiology'],
  ['10/20/2025', 'MS Word',       'Anatomy and Physiology'],
  ['10/27/2025', null,            'Anatomy and Physiology'],
  ['11/3/2025',  'MS Excel',      'Anatomy and Physiology'],
  ['11/10/2025', null,            'Medical Transcription'],
  ['11/17/2025', 'MS Powerpoint', 'Medical Transcription'],
  ['11/24/2025', null,            'Medical Transcription'],
  ['12/1/2025',  'MS Access',     'Job Strategy'],
  ['12/8/2025',  null,            'Medical Office Administrations'],
  ['12/15/2025', null,            'Medical Office Administrations'],
  ['12/22/2025', null,            'WINTER BREAK'],
  ['12/29/2025', null,            'Medical Office Administrations'],
  ['1/5/2026',   'MS Word',       'Medical Office Administrations'],
  ['1/12/2026',  null,            'Medical Office Administrations'],
  ['1/19/2026',  'MS Excel',      'Medical Office Administrations'],
  ['1/26/2026',  null,            'Medical Office Administrations'],
  ['2/2/2026',   'MS Powerpoint', 'Medical Office Administrations'],
  ['2/9/2026',   null,            'Medical Office Administrations'],
  ['2/16/2026',  'MS Access',     'Medical Office Administrations'],
  ['2/23/2026',  null,            'Medical Office Administrations'],
  ['3/2/2026',   'MS Word',       'Business Communication'],
  ['3/9/2026',   null,            'Business Communication'],
  ['3/16/2026',  'MS Excel',      'Business Communication'],
  ['3/23/2026',  null,            'Business Communication'],
  ['3/30/2026',  'MS Powerpoint', 'Medical Coding and OHIP Billing'],
  ['4/6/2026',   null,            'Medical Coding and OHIP Billing'],
  ['4/13/2026',  'MS Access',     'Medical Coding and OHIP Billing'],
  ['4/20/2026',  null,            'Medical Terminology'],
  ['4/27/2026',  'MS Word',       'Medical Terminology'],
  ['5/4/2026',   null,            'Medical Terminology'],
  ['5/11/2026',  'MS Excel',      'Medical Terminology'],
  ['5/18/2026',  null,            'Anatomy and Physiology'],
  ['5/25/2026',  'MS Powerpoint', 'Anatomy and Physiology'],
  ['6/1/2026',   null,            'Anatomy and Physiology'],
  ['6/8/2026',   'MS Access',     'Anatomy and Physiology'],
  ['6/15/2026',  null,            'Anatomy and Physiology'],
  ['6/22/2026',  'MS Word',       'Medical Transcription'],
  ['6/29/2026',  null,            'Medical Transcription'],
  ['7/6/2026',   'MS Excel',      'Medical Transcription'],
  ['7/13/2026',  null,            'Job Strategy'],
  ['7/20/2026',  'MS Powerpoint', 'Medical Office Administrations'],
  ['7/27/2026',  null,            'Medical Office Administrations'],
  ['8/3/2026',   'MS Access',     'Medical Office Administrations'],
  ['8/10/2026',  null,            'Medical Office Administrations'],
  ['8/17/2026',  'MS Word',       'Medical Office Administrations'],
  ['8/24/2026',  null,            'Medical Office Administrations'],
  ['8/31/2026',  'MS Excel',      'Medical Office Administrations'],
  ['9/7/2026',   null,            'Medical Office Administrations'],
  ['9/14/2026',  'MS Powerpoint', 'Medical Office Administrations'],
  ['9/21/2026',  null,            'Medical Office Administrations'],
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const MOA_SESSIONS: MoaSession[] = RAW
  .map(([d, f, p]) => ({ start: parseMdy(d), filler: f, program: p }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

const NAME_MAP: Record<string, string> = {
  // All MS-Office fillers map to the single MS suite module in the DB.
  'ms excel':                          'Microsoft Office Suite',
  'ms word':                           'Microsoft Office Suite',
  'ms powerpoint':                     'Microsoft Office Suite',
  'ms access':                         'Microsoft Office Suite',
  // Programs.
  'medical office administrations':    'Medical Office Procedure',
  'business communication':            'Business Communication',
  'medical coding and ohip billing':   'Medical Coding & OHIP Billing',
  'medical terminology':               'Medical Terminology',
  'anatomy and physiology':            'Anatomy and Physiology',
  'medical transcription':             'Medical Transcription',
  'job strategy':                      'Job Search Strategies',
};

export function moaDbModuleName(scheduleName: string): string | null {
  return NAME_MAP[scheduleName.toLowerCase().trim()] ?? null;
}
