// HT (Hospitality & Tourism) program rotation schedule.
// Two-track program (Weekday + Weekend), same shape as IBA.
//
// Track mapping by batchCode prefix:
//   HTW*     -> weekend
//   HTWCOOP* -> weekend
//   everything else (HT*, HTE*, HTCOOP*, HTECOOP*) -> weekday

export type HtTrack = 'weekday' | 'weekend';

export type HtSession = {
  start: Date;
  track: HtTrack;
  module: string;
};

const RAW: Array<[string, HtTrack, string]> = [
  ['8/4/2025',   'weekday', 'Macro Economics'],
  ['8/11/2025',  'weekday', 'Macro Economics'],
  ['8/18/2025',  'weekday', 'Computer Applications in Business'],
  ['8/25/2025',  'weekday', 'Computer Applications in Business'],
  ['9/1/2025',   'weekday', 'Business Law'],
  ['9/8/2025',   'weekday', 'Business Law'],
  ['9/15/2025',  'weekday', 'Business Ethics'],
  ['9/22/2025',  'weekday', 'Business Ethics'],
  ['9/29/2025',  'weekday', 'English Fundamentals'],
  ['10/6/2025',  'weekday', 'English Fundamentals'],
  ['10/13/2025', 'weekday', 'Statistics for Business'],
  ['10/20/2025', 'weekday', 'Statistics for Business'],
  ['10/27/2025', 'weekday', 'Fundamentals of Accounting'],
  ['11/3/2025',  'weekday', 'Fundamentals of Accounting'],
  ['11/10/2025', 'weekday', 'Strategic Management'],
  ['11/17/2025', 'weekday', 'Strategic Management'],
  ['11/24/2025', 'weekday', 'Hospitality Law'],
  ['11/28/2025', 'weekend', 'Introduction to HRM'],
  ['12/1/2025',  'weekday', 'Hospitality Law'],
  ['12/5/2025',  'weekend', 'Introduction to HRM'],
  ['12/8/2025',  'weekday', 'Managing Front Office Operations'],
  ['12/12/2025', 'weekend', 'Management Fundamentals'],
  ['12/15/2025', 'weekday', 'Managing Front Office Operations'],
  ['12/19/2025', 'weekend', 'Management Fundamentals'],
  ['12/22/2025', 'weekday', 'WINTER BREAK'],
  ['12/26/2025', 'weekend', 'WINTER BREAK'],
  ['12/29/2025', 'weekday', 'Managing Technology in Hospitality Industry'],
  ['1/2/2026',   'weekend', 'Sales Management'],
  ['1/5/2026',   'weekday', 'Managing Technology in Hospitality Industry'],
  ['1/9/2026',   'weekend', 'Sales Management'],
  ['1/12/2026',  'weekday', 'House Keeping'],
  ['1/16/2026',  'weekend', 'Project Management'],
  ['1/19/2026',  'weekday', 'House Keeping'],
  ['1/23/2026',  'weekend', 'Project Management'],
  ['1/26/2026',  'weekday', 'Training & Development in Hospitality Industry'],
  ['1/30/2026',  'weekend', 'Fundamentals of Marketing'],
  ['2/2/2026',   'weekday', 'Training & Development in Hospitality Industry'],
  ['2/6/2026',   'weekend', 'Fundamentals of Marketing'],
  ['2/9/2026',   'weekday', 'Introduction to Hospitality & Tourism'],
  ['2/13/2026',  'weekend', 'Operations Research'],
  ['2/16/2026',  'weekday', 'Introduction to Hospitality & Tourism'],
  ['2/20/2026',  'weekend', 'Operations Research'],
  ['2/23/2026',  'weekday', 'Food & Beverage Management'],
  ['2/27/2026',  'weekend', 'Organizational Behaviour'],
  ['3/2/2026',   'weekday', 'Food & Beverage Management'],
  ['3/6/2026',   'weekend', 'Organizational Behaviour'],
  ['3/9/2026',   'weekday', 'International & Canadian Tourism'],
  ['3/13/2026',  'weekend', 'Strategic Management'],
  ['3/16/2026',  'weekday', 'International & Canadian Tourism'],
  ['3/20/2026',  'weekend', 'Strategic Management'],
  ['3/23/2026',  'weekday', 'Introduction to HRM'],
  ['3/27/2026',  'weekend', 'Micro Economics'],
  ['3/30/2026',  'weekday', 'Introduction to HRM'],
  ['4/3/2026',   'weekend', 'Micro Economics'],
  ['4/6/2026',   'weekday', 'Management Fundamentals'],
  ['4/10/2026',  'weekend', 'Macro Economics'],
  ['4/13/2026',  'weekday', 'Management Fundamentals'],
  ['4/17/2026',  'weekend', 'Macro Economics'],
  ['4/20/2026',  'weekday', 'Sales Management'],
  ['4/24/2026',  'weekend', 'Statistics for Business'],
  ['4/27/2026',  'weekday', 'Sales Management'],
  ['5/1/2026',   'weekend', 'Statistics for Business'],
  ['5/4/2026',   'weekday', 'Project Management'],
  ['5/8/2026',   'weekend', 'Fundamentals of Accounting'],
  ['5/11/2026',  'weekday', 'Project Management'],
  ['5/15/2026',  'weekend', 'Fundamentals of Accounting'],
  ['5/18/2026',  'weekday', 'Fundamentals of Marketing'],
  ['5/22/2026',  'weekend', 'Computer Applications in Business'],
  ['5/25/2026',  'weekday', 'Fundamentals of Marketing'],
  ['5/29/2026',  'weekend', 'Computer Applications in Business'],
  ['6/1/2026',   'weekday', 'Operations Research'],
  ['6/5/2026',   'weekend', 'Business Law'],
  ['6/8/2026',   'weekday', 'Operations Research'],
  ['6/12/2026',  'weekend', 'Business Law'],
  ['6/15/2026',  'weekday', 'Organizational Behaviour'],
  ['6/19/2026',  'weekend', 'Business Ethics'],
  ['6/22/2026',  'weekday', 'Organizational Behaviour'],
  ['6/26/2026',  'weekend', 'Business Ethics'],
  ['6/29/2026',  'weekday', 'Micro Economics'],
  ['7/3/2026',   'weekend', 'English Fundamentals'],
  ['7/6/2026',   'weekday', 'Micro Economics'],
  ['7/10/2026',  'weekend', 'English Fundamentals'],
  ['7/13/2026',  'weekday', 'Macro Economics'],
  ['7/17/2026',  'weekend', 'Hospitality Law'],
  ['7/20/2026',  'weekday', 'Macro Economics'],
  ['7/24/2026',  'weekend', 'Hospitality Law'],
  ['7/27/2026',  'weekday', 'Computer Applications in Business'],
  ['7/31/2026',  'weekend', 'Managing Front Office Operations'],
  ['8/3/2026',   'weekday', 'Computer Applications in Business'],
  ['8/7/2026',   'weekend', 'Managing Front Office Operations'],
  ['8/10/2026',  'weekday', 'Business Law'],
  ['8/14/2026',  'weekend', 'Managing Technology in Hospitality Industry'],
  ['8/17/2026',  'weekday', 'Business Law'],
  ['8/21/2026',  'weekend', 'Managing Technology in Hospitality Industry'],
  ['8/24/2026',  'weekday', 'Business Ethics'],
  ['8/28/2026',  'weekend', 'House Keeping'],
  ['8/31/2026',  'weekday', 'Business Ethics'],
  ['9/4/2026',   'weekend', 'House Keeping'],
  ['9/7/2026',   'weekday', 'English Fundamentals'],
  ['9/11/2026',  'weekend', 'Training & Development in Hospitality Industry'],
  ['9/14/2026',  'weekday', 'English Fundamentals'],
  ['9/18/2026',  'weekend', 'Training & Development in Hospitality Industry'],
  ['9/21/2026',  'weekday', 'Statistics for Business'],
  ['9/25/2026',  'weekend', 'Introduction to Hospitality & Tourism'],
  ['9/28/2026',  'weekday', 'Statistics for Business'],
  ['10/2/2026',  'weekend', 'Introduction to Hospitality & Tourism'],
  ['10/5/2026',  'weekday', 'Fundamentals of Accounting'],
  ['10/9/2026',  'weekend', 'Food & Beverage Management'],
  ['10/12/2026', 'weekday', 'Fundamentals of Accounting'],
  ['10/16/2026', 'weekend', 'Food & Beverage Management'],
  ['10/19/2026', 'weekday', 'Strategic Management'],
  ['10/23/2026', 'weekend', 'International & Canadian Tourism'],
  ['10/26/2026', 'weekday', 'Strategic Management'],
  ['10/30/2026', 'weekend', 'International & Canadian Tourism'],
  ['11/2/2026',  'weekday', 'Hospitality Law'],
  ['11/9/2026',  'weekday', 'Hospitality Law'],
  ['11/16/2026', 'weekday', 'Managing Front Office Operations'],
  ['11/23/2026', 'weekday', 'Managing Front Office Operations'],
  ['11/30/2026', 'weekday', 'Managing Technology in Hospitality Industry'],
  ['12/7/2026',  'weekday', 'Managing Technology in Hospitality Industry'],
  ['12/14/2026', 'weekday', 'House Keeping'],
  ['12/21/2026', 'weekday', 'House Keeping'],
  ['12/28/2026', 'weekday', 'WINTER BREAK'],
  ['1/4/2027',   'weekday', 'Training & Development in Hospitality Industry'],
  ['1/11/2027',  'weekday', 'Training & Development in Hospitality Industry'],
  ['1/18/2027',  'weekday', 'Introduction to Hospitality & Tourism'],
  ['1/25/2027',  'weekday', 'Introduction to Hospitality & Tourism'],
  ['2/1/2027',   'weekday', 'Food & Beverage Management'],
  ['2/8/2027',   'weekday', 'Food & Beverage Management'],
  ['2/15/2027',  'weekday', 'International & Canadian Tourism'],
  ['2/22/2027',  'weekday', 'International & Canadian Tourism'],
];

function parseMdy(s: string): Date {
  const [m, d, y] = s.split('/').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const HT_SESSIONS: HtSession[] = RAW
  .map(([d, t, m]) => ({ start: parseMdy(d), track: t, module: m }))
  .sort((a, b) => a.start.getTime() - b.start.getTime());

export function htTrackForBatch(batchCode: string | null | undefined): HtTrack {
  const c = (batchCode ?? '').toUpperCase();
  if (c.startsWith('HTW')) return 'weekend';
  return 'weekday';
}
