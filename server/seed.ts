import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './db';

// ─── IBA Course Schedule Data ───────────────────────────────────────
const IBA_SCHEDULE = [
  { start: '2025-08-04', module: 'Macro Economics', track: 'Weekday' },
  { start: '2025-08-11', module: 'Macro Economics', track: 'Weekday' },
  { start: '2025-08-18', module: 'Computer Applications in Business', track: 'Weekday' },
  { start: '2025-08-25', module: 'Computer Applications in Business', track: 'Weekday' },
  { start: '2025-09-01', module: 'Business Law', track: 'Weekday' },
  { start: '2025-09-08', module: 'Business Law', track: 'Weekday' },
  { start: '2025-09-15', module: 'Business Ethics', track: 'Weekday' },
  { start: '2025-09-22', module: 'Business Ethics', track: 'Weekday' },
  { start: '2025-09-29', module: 'English Fundamentals', track: 'Weekday' },
  { start: '2025-10-06', module: 'English Fundamentals', track: 'Weekday' },
  { start: '2025-10-13', module: 'Statistics for Business', track: 'Weekday' },
  { start: '2025-10-20', module: 'Statistics for Business', track: 'Weekday' },
  { start: '2025-10-27', module: 'Fundamentals of Accounting', track: 'Weekday' },
  { start: '2025-11-03', module: 'Fundamentals of Accounting', track: 'Weekday' },
  { start: '2025-11-10', module: 'Strategic Management', track: 'Weekday' },
  { start: '2025-11-17', module: 'Strategic Management', track: 'Weekday' },
  { start: '2025-11-24', module: 'International Law', track: 'Weekday' },
  { start: '2025-11-28', module: 'Introduction to HRM', track: 'Weekend' },
  { start: '2025-12-01', module: 'International Law', track: 'Weekday' },
  { start: '2025-12-05', module: 'Introduction to HRM', track: 'Weekend' },
  { start: '2025-12-08', module: 'E Commerce & Digital Marketing', track: 'Weekday' },
  { start: '2025-12-12', module: 'Management Fundamentals', track: 'Weekend' },
  { start: '2025-12-15', module: 'E Commerce & Digital Marketing', track: 'Weekday' },
  { start: '2025-12-19', module: 'Management Fundamentals', track: 'Weekend' },
  { start: '2025-12-22', module: 'WINTER BREAK', track: 'Weekday' },
  { start: '2025-12-26', module: 'WINTER BREAK', track: 'Weekend' },
  { start: '2025-12-29', module: 'Leadership', track: 'Weekday' },
  { start: '2026-01-02', module: 'Sales Management', track: 'Weekend' },
  { start: '2026-01-05', module: 'Leadership', track: 'Weekday' },
  { start: '2026-01-09', module: 'Sales Management', track: 'Weekend' },
  { start: '2026-01-12', module: 'Intercultural Communication', track: 'Weekday' },
  { start: '2026-01-16', module: 'Project Management', track: 'Weekend' },
  { start: '2026-01-19', module: 'Intercultural Communication', track: 'Weekday' },
  { start: '2026-01-23', module: 'Project Management', track: 'Weekend' },
  { start: '2026-01-26', module: 'Cross Cultural Management', track: 'Weekday' },
  { start: '2026-01-30', module: 'Fundamentals of Marketing', track: 'Weekend' },
  { start: '2026-02-02', module: 'Cross Cultural Management', track: 'Weekday' },
  { start: '2026-02-06', module: 'Fundamentals of Marketing', track: 'Weekend' },
  { start: '2026-02-09', module: 'International Business Strategy', track: 'Weekday' },
  { start: '2026-02-13', module: 'Operations Research', track: 'Weekend' },
  { start: '2026-02-16', module: 'International Business Strategy', track: 'Weekday' },
  { start: '2026-02-20', module: 'Operations Research', track: 'Weekend' },
  { start: '2026-02-23', module: 'International Banking & Finance', track: 'Weekday' },
  { start: '2026-02-27', module: 'Organizational Behaviour', track: 'Weekend' },
  { start: '2026-03-02', module: 'International Banking & Finance', track: 'Weekday' },
  { start: '2026-03-06', module: 'Organizational Behaviour', track: 'Weekend' },
  { start: '2026-03-09', module: 'Entrepreneurship', track: 'Weekday' },
  { start: '2026-03-13', module: 'Strategic Management', track: 'Weekend' },
  { start: '2026-03-16', module: 'Entrepreneurship', track: 'Weekday' },
  { start: '2026-03-20', module: 'Strategic Management', track: 'Weekend' },
  { start: '2026-03-23', module: 'Introduction to HRM', track: 'Weekday' },
  { start: '2026-03-27', module: 'Micro Economics', track: 'Weekend' },
  { start: '2026-03-30', module: 'Introduction to HRM', track: 'Weekday' },
  { start: '2026-04-03', module: 'Micro Economics', track: 'Weekend' },
  { start: '2026-04-06', module: 'Management Fundamentals', track: 'Weekday' },
  { start: '2026-04-10', module: 'Macro Economics', track: 'Weekend' },
  { start: '2026-04-13', module: 'Management Fundamentals', track: 'Weekday' },
  { start: '2026-04-17', module: 'Macro Economics', track: 'Weekend' },
  { start: '2026-04-20', module: 'Sales Management', track: 'Weekday' },
  { start: '2026-04-24', module: 'Statistics for Business', track: 'Weekend' },
  { start: '2026-04-27', module: 'Sales Management', track: 'Weekday' },
  { start: '2026-05-01', module: 'Statistics for Business', track: 'Weekend' },
  { start: '2026-05-04', module: 'Project Management', track: 'Weekday' },
  { start: '2026-05-08', module: 'Fundamentals of Accounting', track: 'Weekend' },
  { start: '2026-05-11', module: 'Project Management', track: 'Weekday' },
  { start: '2026-05-15', module: 'Fundamentals of Accounting', track: 'Weekend' },
  { start: '2026-05-18', module: 'Fundamentals of Marketing', track: 'Weekday' },
  { start: '2026-05-22', module: 'Computer Applications in Business', track: 'Weekend' },
  { start: '2026-05-25', module: 'Fundamentals of Marketing', track: 'Weekday' },
  { start: '2026-05-29', module: 'Computer Applications in Business', track: 'Weekend' },
  { start: '2026-06-01', module: 'Operations Research', track: 'Weekday' },
  { start: '2026-06-05', module: 'Business Law', track: 'Weekend' },
  { start: '2026-06-08', module: 'Operations Research', track: 'Weekday' },
  { start: '2026-06-12', module: 'Business Law', track: 'Weekend' },
  { start: '2026-06-15', module: 'Organizational Behaviour', track: 'Weekday' },
  { start: '2026-06-19', module: 'Business Ethics', track: 'Weekend' },
  { start: '2026-06-22', module: 'Organizational Behaviour', track: 'Weekday' },
  { start: '2026-06-26', module: 'Business Ethics', track: 'Weekend' },
  { start: '2026-06-29', module: 'Micro Economics', track: 'Weekday' },
  { start: '2026-07-03', module: 'English Fundamentals', track: 'Weekend' },
  { start: '2026-07-06', module: 'Micro Economics', track: 'Weekday' },
  { start: '2026-07-10', module: 'English Fundamentals', track: 'Weekend' },
  { start: '2026-07-13', module: 'Macro Economics', track: 'Weekday' },
  { start: '2026-07-17', module: 'International Law', track: 'Weekend' },
  { start: '2026-07-20', module: 'Macro Economics', track: 'Weekday' },
  { start: '2026-07-24', module: 'International Law', track: 'Weekend' },
  { start: '2026-07-27', module: 'Computer Applications in Business', track: 'Weekday' },
  { start: '2026-07-31', module: 'E Commerce & Digital Marketing', track: 'Weekend' },
  { start: '2026-08-03', module: 'Computer Applications in Business', track: 'Weekday' },
  { start: '2026-08-07', module: 'E Commerce & Digital Marketing', track: 'Weekend' },
  { start: '2026-08-10', module: 'Business Law', track: 'Weekday' },
  { start: '2026-08-14', module: 'Leadership', track: 'Weekend' },
  { start: '2026-08-17', module: 'Business Law', track: 'Weekday' },
  { start: '2026-08-21', module: 'Leadership', track: 'Weekend' },
  { start: '2026-08-24', module: 'Business Ethics', track: 'Weekday' },
  { start: '2026-08-28', module: 'Entrepreneurship', track: 'Weekend' },
  { start: '2026-08-31', module: 'Business Ethics', track: 'Weekday' },
  { start: '2026-09-04', module: 'Entrepreneurship', track: 'Weekend' },
  { start: '2026-09-07', module: 'English Fundamentals', track: 'Weekday' },
  { start: '2026-09-11', module: 'Intercultural Communication', track: 'Weekend' },
  { start: '2026-09-14', module: 'English Fundamentals', track: 'Weekday' },
  { start: '2026-09-18', module: 'Intercultural Communication', track: 'Weekend' },
  { start: '2026-09-21', module: 'Statistics for Business', track: 'Weekday' },
  { start: '2026-09-25', module: 'Cross Cultural Management', track: 'Weekend' },
  { start: '2026-09-28', module: 'Statistics for Business', track: 'Weekday' },
  { start: '2026-10-02', module: 'Cross Cultural Management', track: 'Weekend' },
  { start: '2026-10-05', module: 'Fundamentals of Accounting', track: 'Weekday' },
  { start: '2026-10-09', module: 'International Business Strategy', track: 'Weekend' },
  { start: '2026-10-12', module: 'Fundamentals of Accounting', track: 'Weekday' },
  { start: '2026-10-16', module: 'International Business Strategy', track: 'Weekend' },
  { start: '2026-10-19', module: 'Strategic Management', track: 'Weekday' },
  { start: '2026-10-23', module: 'International Banking & Finance', track: 'Weekend' },
  { start: '2026-10-26', module: 'Strategic Management', track: 'Weekday' },
  { start: '2026-10-30', module: 'International Banking & Finance', track: 'Weekend' },
  { start: '2026-11-02', module: 'International Law', track: 'Weekday' },
  { start: '2026-11-09', module: 'International Law', track: 'Weekday' },
  { start: '2026-11-16', module: 'E Commerce & Digital Marketing', track: 'Weekday' },
  { start: '2026-11-23', module: 'E Commerce & Digital Marketing', track: 'Weekday' },
  { start: '2026-11-30', module: 'Leadership', track: 'Weekday' },
  { start: '2026-12-07', module: 'Leadership', track: 'Weekday' },
  { start: '2026-12-14', module: 'Intercultural Communication', track: 'Weekday' },
  { start: '2026-12-21', module: 'Intercultural Communication', track: 'Weekday' },
  { start: '2026-12-28', module: 'WINTER BREAK', track: 'Weekday' },
  { start: '2027-01-04', module: 'Cross Cultural Management', track: 'Weekday' },
  { start: '2027-01-11', module: 'Cross Cultural Management', track: 'Weekday' },
  { start: '2027-01-18', module: 'International Business Strategy', track: 'Weekday' },
  { start: '2027-01-25', module: 'International Business Strategy', track: 'Weekday' },
  { start: '2027-02-01', module: 'International Banking & Finance', track: 'Weekday' },
  { start: '2027-02-08', module: 'International Banking & Finance', track: 'Weekday' },
  { start: '2027-02-15', module: 'Entrepreneurship', track: 'Weekday' },
  { start: '2027-02-22', module: 'Entrepreneurship', track: 'Weekday' },
];

// Unique course names (excluding breaks)
const COURSE_NAMES = [...new Set(
  IBA_SCHEDULE.filter(s => s.module !== 'WINTER BREAK').map(s => s.module)
)];

// Generate a short course code from name
function courseCode(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 4).toUpperCase();
  return words
    .filter(w => !['in', 'of', 'for', 'to', 'the', 'and', '&', 'a'].includes(w.toLowerCase()))
    .map(w => w[0].toUpperCase())
    .join('');
}

// Assign distinct colors to courses
const COURSE_COLORS = [
  '#0770A2', '#D64309', '#127A2C', '#6B3FA0', '#C23C2D',
  '#2C6E49', '#0B5394', '#BF4F00', '#7B2D8E', '#1A6B5A',
  '#8B4513', '#2E5090', '#9B2335', '#3D7A4A', '#5C4A9C',
  '#CC5500', '#1B7F8C', '#8B0000', '#2F6B3A', '#6A4C93',
  '#B44700', '#166D6F', '#A0522D', '#3B5998', '#8E4585',
  '#CC6600', '#1F7A6D', '#9B111E', '#4A7C59', '#6B5B95',
];

async function seed() {
  console.log('Seeding database...');

  // ── 1. Create default admin user ──
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tahacollege.ca' },
    update: {},
    create: {
      email: 'admin@tahacollege.ca',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'TAHA',
      role: 'ADMIN',
    },
  });
  console.log(`Admin user created: ${admin.email} (password: admin123)`);

  // ── 2. Create IBA courses ──
  console.log('\nCreating IBA courses...');
  const courseMap = new Map<string, string>(); // name -> id

  for (let i = 0; i < COURSE_NAMES.length; i++) {
    const name = COURSE_NAMES[i];
    const code = `IBA-${courseCode(name)}`;
    const color = COURSE_COLORS[i % COURSE_COLORS.length];

    const course = await prisma.course.upsert({
      where: { code },
      update: { name, color },
      create: {
        name,
        code,
        color,
        status: 'PUBLISHED',
        term: 'IBA Program',
        subAccount: 'TAHA College',
        description: `IBA Program — ${name}`,
      },
    });
    courseMap.set(name, course.id);
    console.log(`  Course: ${name} (${code})`);
  }

  // ── 3. Create calendar events from schedule ──
  console.log('\nCreating schedule calendar events...');
  let eventCount = 0;

  // Delete old schedule events to avoid duplicates on re-seed
  await prisma.calendarEvent.deleteMany({
    where: { description: { startsWith: 'IBA Schedule:' } },
  });

  for (const entry of IBA_SCHEDULE) {
    const startDate = new Date(entry.start + 'T09:00:00');
    // Each module block is 1 week (7 days)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(17, 0, 0);

    if (entry.module === 'WINTER BREAK') {
      // Create break event without course link
      await prisma.calendarEvent.create({
        data: {
          title: `${entry.track} — WINTER BREAK`,
          description: 'IBA Schedule: Winter Break',
          startTime: startDate,
          endTime: endDate,
          createdById: admin.id,
        },
      });
    } else {
      const courseId = courseMap.get(entry.module)!;
      await prisma.calendarEvent.create({
        data: {
          title: `${entry.track} — ${entry.module}`,
          description: `IBA Schedule: ${entry.track}`,
          startTime: startDate,
          endTime: endDate,
          courseId,
          createdById: admin.id,
        },
      });
    }
    eventCount++;
  }

  console.log(`  Created ${eventCount} schedule events`);

  console.log('\n─────────────────────────────────────────');
  console.log('You can now log in and start importing data via /api/import');
  console.log('');
  console.log('Import order:');
  console.log('  1. POST /api/import/students   — upload students Excel');
  console.log('  2. POST /api/import/courses     — upload courses Excel');
  console.log('  3. POST /api/import/enrollments — upload enrollments Excel');
  console.log('  4. POST /api/import/assignments — upload assignments Excel');
  console.log('  5. POST /api/import/grades      — upload grades/submissions Excel');
}

seed()
  .then(() => {
    console.log('\nSeed completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
