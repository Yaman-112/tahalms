// AC (Accounting, Payroll, Business & Tax) WEEKDAY rotation schedule.
// Each weekly session may have both a "Filler Module" (1-week MS-Office unit)
// and a multi-week "Program Module" running in parallel. Both are tracked.
//
// NOTE: only the weekday schedule was provided. Weekend batches (ACW*) are
// not yet covered.

export type AcSession = {
  start: Date;       // session start (inclusive)
  filler: string | null;
  program: string;   // canonical name (or 'WINTER BREAK')
};

const RAW: Array<[string, string | null, string]> = [
  ['8/4/2025',   'MS Word',       'Payroll Fundamentals 1'],
  ['8/11/2025',  null,            'Payroll Fundamentals 1'],
  ['8/18/2025',  'MS Excel',      'Payroll Fundamentals 2'],
  ['8/25/2025',  null,            'Payroll Fundamentals 2'],
  ['9/1/2025',   'MS Outlook',    'Payroll Fundamentals 2'],
  ['9/8/2025',   'MS PowerPoint', 'Office Procedure'],
  ['9/15/2025',  'MS Windows',    'Office Procedure'],
  ['9/22/2025',  'MS Word',       'Office Procedure'],
  ['9/29/2025',  null,            'Office Procedure'],
  ['10/6/2025',  'MS Excel',      'Office Procedure'],
  ['10/13/2025', null,            'Job Search Strategies'],
  ['10/20/2025', 'MS Outlook',    'Computerized Accounting with Sage 50'],
  ['10/27/2025', 'MS PowerPoint', 'Computerized Accounting with Sage 50'],
  ['11/3/2025',  'MS Windows',    'Computerized Accounting with Sage 50'],
  ['11/10/2025', 'MS Word',       'Computerized Accounting with Sage 50'],
  ['11/17/2025', 'MS Excel',      'Computerized Accounting with Sage 50'],
  ['11/24/2025', null,            'Computerized Accounting with Sage 50'],
  ['12/1/2025',  null,            'Computerized Accounting with Sage 50'],
  ['12/8/2025',  'MS Outlook',    'Computerized Accounting with Sage 300'],
  ['12/15/2025', 'MS PowerPoint', 'Computerized Accounting with Sage 300'],
  ['12/22/2025', null,            'WINTER BREAK'],
  ['12/29/2025', 'MS Windows',    'Computerized Accounting with Sage 300'],
  ['1/5/2026',   'MS Word',       'Computerized Accounting with Sage 300'],
  ['1/12/2026',  'MS Excel',      'Income Tax Theory and Practice'],
  ['1/19/2026',  null,            'Income Tax Theory and Practice'],
  ['1/26/2026',  null,            'Income Tax Theory and Practice'],
  ['2/2/2026',   'MS Outlook',    'Income Tax Theory and Practice'],
  ['2/9/2026',   'MS PowerPoint', 'Accounting Fundamentals and Bookkeeping'],
  ['2/16/2026',  'MS Windows',    'Accounting Fundamentals and Bookkeeping'],
  ['2/23/2026',  'MS Word',       'Accounting Fundamentals and Bookkeeping'],
  ['3/2/2026',   null,            'Accounting Fundamentals and Bookkeeping'],
  ['3/9/2026',   'MS Excel',      'Accounting Fundamentals and Bookkeeping'],
  ['3/16/2026',  null,            'Accounting Fundamentals and Bookkeeping'],
  ['3/23/2026',  'MS Outlook',    'Accounting Fundamentals and Bookkeeping'],
  ['3/30/2026',  'MS PowerPoint', 'Accounting Fundamentals and Bookkeeping'],
  ['4/6/2026',   'MS Windows',    'Accounting Fundamentals and Bookkeeping'],
  ['4/13/2026',  'MS Word',       'Accounting Fundamentals and Bookkeeping'],
  ['4/20/2026',  'MS Excel',      'Accounting Fundamentals and Bookkeeping'],
  ['4/27/2026',  null,            'Accounting Fundamentals and Bookkeeping'],
  ['5/4/2026',   null,            'Computerized Accounting with Quickbooks'],
  ['5/11/2026',  'MS Outlook',    'Computerized Accounting with Quickbooks'],
  ['5/18/2026',  'MS PowerPoint', 'Computerized Accounting with Quickbooks'],
  ['5/25/2026',  'MS Windows',    'Computerized Accounting with Quickbooks'],
  ['6/1/2026',   'MS Word',       'Computerized Accounting with Quickbooks'],
  ['6/8/2026',   'MS Excel',      'Computerized Accounting with Quickbooks'],
  ['6/15/2026',  null,            'Payroll Fundamentals 1'],
  ['6/22/2026',  null,            'Payroll Fundamentals 1'],
  ['6/29/2026',  'MS Outlook',    'Payroll Fundamentals 2'],
  ['7/6/2026',   'MS PowerPoint', 'Payroll Fundamentals 2'],
  ['7/13/2026',  'MS Windows',    'Payroll Fundamentals 2'],
  ['7/20/2026',  'MS Word',       'Office Procedure'],
  ['7/27/2026',  'MS Excel',      'Office Procedure'],
  ['8/3/2026',   null,            'Office Procedure'],
  ['8/10/2026',  null,            'Office Procedure'],
  ['8/17/2026',  'MS Outlook',    'Office Procedure'],
  ['8/24/2026',  'MS PowerPoint', 'Job Search Strategies'],
  ['8/31/2026',  'MS Windows',    'Computerized Accounting with Sage 50'],
  ['9/7/2026',   'MS Word',       'Computerized Accounting with Sage 50'],
  ['9/14/2026',  'MS Excel',      'Computerized Accounting with Sage 50'],
  ['9/21/2026',  null,            'Computerized Accounting with Sage 50'],
  ['9/28/2026',  null,            'Computerized Accounting with Sage 50'],
  ['10/5/2026',  'MS Outlook',    'Computerized Accounting with Sage 50'],
  ['10/12/2026', 'MS PowerPoint', 'Computerized Accounting with Sage 50'],
  ['10/19/2026', 'MS Windows',    'Computerized Accounting with Sage 300'],
  ['10/26/2026', 'MS Word',       'Computerized Accounting with Sage 300'],
  ['11/2/2026',  'MS Excel',      'Computerized Accounting with Sage 300'],
  ['11/9/2026',  null,            'Computerized Accounting with Sage 300'],
  ['11/16/2026', null,            'Income Tax Theory and Practice'],
  ['11/23/2026', 'MS Outlook',    'Income Tax Theory and Practice'],
  ['11/30/2026', 'MS PowerPoint', 'Income Tax Theory and Practice'],
  ['12/7/2026',  'MS Windows',    'Income Tax Theory and Practice'],
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const AC_SESSIONS: AcSession[] = RAW
  .map(([d, f, p]) => ({ start: parseMdy(d), filler: f, program: p }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

// Map schedule names → DB module names (some differ in spelling/grouping).
const NAME_MAP: Record<string, string> = {
  'ms word':                                  'Microsoft Word 2',
  'ms excel':                                 'Microsoft Excel 1 and Excel 2',
  'ms outlook':                               'Microsoft Outlook',
  'ms powerpoint':                            'Microsoft Powerpoint',
  'ms windows':                               'Microsoft Windows',
  'payroll fundamentals 1':                   'Payroll Fundamentals 1',
  'payroll fundamentals 2':                   'Payroll Fundamental 2',
  'office procedure':                         'Office Procedures',
  'job search strategies':                    'Job Search',
  'computerized accounting with sage 50':     'Computerized Accounting with Sage50/Sage300',
  'compterized accounting with sage 50':      'Computerized Accounting with Sage50/Sage300',
  'computerized accounting with sage 300':    'Computerized Accounting with Sage50/Sage300',
  'income tax theory and practice':           'Canadian Income Tax',
  'accounting fundamentals and bookkeeping':  'Accounting Fundamentals and Book Keeping',
  'computerized accounting with quickbooks':  'Computerized Accounting with Quickbooks',
};

export function acDbModuleName(scheduleName: string): string | null {
  return NAME_MAP[scheduleName.toLowerCase().trim()] ?? null;
}

export function acIsWeekday(batchCode: string | null | undefined): boolean {
  const c = (batchCode ?? '').toUpperCase();
  if (c.startsWith('ACW')) return false;
  return true;
}

// AC WEEKEND rotation. One module per session (no filler track on weekends).
// Each row's window ends at the next row's start.
export type AcWeekendWindow = { start: Date; end: Date; module: string };

const WKND_RAW: Array<[string, string, string]> = [
  ['11/14/2025', '11/21/2025', 'MS Windows'],
  ['11/21/2025', '11/28/2025', 'MS Word'],
  ['11/28/2025', '12/5/2025',  'MS Outlook'],
  ['12/5/2025',  '12/12/2025', 'MS PowerPoint'],
  // 12/12 -> 1/9 spans MS Excel with the winter break embedded; treat as one window.
  ['12/12/2025', '1/9/2026',   'MS Excel'],
  ['1/9/2026',   '2/13/2026',  'Office Procedure'],
  ['2/13/2026',  '2/20/2026',  'Job Search Strategies'],
  ['2/20/2026',  '5/15/2026',  'Accounting Fundamentals and Bookkeeping'],
  ['5/15/2026',  '6/26/2026',  'Computerized Accounting with Quickbooks'],
  ['6/26/2026',  '7/10/2026',  'Payroll Fundamentals 1'],
  ['7/10/2026',  '7/31/2026',  'Payroll Fundamentals 2'],
  ['7/31/2026',  '9/18/2026',  'Computerized Accounting with Sage 50'],
  ['9/18/2026',  '10/16/2026', 'Computerized Accounting with Sage 300'],
  ['10/16/2026', '11/13/2026', 'Income Tax Theory and Practice'],
];

export const AC_WEEKEND_WINDOWS: AcWeekendWindow[] = WKND_RAW
  .map(([s, e, m]) => ({ start: parseMdy(s), end: parseMdy(e), module: m }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());
