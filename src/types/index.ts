export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string;
  status: 'PUBLISHED' | 'UNPUBLISHED';
  term: string;
  subAccount: string;
  imageUrl: string | null;
  teachers: { id: string; name: string; initial: string }[];
  studentCount: number;
  _count: { assignments: number; enrollments: number };
}

export interface Module {
  id: string;
  name: string;
  startDate: string | null;
  position: number;
  published: boolean;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect?: boolean;
  position: number;
}

export interface StudentAnswer {
  id: string;
  questionId: string;
  studentId: string;
  submissionId: string;
  selectedOptionId: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  feedback: string | null;
}

export interface Question {
  id: string;
  assignmentId: string;
  type: 'MCQ' | 'THEORY';
  text: string;
  points: number;
  position: number;
  required: boolean;
  explanation: string | null;
  wordLimit: number | null;
  options: QuestionOption[];
  answers?: StudentAnswer[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: 'QUIZ' | 'ASSIGNMENT';
  format: 'FILE' | 'MCQ' | 'THEORY' | 'MIXED';
  points: number;
  dueDate: string | null;
  published: boolean;
  instructions: string | null;
  attachmentPath: string | null;
  attachmentName: string | null;
  allowedFormats: string;
  maxFileSize: number;
  timeLimit: number | null;
  shuffleQuestions: boolean;
  showResults: boolean;
  negativeMarking: number;
  course?: { id: string; name: string; code: string; color: string };
  submissions?: Submission[];
  questions?: Question[];
  _count?: { submissions: number };
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'MISSING' | 'SUBMITTED' | 'GRADED';
  score: number | null;
  date: string | null;
  feedback: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  comment: string | null;
  submittedAt: string | null;
  isLate: boolean;
  assignment?: Assignment & { course?: { id: string; name: string; code: string; color: string } };
  student?: { id: string; firstName: string; lastName: string; email: string };
  gradedBy?: { id: string; firstName: string; lastName: string };
}

export interface Message {
  id: string;
  senderId: string;
  subject: string;
  body: string;
  createdAt: string;
  read?: boolean;
  starred?: boolean;
  sender: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  recipients: { id: string; user: { id: string; firstName: string; lastName: string } }[];
  course: { id: string; name: string; code: string } | null;
}

export interface StudentDashboard {
  courses: (Course & { teachers: string[] })[];
  todoItems: Submission[];
  recentGrades: Submission[];
  upcomingAssignments: Assignment[];
}

export interface TeacherDashboard {
  publishedCourses: Course[];
  unpublishedCourses: Course[];
  todoItems: Submission[];
  upcoming: Assignment[];
}

export interface AdminDashboard {
  stats: { totalStudents: number; totalTeachers: number; totalCourses: number };
  publishedCourses: Course[];
  recentImports: any[];
  upcoming: Assignment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
