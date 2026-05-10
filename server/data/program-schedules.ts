// Program schedules per course. Maps the Monday-anchored week start to the
// program module the cohort is studying that week. Filler module column from
// the source schedule is intentionally excluded.

export type ScheduleEntry = { weekStart: string; programModule: string | null };

// AC course schedule. Module names here are the canonical "schedule" names —
// AC_NAME_TO_DB_MODULE below maps them to actual Module.name rows in the DB.
export const AC_SCHEDULE: ScheduleEntry[] = [
  { weekStart: '2025-08-04', programModule: 'Payroll Fundamentals 1' },
  { weekStart: '2025-08-11', programModule: 'Payroll Fundamentals 1' },
  { weekStart: '2025-08-18', programModule: 'Payroll Fundamentals 2' },
  { weekStart: '2025-08-25', programModule: 'Payroll Fundamentals 2' },
  { weekStart: '2025-09-01', programModule: 'Payroll Fundamentals 2' },
  { weekStart: '2025-09-08', programModule: 'Office Procedure' },
  { weekStart: '2025-09-15', programModule: 'Office Procedure' },
  { weekStart: '2025-09-22', programModule: 'Office Procedure' },
  { weekStart: '2025-09-29', programModule: 'Office Procedure' },
  { weekStart: '2025-10-06', programModule: 'Office Procedure' },
  { weekStart: '2025-10-13', programModule: 'Job Search Strategies' },
  { weekStart: '2025-10-20', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-10-27', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-11-03', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-11-10', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-11-17', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-11-24', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-12-01', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2025-12-08', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2025-12-15', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2025-12-22', programModule: null }, // WINTER BREAK
  { weekStart: '2025-12-29', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2026-01-05', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2026-01-12', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-01-19', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-01-26', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-02-02', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-02-09', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-02-16', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-02-23', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-03-02', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-03-09', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-03-16', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-03-23', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-03-30', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-04-06', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-04-13', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-04-20', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-04-27', programModule: 'Accounting Fundamentals and Bookkeeping' },
  { weekStart: '2026-05-04', programModule: 'Computerized Accounting with Quickbooks' },
  { weekStart: '2026-05-11', programModule: 'Computerized Accounting with Quickbooks' },
  { weekStart: '2026-05-18', programModule: 'Computerized Accounting with Quickbooks' },
  { weekStart: '2026-05-25', programModule: 'Computerized Accounting with Quickbooks' },
  { weekStart: '2026-06-01', programModule: 'Computerized Accounting with Quickbooks' },
  { weekStart: '2026-06-08', programModule: 'Computerized Accounting with Quickbooks' },
  { weekStart: '2026-06-15', programModule: 'Payroll Fundamentals 1' },
  { weekStart: '2026-06-22', programModule: 'Payroll Fundamentals 1' },
  { weekStart: '2026-06-29', programModule: 'Payroll Fundamentals 2' },
  { weekStart: '2026-07-06', programModule: 'Payroll Fundamentals 2' },
  { weekStart: '2026-07-13', programModule: 'Payroll Fundamentals 2' },
  { weekStart: '2026-07-20', programModule: 'Office Procedure' },
  { weekStart: '2026-07-27', programModule: 'Office Procedure' },
  { weekStart: '2026-08-03', programModule: 'Office Procedure' },
  { weekStart: '2026-08-10', programModule: 'Office Procedure' },
  { weekStart: '2026-08-17', programModule: 'Office Procedure' },
  { weekStart: '2026-08-24', programModule: 'Job Search Strategies' },
  { weekStart: '2026-08-31', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-09-07', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-09-14', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-09-21', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-09-28', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-10-05', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-10-12', programModule: 'Computerized Accounting with Sage 50' },
  { weekStart: '2026-10-19', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2026-10-26', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2026-11-02', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2026-11-09', programModule: 'Computerized Accounting with Sage 300' },
  { weekStart: '2026-11-16', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-11-23', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-11-30', programModule: 'Income Tax Theory and Practice' },
  { weekStart: '2026-12-07', programModule: 'Income Tax Theory and Practice' },
];

// AC has merged Sage 50 + Sage 300 into one DB module, and uses slightly
// different spellings for several modules. Schedule name → DB Module.name.
export const AC_NAME_TO_DB_MODULE: Record<string, string> = {
  'Payroll Fundamentals 1': 'Payroll Fundamentals 1',
  'Payroll Fundamentals 2': 'Payroll Fundamental 2',
  'Office Procedure': 'Office Procedures',
  'Job Search Strategies': 'Job Search',
  'Computerized Accounting with Sage 50': 'Computerized Accounting with Sage50/Sage300',
  'Computerized Accounting with Sage 300': 'Computerized Accounting with Sage50/Sage300',
  'Income Tax Theory and Practice': 'Canadian Income Tax',
  'Accounting Fundamentals and Bookkeeping': 'Accounting Fundamentals and Book Keeping',
  'Computerized Accounting with Quickbooks': 'Computerized Accounting with Quickbooks',
};

// Returns the schedule entry for the week containing `today`. The schedule is
// sorted by weekStart ascending; we pick the latest entry whose weekStart ≤ today.
export function getScheduleEntryFor(schedule: ScheduleEntry[], today: Date): ScheduleEntry | null {
  const todayStr = today.toISOString().slice(0, 10);
  let match: ScheduleEntry | null = null;
  for (const e of schedule) {
    if (e.weekStart <= todayStr) match = e;
    else break;
  }
  return match;
}

export function getProgramSchedule(courseCode: string): { schedule: ScheduleEntry[]; nameMap: Record<string, string> } | null {
  if (courseCode === 'AC') return { schedule: AC_SCHEDULE, nameMap: AC_NAME_TO_DB_MODULE };
  return null;
}
