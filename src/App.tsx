/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TAHA Canvas LMS v2.0
 */

import React, { useState, useRef } from 'react';
import {
  LayoutDashboard, Book, Calendar, Inbox, Clock, HelpCircle,
  ChevronLeft, Plus, NotebookPen, MoreVertical, ChevronRight,
  Megaphone, FileText, Folder,
  Menu, Eye, Check, Search, Reply, Archive, Trash2, Shield, Upload, X, AlertCircle, CheckCircle, GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { useApi } from './hooks/useApi';
import { api, getAccessToken, del, patch } from './api/client';
import type {
  StudentDashboard, TeacherDashboard, AdminDashboard,
  Course, Assignment, Submission, Message
} from './types';

// --- Shared Components ---

const SidebarItem = ({
  icon: Icon, label, active = false, badge = 0, onClick
}: { icon: any, label: string, active?: boolean, badge?: number, onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`flex flex-col items-center py-3 cursor-pointer transition-colors relative group ${active ? 'bg-white text-[#2D3B45]' : 'text-white hover:bg-[#3d4d5a]'}`}
  >
    <div className="relative">
      <Icon size={28} strokeWidth={1.5} />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#008EE2] text-white text-[16px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#2D3B45]">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[16px] mt-1 font-medium">{label}</span>
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#008EE2]" />}
  </div>
);

const CanvasLogo = () => (
  <div className="p-4 flex justify-center">
    <img src="/tahalogo.png" alt="TAHA College" className="h-10 w-auto" />
  </div>
);

const LoadingSpinner = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-[#008EE2] border-t-transparent rounded-full animate-spin" />
  </div>
);

// --- Login Views ---

function StudentLoginView({ onSwitchRole }: { onSwitchRole: (role: string) => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    if (!res.success) setError(res.error || 'Login failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="h-24 bg-[#4A90E2] flex items-center px-12 shadow-md">
        <img src="/taha-logo-full.png" alt="TAHA College" className="h-14 w-auto" />
      </header>

      <main className="flex-1 flex flex-col items-center pt-20 px-4">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-bold text-black mb-10">Enter your username and password</h2>
          <p className="text-[16px] text-black mb-12">
            A service has requested you to authenticate yourself. Please enter your username and password in the form below.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
            <div className="flex items-center w-full">
              <label className="w-32 text-right pr-4 text-[16px]">Username</label>
              <input
                type="text" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 border border-[#4A90E2] rounded-sm px-2 py-1.5 focus:outline-none shadow-inner"
              />
            </div>
            <div className="flex items-center w-full">
              <label className="w-32 text-right pr-4 text-[16px]">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 border border-gray-300 rounded-sm px-2 py-1.5 focus:outline-none shadow-inner"
              />
            </div>
            <div className="flex items-center w-full pt-4">
              <div className="w-32" />
              <button
                onClick={handleSubmit} disabled={loading}
                className="w-full bg-[#4A90E2] text-white py-2 rounded-sm font-medium hover:bg-[#357ABD] transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>

          <div className="mt-20">
            <h3 className="font-bold text-gray-600 text-[16px] mb-2">Help! I don't remember my password.</h3>
            <p className="text-[16px] text-gray-500 leading-relaxed">
              Without your username and password you cannot authenticate yourself for access to the service. There may be someone that can help you. Consult the help desk at your organization!
            </p>
          </div>
        </div>
      </main>

      <footer className="h-20 bg-[#4A90E2] flex items-center justify-between px-12 text-white text-[16px]">
        <div className="flex-1 text-center">© 2026 TAHA College — Beauty, Business, Health & Technology</div>
        <img src="/taha-logo-full.png" alt="TAHA College" className="h-10 w-auto" />
      </footer>

      {/* Role switcher for demo */}
      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <button onClick={() => onSwitchRole('teacher')} className="bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[16px] px-2 py-1 rounded shadow-lg border border-white/20">
          Switch to Teacher Login
        </button>
      </div>
    </div>
  );
}

function TeacherLoginView({ onSwitchRole }: { onSwitchRole: (role: string) => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    if (!res.success) setError(res.error || 'Login failed');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image with dark gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img src="/teacher-login-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      <header className="h-16 flex items-center px-6 shrink-0 relative z-10">
        <img src="/taha-logo-full.png" alt="TAHA College" className="h-10 w-auto drop-shadow-lg" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm w-full max-w-[500px] rounded-lg shadow-2xl p-12 flex flex-col items-center">
          <div className="flex flex-col items-center mb-10">
            <img src="/taha-logo-full.png" alt="TAHA College" className="h-16 w-auto" />
          </div>

          <h2 className="text-2xl text-gray-700 mb-8">Welcome to TAHA Canvas</h2>

          {error && (
            <div className="w-full mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-gray-700">Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-[#008EE2] text-white py-3 rounded-sm font-bold hover:bg-[#0077BE] transition-colors disabled:opacity-50">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            <div className="flex flex-col items-center space-y-2 pt-2">
              <a href="#" className="text-[#008EE2] text-sm hover:underline">Forgot password?</a>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <button onClick={() => onSwitchRole('student')} className="bg-white/10 hover:bg-white/20 text-white text-[16px] px-2 py-1 rounded border border-white/20">
          Switch to Student Login
        </button>
      </div>
    </div>
  );
}

// --- Dashboard Components ---

// ─── Dashboard Files Section (per-course, collapsible) ──
function DashboardFilesSection({ courses }: { courses: { id: string; name: string; color?: string }[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  if (courses.length === 0) return null;
  const toggle = (id: string) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-[#2D3B45] mb-4 border-b border-gray-200 pb-2">Course Files</h2>
      <div className="space-y-3">
        {courses.map(c => (
          <CourseFileCard key={c.id} course={c} expanded={expanded.has(c.id)} onToggle={() => toggle(c.id)} />
        ))}
      </div>
    </div>
  );
}

function CourseFileCard({ course, expanded, onToggle }: { course: { id: string; name: string; color?: string }; expanded: boolean; onToggle: () => void }) {
  const { data: files } = useApi<any[]>(expanded ? `/courses/${course.id}/files` : null);
  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  const handleDownload = (fileId: string, fileName: string) => {
    const token = getAccessToken();
    const url = `/api/courses/${course.id}/files/${fileId}/download?token=${encodeURIComponent(token || '')}`;
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const byFolder = new Map<string, any[]>();
  for (const f of files || []) {
    const k = f.folder || '';
    if (!byFolder.has(k)) byFolder.set(k, []);
    byFolder.get(k)!.push(f);
  }
  const folderKeys = Array.from(byFolder.keys()).sort();

  return (
    <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
      <div onClick={onToggle} className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-8 rounded" style={{ backgroundColor: course.color || '#2D3B45' }} />
          <div>
            <h3 className="font-semibold text-[#2D3B45] text-[14px]">{course.name}</h3>
            {expanded && files && <span className="text-[12px] text-gray-400">{files.length} files</span>}
          </div>
        </div>
        <ChevronRight size={18} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>
      {expanded && (
        <div className="border-t border-[#E1E1E1] p-3 bg-gray-50">
          {!files ? (
            <p className="text-[13px] text-gray-400">Loading…</p>
          ) : files.length === 0 ? (
            <p className="text-[13px] text-gray-400">No files yet.</p>
          ) : (
            folderKeys.map(folder => (
              <div key={folder || 'root'} className="mb-3 last:mb-0">
                <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{folder || 'Course Files'}</div>
                <div className="divide-y divide-[#EFEFEF]">
                  {byFolder.get(folder)!.map(f => (
                    <div key={f.id} className="flex items-center py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#2D3B45] truncate">{f.fileName}</div>
                        <div className="text-[11px] text-gray-500">{formatBytes(f.fileSize)}</div>
                      </div>
                      <button
                        onClick={() => handleDownload(f.id, f.fileName)}
                        className="ml-3 px-2 py-0.5 text-[12px] text-[#008EE2] hover:bg-[#008EE2]/10 rounded"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StudentDashboardView({ onCourseSelect }: { onCourseSelect: (id: string) => void }) {
  const { user } = useAuth();
  const { data, loading } = useApi<any>('/dashboard');

  if (loading || !data) return <LoadingSpinner />;

  const profile = data.profile;
  const enrollments = data.enrollments || [];

  return (
    <>
      <header className="h-16 border-b border-[#E1E1E1] flex items-center justify-between px-8 bg-white shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </header>

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-6xl mx-auto p-8">
          {/* Student Profile Card */}
          {profile && (
            <div className="bg-gradient-to-r from-[#2D3B45] to-[#4A5568] rounded-lg p-6 mb-8 text-white">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 shrink-0">
                  <span className="text-2xl font-light">{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-white/70 text-sm">{profile.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-[16px] text-white/60">
                    {profile.vNumber && <span>ID: {profile.vNumber}</span>}
                    {profile.program && <span>Program: {profile.program}</span>}
                    {profile.campus && <span>Campus: {profile.campus}</span>}
                    {profile.shift && <span>Shift: {profile.shift}</span>}
                  </div>
                </div>
                {profile.campusStatus && (
                  <span className={`px-3 py-1 text-[16px] font-bold rounded-full ${profile.campusStatus === 'Start' || profile.campusStatus === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {profile.campusStatus}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Upcoming & Due Assignments */}
          {(() => {
            const now = Date.now();
            const all: any[] = data.upcomingAssignments || [];
            const upcoming = all.filter(a => a.dueDate && new Date(a.dueDate).getTime() >= now);
            const due = all.filter(a => a.dueDate && new Date(a.dueDate).getTime() < now);
            if (upcoming.length === 0 && due.length === 0) return null;
            return (
              <div className="border border-[#E1E1E1] rounded-lg p-5 mb-8 bg-white">
                <h2 className="text-lg font-bold text-[#2D3B45] mb-3 flex items-center">
                  <Clock size={18} className="mr-2 text-[#008EE2]" />
                  Upcoming & Due Assignments
                </h2>
                {due.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[13px] font-bold text-red-600 mb-2 uppercase tracking-wide">Overdue ({due.length})</div>
                    <ul className="divide-y divide-gray-100">
                      {due.map((a: any) => (
                        <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#2D3B45] truncate">{a.title}</div>
                            <div className="text-xs text-gray-500">
                              {a.course && <span className="mr-2 text-[#008EE2]">{a.course.code}</span>}
                              <span className="text-red-600 font-medium">Due {new Date(a.dueDate).toLocaleString()}</span>
                              {a.points != null && <span className="ml-2 text-gray-400">· {a.points} pts</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div>
                    <div className="text-[13px] font-bold text-[#008EE2] mb-2 uppercase tracking-wide">Coming Up ({upcoming.length})</div>
                    <ul className="divide-y divide-gray-100">
                      {upcoming.map((a: any) => (
                        <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#2D3B45] truncate">{a.title}</div>
                            <div className="text-xs text-gray-500">
                              {a.course && <span className="mr-2 text-[#008EE2]">{a.course.code}</span>}
                              <span>Due {new Date(a.dueDate).toLocaleString()}</span>
                              {a.points != null && <span className="ml-2 text-gray-400">· {a.points} pts</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}

          {/* My Courses / Enrollments */}
          <h2 className="text-lg font-bold text-[#2D3B45] mb-4 border-b border-gray-200 pb-2">
            My Courses ({enrollments.length})
          </h2>

          {enrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>You are not enrolled in any courses yet.</p>
            </div>
          ) : (
            <div className="space-y-6 mb-8">
              {enrollments.map((e: any) => {
                const modules = e.course?.modules || [];
                const totalMods = modules.length;
                const now = new Date();

                // IBA-specific schedule (rolling 2-week rotation, two tracks).
                // Used to override progress + current module since the per-
                // student StudentProgress table is not synced for IBA.
                const IBA_SCHED: { date: string; track: 'weekday' | 'weekend'; module: string }[] = [
                  { date: '2025-08-04', track: 'weekday', module: 'Macro Economics' },{ date: '2025-08-18', track: 'weekday', module: 'Computer Applications in Business' },
                  { date: '2025-09-01', track: 'weekday', module: 'Business Law' },{ date: '2025-09-15', track: 'weekday', module: 'Business Ethics' },
                  { date: '2025-09-29', track: 'weekday', module: 'English Fundamentals' },{ date: '2025-10-13', track: 'weekday', module: 'Statistics for Business' },
                  { date: '2025-10-27', track: 'weekday', module: 'Fundamentals of Accounting' },{ date: '2025-11-10', track: 'weekday', module: 'Strategic Management' },
                  { date: '2025-11-24', track: 'weekday', module: 'International Law' },{ date: '2025-11-28', track: 'weekend', module: 'Introduction to HRM' },
                  { date: '2025-12-08', track: 'weekday', module: 'E Commerce & Digital Marketing' },{ date: '2025-12-12', track: 'weekend', module: 'Management Fundamentals' },
                  { date: '2025-12-29', track: 'weekday', module: 'Leadership' },{ date: '2026-01-02', track: 'weekend', module: 'Sales Management' },
                  { date: '2026-01-12', track: 'weekday', module: 'Intercultural Communication' },{ date: '2026-01-16', track: 'weekend', module: 'Project Management' },
                  { date: '2026-01-26', track: 'weekday', module: 'Cross Cultural Management' },{ date: '2026-01-30', track: 'weekend', module: 'Fundamentals of Marketing' },
                  { date: '2026-02-09', track: 'weekday', module: 'International Business Strategy' },{ date: '2026-02-13', track: 'weekend', module: 'Operations Research' },
                  { date: '2026-02-23', track: 'weekday', module: 'International Banking & Finance' },{ date: '2026-02-27', track: 'weekend', module: 'Organizational Behaviour' },
                  { date: '2026-03-09', track: 'weekday', module: 'Entrepreneurship' },{ date: '2026-03-13', track: 'weekend', module: 'Strategic Management' },
                  { date: '2026-03-23', track: 'weekday', module: 'Introduction to HRM' },{ date: '2026-03-27', track: 'weekend', module: 'Micro Economics' },
                  { date: '2026-04-06', track: 'weekday', module: 'Management Fundamentals' },{ date: '2026-04-10', track: 'weekend', module: 'Macro Economics' },
                  { date: '2026-04-20', track: 'weekday', module: 'Sales Management' },{ date: '2026-04-24', track: 'weekend', module: 'Statistics for Business' },
                  { date: '2026-05-04', track: 'weekday', module: 'Project Management' },{ date: '2026-05-08', track: 'weekend', module: 'Fundamentals of Accounting' },
                  { date: '2026-05-18', track: 'weekday', module: 'Fundamentals of Marketing' },{ date: '2026-05-22', track: 'weekend', module: 'Computer Applications in Business' },
                  { date: '2026-06-01', track: 'weekday', module: 'Operations Research' },{ date: '2026-06-05', track: 'weekend', module: 'Business Law' },
                  { date: '2026-06-15', track: 'weekday', module: 'Organizational Behaviour' },{ date: '2026-06-19', track: 'weekend', module: 'Business Ethics' },
                  { date: '2026-06-29', track: 'weekday', module: 'Micro Economics' },{ date: '2026-07-03', track: 'weekend', module: 'English Fundamentals' },
                  { date: '2026-07-13', track: 'weekday', module: 'Macro Economics' },{ date: '2026-07-17', track: 'weekend', module: 'International Law' },
                  { date: '2026-07-27', track: 'weekday', module: 'Computer Applications in Business' },{ date: '2026-07-31', track: 'weekend', module: 'E Commerce & Digital Marketing' },
                  { date: '2026-08-10', track: 'weekday', module: 'Business Law' },{ date: '2026-08-14', track: 'weekend', module: 'Leadership' },
                  { date: '2026-08-24', track: 'weekday', module: 'Business Ethics' },{ date: '2026-08-28', track: 'weekend', module: 'Entrepreneurship' },
                  { date: '2026-09-07', track: 'weekday', module: 'English Fundamentals' },{ date: '2026-09-11', track: 'weekend', module: 'Intercultural Communication' },
                  { date: '2026-09-21', track: 'weekday', module: 'Statistics for Business' },{ date: '2026-09-25', track: 'weekend', module: 'Cross Cultural Management' },
                  { date: '2026-10-05', track: 'weekday', module: 'Fundamentals of Accounting' },{ date: '2026-10-09', track: 'weekend', module: 'International Business Strategy' },
                  { date: '2026-10-19', track: 'weekday', module: 'Strategic Management' },{ date: '2026-10-23', track: 'weekend', module: 'International Banking & Finance' },
                ];
                const ibaIsCourse = e.course?.code === 'IBA';
                const norm = (s: string) => s.toLowerCase().replace(/anis(ational|ation|ed|ing|e)/g, 'aniz$1');
                let ibaOverride: { completed: number; current: any } | null = null;
                let ibaWindowByName: Map<string, { start: number; end: number }> | null = null;
                let ibaCurrentName: string | null = null;
                if (ibaIsCourse) {
                  const startStr = e.startDate || (user as any)?.startDate;
                  const startDate = startStr ? new Date(startStr) : null;
                  // Track: weekday by default; weekend if batchCode starts with IBAW
                  const bc = (e.batchCode || '').toUpperCase();
                  const track: 'weekday' | 'weekend' = bc.startsWith('IBAW') ? 'weekend' : 'weekday';
                  const trackSched = IBA_SCHED.filter(s => s.track === track).map(s => ({ ...s, when: new Date(s.date + 'T00:00:00Z') })).sort((a, b) => a.when.getTime() - b.when.getTime());
                  const inWindow = trackSched.filter(s => (!startDate || s.when.getTime() >= startDate.getTime()));
                  // Find current session: latest one with start <= now AND nextStart > now
                  let currentSession: any = null;
                  for (let i = 0; i < inWindow.length; i++) {
                    const s = inWindow[i];
                    const next = inWindow[i + 1];
                    const endTs = next ? next.when.getTime() : s.when.getTime() + 7 * 86400000;
                    if (now.getTime() >= s.when.getTime() && now.getTime() < endTs) { currentSession = s; break; }
                  }
                  ibaCurrentName = currentSession ? norm(currentSession.module) : null;
                  // For each module, take the FIRST occurrence's window (after startDate).
                  ibaWindowByName = new Map();
                  for (let i = 0; i < inWindow.length; i++) {
                    const s = inWindow[i];
                    const next = inWindow[i + 1];
                    const endTs = next ? next.when.getTime() : s.when.getTime() + 7 * 86400000;
                    const key = norm(s.module);
                    const existing = ibaWindowByName.get(key);
                    if (!existing) ibaWindowByName.set(key, { start: s.when.getTime(), end: endTs });
                    else if (next && norm(next.module) === key && next.when.getTime() === existing.end) ibaWindowByName.set(key, { start: existing.start, end: endTs });
                  }
                  // Completed: modules whose first-window ended before now AND aren't the current one
                  let completed = 0;
                  for (const [name, w] of ibaWindowByName) {
                    if (w.end <= now.getTime() && name !== ibaCurrentName) completed++;
                  }
                  const matchModule = currentSession
                    ? modules.find((m: any) => norm(m.name) === norm(currentSession.module))
                    : null;
                  ibaOverride = { completed, current: matchModule || (currentSession ? { name: currentSession.module } : null) };
                }

                // Prefer authoritative studentProgress + currentModuleId from the
                // backend. Fall back to date-window logic for courses that haven't
                // had per-student progress synced yet.
                const sp: any[] = e.studentProgress || [];
                const hasSyncedProgress = sp.length > 0;
                const statusByModuleId = new Map<string, string>(sp.map((p: any) => [p.moduleId, p.status]));
                const startedByModuleId = new Map<string, string | null>(sp.map((p: any) => [p.moduleId, p.startedAt]));
                const realId = (m: any) => m.id;

                let completedCount: number;
                let currentModule: any;
                if (hasSyncedProgress) {
                  // Prefer authoritative student_progress + enrollment.currentModuleId
                  // (matches the auditor/admin profile view; respects withdrawals).
                  // Counted against the visible/expanded module list so AC's
                  // virtual Sage 50 + Sage 300 split each contributes 1.
                  completedCount = modules.filter((m: any) => statusByModuleId.get(realId(m)) === 'COMPLETED').length;
                  currentModule = e.currentModuleId
                    ? modules.find((m: any) => realId(m) === e.currentModuleId)
                    : modules.find((m: any) => statusByModuleId.get(realId(m)) === 'IN_PROGRESS');
                } else if (ibaOverride) {
                  // Fallback for IBA students with no synced progress yet
                  completedCount = ibaOverride.completed;
                  currentModule = ibaOverride.current;
                } else {
                  const completedModules = modules.filter((m: any) => {
                    if (!m.startDate) return false;
                    const mStart = new Date(m.startDate);
                    const idx = modules.indexOf(m);
                    const nextMod = modules[idx + 1];
                    const mEnd = nextMod?.startDate ? new Date(nextMod.startDate) : new Date(mStart.getTime() + 14 * 86400000);
                    return now >= mEnd;
                  });
                  completedCount = completedModules.length;
                  currentModule = modules.find((m: any, idx: number) => {
                    if (!m.startDate) return false;
                    const mStart = new Date(m.startDate);
                    const nextMod = modules[idx + 1];
                    const mEnd = nextMod?.startDate ? new Date(nextMod.startDate) : new Date(mStart.getTime() + 14 * 86400000);
                    return now >= mStart && now < mEnd;
                  });
                }

                const progress = totalMods > 0 ? (completedCount / totalMods) * 100 : 0;

                return (
                  <div key={e.id} className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                    {/* Course header */}
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => onCourseSelect(e.course.id)}>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-10 rounded" style={{ backgroundColor: e.course.color || '#2D3B45' }} />
                        <div>
                          <h3 className="font-bold text-[#2D3B45]">{e.course.name}</h3>
                          <div className="flex items-center space-x-3 text-[16px] text-gray-500 mt-1">
                            {e.campus && <span>{e.campus}</span>}
                            {e.classTime && <span>{e.classTime}</span>}
                            {e.teacher && <span>Teacher: <span className="font-medium text-[#2D3B45]">{`${e.teacher.firstName ?? ''} ${e.teacher.lastName ?? ''}`.trim() || e.teacher.email}</span></span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-6">
                        {!/withdraw/i.test(profile?.campusStatus || '') && (
                          <div>
                            <div className="text-2xl font-bold text-[#008EE2]">{progress.toFixed(2)}%</div>
                            <div className="text-[14px] text-gray-400">progress</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-4 pb-2">
                      <div className={`w-full bg-gray-200 rounded-full h-2 ${/withdraw/i.test(profile?.campusStatus || '') ? 'blur-sm opacity-60' : ''}`}>
                        <div className="bg-[#008EE2] h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[16px] text-gray-400">
                        <span>{completedCount} of {totalMods} modules completed</span>
                        {currentModule && !/withdraw/i.test(profile?.campusStatus || '') && <span>Current: <span className="font-medium text-[#2D3B45]">{currentModule.name}</span></span>}
                      </div>
                    </div>

                    {/* Module timeline */}
                    {modules.length > 0 && (() => {
                      // For ordering, prefer studentProgress.startedAt (rotation-correct
                      // chronology). Modules without a real student-specific start
                      // (NOT_STARTED — either missed pre-enrollment or still upcoming
                      // in the rotation) go to the end so the timeline reads
                      // completed → current → upcoming left-to-right.
                      const orderedModules = [...modules].sort((a: any, b: any) => {
                        // Prefer per-student studentProgress.startedAt — for IBA students
                        // whose actual cohort cycle differs from the canonical IBA_SCHED
                        // projection, this places their real completion dates correctly.
                        if (hasSyncedProgress) {
                          const aSP = startedByModuleId.get(realId(a));
                          const bSP = startedByModuleId.get(realId(b));
                          if (aSP && bSP) return new Date(aSP).getTime() - new Date(bSP).getTime();
                          if (aSP && !bSP) return -1;
                          if (!aSP && bSP) return 1;
                          // Both missing — fall through to schedule projection or position
                        }
                        if (ibaIsCourse && ibaWindowByName) {
                          const at = ibaWindowByName.get(norm(a.name))?.start ?? Number.MAX_SAFE_INTEGER;
                          const bt = ibaWindowByName.get(norm(b.name))?.start ?? Number.MAX_SAFE_INTEGER;
                          return at - bt;
                        }
                        if (hasSyncedProgress) return (a.position ?? 0) - (b.position ?? 0);
                        const at = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
                        const bt = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
                        return at - bt;
                      });
                      const moduleStatuses: string[] = orderedModules.map((mod: any, idx: number) => {
                        if (ibaIsCourse && ibaWindowByName) {
                          const w = ibaWindowByName.get(norm(mod.name));
                          if (!w) return 'NOT_STARTED';
                          if (ibaCurrentName === norm(mod.name)) return 'IN_PROGRESS';
                          if (now.getTime() >= w.end) return 'COMPLETED';
                          if (now.getTime() >= w.start) return 'IN_PROGRESS';
                          return 'NOT_STARTED';
                        }
                        if (hasSyncedProgress) return statusByModuleId.get(realId(mod)) || 'NOT_STARTED';
                        if (!mod.startDate) return 'NOT_STARTED';
                        const mStart = new Date(mod.startDate);
                        const nextMod = orderedModules[idx + 1];
                        const mEnd = nextMod?.startDate ? new Date(nextMod.startDate) : new Date(mStart.getTime() + 14 * 86400000);
                        if (now >= mEnd) return 'COMPLETED';
                        if (now >= mStart) return 'IN_PROGRESS';
                        return 'NOT_STARTED';
                      });
                      // Only when relying on date-window fallback, collapse multiple IN_PROGRESS to the latest-started.
                      if (!hasSyncedProgress) {
                        const inProgIdxs = moduleStatuses
                          .map((s, i) => (s === 'IN_PROGRESS' ? i : -1))
                          .filter(i => i >= 0);
                        if (inProgIdxs.length > 1) {
                          let keep = inProgIdxs[0];
                          let keepStart = orderedModules[keep].startDate ? new Date(orderedModules[keep].startDate).getTime() : -Infinity;
                          for (const i of inProgIdxs) {
                            const t = orderedModules[i].startDate ? new Date(orderedModules[i].startDate).getTime() : -Infinity;
                            if (t > keepStart) { keep = i; keepStart = t; }
                          }
                          for (const i of inProgIdxs) if (i !== keep) moduleStatuses[i] = 'COMPLETED';
                        }
                      }
                      // For withdrawn students, only show completed bars.
                      const isWithdrawn = /withdraw/i.test(profile?.campusStatus || '');
                      const paired = orderedModules.map((m: any, i: number) => ({ m, status: moduleStatuses[i] }));
                      const filtered = isWithdrawn ? paired.filter((p: any) => p.status === 'COMPLETED') : paired;
                      const renderModules = filtered.map((p: any) => p.m);
                      const renderStatuses = filtered.map((p: any) => p.status);
                      return (
                      <div className="px-4 pb-4">
                        <div className="flex items-center space-x-1 mt-2">
                          {renderModules.map((mod: any, idx: number) => {
                            const status = renderStatuses[idx];
                            const isCurrentMod = currentModule?.id === mod.id;

                            // For IBA students, prefer the rotation-derived window
                            // start (per their startDate + track) over the
                            // unreliable program-level Module.startDate.
                            const ibaW = ibaIsCourse && ibaWindowByName ? ibaWindowByName.get(norm(mod.name)) : null;
                            const tipDate = ibaW
                              ? new Date(ibaW.start).toISOString()
                              : (hasSyncedProgress
                                ? (startedByModuleId.get(realId(mod)) || null)
                                : (mod.startDate || null));
                            return (
                              <div key={mod.id} className="group relative flex-1" title={`${mod.name} — ${status}${tipDate ? ' (' + (status === 'COMPLETED' ? 'taught' : status === 'IN_PROGRESS' ? 'started' : 'starts') + ' ' + new Date(tipDate).toLocaleDateString() + ')' : ''}`}>
                                <div className={`h-3 rounded-sm ${
                                  status === 'COMPLETED' ? 'bg-green-500' :
                                  status === 'IN_PROGRESS' ? 'bg-[#008EE2] animate-pulse' :
                                  'bg-gray-200'
                                }`} />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2D3B45] text-white text-[16px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {mod.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-[16px] text-gray-400">
                          <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-green-500" /><span>Completed</span></div>
                          <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-[#008EE2]" /><span>Current</span></div>
                          <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-gray-200" /><span>Upcoming</span></div>
                        </div>
                      </div>
                      );
                    })()}

                    {/* Details row */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-[#E1E1E1] grid grid-cols-2 md:grid-cols-4 gap-2 text-[16px] text-gray-500">
                      {e.startDate && <span>Start: <span className="font-medium text-gray-700">{new Date(e.startDate).toLocaleDateString()}</span></span>}
                      {e.endDate && <span>End: <span className="font-medium text-gray-700">{new Date(e.endDate).toLocaleDateString()}</span></span>}
                      <span>Tuition Fees: <span className="font-medium text-gray-700">$12,500</span></span>
                      {e.lastStatus && <span>Status: <span className={`font-medium ${e.lastStatus.includes('Start') || e.lastStatus.includes('Active') ? 'text-green-600' : 'text-gray-700'}`}>{e.lastStatus}</span></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Course Files */}
          <DashboardFilesSection
            courses={enrollments
              .filter((e: any) => e.course)
              .map((e: any) => ({ id: e.course.id, name: e.course.name, color: e.course.color }))
              .filter((c: any, idx: number, arr: any[]) => arr.findIndex(x => x.id === c.id) === idx)
            }
          />
        </div>
      </div>
    </>
  );
}

function TeacherDashboardView({ onCourseSelect }: { onCourseSelect: (id: string) => void }) {
  const { data, loading } = useApi<any>('/dashboard');

  if (loading || !data) return <LoadingSpinner />;

  const batches = data.batches || [];
  const totalStudents = batches.reduce((s: number, b: any) => s + b.studentCount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="h-20 border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
        <h1 className="text-3xl font-medium text-[#2D3B45]">Dashboard</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Teacher Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-[#008EE2] text-white rounded-lg p-5">
              <div className="text-3xl font-bold">{batches.length}</div>
              <div className="text-sm opacity-80 mt-1">My Batches</div>
            </div>
            <div className="bg-[#2D3B45] text-white rounded-lg p-5">
              <div className="text-3xl font-bold">{totalStudents}</div>
              <div className="text-sm opacity-80 mt-1">Total Students</div>
            </div>
            <div className="bg-[#008744] text-white rounded-lg p-5">
              <div className="text-3xl font-bold">{data.publishedCourses?.length || 0}</div>
              <div className="text-sm opacity-80 mt-1">Courses</div>
            </div>
          </div>

          {/* My Batches */}
          <h2 className="text-lg font-bold text-[#2D3B45] mb-4 border-b border-gray-200 pb-2">My Batches</h2>
          {batches.length === 0 ? (
            <p className="text-gray-500 text-sm mb-8">No batches assigned yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {batches.map((b: any) => {
                const status = b.startDate ? (new Date() < new Date(b.startDate) ? 'UPCOMING' : (b.endDate && new Date() > new Date(b.endDate) ? 'COMPLETED' : 'ACTIVE')) : 'UPCOMING';
                return (
                  <div key={b.id} onClick={() => onCourseSelect(b.course.id)}
                    className="border border-[#E1E1E1] rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-2" style={{ backgroundColor: b.course.color || '#2D3B45' }} />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 bg-[#2D3B45] text-white text-[16px] font-bold rounded">{b.batchCode}</span>
                          {status !== 'UPCOMING' && (
                            <span className={`px-2 py-0.5 text-[16px] font-bold rounded-full ${status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{status}</span>
                          )}
                        </div>
                        <span className="text-[16px] font-bold text-gray-600">{b.studentCount} students</span>
                      </div>
                      <h3 className="font-bold text-[#2D3B45] text-sm">{b.course.name}</h3>

                      {/* Current module indicator */}
                      {b.currentModuleName && (
                        <div className="mt-2 text-[16px]">
                          <span className="text-gray-400">Current Module:</span>{' '}
                          <span className="font-medium text-[#008EE2]">{b.currentModuleName}</span>
                          <span className="text-gray-300 ml-1">({b.currentModulePosition}/{b.totalModules})</span>
                        </div>
                      )}

                      {/* Module progress bar */}
                      {b.totalModules > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-0.5">
                            {Array.from({ length: b.totalModules }, (_, i) => (
                              <div key={i} className={`flex-1 h-2 rounded-sm ${
                                i + 1 < b.currentModulePosition ? 'bg-green-400' :
                                i + 1 === b.currentModulePosition ? 'bg-[#008EE2]' :
                                'bg-gray-200'
                              }`} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 text-[16px] text-gray-400">
                        {b.startDate && <span>Start: {new Date(b.startDate).toLocaleDateString()}</span>}
                        {b.campus && <span>{b.campus}</span>}
                        {b.classTime && <span>{b.classTime}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Published Courses */}
          {data.publishedCourses?.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-[#2D3B45] mb-4 border-b border-gray-200 pb-2">My Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.publishedCourses.map((course: any) => (
                  <div key={course.id} onClick={() => onCourseSelect(course.id)}
                    className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="h-28 relative" style={{ backgroundColor: course.color || '#2D3B45' }}>
                      <MoreVertical size={20} className="absolute top-3 right-3 text-white" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-1" style={{ color: course.color }}>{course.name}</h3>
                      <p className="text-[#2D3B45] text-sm">{course.code}</p>
                      <div className="flex items-center space-x-4 mt-3 text-gray-400">
                        <Megaphone size={18} /> <NotebookPen size={18} /> <Folder size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Course Files */}
          <DashboardFilesSection
            courses={[
              ...(batches.map((b: any) => ({ id: b.course.id, name: b.course.name, color: b.course.color }))),
              ...((data.publishedCourses || []).map((c: any) => ({ id: c.id, name: c.name, color: c.color }))),
            ].filter((c: any, idx: number, arr: any[]) => arr.findIndex(x => x.id === c.id) === idx)}
          />
        </div>
      </div>
    </div>
  );
}

function AdminDashboardView({ onCourseSelect, onNavigate }: { onCourseSelect: (id: string) => void; onNavigate: (tab: string) => void }) {
  const { user } = useAuth();
  const { data, loading } = useApi<AdminDashboard>('/dashboard');

  if (loading || !data) return <LoadingSpinner />;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="h-20 border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
        <h1 className="text-3xl font-medium text-[#2D3B45]">Dashboard</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {!(user as any)?.isAuditor && (
              <div className="bg-[#008EE2] text-white rounded-lg p-6">
                <div className="text-4xl font-bold">{data.stats.totalStudents}</div>
                <div className="text-sm opacity-80 mt-1">Active Students</div>
              </div>
            )}
            <div className="bg-[#2D3B45] text-white rounded-lg p-6">
              <div className="text-4xl font-bold">{data.stats.totalTeachers}</div>
              <div className="text-sm opacity-80 mt-1">Teachers</div>
            </div>
            <div className="bg-[#008744] text-white rounded-lg p-6">
              <div className="text-4xl font-bold">{data.stats.totalCourses}</div>
              <div className="text-sm opacity-80 mt-1">Courses</div>
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-light text-[#2D3B45] border-b border-gray-200 pb-4 mb-8">
              Published Courses ({data.publishedCourses.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.publishedCourses.map(course => (
                <div key={course.id} onClick={() => onCourseSelect(course.id)}
                  className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                  <div className="h-36 relative" style={{ backgroundColor: course.color }}>
                    <button className="absolute top-4 right-4 p-1 hover:bg-black/10 rounded transition-colors">
                      <MoreVertical size={20} className="text-white" />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-sm mb-1" style={{ color: course.color }}>{course.name}</h3>
                    <p className="text-[#2D3B45] text-sm">{course.code}</p>
                    <div className="flex items-center space-x-6 mt-6 text-gray-400">
                      <Folder size={20} className="hover:text-[#2D3B45]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="w-72 border-l border-gray-200 p-6 overflow-y-auto bg-white shrink-0">
          <div className="mb-10">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
              <h3 className="text-lg font-medium text-[#2D3B45]">Coming Up</h3>
              <button type="button" onClick={() => onNavigate('Calendar')} className="text-[#008EE2] text-[16px] flex items-center hover:underline">
                <Calendar size={12} className="mr-1" /> View Calendar
              </button>
            </div>
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nothing upcoming</p>
            ) : data.upcoming.map(a => (
              <div key={a.id} className="flex items-start space-x-3 mb-4">
                <div className="mt-1 text-gray-400"><NotebookPen size={16} /></div>
                <div className="flex-1 min-w-0">
                  <a href="#" className="text-[#008EE2] text-sm hover:underline block leading-tight">{a.title}</a>
                  <p className="text-[16px] text-gray-400">{a.points} points • {a.dueDate && new Date(a.dueDate).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button onClick={() => onNavigate('Admin')} className="w-full bg-gray-100 hover:bg-gray-200 text-[#2D3B45] text-sm py-2 px-4 rounded transition-colors text-left">
              Start a New Course
            </button>
            <button onClick={() => onNavigate('Admin')} className="w-full bg-gray-100 hover:bg-gray-200 text-[#2D3B45] text-sm py-2 px-4 rounded transition-colors text-left">
              View Grades
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- Admin Courses View ---

function AdminCoursesView({ onCourseSelect }: { onCourseSelect: (id: string) => void }) {
  const { user } = useAuth();
  const [adminActiveSection, setAdminActiveSection] = useState('Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [peoplePage, setPeoplePage] = useState(1);
  const [peopleRole, setPeopleRole] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleSearchId, setPeopleSearchId] = useState('');
  const [selectedBatchCode, setSelectedBatchCode] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, loading } = useApi<{ courses: Course[]; total: number }>('/courses?limit=100');
  const { data: peopleData, loading: peopleLoading } = useApi<{ users: any[]; total: number; totalPages: number }>(
    adminActiveSection === 'People'
      ? `/users?page=${peoplePage}&limit=25${peopleRole ? `&role=${peopleRole}` : ''}${peopleSearch ? `&search=${encodeURIComponent(peopleSearch)}` : ''}${peopleSearchId ? `&searchId=${encodeURIComponent(peopleSearchId)}` : ''}`
      : null
  );
  const [batchSearch, setBatchSearch] = useState('');
  const [batchTypeFilter, setBatchTypeFilter] = useState<'all' | 'PRIMARY' | 'MID_COURSE'>('all');
  const { data: batchesData, loading: batchesLoading, refetch: refetchBatches } = useApi<any[]>(
    adminActiveSection === 'Batches' && !selectedBatchCode ? `/enrollments/batch-summary` : null
  );
  const [batchStudentPage, setBatchStudentPage] = useState(1);
  const [showExitingOnly, setShowExitingOnly] = useState(false);
  const { data: batchStudents, loading: batchStudentsLoading, refetch: refetchBatchStudents } = useApi<any>(
    selectedBatchCode ? `/enrollments?batchCode=${selectedBatchCode}&page=${batchStudentPage}&limit=50` : null
  );
  const { data: userProfile, loading: userProfileLoading, refetch: refetchUserProfile } = useApi<any>(
    selectedUserId ? `/users/${selectedUserId}` : null
  );
  const { data: userSubmissions } = useApi<any[]>(
    selectedUserId ? `/submissions?studentId=${selectedUserId}` : null
  );
  const toggleUserActive = async () => {
    if (!userProfile) return;
    const res = await patch<any>(`/users/${userProfile.id}`, { isActive: !userProfile.isActive });
    if (res.success) refetchUserProfile();
    else alert(res.error || 'Failed to update user');
  };
  const deleteUser = async () => {
    if (!userProfile) return;
    if (!confirm(`Delete ${userProfile.firstName} ${userProfile.lastName} from TAHA College?`)) return;
    const res = await del<any>(`/users/${userProfile.id}`);
    if (res.success) { setSelectedUserId(null); refetchBatchStudents(); refetchBatches(); }
    else alert(res.error || 'Failed to delete user');
  };
  const editUserName = async () => {
    if (!userProfile) return;
    const firstName = prompt('First name:', userProfile.firstName ?? '');
    if (firstName === null) return;
    const lastName = prompt('Last name:', userProfile.lastName ?? '');
    if (lastName === null) return;
    const res = await patch<any>(`/users/${userProfile.id}`, { firstName: firstName.trim(), lastName: lastName.trim() });
    if (res.success) refetchUserProfile();
    else alert(res.error || 'Failed to update user');
  };
  const resetPassword = async () => {
    if (!userProfile) return;
    const password = prompt(`Set a new password for ${userProfile.firstName}. Leave blank to cancel.`);
    if (!password || password.trim().length < 6) { if (password !== null) alert('Password must be at least 6 characters.'); return; }
    const res = await patch<any>(`/users/${userProfile.id}`, { password: password.trim() });
    if (res.success) alert('Password updated.');
    else alert(res.error || 'Failed to update password');
  };
  const [pageViewTab, setPageViewTab] = useState<'30day' | '1year'>('30day');
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [gradesCourseFilter, setGradesCourseFilter] = useState<string>('all');
  const [showProgressModal, setShowProgressModal] = useState(false);
  // Dialogs
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showCreateBatchDialog, setShowCreateBatchDialog] = useState(false);
  const [enrollStudentSearch, setEnrollStudentSearch] = useState('');
  const [enrollAutoSubBatch, setEnrollAutoSubBatch] = useState(true);
  const [enrollResult, setEnrollResult] = useState<any>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const { data: searchStudents } = useApi<{ users: any[] }>(
    enrollStudentSearch.length >= 2 ? `/users?search=${encodeURIComponent(enrollStudentSearch)}&role=STUDENT&limit=10` : null
  );
  const [createBatchCourseId, setCreateBatchCourseId] = useState('');
  const [createBatchTeacherId, setCreateBatchTeacherId] = useState('');
  const [createBatchLoading, setCreateBatchLoading] = useState(false);
  const { data: allTeachers } = useApi<{ users: any[] }>(
    showCreateBatchDialog ? '/users?role=TEACHER&limit=100' : null
  );

  const adminNavItems = [
    'Courses', 'Batches', 'People',
    ...(((user as any)?.isAuditor) ? [] : ['Statistics']),
    'Permissions', 'Question Banks',
    ...(((user as any)?.isAuditor) ? [] : ['Analytics Hub']),
    'Apps',
    ...(((user as any)?.isAuditor) ? [] : ['Admin Analytics']),
    ...(((user as any)?.isAuditor) ? [] : ['Outcomes', 'Rubrics', 'Grading'])
  ];

  const filteredCourses = data?.courses.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="h-16 border-b border-[#E1E1E1] flex items-center px-8 bg-white shrink-0">
        <Menu size={24} className="mr-6 text-[#2D3B45] cursor-pointer" />
        <div className="flex items-center text-lg font-medium text-[#2D3B45]">
          <span className="text-[#008EE2] hover:underline cursor-pointer">TAHA College</span>
          <ChevronRight size={18} className="mx-2 text-gray-400" />
          <span>{adminActiveSection}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 border-r border-[#E1E1E1] overflow-y-auto py-4 shrink-0">
          {adminNavItems.map(item => (
            <div key={item} onClick={() => setAdminActiveSection(item)}
              className={`flex items-center px-4 py-1.5 cursor-pointer border-l-[3px] ${adminActiveSection === item ? 'border-black text-black font-bold' : 'border-transparent text-[#008EE2] hover:bg-gray-50'}`}>
              <span className="text-[16px]">{item}</span>
            </div>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto p-8">
          {adminActiveSection === 'Courses' && (
            <div className="max-w-[1400px] mx-auto">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search courses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                </div>
              </div>

              {loading ? <LoadingSpinner /> : (
                <div className="border-t border-gray-200">
                  <table className="w-full text-left text-[16px]">
                    <thead>
                      <tr className="text-[#008EE2] font-bold">
                        <th className="py-4 px-4 w-16">Status</th>
                        <th className="py-4 px-4">Course</th>
                        <th className="py-4 px-4">SIS ID</th>
                        <th className="py-4 px-4">Term</th>
                        <th className="py-4 px-4">Teacher</th>
                        <th className="py-4 px-4">Sub-Account</th>
                        {!(user as any)?.isAuditor && <th className="py-4 px-4">Students</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCourses.map(course => (
                        <tr key={course.id} className="hover:bg-gray-50 group">
                          <td className="py-4 px-4">
                            {course.status === 'PUBLISHED' ? (
                              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </td>
                          <td className="py-4 px-4"><a href="#" onClick={(e) => { e.preventDefault(); onCourseSelect(course.id); }} className="text-[#008EE2] hover:underline">{course.name}</a></td>
                          <td className="py-4 px-4 text-gray-600">{course.code}</td>
                          <td className="py-4 px-4 text-gray-600">{course.term}</td>
                          <td className="py-4 px-4 align-top min-w-[200px]">
                            {course.teachers?.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                <div className="w-8 h-8 shrink-0 overflow-hidden rounded-full border border-gray-300 flex items-center justify-center text-[13px] font-medium text-gray-600 bg-white">
                                  {(t.initial ?? '?').slice(0, 2)}
                                </div>
                                <a href="#" onClick={e => { e.preventDefault(); setSelectedUserId(t.id); setAdminActiveSection('Batches'); }} className="text-[#008EE2] hover:underline text-[16px] break-words min-w-0">{t.name}</a>
                              </div>
                            ))}
                          </td>
                          <td className="py-4 px-4"><a href="#" onClick={e => { e.preventDefault(); setAdminActiveSection('Sub-Accounts'); }} className="text-[#008EE2] hover:underline">{course.subAccount}</a></td>
                          {!(user as any)?.isAuditor && <td className="py-4 px-4 text-gray-600">{course.studentCount}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {adminActiveSection === 'People' && (
            <div className="max-w-[1400px] mx-auto">
              {/* Filters */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1 max-w-[300px]">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search by name or email..."
                    value={peopleSearch}
                    onChange={e => { setPeopleSearch(e.target.value); setPeoplePage(1); }}
                    className="w-full bg-white border border-gray-300 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                </div>
                <div className="relative flex-1 max-w-[240px]">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search by ID..."
                    value={peopleSearchId}
                    onChange={e => { setPeopleSearchId(e.target.value); setPeoplePage(1); }}
                    className="w-full bg-white border border-gray-300 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                </div>
                <select value={peopleRole}
                  onChange={e => { setPeopleRole(e.target.value); setPeoplePage(1); }}
                  className="bg-white border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]">
                  <option value="">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="TEACHER">Teachers</option>
                  <option value="ADMIN">Admins</option>
                </select>
                <div className="text-sm text-gray-500">
                  {peopleData ? `${peopleData.total} users found` : ''}
                </div>
              </div>

              {peopleLoading ? <LoadingSpinner /> : (
                <>
                  <div className="border-t border-gray-200">
                    <table className="w-full text-left text-[16px]">
                      <thead>
                        <tr className="text-[#008EE2] font-bold">
                          <th className="py-4 px-4">Name</th>
                          <th className="py-4 px-4">Email</th>
                          <th className="py-4 px-4">Role</th>
                          {!(user as any)?.isAuditor && <th className="py-4 px-4">Status</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {peopleData?.users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedUserId(u.id); setAdminActiveSection('Batches'); }}>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-[16px] font-medium text-gray-600 bg-gray-50">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-medium text-[#008EE2] hover:underline">{u.firstName} {u.lastName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-600 text-[16px]">{u.email}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 text-[16px] font-medium rounded-full ${
                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{u.role}</span>
                            </td>
                            {!(user as any)?.isAuditor && (
                              <td className="py-4 px-4">
                                {u.isActive ? (
                                  <span className="px-2 py-0.5 text-[16px] font-medium rounded-full bg-green-100 text-green-700">Active</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[16px] font-medium rounded-full bg-red-100 text-red-600">Inactive</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {peopleData && peopleData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Page {peoplePage} of {peopleData.totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setPeoplePage(p => Math.max(1, p - 1))} disabled={peoplePage <= 1}
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, peopleData.totalPages) }, (_, i) => {
                          const start = Math.max(1, Math.min(peoplePage - 2, peopleData.totalPages - 4));
                          const page = start + i;
                          if (page > peopleData.totalPages) return null;
                          return (
                            <button key={page} onClick={() => setPeoplePage(page)}
                              className={`w-8 h-8 rounded text-sm ${page === peoplePage ? 'bg-[#008EE2] text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
                              {page}
                            </button>
                          );
                        })}
                        <button onClick={() => setPeoplePage(p => Math.min(peopleData.totalPages, p + 1))} disabled={peoplePage >= peopleData.totalPages}
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {adminActiveSection === 'Batches' && (
            <div className="max-w-[1400px] mx-auto">
              {/* Student Profile View */}
              {selectedUserId ? (
                <div>
                  <button onClick={() => setSelectedUserId(null)} className="flex items-center text-[#008EE2] text-sm mb-6 hover:underline">
                    <ChevronLeft size={16} className="mr-1" /> Back to {selectedBatchCode ? `Batch ${selectedBatchCode}` : 'list'}
                  </button>
                  {userProfileLoading ? <LoadingSpinner /> : userProfile && (
                    <div>
                      {/* Canvas-style breadcrumb */}
                      <div className="text-[13px] text-[#008EE2] mb-3">
                        <a onClick={() => { setSelectedUserId(null); setAdminActiveSection('Courses'); }} className="hover:underline cursor-pointer">TAHA College</a>
                        <span className="text-gray-400 mx-1">›</span>
                        <span className="text-gray-600">{userProfile.firstName?.toLowerCase()}'s profile</span>
                      </div>

                      <div className="flex gap-6">
                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <h1 className="text-[28px] font-normal text-[#2D3B45] mb-4">{userProfile.firstName}</h1>

                          {/* Name and Email fieldset */}
                          <fieldset className="border border-[#C7CDD1] rounded px-4 pt-2 pb-3 mb-4">
                            <legend className="px-2 text-[14px] font-bold text-[#2D3B45]">Name and Email</legend>
                            <div className="flex">
                              <table className="flex-1 text-[14px]">
                                <tbody>
                                  <tr>
                                    <td className="w-[140px] align-top py-1 text-[#2D3B45] font-bold">Full Name:</td>
                                    <td className="py-1 text-[#2D3B45]">{userProfile.firstName} {userProfile.lastName}</td>
                                  </tr>
                                  <tr>
                                    <td className="align-top py-1 text-[#2D3B45] font-bold">Display Name:</td>
                                    <td className="py-1 text-[#2D3B45]">{userProfile.firstName}</td>
                                  </tr>
                                  <tr>
                                    <td className="align-top py-1 text-[#2D3B45] font-bold">Sortable Name:</td>
                                    <td className="py-1 text-[#2D3B45]">{userProfile.lastName}, {userProfile.firstName}</td>
                                  </tr>
                                  <tr>
                                    <td className="align-top py-2 text-[#2D3B45] font-bold">Profile Picture:</td>
                                    <td className="py-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-[50px] h-[50px] rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[#008EE2] text-[18px] font-light">
                                          {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                                        </div>
                                        <a onClick={async () => {
                                          if (!confirm('Remove avatar picture?')) return;
                                          const res = await patch<any>(`/users/${userProfile.id}`, { avatarUrl: null });
                                          if (res.success) refetchUserProfile(); else alert(res.error || 'Failed to remove avatar');
                                        }} className="text-[#008EE2] hover:underline cursor-pointer text-[13px]">Remove avatar picture</a>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="align-top py-1 text-[#2D3B45] font-bold">Default Email:</td>
                                    <td className="py-1 text-[#2D3B45]">{userProfile.email}</td>
                                  </tr>
                                  <tr>
                                    <td className="align-top py-1 text-[#2D3B45] font-bold">Time Zone:</td>
                                    <td className="py-1 text-[#2D3B45]">Eastern Time (US &amp; Canada)</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-2 pt-1 text-[13px] text-[#008EE2]">
                              <a onClick={editUserName} className="hover:underline cursor-pointer">Edit</a>
                              <span className="text-gray-400 px-1">|</span>
                              <a onClick={resetPassword} className="hover:underline cursor-pointer">Reset Password</a>
                              <span className="text-gray-400 px-1">|</span>
                              <a onClick={toggleUserActive} className="hover:underline cursor-pointer">{userProfile.isActive ? 'Suspend User' : 'Reactivate User'}</a>
                              <span className="text-gray-400 px-1">|</span>
                              <a onClick={deleteUser} className="hover:underline cursor-pointer text-red-600">Delete from TAHA College</a>
                            </div>
                          </fieldset>

                          {/* Login Information fieldset */}
                          <fieldset className="border border-[#C7CDD1] rounded px-4 pt-2 pb-3 mb-4">
                            <legend className="px-2 text-[14px] font-bold text-[#2D3B45]">Login Information</legend>
                            <table className="w-full text-[13px] border-t border-gray-200">
                              <tbody>
                                <tr className="border-b border-gray-200">
                                  <td className="align-top py-3 px-3 text-[#2D3B45] leading-6">
                                    <div>{userProfile.email}</div>
                                    {userProfile.vNumber && <div>SIS ID: {userProfile.vNumber}</div>}
                                    <div>Integration ID:</div>
                                  </td>
                                  <td className="align-top py-3 px-3 text-[#2D3B45] whitespace-nowrap">TAHA College</td>
                                  <td className="align-top py-3 px-3 text-right w-[30px]">
                                    <button onClick={editUserName} className="text-gray-400 hover:text-[#008EE2]" title="Edit login">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div className="mt-2 text-[13px]">
                              <a onClick={resetPassword} className="text-[#008EE2] hover:underline cursor-pointer">Reset Password</a>
                            </div>
                          </fieldset>

                          {/* Student Information (TAHA-specific fields) */}
                          {(userProfile.campus || userProfile.program || userProfile.shift || userProfile.contactNo || userProfile.startDate || userProfile.finishDate || userProfile.campusStatus || userProfile.admissionRep) && (
                            <fieldset className="border border-[#C7CDD1] rounded px-4 pt-2 pb-4 mb-4">
                              <legend className="px-2 text-[14px] font-bold text-[#2D3B45]">Student Information</legend>
                              <table className="w-full text-[14px]">
                                <tbody>
                                  {[
                                    { label: 'Contact', value: userProfile.contactNo },
                                    { label: 'Campus', value: userProfile.campus },
                                    { label: 'Program', value: userProfile.program },
                                    { label: 'Shift', value: userProfile.shift },
                                    { label: 'Start Date', value: userProfile.startDate ? new Date(userProfile.startDate).toLocaleDateString() : null },
                                    { label: 'Finish Date', value: userProfile.finishDate ? new Date(userProfile.finishDate).toLocaleDateString() : null },
                                    { label: 'Status', value: userProfile.campusStatus },
                                    { label: 'Admission Rep', value: userProfile.admissionRep },
                                  ].filter(f => f.value).map(f => (
                                    <tr key={f.label}>
                                      <td className="w-[160px] align-top py-1 text-[#2D3B45] font-bold">{f.label}:</td>
                                      <td className="py-1 text-[#2D3B45]">{f.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </fieldset>
                          )}

                          {/* Enrollments fieldset */}
                          <fieldset className="border border-[#C7CDD1] rounded px-4 pt-2 pb-4 mb-4">
                            <legend className="px-2 text-[14px] font-bold text-[#2D3B45]">Enrollments</legend>
                            <div className="text-[14px] font-bold text-[#2D3B45] mb-2">Courses ({userProfile.enrollments?.length || 0})</div>
                            {userProfile.enrollments?.length > 0 ? (
                              <div className="max-h-[180px] overflow-y-auto pr-2">
                                {userProfile.enrollments.map((e: any) => (
                                  <div key={e.id} className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-b-0">
                                    <div className="text-[13px] min-w-0 flex-1">
                                      <a onClick={() => onCourseSelect(e.course.id)} className="text-[#008EE2] hover:underline cursor-pointer font-medium">
                                        {e.course.name}{e.batchCode ? `, ${e.batchCode}` : ''}{e.startDate ? ` - ${new Date(e.startDate).toLocaleDateString()}` : ''}
                                      </a>
                                      <div className="text-[12px] text-gray-500 mt-0.5">
                                        <span className={`${e.lastStatus?.includes('Withdrawal') || e.lastStatus?.includes('Cancel') ? 'text-red-600' : 'text-green-700'}`}>
                                          {e.lastStatus || 'Active'}
                                        </span>
                                        , Enrolled as: Student
                                      </div>
                                    </div>
                                    <button onClick={async () => {
                                      if (!confirm(`Remove enrollment in ${e.course.name}?`)) return;
                                      const res = await del<any>(`/enrollments/${e.id}`);
                                      if (res.success) refetchUserProfile(); else alert(res.error || 'Failed to remove enrollment');
                                    }} className="text-gray-400 hover:text-red-500 ml-3 mt-0.5" title="Remove enrollment">
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[13px] text-gray-500 py-2">No enrollments.</div>
                            )}
                          </fieldset>

                          {/* Access Tokens fieldset */}
                          <fieldset className="border border-[#C7CDD1] rounded px-4 pt-2 pb-8 mb-4">
                            <legend className="px-2 text-[14px] font-bold text-[#2D3B45]">Access Tokens</legend>
                            <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                              <Search size={40} strokeWidth={1.5} className="mb-2" />
                              <div className="text-[13px]">This user has not generated any access tokens.</div>
                            </div>
                          </fieldset>

                          {/* Page Views fieldset */}
                          <fieldset className="border border-[#C7CDD1] rounded px-4 pt-2 pb-6">
                            <legend className="px-2 text-[14px] font-bold text-[#2D3B45]">Page Views</legend>
                            <div className="flex items-center gap-1 border-b border-gray-200 mb-2">
                              <button
                                type="button"
                                onClick={() => setPageViewTab('30day')}
                                className={`px-3 py-1.5 text-[13px] ${pageViewTab === '30day' ? 'font-medium border-b-2 border-[#008EE2] text-[#2D3B45]' : 'text-[#008EE2] hover:underline'}`}>
                                30-day activity
                              </button>
                              <button
                                type="button"
                                onClick={() => setPageViewTab('1year')}
                                className={`px-3 py-1.5 text-[13px] ${pageViewTab === '1year' ? 'font-medium border-b-2 border-[#008EE2] text-[#2D3B45]' : 'text-[#008EE2] hover:underline'}`}>
                                1-year activity
                              </button>
                            </div>
                            <div className="text-[12px] text-gray-500 mb-4">
                              {pageViewTab === '30day'
                                ? 'Assignment submission and grading activity in the last 30 days.'
                                : 'Assignment submission and grading activity in the last year.'}
                            </div>
                            {(() => {
                              const now = Date.now();
                              const cutoff = now - (pageViewTab === '30day' ? 30 : 365) * 86400000;
                              const events: { at: Date; action: 'SUBMITTED' | 'GRADED'; title: string; courseCode: string; score: number | null; points: number | null; isLate: boolean }[] = [];
                              for (const s of userSubmissions ?? []) {
                                if (!s.submittedAt) continue;
                                const title = s.assignment?.title ?? 'Assignment';
                                const courseCode = s.assignment?.course?.code ?? '';
                                const action = s.status === 'GRADED' ? 'GRADED' : 'SUBMITTED';
                                events.push({
                                  at: new Date(s.submittedAt),
                                  action,
                                  title,
                                  courseCode,
                                  score: action === 'GRADED' ? s.score : null,
                                  points: s.assignment?.points ?? null,
                                  isLate: !!s.isLate,
                                });
                              }
                              const windowed = events.filter(e => e.at.getTime() >= cutoff && e.at.getTime() <= now).sort((a, b) => b.at.getTime() - a.at.getTime());
                              if (windowed.length === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center py-8">
                                    <div className="text-5xl mb-2">🐼</div>
                                    <div className="text-[14px] font-medium text-[#2D3B45]">
                                      {pageViewTab === '30day' ? 'Nothing in the last 30 days' : 'Nothing in the last year'}
                                    </div>
                                    <div className="text-[12px] text-gray-500 mt-1 text-center max-w-md">
                                      No assignment activity to show.
                                    </div>
                                  </div>
                                );
                              }
                              const relative = (d: Date) => {
                                const diffMs = now - d.getTime();
                                const m = Math.floor(diffMs / 60000);
                                if (m < 1) return 'just now';
                                if (m < 60) return `${m} min${m === 1 ? '' : 's'} ago`;
                                const h = Math.floor(m / 60);
                                if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
                                const dd = Math.floor(h / 24);
                                if (dd < 7) return `${dd} day${dd === 1 ? '' : 's'} ago`;
                                const w = Math.floor(dd / 7);
                                if (w < 5) return `${w} week${w === 1 ? '' : 's'} ago`;
                                const mo = Math.floor(dd / 30);
                                if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
                                return `${Math.floor(dd / 365)} year${dd >= 730 ? 's' : ''} ago`;
                              };
                              return (
                                <div className="divide-y divide-gray-100">
                                  {windowed.map((ev, i) => (
                                    <div key={i} className="flex items-start py-2 text-[13px]">
                                      <div className="w-[90px] shrink-0 text-gray-500">
                                        {ev.at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        <div className="text-[11px]">{ev.at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${ev.action === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {ev.action}
                                          </span>
                                          {ev.action === 'GRADED' && ev.score != null && ev.points != null && (
                                            <span className="text-[12px] font-bold text-[#2D3B45]">{ev.score} / {ev.points}</span>
                                          )}
                                        </div>
                                        <div className="text-[#2D3B45] truncate">
                                          {ev.title}
                                          {ev.courseCode && <span className="text-gray-500 ml-2">({ev.courseCode})</span>}
                                        </div>
                                      </div>
                                      <div className="w-[100px] shrink-0 text-right text-[12px] text-gray-500">{relative(ev.at)}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </fieldset>
                        </div>

                        {/* Right sidebar actions */}
                        <aside className="w-[220px] shrink-0 space-y-2">
                          <button onClick={() => { window.location.href = `mailto:${userProfile.email}?subject=Message from TAHA College`; }} className="w-full flex items-center gap-2 px-3 py-2 border border-[#C7CDD1] rounded text-[13px] text-[#2D3B45] hover:bg-gray-50 text-left">
                            <Inbox size={14} className="shrink-0" />
                            <span>Message {userProfile.firstName}</span>
                          </button>
                          <button onClick={() => { setGradesCourseFilter('all'); setShowGradesModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 border border-[#C7CDD1] rounded text-[13px] text-[#2D3B45] hover:bg-gray-50 text-left">
                            <GraduationCap size={14} className="shrink-0" />
                            <span>Grades</span>
                          </button>
                          <button onClick={() => setShowProgressModal(true)} className="w-full flex items-center gap-2 px-3 py-2 border border-[#C7CDD1] rounded text-[13px] text-[#2D3B45] hover:bg-gray-50 text-left">
                            <NotebookPen size={14} className="shrink-0" />
                            <span>Progress</span>
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`Terminate all sessions for ${userProfile.firstName}? This will log them out and suspend the account until reactivated.`)) return;
                            const res = await patch<any>(`/users/${userProfile.id}`, { isActive: false });
                            if (res.success) { refetchUserProfile(); alert('All sessions terminated.'); }
                            else alert(res.error || 'Failed');
                          }} className="w-full flex items-center gap-2 px-3 py-2 border border-[#C7CDD1] rounded text-[13px] text-[#2D3B45] hover:bg-gray-50 text-left">
                            <Shield size={14} className="shrink-0" />
                            <span>Terminate all sessions for this user</span>
                          </button>
                        </aside>
                      </div>

                      {/* Grades modal */}
                      {showGradesModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowGradesModal(false)}>
                          <div className="bg-white rounded-lg shadow-xl w-[900px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                              <div>
                                <h2 className="text-[16px] font-bold text-[#2D3B45]">Grades — {userProfile.firstName} {userProfile.lastName}</h2>
                                <p className="text-[12px] text-gray-500">All submissions, newest first.</p>
                              </div>
                              <button onClick={() => setShowGradesModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                            </div>
                            {(() => {
                              const rows = (userSubmissions ?? [])
                                .filter((s: any) => s.submittedAt || s.date || s.status === 'GRADED')
                                .map((s: any) => ({
                                  at: s.submittedAt || s.date ? new Date(s.submittedAt || s.date) : null,
                                  course: s.assignment?.course?.code ?? '',
                                  title: s.assignment?.title ?? 'Assignment',
                                  status: s.status ?? 'MISSING',
                                  score: s.score,
                                  points: s.assignment?.points ?? 0,
                                  isLate: !!s.isLate,
                                }))
                                .sort((a: any, b: any) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
                              const courseCodes = Array.from(new Set(rows.map((r: any) => r.course))).filter(Boolean).sort();
                              const filtered = gradesCourseFilter === 'all' ? rows : rows.filter((r: any) => r.course === gradesCourseFilter);
                              const graded = filtered.filter((r: any) => r.status === 'GRADED').length;
                              const totalScore = filtered.filter((r: any) => r.status === 'GRADED' && typeof r.score === 'number').reduce((a: number, r: any) => a + r.score, 0);
                              const totalPoints = filtered.filter((r: any) => r.status === 'GRADED').reduce((a: number, r: any) => a + (r.points || 0), 0);
                              return (
                                <>
                                  <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50 text-[12px]">
                                    <label className="text-gray-600">Course:</label>
                                    <select value={gradesCourseFilter} onChange={e => setGradesCourseFilter(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-[12px]">
                                      <option value="all">All ({rows.length})</option>
                                      {courseCodes.map(c => <option key={c} value={c}>{c} ({rows.filter((r: any) => r.course === c).length})</option>)}
                                    </select>
                                    <div className="ml-auto text-gray-600" />
                                  </div>
                                  <div className="overflow-auto flex-1">
                                    {filtered.length === 0 ? (
                                      <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-[13px]">No submissions to show.</div>
                                    ) : (
                                      <table className="w-full text-[12px]">
                                        <thead className="bg-gray-50 sticky top-0">
                                          <tr className="text-left text-gray-600">
                                            <th className="px-4 py-2 font-medium w-[70px]">Course</th>
                                            <th className="px-4 py-2 font-medium">Assignment</th>
                                            <th className="px-4 py-2 font-medium w-[100px]">Status</th>
                                            <th className="px-4 py-2 font-medium text-right w-[110px]">Score</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {filtered.map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                              <td className="px-4 py-2 text-gray-700">{r.course}</td>
                                              <td className="px-4 py-2 text-[#2D3B45]">{r.title}{r.isLate && <span className="ml-2 text-[10px] text-orange-600">LATE</span>}</td>
                                              <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${r.status === 'GRADED' ? 'bg-green-100 text-green-700' : r.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                  {r.status}
                                                </span>
                                              </td>
                                              <td className="px-4 py-2 text-right tabular-nums">
                                                {r.status === 'GRADED' && typeof r.score === 'number' ? (
                                                  <span className="font-medium">{r.score}<span className="text-gray-400">/{r.points}</span></span>
                                                ) : (
                                                  <span className="text-gray-400">—</span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Progress modal */}
                      {showProgressModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowProgressModal(false)}>
                          <div className="bg-white rounded-lg shadow-xl w-[850px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                              <div>
                                <h2 className="text-[16px] font-bold text-[#2D3B45]">Course Progress — {userProfile.firstName} {userProfile.lastName}</h2>
                                <p className="text-[12px] text-gray-500">Per-course module schedule with current module highlighted.</p>
                              </div>
                              <button onClick={() => setShowProgressModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                            </div>
                            <div className="overflow-auto flex-1 p-5 space-y-6">
                              {(userProfile.enrollments ?? []).length === 0 ? (
                                <div className="text-center text-gray-500 text-[13px] py-8">No enrollments for this student.</div>
                              ) : (
                                (userProfile.enrollments ?? []).map((e: any) => {
                                  const AC_FILLER_MODULES = new Set([
                                    'Microsoft Windows', 'Microsoft Word 2',
                                    'Microsoft Excel 1 and Excel 2', 'Microsoft Outlook',
                                    'Microsoft Powerpoint',
                                  ]);
                                  const modules = (e.course?.modules ?? []);
                                  const realId = (m: any) => m.id;
                                  const now = new Date();
                                  const sp: any[] = e.studentProgress || [];
                                  const hasSyncedProgress = sp.length > 0;
                                  const spByModuleId = new Map<string, any>(sp.map((p: any) => [p.moduleId, p]));
                                  // Chronologically sorted list of module startDates (only modules that have one).
                                  const sortedStarts = modules
                                    .filter((m: any) => m.startDate)
                                    .map((m: any) => new Date(m.startDate).getTime())
                                    .sort((a: number, b: number) => a - b);
                                  // IBA-specific: rotation schedule overrides per-student windows.
                                  const ibaModWindowByName = new Map<string, { start: Date; end: Date }>();
                                  const norm = (s: string) => s.toLowerCase().replace(/anis(ational|ation|ed|ing|e)/g, 'aniz$1');
                                  if (e.course?.code === 'IBA') {
                                    const IBA_SCHED: { date: string; track: 'weekday' | 'weekend'; module: string }[] = [
                                      { date: '2025-08-04', track: 'weekday', module: 'Macro Economics' },{ date: '2025-08-18', track: 'weekday', module: 'Computer Applications in Business' },
                                      { date: '2025-09-01', track: 'weekday', module: 'Business Law' },{ date: '2025-09-15', track: 'weekday', module: 'Business Ethics' },
                                      { date: '2025-09-29', track: 'weekday', module: 'English Fundamentals' },{ date: '2025-10-13', track: 'weekday', module: 'Statistics for Business' },
                                      { date: '2025-10-27', track: 'weekday', module: 'Fundamentals of Accounting' },{ date: '2025-11-10', track: 'weekday', module: 'Strategic Management' },
                                      { date: '2025-11-24', track: 'weekday', module: 'International Law' },{ date: '2025-11-28', track: 'weekend', module: 'Introduction to HRM' },
                                      { date: '2025-12-08', track: 'weekday', module: 'E Commerce & Digital Marketing' },{ date: '2025-12-12', track: 'weekend', module: 'Management Fundamentals' },
                                      { date: '2025-12-29', track: 'weekday', module: 'Leadership' },{ date: '2026-01-02', track: 'weekend', module: 'Sales Management' },
                                      { date: '2026-01-12', track: 'weekday', module: 'Intercultural Communication' },{ date: '2026-01-16', track: 'weekend', module: 'Project Management' },
                                      { date: '2026-01-26', track: 'weekday', module: 'Cross Cultural Management' },{ date: '2026-01-30', track: 'weekend', module: 'Fundamentals of Marketing' },
                                      { date: '2026-02-09', track: 'weekday', module: 'International Business Strategy' },{ date: '2026-02-13', track: 'weekend', module: 'Operations Research' },
                                      { date: '2026-02-23', track: 'weekday', module: 'International Banking & Finance' },{ date: '2026-02-27', track: 'weekend', module: 'Organizational Behaviour' },
                                      { date: '2026-03-09', track: 'weekday', module: 'Entrepreneurship' },{ date: '2026-03-13', track: 'weekend', module: 'Strategic Management' },
                                      { date: '2026-03-23', track: 'weekday', module: 'Introduction to HRM' },{ date: '2026-03-27', track: 'weekend', module: 'Micro Economics' },
                                      { date: '2026-04-06', track: 'weekday', module: 'Management Fundamentals' },{ date: '2026-04-10', track: 'weekend', module: 'Macro Economics' },
                                      { date: '2026-04-20', track: 'weekday', module: 'Sales Management' },{ date: '2026-04-24', track: 'weekend', module: 'Statistics for Business' },
                                      { date: '2026-05-04', track: 'weekday', module: 'Project Management' },{ date: '2026-05-08', track: 'weekend', module: 'Fundamentals of Accounting' },
                                      { date: '2026-05-18', track: 'weekday', module: 'Fundamentals of Marketing' },{ date: '2026-05-22', track: 'weekend', module: 'Computer Applications in Business' },
                                      { date: '2026-06-01', track: 'weekday', module: 'Operations Research' },{ date: '2026-06-05', track: 'weekend', module: 'Business Law' },
                                      { date: '2026-06-15', track: 'weekday', module: 'Organizational Behaviour' },{ date: '2026-06-19', track: 'weekend', module: 'Business Ethics' },
                                      { date: '2026-06-29', track: 'weekday', module: 'Micro Economics' },{ date: '2026-07-03', track: 'weekend', module: 'English Fundamentals' },
                                      { date: '2026-07-13', track: 'weekday', module: 'Macro Economics' },{ date: '2026-07-17', track: 'weekend', module: 'International Law' },
                                      { date: '2026-07-27', track: 'weekday', module: 'Computer Applications in Business' },{ date: '2026-07-31', track: 'weekend', module: 'E Commerce & Digital Marketing' },
                                      { date: '2026-08-10', track: 'weekday', module: 'Business Law' },{ date: '2026-08-14', track: 'weekend', module: 'Leadership' },
                                      { date: '2026-08-24', track: 'weekday', module: 'Business Ethics' },{ date: '2026-08-28', track: 'weekend', module: 'Entrepreneurship' },
                                      { date: '2026-09-07', track: 'weekday', module: 'English Fundamentals' },{ date: '2026-09-11', track: 'weekend', module: 'Intercultural Communication' },
                                      { date: '2026-09-21', track: 'weekday', module: 'Statistics for Business' },{ date: '2026-09-25', track: 'weekend', module: 'Cross Cultural Management' },
                                      { date: '2026-10-05', track: 'weekday', module: 'Fundamentals of Accounting' },{ date: '2026-10-09', track: 'weekend', module: 'International Business Strategy' },
                                      { date: '2026-10-19', track: 'weekday', module: 'Strategic Management' },{ date: '2026-10-23', track: 'weekend', module: 'International Banking & Finance' },
                                    ];
                                    const bc = (e.batchCode || '').toUpperCase();
                                    const track: 'weekday' | 'weekend' = bc.startsWith('IBAW') ? 'weekend' : 'weekday';
                                    const studentStartTs = e.startDate ? new Date(e.startDate).getTime() : 0;
                                    const trackSched = IBA_SCHED.filter(s => s.track === track)
                                      .map(s => ({ ...s, when: new Date(s.date + 'T00:00:00Z') }))
                                      .sort((a, b) => a.when.getTime() - b.when.getTime());
                                    const inWindow = trackSched.filter(s => s.when.getTime() >= studentStartTs);
                                    // For each session, end = next same-track session.start (or +7d for last).
                                    // For a given module, use the FIRST occurrence's window after the
                                    // student's startDate. Skip later cycles so the window stays tight.
                                    for (let i = 0; i < inWindow.length; i++) {
                                      const s = inWindow[i];
                                      const next = inWindow[i + 1];
                                      const end = next ? next.when : new Date(s.when.getTime() + 7 * 86400000);
                                      const key = norm(s.module);
                                      const existing = ibaModWindowByName.get(key);
                                      if (!existing) {
                                        ibaModWindowByName.set(key, { start: s.when, end });
                                      } else if (next && norm(next.module) === key && next.when.getTime() === existing.end.getTime()) {
                                        // Adjacent same-track same-module session extends the same instance
                                        ibaModWindowByName.set(key, { start: existing.start, end });
                                      }
                                    }
                                  }
                                  const modWindow = (m: any) => {
                                    // Always prefer student_progress.started_at/completed_at when present:
                                    // it reflects the student's actual cohort cycle (which may differ
                                    // from the canonical IBA_SCHED projection — e.g. earlier intakes).
                                    if (hasSyncedProgress) {
                                      const p = spByModuleId.get(realId(m));
                                      if (p?.startedAt) {
                                        const start = new Date(p.startedAt);
                                        const end = p.completedAt ? new Date(p.completedAt) : new Date(start.getTime() + 14 * 86400000);
                                        return { start, end };
                                      }
                                    }
                                    // Fallback for IBA: rotation-derived windows for modules without progress rows.
                                    if (e.course?.code === 'IBA') {
                                      const w = ibaModWindowByName.get(norm(m.name));
                                      return w || null;
                                    }
                                    if (hasSyncedProgress) return null;
                                    if (!m.startDate) return null;
                                    const start = new Date(m.startDate);
                                    const nextMs = sortedStarts.find((t: number) => t > start.getTime());
                                    const end = nextMs ? new Date(nextMs) : new Date(start.getTime() + Math.max(14, Math.ceil((m.hours ?? 45) / 15) * 7) * 86400000);
                                    return { start, end };
                                  };
                                  const studentStart = e.startDate ? new Date(e.startDate) : null;
                                  const enriched = modules.map((m: any) => {
                                    const w = modWindow(m);
                                    let state: 'completed' | 'current' | 'upcoming' | 'before_enrollment' | 'unknown' = 'unknown';
                                    if (hasSyncedProgress) {
                                      const p = spByModuleId.get(realId(m));
                                      const isCurrent = e.currentModuleId === realId(m) || p?.status === 'IN_PROGRESS';
                                      if (isCurrent) state = 'current';
                                      else if (p?.status === 'COMPLETED') state = 'completed';
                                      else state = 'upcoming';
                                      return { ...m, window: w, state };
                                    }
                                    if (w) {
                                      if (studentStart && w.end < studentStart) state = 'before_enrollment';
                                      else if (now >= w.end) state = 'completed';
                                      else if (now >= w.start) state = 'current';
                                      else state = 'upcoming';
                                    }
                                    return { ...m, window: w, state };
                                  });
                                  // Sort modules chronologically for display (position in DB can be non-chronological for rotation courses)
                                  enriched.sort((a: any, b: any) => {
                                    const at = a.window?.start?.getTime() ?? Number.MAX_SAFE_INTEGER;
                                    const bt = b.window?.start?.getTime() ?? Number.MAX_SAFE_INTEGER;
                                    return at - bt;
                                  });
                                  // Only the latest-started module whose window contains "now" stays current;
                                  // any earlier overlapping ones are treated as completed (the cohort has moved on).
                                  const currentIdxs = enriched
                                    .map((m: any, i: number) => (m.state === 'current' ? i : -1))
                                    .filter((i: number) => i >= 0);
                                  if (currentIdxs.length > 1) {
                                    const keep = currentIdxs[currentIdxs.length - 1];
                                    currentIdxs.forEach((i: number) => {
                                      if (i !== keep) enriched[i].state = 'completed';
                                    });
                                  }
                                  // Only count modules that are in the student's enrollment window toward progress
                                  const countable = enriched.filter((m: any) => m.state !== 'before_enrollment');
                                  const totalMods = countable.length;
                                  const completedCount = countable.filter((m: any) => m.state === 'completed').length;
                                  const currentMod = enriched.find((m: any) => m.state === 'current');
                                  const progress = totalMods > 0 ? Math.round((completedCount / totalMods) * 100) : 0;
                                  return (
                                    <div key={e.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <h3 className="font-bold text-[14px] text-[#2D3B45]">{e.course?.name} <span className="text-gray-400 font-normal">({e.course?.code})</span></h3>
                                            <div className="text-[12px] text-gray-500 mt-0.5">
                                              {e.startDate && <span>Started {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-2xl font-bold text-[#008EE2]">{progress}%</div>
                                            <div className="text-[11px] text-gray-500">{completedCount} of {totalMods} modules done</div>
                                          </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div className="bg-[#008EE2] h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                                        </div>
                                        {currentMod ? (
                                          <div className="mt-3 text-[13px]">
                                            <span className="text-gray-500">Currently studying:</span> <span className="font-medium text-[#2D3B45]">{currentMod.name}</span>
                                            {currentMod.window && <span className="text-gray-400 ml-2 text-[11px]">({currentMod.window.start.toLocaleDateString()} → {currentMod.window.end.toLocaleDateString()})</span>}
                                          </div>
                                        ) : totalMods > 0 ? (
                                          <div className="mt-3 text-[13px] text-gray-500">
                                            {completedCount === totalMods ? 'Course complete.' : completedCount === 0 ? 'Course has not started yet.' : 'Between modules.'}
                                          </div>
                                        ) : null}
                                      </div>
                                      {totalMods > 0 && (() => {
                                        // For withdrawn students show only completed modules; otherwise
                                        // include the current module and the next-up upcoming.
                                        const isWithdrawn = /withdraw/i.test(userProfile?.campusStatus || '');
                                        const visibleEnriched = enriched;
                                        const completed = visibleEnriched.filter((m: any) => m.state === 'completed');
                                        const current = isWithdrawn ? [] : visibleEnriched.filter((m: any) => m.state === 'current');
                                        const nowMs = now.getTime();
                                        const upcomingFuture = isWithdrawn ? [] : visibleEnriched
                                          .filter((m: any) => m.state === 'upcoming' && m.window?.start && m.window.start.getTime() >= nowMs)
                                          .sort((a: any, b: any) => a.window.start.getTime() - b.window.start.getTime());
                                        const upcomingOne = upcomingFuture.slice(0, 1);
                                        const visible = [...completed, ...current, ...upcomingOne];
                                        if (visible.length === 0) return (
                                          <div className="px-4 py-3 text-[12px] text-gray-500 italic">No modules to show.</div>
                                        );
                                        return (
                                        <div className="divide-y divide-gray-100">
                                          {visible.map((m: any) => (
                                            <div key={m.id} className={`flex items-center px-4 py-2 text-[12px] ${m.state === 'current' ? 'bg-blue-50' : ''}`}>
                                              <div className="w-6 shrink-0">
                                                {m.state === 'completed' ? <CheckCircle size={14} className="text-green-600" /> : m.state === 'current' ? <Clock size={14} className="text-[#008EE2]" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 ml-px" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className={`${m.state === 'current' ? 'font-semibold text-[#2D3B45]' : 'text-[#2D3B45]'}`}>{m.name}</div>
                                                {m.window && (
                                                  <div className="text-[10px] text-gray-500">{m.window.start.toLocaleDateString()} → {m.window.end.toLocaleDateString()}</div>
                                                )}
                                              </div>
                                              <div className="shrink-0 text-right w-[70px]">
                                                {m.state === 'completed' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">Done</span>}
                                                {m.state === 'current' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">Current</span>}
                                                {m.state === 'upcoming' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">Upcoming</span>}
                                                {m.state === 'before_enrollment' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">Before start</span>}
                                                {m.state === 'unknown' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">No date</span>}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              ) : selectedBatchCode ? (
                /* Batch Student List */
                <div>
                  <button onClick={() => { setSelectedBatchCode(null); setBatchStudentPage(1); setShowEnrollDialog(false); setEnrollResult(null); setShowExitingOnly(false); }} className="flex items-center text-[#008EE2] text-sm mb-6 hover:underline">
                    <ChevronLeft size={16} className="mr-1" /> Back to all batches
                  </button>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl font-bold text-[#2D3B45]">Batch: <span className="px-3 py-1 bg-[#2D3B45] text-white rounded text-lg">{selectedBatchCode}</span></h1>
                      {(() => {
                        const batchInfo = (batchesData || []).find((b: any) => b.batchCode === selectedBatchCode);
                        if (!batchInfo) return null;
                        const bType = batchInfo.batchType || 'PRIMARY';
                        return (
                          <>
                            <span className={`px-2 py-0.5 text-[16px] font-medium rounded-full ${bType === 'PRIMARY' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                              {bType === 'PRIMARY' ? 'Primary' : 'Mid-Course'}
                            </span>
                            {batchInfo.parentBatchCode && (
                              <button onClick={() => setSelectedBatchCode(batchInfo.parentBatchCode)} className="text-[16px] text-[#008EE2] hover:underline">
                                Parent: {batchInfo.parentBatchCode}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <button onClick={() => { setShowEnrollDialog(true); setEnrollResult(null); setEnrollStudentSearch(''); }}
                      className="flex items-center space-x-1 bg-[#008EE2] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#0074BF] transition-colors">
                      <Plus size={16} /> <span>Enroll Student</span>
                    </button>
                  </div>
                  <p className="text-gray-500 mb-4">{batchStudents?.total || 0} students enrolled</p>

                  {/* Sub-batches list */}
                  {(() => {
                    const subBatches = (batchesData || []).filter((b: any) => b.parentBatchCode === selectedBatchCode);
                    if (subBatches.length === 0) return null;
                    return (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h3 className="text-sm font-bold text-amber-800 mb-2">Mid-Course Sub-Batches ({subBatches.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {subBatches.map((sb: any) => (
                            <button key={sb.id} onClick={() => setSelectedBatchCode(sb.batchCode)}
                              className="px-3 py-1 bg-white border border-amber-300 rounded text-sm text-amber-800 hover:bg-amber-100 transition-colors">
                              {sb.batchCode} <span className="text-[16px] text-amber-500">({sb.studentCount} students)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Enroll Student Dialog */}
                  {showEnrollDialog && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-[#2D3B45]">Enroll Student into {selectedBatchCode}</h3>
                        <button onClick={() => { setShowEnrollDialog(false); setEnrollResult(null); }} className="text-gray-400 hover:text-gray-600">&times;</button>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <input type="text" placeholder="Search student by name or email..."
                          value={enrollStudentSearch} onChange={e => setEnrollStudentSearch(e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                        <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                          <input type="checkbox" checked={enrollAutoSubBatch} onChange={e => setEnrollAutoSubBatch(e.target.checked)}
                            className="rounded border-gray-300" />
                          <span>Auto sub-batch (mid-course)</span>
                        </label>
                      </div>
                      {searchStudents?.users && searchStudents.users.length > 0 && !enrollResult && (
                        <div className="border border-gray-200 rounded bg-white max-h-40 overflow-y-auto mb-3">
                          {searchStudents.users.map((u: any) => (
                            <button key={u.id} disabled={enrollLoading}
                              onClick={async () => {
                                setEnrollLoading(true);
                                try {
                                  const res = await (await import('./api/client')).post('/progress/enroll', {
                                    userId: u.id, batchCode: selectedBatchCode, autoSubBatch: enrollAutoSubBatch,
                                  });
                                  if ((res as any).success) {
                                    setEnrollResult((res as any).data);
                                    refetchBatchStudents();
                                    refetchBatches();
                                  }
                                } catch { /* ignore */ }
                                setEnrollLoading(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center justify-between">
                              <span><strong>{u.firstName} {u.lastName}</strong> — {u.email}</span>
                              {u.vNumber && <span className="text-[16px] text-gray-400">{u.vNumber}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {enrollResult && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                          <p className="font-bold text-green-800">Enrolled successfully!</p>
                          <p className="text-green-700 mt-1">
                            Batch: <strong>{enrollResult.batchCode}</strong>
                            {enrollResult.parentBatchCode && <span className="text-green-500"> (sub-batch of {enrollResult.parentBatchCode})</span>}
                            {' '} — Starting at module {enrollResult.joinedModulePosition}
                            {enrollResult.isMidCourseJoin && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[16px] rounded">Mid-course join</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {batchStudentsLoading ? <LoadingSpinner /> : (
                    <>
                      {/* Batch Progress Summary */}
                      {(() => {
                        const enrolls = batchStudents?.enrollments || [];
                        if (enrolls.length === 0) return null;
                        const firstE = enrolls[0];
                        const p = firstE?.progress;
                        const avgAssignProg = enrolls.length > 0 ? Math.round(enrolls.reduce((s: number, e: any) => s + (e.progress?.assignmentProgress || 0), 0) / enrolls.length) : 0;
                        const avgGrade = (() => {
                          const graded = enrolls.filter((e: any) => e.progress?.gradePct !== null);
                          return graded.length > 0 ? Math.round(graded.reduce((s: number, e: any) => s + e.progress.gradePct, 0) / graded.length) : null;
                        })();
                        const nowMs = Date.now();
                        const exitWindowMs = 30 * 24 * 60 * 60 * 1000;
                        const exitingCount = enrolls.filter((e: any) => {
                          if (!e.endDate) return false;
                          const end = new Date(e.endDate).getTime();
                          return end >= nowMs && end - nowMs <= exitWindowMs;
                        }).length;
                        return (
                          <div className="grid grid-cols-6 gap-3 mb-6">
                            <div className="bg-[#2D3B45] text-white rounded-lg p-3 text-center">
                              <div className="text-[16px] uppercase tracking-wider opacity-70">Students</div>
                              <div className="text-xl font-bold">{enrolls.length}</div>
                            </div>
                            <div className="bg-[#008EE2] text-white rounded-lg p-3 text-center">
                              <div className="text-[16px] uppercase tracking-wider opacity-70">Module Progress</div>
                              <div className="text-xl font-bold">{p?.completedModules || 0}/{p?.totalModules || 0}</div>
                            </div>
                            <div className="bg-[#008744] text-white rounded-lg p-3 text-center">
                              <div className="text-[16px] uppercase tracking-wider opacity-70">Avg Assignment</div>
                              <div className="text-xl font-bold">{avgAssignProg}%</div>
                            </div>
                            <div className="bg-[#6B3FA0] text-white rounded-lg p-3 text-center">
                              <div className="text-[16px] uppercase tracking-wider opacity-70">Avg Grade</div>
                              <div className="text-xl font-bold">{avgGrade !== null ? `${avgGrade}%` : '—'}</div>
                            </div>
                            <div className="bg-[#C23C2D] text-white rounded-lg p-3 text-center">
                              <div className="text-[16px] uppercase tracking-wider opacity-70">Current Module</div>
                              <div className="text-sm font-bold mt-0.5 truncate">{p?.currentModuleName || '—'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowExitingOnly(v => !v)}
                              className={`rounded-lg p-3 text-center transition-all text-white ${showExitingOnly ? 'bg-[#B45309] ring-2 ring-offset-2 ring-[#F59E0B]' : 'bg-[#F59E0B] hover:bg-[#D97706]'}`}
                              title="Students whose course ends within 30 days — click to filter"
                            >
                              <div className="text-[16px] uppercase tracking-wider opacity-90">About to Exit</div>
                              <div className="text-xl font-bold">{exitingCount}</div>
                              <div className="text-[11px] opacity-80 mt-0.5">{showExitingOnly ? 'Showing only' : 'Click to filter'}</div>
                            </button>
                          </div>
                        );
                      })()}

                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-[16px]">
                          <thead className="bg-[#F5F5F5]">
                            <tr className="text-[#2D3B45] font-bold text-[16px]">
                              <th className="py-3 px-4">Student</th>
                              <th className="py-3 px-4">Student ID</th>
                              <th className="py-3 px-4">Campus</th>
                              <th className="py-3 px-4 text-center">Assignments</th>
                              <th className="py-3 px-4 text-center">Grade</th>
                              <th className="py-3 px-4">Progress</th>
                              <th className="py-3 px-4">Current Module</th>
                              <th className="py-3 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(batchStudents?.enrollments || [])
                              .filter((e: any) => {
                                if (!showExitingOnly) return true;
                                if (!e.endDate) return false;
                                const end = new Date(e.endDate).getTime();
                                const nowMs = Date.now();
                                return end >= nowMs && end - nowMs <= 30 * 24 * 60 * 60 * 1000;
                              })
                              .map((e: any) => {
                              const p = e.progress || {};
                              const assignProg = p.assignmentProgress || 0;
                              return (
                              <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUserId(e.user.id)}>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[16px] font-medium text-gray-600 bg-gray-50">
                                      {e.user.firstName?.[0]}{e.user.lastName?.[0]}
                                    </div>
                                    <div>
                                      <span className="font-medium text-[#008EE2] hover:underline">{e.user.firstName} {e.user.lastName}</span>
                                      <div className="text-[16px] text-gray-400">{e.user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-500 text-[16px]">{e.user.vNumber || '—'}</td>
                                <td className="py-3 px-4 text-gray-500 text-[16px]">{e.user.campus || '—'}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="text-[16px]">{p.completedAssignments || 0}<span className="text-gray-400">/{p.totalAssignments || 0}</span></span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {p.gradePct !== null && p.gradePct !== undefined ? (
                                    <span className={`text-[16px] font-bold ${p.gradePct >= 70 ? 'text-green-600' : p.gradePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{p.gradePct}%</span>
                                  ) : <span className="text-gray-400 text-[16px]">—</span>}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                          width: `${Math.min(assignProg, 100)}%`,
                                          backgroundColor: assignProg >= 75 ? '#008744' : assignProg >= 40 ? '#F5A623' : '#C23C2D',
                                        }}
                                      />
                                    </div>
                                    <span className={`text-[16px] font-bold ${assignProg >= 75 ? 'text-green-600' : assignProg >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{assignProg}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-[16px]">
                                  {p.currentModuleName ? (
                                    <span className="text-[#2D3B45] font-medium">{p.currentModuleName}</span>
                                  ) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="py-3 px-4">
                                  {e.lastStatus ? <span className={`px-2 py-0.5 text-[16px] font-medium rounded-full ${e.lastStatus.includes('Start') || e.lastStatus.includes('Active') || e.lastStatus.includes('Registered') ? 'bg-green-100 text-green-700' : e.lastStatus.includes('Withdrawal') || e.lastStatus.includes('Cancel') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{e.lastStatus}</span> : '—'}
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

              ) : (
                /* Batch List */
                <>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative flex-1 max-w-[400px]">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search by batch code, course, or teacher..."
                        value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {(['all', 'PRIMARY', 'MID_COURSE'] as const).map(t => (
                        <button key={t} onClick={() => setBatchTypeFilter(t)}
                          className={`px-3 py-1.5 text-[16px] font-medium rounded transition-colors ${batchTypeFilter === t ? 'bg-[#008EE2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {t === 'all' ? 'All' : t === 'PRIMARY' ? 'Primary' : 'Mid-Course'}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowCreateBatchDialog(true)}
                      className="flex items-center space-x-1 bg-[#008EE2] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#0074BF] transition-colors">
                      <Plus size={16} /> <span>Create Batch</span>
                    </button>
                  </div>

                  {batchesLoading ? <LoadingSpinner /> : (() => {
                    const filtered = (batchesData || []).filter((b: any) => {
                      if (batchTypeFilter !== 'all' && (b.batchType || 'PRIMARY') !== batchTypeFilter) return false;
                      if (!batchSearch) return true;
                      const q = batchSearch.toLowerCase();
                      return b.batchCode.toLowerCase().includes(q) ||
                        b.course.name.toLowerCase().includes(q) ||
                        b.teacher.firstName.toLowerCase().includes(q) ||
                        (b.teacher.lastName || '').toLowerCase().includes(q);
                    });
                    const totalStudents = filtered.reduce((s: number, b: any) => s + b.studentCount, 0);

                    return (
                      <>
                        {!(user as any)?.isAuditor && (
                          <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                            <span>{filtered.length} batches</span>
                            <span>•</span>
                            <span>{totalStudents} total students enrolled</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200">
                          <table className="w-full text-left text-[16px]">
                            <thead>
                              <tr className="text-[#008EE2] font-bold">
                                <th className="py-3 px-4">Batch Code</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Course Name</th>
                                <th className="py-3 px-4">Instructor</th>
                                {!(user as any)?.isAuditor && <th className="py-3 px-4 text-center">Students</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filtered.map((b: any) => {
                                const bType = b.batchType || 'PRIMARY';
                                const bStatus = b.status || 'UPCOMING';
                                return (
                                <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBatchCode(b.batchCode)}>
                                  <td className="py-3 px-4">
                                    <span className="px-2.5 py-1 bg-[#2D3B45] text-white text-[16px] font-bold rounded">{b.batchCode}</span>
                                    {b.parentBatchCode && (
                                      <span className="ml-2 text-[16px] text-gray-400">← {b.parentBatchCode}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 text-[16px] font-medium rounded-full ${bType === 'PRIMARY' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                                      {bType === 'PRIMARY' ? 'Primary' : 'Mid-Course'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 text-[16px] font-medium rounded-full ${bStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : bStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {bStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-[#008EE2] font-medium">{b.course.name}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[16px] font-medium text-gray-600 bg-gray-50">
                                        {b.teacher.firstName[0]}{(b.teacher.lastName || b.teacher.firstName)[0]}
                                      </div>
                                      <span className="font-medium text-[#2D3B45]">{b.teacher.firstName} {b.teacher.lastName !== b.teacher.firstName ? b.teacher.lastName : ''}</span>
                                    </div>
                                  </td>
                                  {!(user as any)?.isAuditor && (
                                    <td className="py-3 px-4 text-center">
                                      <span className={`px-2.5 py-1 text-[16px] font-bold rounded-full ${b.studentCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                        {b.studentCount}
                                      </span>
                                    </td>
                                  )}
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Create Batch Dialog (modal overlay) */}
          {showCreateBatchDialog && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreateBatchDialog(false)}>
              <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-[#2D3B45]">Create New Batch</h2>
                  <p className="text-sm text-gray-500 mt-1">Assign an instructor to a course — a batch ID will be auto-generated.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D3B45] mb-1">Course</label>
                    <select value={createBatchCourseId} onChange={e => setCreateBatchCourseId(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]">
                      <option value="">Select a course...</option>
                      {(data?.courses || []).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D3B45] mb-1">Instructor</label>
                    <select value={createBatchTeacherId} onChange={e => setCreateBatchTeacherId(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]">
                      <option value="">Select an instructor...</option>
                      {(allTeachers?.users || []).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button onClick={() => setShowCreateBatchDialog(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">Cancel</button>
                  <button disabled={!createBatchCourseId || !createBatchTeacherId || createBatchLoading}
                    onClick={async () => {
                      setCreateBatchLoading(true);
                      try {
                        const res = await (await import('./api/client')).post('/progress/assign-instructor', {
                          courseId: createBatchCourseId, teacherId: createBatchTeacherId,
                        });
                        if ((res as any).success) {
                          setShowCreateBatchDialog(false);
                          setCreateBatchCourseId('');
                          setCreateBatchTeacherId('');
                          refetchBatches();
                        }
                      } catch { /* ignore */ }
                      setCreateBatchLoading(false);
                    }}
                    className="px-4 py-2 text-sm bg-[#008EE2] text-white rounded font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                    {createBatchLoading ? 'Creating...' : 'Create Batch'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {adminActiveSection === 'Statistics' && (
            <AdminStatisticsView />
          )}

          {adminActiveSection === 'Question Banks' && (
            <AdminQuestionBanksView />
          )}

          {adminActiveSection === 'Permissions' && (
            (user as any)?.isAuditor ? (
              <div className="relative h-full">
                <div className="pointer-events-none select-none filter blur-md opacity-60">
                  <AdminPermissionsView />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white border border-[#E1E1E1] rounded-lg shadow-lg px-8 py-6 text-center max-w-md">
                    <Shield size={36} className="mx-auto mb-3 text-[#008EE2]" />
                    <h2 className="text-lg font-bold text-[#2D3B45] mb-2">Restricted</h2>
                    <p className="text-sm text-gray-600">You don't have access to manage permissions. Please contact the IT Team for assistance.</p>
                  </div>
                </div>
              </div>
            ) : (
              <AdminPermissionsView />
            )
          )}

          {adminActiveSection === 'Analytics Hub' && (
            <AdminAnalyticsHubView />
          )}

          {adminActiveSection === 'Apps' && (
            <AdminAppsView />
          )}

          {adminActiveSection === 'Admin Analytics' && (
            <AdminAnalyticsView />
          )}

          {['Outcomes', 'Rubrics', 'Grading'].includes(adminActiveSection) && (
            <div>
              <h1 className="text-2xl font-bold text-[#2D3B45]">{adminActiveSection}</h1>
            </div>
          )}

          {!['Courses', 'People', 'Batches', 'Statistics', 'Question Banks', 'Permissions', 'Analytics Hub', 'Apps', 'Admin Analytics', 'Outcomes', 'Rubrics', 'Grading'].includes(adminActiveSection) && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p>{adminActiveSection} — coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Admin Analytics Hub View ---

function AdminAnalyticsHubView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    api<any>('/analytics/hub').then(res => { if (res.success) setData(res.data); setLoading(false); });
  }, []);
  if (loading) return <div className="text-gray-500 text-sm py-8">Loading analytics…</div>;
  if (!data) return <div className="text-red-600 text-sm py-8">Failed to load analytics.</div>;

  const metrics = [
    { label: 'Total users', value: data.users.total, sub: `${data.users.activeLast30} active in 30d` },
    { label: 'Active students', value: data.users.activeStudents },
    { label: 'Teachers', value: data.users.teachers },
    { label: 'Courses', value: data.courses.total, sub: `${data.courses.batches} batches` },
    { label: 'Graded last 30d', value: data.submissions.gradedLast30.toLocaleString(), sub: `${data.submissions.last30 ? Math.round((data.submissions.gradedLast30 / data.submissions.last30) * 100) : 0}% of submissions` },
    { label: 'Admins', value: data.users.admins },
  ];
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#2D3B45]">Analytics Hub</h1>
        <p className="text-[13px] text-gray-500">High-level pulse of the platform.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4 bg-white">
            <div className="text-[11px] text-gray-500 uppercase tracking-wide">{m.label}</div>
            <div className="text-2xl font-bold text-[#2D3B45] mt-1">{m.value}</div>
            {m.sub && <div className="text-[11px] text-gray-500 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-[13px] font-bold text-[#2D3B45]">Top 5 courses — last 30 days by submission volume</div>
        <table className="w-full text-[13px]">
          <thead className="bg-gray-50 text-left text-gray-600 text-[11px]"><tr>
            <th className="px-4 py-2 font-medium w-[80px]">Code</th>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium text-right w-[140px]">Submissions (30d)</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.topCourses.map((c: any) => (
              <tr key={c.code}>
                <td className="px-4 py-2"><span className="text-[11px] font-bold px-2 py-0.5 bg-[#2D3B45] text-white rounded">{c.code}</span></td>
                <td className="px-4 py-2 text-[#2D3B45]">{c.name}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{c.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Admin Apps View ---

function AdminAppsView() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#2D3B45]">Apps & Integrations</h1>
        <p className="text-[13px] text-gray-500">Third-party services connected to the platform.</p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-300 rounded-lg">
        <div className="text-[14px] font-medium text-[#2D3B45]">No app integrations yet</div>
        <div className="text-[12px] text-gray-500 mt-1">Integrations will appear here once they're connected.</div>
      </div>
    </div>
  );
}

// --- Admin Analytics (deep) ---

function AdminAnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  React.useEffect(() => {
    api<any>('/analytics/admin').then(res => { if (res.success) setData(res.data); setLoading(false); });
  }, []);
  if (loading) return <div className="text-gray-500 text-sm py-8">Loading analytics…</div>;
  if (!data) return <div className="text-red-600 text-sm py-8">Failed to load analytics.</div>;

  // Render mini bar chart from timeseries
  const maxVal = Math.max(1, ...data.timeseries.map((t: any) => t.total));
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#2D3B45]">Admin Analytics</h1>
        <p className="text-[13px] text-gray-500">Submission trends, per-course performance, teacher activity, and data quality alerts.</p>
      </div>

      {/* Timeseries chart */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-[13px] font-bold text-[#2D3B45]">Submissions per day — last 30 days</div>
        <div className="p-4">
          <div className="flex items-end gap-[3px] h-[140px]">
            {data.timeseries.map((t: any) => {
              const h = (t.total / maxVal) * 100;
              const gh = t.total ? (t.graded / t.total) * h : 0;
              return (
                <div key={t.date} className="flex-1 flex flex-col justify-end relative group">
                  <div className="w-full bg-blue-100" style={{ height: `${h}%` }}>
                    <div className="w-full bg-blue-500" style={{ height: `${(gh / Math.max(h, 1)) * 100}%` }} />
                  </div>
                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded mb-1 z-10">
                    {t.date}: {t.total} ({t.graded} graded)
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-600">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-blue-500" /> Graded</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-blue-100" /> Submitted (ungraded)</span>
          </div>
        </div>
      </div>

      {/* Per-course */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-[13px] font-bold text-[#2D3B45]">Per-course activity (last 30 days)</div>
        <table className="w-full text-[13px]">
          <thead className="bg-gray-50 text-left text-gray-600 text-[11px]"><tr>
            <th className="px-4 py-2 font-medium w-[80px]">Code</th>
            <th className="px-4 py-2 font-medium">Course</th>
            <th className="px-4 py-2 font-medium text-right w-[100px]">Enrolled</th>
            <th className="px-4 py-2 font-medium text-right w-[120px]">Submissions</th>
            <th className="px-4 py-2 font-medium text-right w-[100px]">Graded</th>
            <th className="px-4 py-2 font-medium text-right w-[110px]">Avg score</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.perCourse.map((c: any) => (
              <tr key={c.code}>
                <td className="px-4 py-2"><span className="text-[11px] font-bold px-2 py-0.5 bg-[#2D3B45] text-white rounded">{c.code}</span></td>
                <td className="px-4 py-2 text-[#2D3B45]">{c.name}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.enrolled}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.subsLast30}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.gradedCount}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.avgScore ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Teacher activity + data quality side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-[13px] font-bold text-[#2D3B45]">Teacher grading activity (last 30 days)</div>
          {data.teacherStats.length === 0 ? (
            <div className="p-4 text-gray-500 text-[13px]">No teacher-graded submissions in the last 30 days.</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 text-left text-gray-600 text-[11px]"><tr>
                <th className="px-4 py-2 font-medium">Teacher</th>
                <th className="px-4 py-2 font-medium text-right w-[120px]">Graded</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.teacherStats.map((t: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-[#2D3B45]">{t.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-[13px] font-bold text-[#2D3B45]">Data quality alerts</div>
          <div className="divide-y divide-gray-100 text-[13px]">
            {[
              { label: 'Users without real email', value: data.alerts.usersNoEmail },
              { label: 'Student enrollments without a batch', value: data.alerts.enrollmentsNoBatch },
              { label: 'Scored submissions missing a submission date', value: data.alerts.subsNoDate },
            ].map((a, i) => (
              <div key={i} className="px-4 py-2 flex items-center justify-between">
                <span className="text-gray-700">{a.label}</span>
                <span className={`font-medium tabular-nums ${a.value > 0 ? 'text-amber-700' : 'text-green-700'}`}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Admin Permissions View ---

function AdminPermissionsView() {
  const [counts, setCounts] = useState<{ admin: number; teacher: number; student: number } | null>(null);
  const [activeRole, setActiveRole] = useState<'ADMIN' | 'TEACHER'>('ADMIN');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadCounts = async () => {
    const [a, t, s] = await Promise.all([
      api<any>('/users?role=ADMIN&limit=1'),
      api<any>('/users?role=TEACHER&limit=1'),
      api<any>('/users?role=STUDENT&limit=1'),
    ]);
    setCounts({
      admin: a.success ? a.data.total : 0,
      teacher: t.success ? t.data.total : 0,
      student: s.success ? s.data.total : 0,
    });
  };
  const loadUsers = async (role: 'ADMIN' | 'TEACHER', q: string) => {
    setLoading(true);
    const params = new URLSearchParams({ role, limit: '100' });
    if (q) params.set('search', q);
    const res = await api<any>(`/users?${params}`);
    if (res.success) setUsers(res.data.users || []);
    setLoading(false);
  };

  React.useEffect(() => { loadCounts(); }, []);
  React.useEffect(() => { loadUsers(activeRole, search); }, [activeRole, search]);

  const permissionMatrix = [
    { area: 'Courses', ADMIN: 'Full CRUD + publish', TEACHER: 'View + grade in own batch', STUDENT: 'View enrolled' },
    { area: 'Users', ADMIN: 'Full CRUD + role changes', TEACHER: 'View own students', STUDENT: 'View own profile' },
    { area: 'Batches', ADMIN: 'Create, assign, reassign', TEACHER: 'View own', STUDENT: '—' },
    { area: 'Assignments', ADMIN: 'Create + edit all', TEACHER: 'Create + edit own course', STUDENT: 'Submit' },
    { area: 'Question Banks', ADMIN: 'Full access', TEACHER: 'Author on own assignments', STUDENT: 'Answer during attempt' },
    { area: 'Submissions', ADMIN: 'View + grade all', TEACHER: 'Grade own batch', STUDENT: 'View own' },
    { area: 'Reports & Analytics', ADMIN: 'Full', TEACHER: 'Own batch only', STUDENT: 'Own progress' },
    { area: 'Platform Settings', ADMIN: 'All', TEACHER: '—', STUDENT: '—' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#2D3B45]">Permissions</h1>
        <p className="text-[13px] text-gray-500">Manage who has admin, teacher, or student access on the platform.</p>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Admins', value: counts?.admin ?? '—', color: 'bg-red-50 text-red-700 border-red-200', role: 'ADMIN' as const },
          { label: 'Teachers', value: counts?.teacher ?? '—', color: 'bg-blue-50 text-blue-700 border-blue-200', role: 'TEACHER' as const },
          { label: 'Students', value: counts?.student ?? '—', color: 'bg-gray-50 text-gray-700 border-gray-200', role: null },
        ].map((s, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${s.color} ${s.role ? 'cursor-pointer hover:shadow-sm' : ''}`}
            onClick={() => s.role && setActiveRole(s.role)}
          >
            <div className="text-[12px] font-medium uppercase tracking-wide">{s.label}</div>
            <div className="text-3xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Role tabs + user list */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="flex border-b border-gray-200 bg-gray-50">
          {(['ADMIN', 'TEACHER'] as const).map(r => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-4 py-2 text-[13px] ${activeRole === r ? 'bg-white font-semibold text-[#2D3B45] border-b-2 border-[#008EE2]' : 'text-gray-600 hover:text-[#2D3B45]'}`}
            >
              {r === 'ADMIN' ? 'Admins' : 'Teachers'}
            </button>
          ))}
          <div className="ml-auto flex items-center pr-3">
            <input
              type="text"
              placeholder={`Search ${activeRole === 'ADMIN' ? 'admins' : 'teachers'}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] w-56"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[400px]">
          {loading ? (
            <div className="text-gray-500 text-sm p-4">Loading…</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500 text-sm p-4">No {activeRole === 'ADMIN' ? 'admins' : 'teachers'}.</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 text-left text-gray-600 text-[12px]">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium w-[90px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-[#2D3B45]">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-2 text-gray-700">{u.email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Permission matrix */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-[13px] font-bold text-[#2D3B45]">What each role can do</div>
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50 text-left text-gray-600 text-[11px]">
            <tr>
              <th className="px-4 py-2 font-medium w-[200px]">Area</th>
              <th className="px-4 py-2 font-medium">Admin</th>
              <th className="px-4 py-2 font-medium">Teacher</th>
              <th className="px-4 py-2 font-medium">Student</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {permissionMatrix.map(row => (
              <tr key={row.area}>
                <td className="px-4 py-2 font-medium text-[#2D3B45]">{row.area}</td>
                <td className="px-4 py-2 text-gray-700">{row.ADMIN}</td>
                <td className="px-4 py-2 text-gray-700">{row.TEACHER}</td>
                <td className="px-4 py-2 text-gray-700">{row.STUDENT}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Admin Question Banks View ---

function AdminQuestionBanksView() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    api<any[]>('/questions/banks').then(res => {
      if (res.success) setCourses(res.data || []);
      setLoading(false);
    });
  }, []);

  const openAssignment = async (asgId: string) => {
    setSelectedAsgId(asgId);
    setQLoading(true);
    setQuestions(null);
    const res = await api<any[]>(`/questions?assignmentId=${asgId}`);
    if (res.success) setQuestions(res.data || []);
    setQLoading(false);
  };

  if (loading) return <div className="text-gray-500 text-sm py-8">Loading question banks…</div>;

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const filteredCourses = courses.filter(c =>
    !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAssignments = selectedCourse
    ? selectedCourse.assignments.filter((a: any) =>
        !search || a.title.toLowerCase().includes(search.toLowerCase())
      )
    : [];
  const totalQ = courses.reduce((s, c) => s + c.totalQuestions, 0);
  const totalA = courses.reduce((s, c) => s + c.assignmentCount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D3B45]">Question Banks</h1>
          <p className="text-[13px] text-gray-500">Browse all assignments that have questions attached, across every course.</p>
        </div>
        <div className="text-[12px] text-gray-600">
          <span className="mr-4">Courses with banks: <strong>{courses.length}</strong></span>
          <span className="mr-4">Assignments: <strong>{totalA}</strong></span>
          <span>Total questions: <strong>{totalQ}</strong></span>
        </div>
      </div>

      {!selectedCourse ? (
        <div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded px-3 py-1.5 text-[13px]"
            />
          </div>
          {filteredCourses.length === 0 ? (
            <div className="text-gray-500 text-sm py-6">No courses with question banks.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCourses.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCourseId(c.id); setSearch(''); }}
                  className="text-left border border-gray-200 rounded-lg p-4 hover:border-[#008EE2] hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-[#2D3B45] text-white rounded">{c.code}</span>
                    <span className="text-[11px] text-gray-500">{c.assignmentCount} asg · {c.totalQuestions} Q</span>
                  </div>
                  <div className="text-[14px] font-medium text-[#2D3B45]">{c.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => { setSelectedCourseId(null); setSelectedAsgId(null); setQuestions(null); setSearch(''); }}
            className="flex items-center text-[#008EE2] text-sm mb-3 hover:underline"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to all courses
          </button>
          <h2 className="text-xl font-bold text-[#2D3B45] mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 bg-[#2D3B45] text-white rounded mr-2 align-middle">{selectedCourse.code}</span>
            {selectedCourse.name}
          </h2>
          <p className="text-[12px] text-gray-500 mb-3">{selectedCourse.assignmentCount} assignments with questions · {selectedCourse.totalQuestions} total questions</p>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search assignments…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded px-3 py-1.5 text-[13px]"
            />
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 text-left text-gray-600 text-[12px]">
                <tr>
                  <th className="px-4 py-2 font-medium">Assignment</th>
                  <th className="px-4 py-2 font-medium w-[90px]">Format</th>
                  <th className="px-4 py-2 font-medium text-right w-[80px]">MCQ</th>
                  <th className="px-4 py-2 font-medium text-right w-[80px]">Theory</th>
                  <th className="px-4 py-2 font-medium text-right w-[90px]">Points</th>
                  <th className="px-4 py-2 font-medium w-[90px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssignments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openAssignment(a.id)}>
                    <td className="px-4 py-2 text-[#2D3B45]">{a.title}</td>
                    <td className="px-4 py-2 text-gray-600 uppercase text-[11px]">{a.format}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.mcqCount}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.theoryCount}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{a.questionPoints}/{a.points}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${a.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {a.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Questions viewer modal */}
      {selectedAsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setSelectedAsgId(null); setQuestions(null); }}>
          <div className="bg-white rounded-lg shadow-xl w-[800px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-[15px] font-bold text-[#2D3B45]">Questions</h3>
                <p className="text-[11px] text-gray-500">{selectedCourse?.assignments.find((a: any) => a.id === selectedAsgId)?.title}</p>
              </div>
              <button onClick={() => { setSelectedAsgId(null); setQuestions(null); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="overflow-auto flex-1 p-5">
              {qLoading ? (
                <div className="text-gray-500 text-sm">Loading…</div>
              ) : !questions || questions.length === 0 ? (
                <div className="text-gray-500 text-sm">No questions.</div>
              ) : (
                <ol className="space-y-4 list-decimal list-inside">
                  {questions.map((q: any) => (
                    <li key={q.id} className="text-[13px]">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded mr-2 align-middle bg-gray-100 text-gray-700">{q.type}</span>
                      <span className="text-[11px] text-gray-500 ml-2">{q.points} pts</span>
                      <div className="mt-1 text-[#2D3B45]">{q.text}</div>
                      {q.type === 'MCQ' && q.options?.length > 0 && (
                        <ul className="mt-2 space-y-1 ml-5">
                          {q.options.map((o: any) => (
                            <li key={o.id} className={`text-[12px] ${o.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                              {o.isCorrect ? '✓ ' : '○ '}{o.text}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.explanation && (
                        <div className="mt-2 text-[11px] text-gray-500 italic">Explanation: {q.explanation}</div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Admin Statistics View ---

function AdminStatisticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress'>('name');

  React.useEffect(() => {
    api<any>('/progress/overview').then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="p-8 text-gray-400">Failed to load progress data.</div>;

  const courseProgress = data.courseProgress || [];
  const activeCourse = selectedCourse ? courseProgress.find((c: any) => c.id === selectedCourse) : null;

  const filteredStudents = activeCourse ? activeCourse.students
    .filter((s: any) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.vNumber?.toLowerCase().includes(term) ||
        s.batchCode?.toLowerCase().includes(term);
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'progress') return b.progressPct - a.progressPct;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    }) : [];

  return (
    <div className="max-w-7xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#008EE2] text-white rounded-lg p-5">
          <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Total Students</div>
          <div className="text-3xl font-bold">{data.totalStudents.toLocaleString()}</div>
        </div>
        <div className="bg-[#2D3B45] text-white rounded-lg p-5">
          <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Total Courses</div>
          <div className="text-3xl font-bold">{data.totalCourses}</div>
        </div>
        <div className="bg-[#008744] text-white rounded-lg p-5">
          <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Avg Course Progress</div>
          <div className="text-3xl font-bold">
            {courseProgress.length > 0
              ? Math.round(courseProgress.reduce((s: number, c: any) => s + c.progressPct, 0) / courseProgress.length)
              : 0}%
          </div>
        </div>
        <div className="bg-[#C23C2D] text-white rounded-lg p-5">
          <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Active Modules Today</div>
          <div className="text-3xl font-bold">
            {courseProgress.filter((c: any) => c.currentModule).length}
          </div>
        </div>
      </div>

      {/* Course Progress Overview */}
      <h2 className="text-lg font-bold text-[#2D3B45] mb-4">Course Progress</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {courseProgress.map((course: any) => (
          <div
            key={course.id}
            onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${selectedCourse === course.id ? 'ring-2 ring-[#008EE2] shadow-lg' : 'hover:shadow-md'}`}
          >
            <div className="h-2" style={{ backgroundColor: course.color || '#2D3B45' }} />
            <div className="p-4">
              <h3 className="font-bold text-sm text-[#2D3B45] mb-1">{course.name}</h3>
              <p className="text-[16px] text-gray-500 mb-3">{course.code} &middot; {course.totalStudents} students &middot; {course.totalModules} modules</p>

              {/* Progress bar */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{ width: `${course.progressPct}%`, backgroundColor: course.color || '#008EE2' }}
                  />
                </div>
                <span className="text-sm font-bold text-[#2D3B45]">{course.progressPct}%</span>
              </div>

              <div className="flex justify-between text-[16px] text-gray-500">
                <span>{course.completedModules}/{course.totalModules} modules done</span>
                {course.currentModule && (
                  <span className="text-[#008EE2] font-medium">Now: {course.currentModule}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Student Detail Table (when a course is selected) */}
      {activeCourse && (
        <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
          <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeCourse.color }} />
              <span className="font-bold text-[16px]">{activeCourse.name} — Student Progress ({activeCourse.students.length})</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text" placeholder="Search students..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="border border-[#E1E1E1] rounded px-3 py-1.5 text-sm w-64"
              />
              <select
                value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                className="border border-[#E1E1E1] rounded px-3 py-1.5 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2.5 font-bold text-[#2D3B45]">Student</th>
                  <th className="text-left px-4 py-2.5 font-bold text-[#2D3B45]">ID</th>
                  <th className="text-left px-4 py-2.5 font-bold text-[#2D3B45]">Batch</th>
                  <th className="text-left px-4 py-2.5 font-bold text-[#2D3B45]">Campus</th>
                  <th className="text-center px-4 py-2.5 font-bold text-[#2D3B45]">Assignments</th>
                  <th className="text-center px-4 py-2.5 font-bold text-[#2D3B45]">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E1E1]">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No students found.</td></tr>
                ) : filteredStudents.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[16px] font-bold text-gray-600">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium">{s.firstName} {s.lastName}</div>
                          <div className="text-[16px] text-gray-400">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{s.vNumber || '—'}</td>
                    <td className="px-4 py-2.5">
                      {s.batchCode ? (
                        <span className="px-2 py-0.5 text-[16px] font-bold rounded bg-gray-100 text-gray-700">{s.batchCode}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{s.campus || '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm">{s.completedAssignments}/{s.totalAssignments}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[80px]">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${s.progressPct}%`,
                              backgroundColor: s.progressPct >= 75 ? '#008744' : s.progressPct >= 40 ? '#F5A623' : '#C23C2D',
                            }}
                          />
                        </div>
                        <span className={`text-sm font-bold min-w-[36px] text-right ${s.progressPct >= 75 ? 'text-green-600' : s.progressPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {s.progressPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Course View ---

// ─── Course Files Tab ──────────────────────────────────
function CourseStudentDetailView({ studentId, courseId, onBack }: { studentId: string; courseId: string; onBack: () => void }) {
  const { data: profile, loading: profileLoading } = useApi<any>(`/users/${studentId}`);
  const { data: subs, loading: subsLoading, refetch } = useApi<any[]>(`/submissions?studentId=${studentId}&courseId=${courseId}`);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  if (profileLoading || !profile) return <LoadingSpinner />;
  const enrollment = (profile.enrollments || []).find((e: any) => e.course?.id === courseId);
  const modules = enrollment?.course?.modules ?? [];
  const realId = (m: any) => m.id;
  const sp = enrollment?.studentProgress ?? [];
  const completed = sp.filter((p: any) => p.status === 'COMPLETED').length;
  const inProg = sp.find((p: any) => p.status === 'IN_PROGRESS');
  const currentModule = enrollment?.currentModuleId
    ? modules.find((m: any) => m.id === enrollment.currentModuleId)
    : (inProg ? modules.find((m: any) => m.id === inProg.moduleId) : null);

  const submitGrade = async (submissionId: string, points: number) => {
    setSavingGrade(true);
    try {
      const score = parseFloat(gradeInput);
      if (Number.isNaN(score) || score < 0 || score > points) {
        alert(`Score must be a number between 0 and ${points}.`);
        return;
      }
      await patch(`/submissions/${submissionId}/grade`, { score });
      setGradingId(null);
      setGradeInput('');
      refetch?.();
    } catch (err: any) {
      alert(err?.message || 'Failed to save grade');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-[#008EE2] text-[14px] hover:underline">
        <ChevronLeft size={16} className="mr-1" /> Back to People
      </button>

      <div className="border border-[#E1E1E1] rounded-lg p-5 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#2D3B45]">{profile.firstName} {profile.lastName}</h2>
            <div className="text-[14px] text-gray-600 mt-1">{profile.email}</div>
            <div className="flex items-center space-x-3 text-[12px] text-gray-500 mt-2">
              {enrollment?.batchCode && <span className="px-2 py-0.5 bg-[#2D3B45] text-white text-[12px] font-bold rounded">{enrollment.batchCode}</span>}
              {profile.vNumber && <span>Roll #: {profile.vNumber}</span>}
              {profile.campus && <span>{profile.campus}</span>}
              {enrollment?.startDate && <span>Started: {new Date(enrollment.startDate).toLocaleDateString()}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#008EE2]">{modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0}%</div>
            <div className="text-[12px] text-gray-500">{completed} of {modules.length} modules</div>
          </div>
        </div>
        {currentModule && (
          <div className="mt-3 text-[13px]">
            <span className="text-gray-500">Currently studying:</span>{' '}
            <span className="font-medium text-[#2D3B45]">{currentModule.name}</span>
          </div>
        )}
      </div>

      {modules.length > 0 && (
        <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
          <div className="bg-[#2D3B45] text-white px-4 py-2 font-bold">Module Progress</div>
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-2 font-medium w-12">#</th>
                <th className="px-4 py-2 font-medium">Module</th>
                <th className="px-4 py-2 font-medium w-32">Status</th>
                <th className="px-4 py-2 font-medium w-40">Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E1E1]">
              {[...modules]
                .map((m: any) => {
                  const p = sp.find((x: any) => x.moduleId === realId(m));
                  return { ...m, _started: p?.startedAt || null, _completed: p?.completedAt || null, _status: p?.status || 'NOT_STARTED' };
                })
                .sort((a: any, b: any) => {
                  const at = a._started ? new Date(a._started).getTime() : Number.MAX_SAFE_INTEGER;
                  const bt = b._started ? new Date(b._started).getTime() : Number.MAX_SAFE_INTEGER;
                  return at - bt;
                })
                .map((m: any, i: number) => (
                  <tr key={m.id} className={m._status === 'IN_PROGRESS' ? 'bg-blue-50 align-top' : 'align-top'}>
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-[#2D3B45]">{m.name}</td>
                    <td className="px-4 py-2 w-[170px]">
                      {m._status === 'COMPLETED' && <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-green-100 text-green-700 whitespace-nowrap">This is a past module</span>}
                      {m._status === 'IN_PROGRESS' && <span className="px-2 py-1 text-[14px] font-bold rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">Scheduled</span>}
                      {m._status === 'NOT_STARTED' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">Upcoming</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-[12px]">
                      {m._started ? new Date(m._started).toLocaleDateString() : '—'}
                      {m._completed && ' → ' + new Date(m._completed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
        <div className="bg-[#2D3B45] text-white px-4 py-2 font-bold flex items-center justify-between">
          <span>Submissions</span>
          {subs && <span className="text-[12px] opacity-80">{subs.length} total</span>}
        </div>
        {subsLoading ? (
          <div className="p-6"><LoadingSpinner /></div>
        ) : !subs || subs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-[13px]">No submissions for this course.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-2 font-medium">Assignment</th>
                <th className="px-4 py-2 font-medium w-24">Status</th>
                <th className="px-4 py-2 font-medium text-right w-32">Score</th>
                <th className="px-4 py-2 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E1E1]">
              {subs.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{s.assignment?.title}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${s.status === 'GRADED' ? 'bg-green-100 text-green-700' : s.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {s.status === 'GRADED' && typeof s.score === 'number'
                      ? <span className="font-medium">{s.score}<span className="text-gray-400">/{s.assignment?.points ?? 0}</span></span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    {gradingId === s.id ? (
                      <div className="flex items-center space-x-1">
                        <input type="number" min={0} max={s.assignment?.points ?? 100} value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder={`/${s.assignment?.points ?? 0}`} className="w-16 border border-gray-300 rounded px-1 py-0.5 text-[12px]" autoFocus />
                        <button disabled={savingGrade} onClick={() => submitGrade(s.id, s.assignment?.points ?? 0)} className="px-2 py-0.5 bg-[#008EE2] text-white text-[12px] rounded disabled:opacity-50">Save</button>
                        <button onClick={() => { setGradingId(null); setGradeInput(''); }} className="px-2 py-0.5 text-gray-500 text-[12px]">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setGradingId(s.id); setGradeInput(typeof s.score === 'number' ? String(s.score) : ''); }} className="text-[#008EE2] text-[12px] hover:underline">{s.status === 'GRADED' ? 'Edit grade' : 'Grade'}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CoursePeopleTab({ courseId, userId, userRole }: { courseId: string; userId: string; userRole: string }) {
  const { data, loading } = useApi<any>(`/enrollments?courseId=${courseId}&limit=2000`);
  // For teachers, filter to batches they actually teach.
  const { data: dashData } = useApi<any>(userRole === 'TEACHER' ? '/dashboard' : null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  if (loading) return <LoadingSpinner />;
  if (selectedStudentId) {
    return <CourseStudentDetailView studentId={selectedStudentId} courseId={courseId} onBack={() => setSelectedStudentId(null)} />;
  }
  const allEnrollments = (data?.enrollments || []).filter((e: any) => e.role === 'STUDENT');
  const teacherBatchCodes: Set<string> = new Set(
    userRole === 'TEACHER' && dashData?.batches
      ? dashData.batches.filter((b: any) => b.course?.id === courseId).map((b: any) => b.batchCode)
      : []
  );
  const visible = userRole === 'TEACHER'
    ? allEnrollments.filter((e: any) => e.batchCode && teacherBatchCodes.has(e.batchCode))
    : allEnrollments;

  // Group by batchCode
  const byBatch = new Map<string, any[]>();
  for (const e of visible) {
    const key = e.batchCode || '(no batch)';
    if (!byBatch.has(key)) byBatch.set(key, []);
    byBatch.get(key)!.push(e);
  }
  const batchKeys = [...byBatch.keys()].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#2D3B45]">People</h2>
        <span className="text-[14px] text-gray-500">{visible.length} student{visible.length === 1 ? '' : 's'} across {batchKeys.length} batch{batchKeys.length === 1 ? '' : 'es'}</span>
      </div>
      {visible.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No enrolled students.</div>
      ) : (
        batchKeys.map(bc => {
          const rows = byBatch.get(bc)!;
          return (
            <div key={bc} className="border border-[#E1E1E1] rounded-lg overflow-hidden">
              <div className="bg-[#2D3B45] text-white px-4 py-2 flex items-center justify-between">
                <span className="font-bold">{bc}</span>
                <span className="text-[12px] opacity-80">{rows.length} student{rows.length === 1 ? '' : 's'}</span>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Roll #</th>
                    <th className="px-4 py-2 font-medium">Campus</th>
                    <th className="px-4 py-2 font-medium">Start</th>
                    <th className="px-4 py-2 font-medium text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E1E1]">
                  {rows.map((e: any) => (
                    <tr key={e.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedStudentId(e.userId)}>
                      <td className="px-4 py-2 font-medium text-[#008EE2] underline">{`${e.user?.firstName ?? ''} ${e.user?.lastName ?? ''}`.trim()}</td>
                      <td className="px-4 py-2 text-gray-600">{e.user?.email}</td>
                      <td className="px-4 py-2 text-gray-500">{e.user?.vNumber || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{e.user?.campus || e.campus || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-[#008EE2] font-medium">{e.progress?.moduleProgress != null ? `${e.progress.moduleProgress}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}

function CourseFilesTab({ courseId, canUpload, canDelete, userId }: { courseId: string; canUpload: boolean; canDelete: (uploaderId: string | null) => boolean; userId: string }) {
  const { data: files, loading, refetch } = useApi<any[]>(`/courses/${courseId}/files`);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (uploadFolder.trim()) fd.append('folder', uploadFolder.trim());
      const res = await api<any>(`/courses/${courseId}/files`, { method: 'POST', body: fd });
      if (!res.success) setUploadError(res.error || 'Upload failed');
      else { setUploadFolder(''); refetch(); }
    } catch (err: any) { setUploadError(err.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDownload = (fileId: string, fileName: string) => {
    const token = getAccessToken();
    const url = `/api/courses/${courseId}/files/${fileId}/download?token=${encodeURIComponent(token || '')}`;
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    const res = await del<any>(`/courses/${courseId}/files/${fileId}`);
    if (res.success) refetch();
    else alert(res.error || 'Delete failed');
  };

  const handleRename = async (fileId: string, currentName: string) => {
    const next = prompt('Rename file:', currentName);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === currentName) return;
    const res = await patch<any>(`/courses/${courseId}/files/${fileId}`, { fileName: trimmed });
    if (res.success) refetch();
    else alert(res.error || 'Rename failed');
  };

  if (loading) return <LoadingSpinner />;

  // Group files under module headings (fall back to folder, then "Course Files").
  const byModule = new Map<string, { label: string; files: any[]; sortKey: number }>();
  for (const f of files || []) {
    const key = f.module?.id || (f.folder ? `__folder__${f.folder}` : '__none__');
    const label = f.module?.name || (f.folder || 'Course Files');
    const sortKey = f.module?.id ? 0 : (f.folder ? 1 : 2);
    if (!byModule.has(key)) byModule.set(key, { label, files: [], sortKey });
    byModule.get(key)!.files.push(f);
  }
  const folderKeys = Array.from(byModule.keys()).sort((a, b) => {
    const A = byModule.get(a)!; const B = byModule.get(b)!;
    if (A.sortKey !== B.sortKey) return A.sortKey - B.sortKey;
    return A.label.localeCompare(B.label);
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-medium text-[#2D3B45]">Files</h1>
        <span className="text-[14px] text-gray-500">{files?.length || 0} files</span>
      </div>

      {canUpload && (
        <div className="mb-6 border border-[#E1E1E1] rounded-lg p-4 bg-[#F9F9F9]">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={uploadFolder}
              onChange={e => setUploadFolder(e.target.value)}
              placeholder="Folder (optional, e.g. Week 1)"
              className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded text-[14px]"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-[#008EE2] text-white px-4 py-2 rounded text-[14px] font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors"
            >
              <Upload size={16} />
              <span>{uploading ? 'Uploading…' : 'Upload'}</span>
            </button>
          </div>
          {uploadError && <p className="text-red-600 text-[13px] mt-2">{uploadError}</p>}
        </div>
      )}

      {folderKeys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No files yet.</p>
        </div>
      ) : (
        folderKeys.map(key => (
          <div key={key} className="mb-6">
            <h2 className="text-[15px] font-semibold text-[#2D3B45] mb-2 border-b border-[#E1E1E1] pb-1 flex items-center justify-between">
              <span>{byModule.get(key)!.label}</span>
              <span className="text-[12px] text-gray-400 font-normal">{byModule.get(key)!.files.length} file{byModule.get(key)!.files.length === 1 ? '' : 's'}</span>
            </h2>
            <div className="divide-y divide-[#EFEFEF]">
              {byModule.get(key)!.files.map(f => (
                <div key={f.id} className="flex items-center py-2 px-2 hover:bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#2D3B45] truncate">{f.fileName}</div>
                    <div className="text-[12px] text-gray-500">
                      {formatBytes(f.fileSize)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(f.id, f.fileName)}
                    className="ml-3 px-3 py-1 text-[13px] text-[#008EE2] hover:bg-[#008EE2]/10 rounded"
                  >
                    Download
                  </button>
                  {canDelete(f.uploadedById) && (
                    <>
                      <button
                        onClick={() => handleRename(f.id, f.fileName)}
                        className="ml-1 px-3 py-1 text-[13px] text-[#008EE2] hover:bg-[#008EE2]/10 rounded"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="ml-1 px-3 py-1 text-[13px] text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CourseView({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { data: course, loading, refetch: refetchCourse } = useApi<any>(`/courses/${courseId}`);
  const [activeSection, setActiveSection] = useState('Home');

  // Assignment module state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [viewAsStudent, setViewAsStudent] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentDetail, setAssignmentDetail] = useState<any>(null);
  const [assignmentDetailLoading, setAssignmentDetailLoading] = useState(false);

  // Student submission state
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionComment, setSubmissionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Teacher create assignment state
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignInstructions, setNewAssignInstructions] = useState('');
  const [newAssignPoints, setNewAssignPoints] = useState(100);
  const [newAssignDueDate, setNewAssignDueDate] = useState('');
  const [newAssignFormats, setNewAssignFormats] = useState('.pdf,.doc,.docx');
  const [newAssignPublished, setNewAssignPublished] = useState(true);
  const [newAssignFile, setNewAssignFile] = useState<File | null>(null);
  const [newAssignModuleId, setNewAssignModuleId] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // Create-from-bank flow state
  const [showBankFlow, setShowBankFlow] = useState(false);
  const [bankList, setBankList] = useState<any[]>([]);
  const [bankSourceId, setBankSourceId] = useState<string>('');
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [bankSelectedQuestionIds, setBankSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [bankTargetMode, setBankTargetMode] = useState<'COURSE' | 'BATCH' | 'STUDENT'>('COURSE');
  const [bankTargetBatches, setBankTargetBatches] = useState<Set<string>>(new Set());
  const [bankTargetStudents, setBankTargetStudents] = useState<Set<string>>(new Set());
  const [courseBatches, setCourseBatches] = useState<any[]>([]);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [bankSaving, setBankSaving] = useState(false);

  // Teacher grading state
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Quiz / Question builder state
  const [newAssignFormat, setNewAssignFormat] = useState<'FILE' | 'MCQ' | 'THEORY' | 'MIXED'>('FILE');
  const [newAssignTimeLimit, setNewAssignTimeLimit] = useState<number>(0);
  const [newAssignNegativeMarking, setNewAssignNegativeMarking] = useState<number>(0);
  const [newAssignShuffleQuestions, setNewAssignShuffleQuestions] = useState(false);
  const [newAssignShowResults, setNewAssignShowResults] = useState(true);
  const [builderQuestions, setBuilderQuestions] = useState<Array<{
    type: 'MCQ' | 'THEORY';
    text: string;
    points: number;
    explanation: string;
    wordLimit: number;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>>([]);

  // Quiz state (questions loaded for assignment detail)
  const [assignmentQuestions, setAssignmentQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, { selectedOptionId?: string; textAnswer?: string }>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Theory grading state (for quiz-based assignments)
  const [theoryGrades, setTheoryGrades] = useState<Record<string, { pointsAwarded: number; feedback: string }>>({});
  const [savingTheoryGrades, setSavingTheoryGrades] = useState(false);
  const [gradingQuizSubmissionId, setGradingQuizSubmissionId] = useState<string | null>(null);

  const loadAssignmentDetail = async (id: string) => {
    setAssignmentDetailLoading(true);
    setSelectedAssignmentId(id);
    setQuizSubmitted(false);
    setQuizAnswers({});
    setQuizTimeLeft(null);
    setAssignmentQuestions([]);
    const res = await api<any>(`/assignments/${id}`);
    if (res.success) {
      setAssignmentDetail(res.data);
      // Fetch questions for non-FILE formats
      const format = res.data?.format || 'FILE';
      if (format !== 'FILE') {
        const qRes = await api<any>(`/questions?assignmentId=${id}`);
        if (qRes.success) {
          setAssignmentQuestions(qRes.data || []);
        }
        // Start timer if time limit exists and student hasn't submitted
        if (res.data?.timeLimit && (user?.role === 'STUDENT' || viewAsStudent)) {
          const mySubmission = res.data.submissions?.find((s: any) => s.studentId === user?.id);
          if (!mySubmission) {
            setQuizTimeLeft(res.data.timeLimit * 60);
          }
        }
      }
    }
    setAssignmentDetailLoading(false);
  };

  const handleSubmitWork = async () => {
    if (!submissionFile || !selectedAssignmentId) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', submissionFile);
    formData.append('assignmentId', selectedAssignmentId);
    if (submissionComment) formData.append('comment', submissionComment);
    const res = await api<any>('/submissions', { method: 'POST', body: formData });
    if (res.success) {
      setSubmissionFile(null);
      setSubmissionComment('');
      await loadAssignmentDetail(selectedAssignmentId);
    }
    setSubmitting(false);
  };

  const handleCreateAssignment = async () => {
    if (!newAssignTitle || !newAssignPoints) return;
    setCreating(true);

    const targetBatchesArr = bankTargetMode === 'BATCH' ? [...bankTargetBatches] : [];
    const targetStudentsArr = bankTargetMode === 'STUDENT' ? [...bankTargetStudents] : [];

    if (newAssignFormat === 'FILE') {
      // Existing FILE-based creation
      const formData = new FormData();
      formData.append('courseId', courseId);
      if (newAssignModuleId) formData.append('moduleId', newAssignModuleId);
      formData.append('title', newAssignTitle);
      formData.append('description', newAssignDesc);
      formData.append('instructions', newAssignInstructions);
      formData.append('points', String(newAssignPoints));
      formData.append('format', 'FILE');
      if (newAssignDueDate) formData.append('dueDate', newAssignDueDate);
      formData.append('allowedFormats', newAssignFormats);
      formData.append('published', String(newAssignPublished));
      if (newAssignFile) formData.append('file', newAssignFile);
      formData.append('targetBatches', JSON.stringify(targetBatchesArr));
      formData.append('targetStudents', JSON.stringify(targetStudentsArr));
      const res = await api<any>('/assignments', { method: 'POST', body: formData });
      if (res.success) {
        resetCreateForm();
        refetchCourse();
      }
    } else {
      // Quiz-based creation: create assignment, then POST questions
      const formData = new FormData();
      formData.append('courseId', courseId);
      if (newAssignModuleId) formData.append('moduleId', newAssignModuleId);
      formData.append('title', newAssignTitle);
      formData.append('description', newAssignDesc);
      formData.append('instructions', newAssignInstructions);
      formData.append('points', String(newAssignPoints));
      formData.append('format', newAssignFormat);
      if (newAssignDueDate) formData.append('dueDate', newAssignDueDate);
      formData.append('published', String(newAssignPublished));
      if (newAssignTimeLimit > 0) formData.append('timeLimit', String(newAssignTimeLimit));
      formData.append('negativeMarking', String(newAssignNegativeMarking));
      formData.append('shuffleQuestions', String(newAssignShuffleQuestions));
      formData.append('showResults', String(newAssignShowResults));
      formData.append('targetBatches', JSON.stringify(targetBatchesArr));
      formData.append('targetStudents', JSON.stringify(targetStudentsArr));

      const res = await api<any>('/assignments', { method: 'POST', body: formData });
      if (res.success && res.data?.id) {
        // Now create questions
        if (builderQuestions.length > 0) {
          await api<any>('/questions', {
            method: 'POST',
            body: JSON.stringify({
              assignmentId: res.data.id,
              questions: builderQuestions.map((q, idx) => ({
                type: q.type,
                text: q.text,
                points: q.points,
                position: idx + 1,
                explanation: q.explanation || undefined,
                wordLimit: q.type === 'THEORY' && q.wordLimit > 0 ? q.wordLimit : undefined,
                options: q.type === 'MCQ' ? q.options.map((o, oi) => ({
                  text: o.text,
                  isCorrect: o.isCorrect,
                  position: oi + 1,
                })) : undefined,
              })),
            }),
          });
        }
        resetCreateForm();
        refetchCourse();
      }
    }
    setCreating(false);
  };

  const resetCreateForm = () => {
    setShowCreateAssignment(false);
    setNewAssignTitle(''); setNewAssignDesc(''); setNewAssignInstructions('');
    setNewAssignPoints(100); setNewAssignDueDate(''); setNewAssignFormats('.pdf,.doc,.docx');
    setNewAssignPublished(true); setNewAssignFile(null);
    setNewAssignFormat('FILE'); setNewAssignTimeLimit(0); setNewAssignNegativeMarking(0);
    setNewAssignShuffleQuestions(false); setNewAssignShowResults(true);
    setNewAssignModuleId('');
    setBuilderQuestions([]);
  };

  const loadTargetData = async () => {
    if (courseBatches.length > 0 || courseStudents.length > 0) return; // cached

    // Teachers can only target their own batches; admins see all.
    let allowedBatchCodes: Set<string> | null = null;
    if (user?.role === 'TEACHER') {
      const batchesRes = await api<any>(`/batches?courseId=${courseId}`);
      if (batchesRes.success) {
        const myBatches = (batchesRes.data || []).filter((b: any) => b.teacherId === user?.id);
        allowedBatchCodes = new Set(myBatches.map((b: any) => b.batchCode));
      } else {
        allowedBatchCodes = new Set();
      }
    }

    const enrollsRes = await api<any>(`/enrollments?courseId=${courseId}&limit=5000`);
    if (enrollsRes.success) {
      const enrolls = enrollsRes.data?.enrollments || [];
      const batchSet = new Map<string, { batchCode: string; count: number }>();
      const studentMap = new Map<string, any>();
      for (const e of enrolls) {
        if (e.batchCode && (!allowedBatchCodes || allowedBatchCodes.has(e.batchCode))) {
          const cur = batchSet.get(e.batchCode);
          if (cur) cur.count++; else batchSet.set(e.batchCode, { batchCode: e.batchCode, count: 1 });
        }
        if (e.user && (!allowedBatchCodes || (e.batchCode && allowedBatchCodes.has(e.batchCode)))) {
          studentMap.set(e.user.id, e.user);
        }
      }
      setCourseBatches([...batchSet.values()].sort((a, b) => a.batchCode.localeCompare(b.batchCode)));
      setCourseStudents([...studentMap.values()].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
    }
  };

  const openBankFlow = async (preselectSourceId?: string) => {
    setActiveSection('Assignments');
    setShowBankFlow(true);
    setBankSourceId(''); setBankQuestions([]); setBankSelectedQuestionIds(new Set());
    setBankTargetMode('COURSE'); setBankTargetBatches(new Set()); setBankTargetStudents(new Set());
    setNewAssignTitle(''); setNewAssignDesc(''); setNewAssignInstructions('');
    setNewAssignPoints(100); setNewAssignDueDate('');
    setNewAssignTimeLimit(0); setNewAssignNegativeMarking(0);
    setNewAssignShuffleQuestions(false); setNewAssignShowResults(true);
    const banksRes = await api<any>(`/assignments/banks?courseId=${courseId}`);
    if (banksRes.success) setBankList(banksRes.data || []);
    await loadTargetData();
    if (preselectSourceId) await onPickBankSource(preselectSourceId);
  };

  const openCreateAssignment = async () => {
    setShowCreateAssignment(true);
    setBankTargetMode('COURSE'); setBankTargetBatches(new Set()); setBankTargetStudents(new Set());
    await loadTargetData();
  };

  const [previewBankId, setPreviewBankId] = useState<string | null>(null);
  const [previewBankQuestions, setPreviewBankQuestions] = useState<any[]>([]);

  // Manage-targets modal (assignment detail view)
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [editTargetMode, setEditTargetMode] = useState<'COURSE' | 'BATCH' | 'STUDENT'>('COURSE');
  const [editTargetBatches, setEditTargetBatches] = useState<Set<string>>(new Set());
  const [editTargetStudents, setEditTargetStudents] = useState<Set<string>>(new Set());
  const [editTargetSaving, setEditTargetSaving] = useState(false);

  const openTargetsModal = async () => {
    if (!assignmentDetail) return;
    await loadTargetData();
    const targets = assignmentDetail.targets || [];
    const batches = new Set<string>(targets.filter((t: any) => t.kind === 'BATCH').map((t: any) => t.targetId));
    const students = new Set<string>(targets.filter((t: any) => t.kind === 'STUDENT').map((t: any) => t.targetId));
    if (batches.size > 0 && students.size === 0) setEditTargetMode('BATCH');
    else if (students.size > 0 && batches.size === 0) setEditTargetMode('STUDENT');
    else if (batches.size > 0 || students.size > 0) setEditTargetMode('BATCH'); // mixed -> default to BATCH tab
    else setEditTargetMode('COURSE');
    setEditTargetBatches(batches);
    setEditTargetStudents(students);
    setShowTargetsModal(true);
  };

  const saveTargets = async () => {
    if (!assignmentDetail) return;
    setEditTargetSaving(true);
    const body: any = {
      targetBatches: editTargetMode === 'BATCH' ? [...editTargetBatches] : [],
      targetStudents: editTargetMode === 'STUDENT' ? [...editTargetStudents] : [],
    };
    const res = await api<any>(`/assignments/${assignmentDetail.id}/targets`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setEditTargetSaving(false);
    if (res.success) {
      setShowTargetsModal(false);
      // refresh detail
      loadAssignmentDetail(assignmentDetail.id);
    } else {
      alert(res.error || 'Failed to update targets');
    }
  };

  React.useEffect(() => {
    if (activeSection === 'Question Banks' && bankList.length === 0) {
      api<any>(`/assignments/banks?courseId=${courseId}`).then(res => {
        if (res.success) setBankList(res.data || []);
      });
    }
  }, [activeSection, courseId]);

  const openBankPreview = async (bankId: string) => {
    setPreviewBankId(bankId);
    const res = await api<any>(`/assignments/${bankId}/questions`);
    if (res.success) setPreviewBankQuestions(res.data || []);
  };

  const onPickBankSource = async (sourceId: string) => {
    setBankSourceId(sourceId);
    setBankSelectedQuestionIds(new Set());
    if (!sourceId) { setBankQuestions([]); return; }
    const res = await api<any>(`/assignments/${sourceId}/questions`);
    if (res.success) {
      setBankQuestions(res.data || []);
      // Default: select all
      setBankSelectedQuestionIds(new Set((res.data || []).map((q: any) => q.id)));
    }
  };

  const submitBankAssignment = async () => {
    if (!bankSourceId || bankSelectedQuestionIds.size === 0 || !newAssignTitle) return;
    setBankSaving(true);
    const body: any = {
      sourceAssignmentId: bankSourceId,
      questionIds: [...bankSelectedQuestionIds],
      courseId,
      title: newAssignTitle,
      description: newAssignDesc || undefined,
      instructions: newAssignInstructions || undefined,
      type: 'QUIZ',
      format: 'MCQ',
      points: newAssignPoints,
      dueDate: newAssignDueDate || undefined,
      timeLimit: newAssignTimeLimit > 0 ? newAssignTimeLimit : undefined,
      shuffleQuestions: newAssignShuffleQuestions,
      showResults: newAssignShowResults,
      negativeMarking: newAssignNegativeMarking,
      targetBatches: bankTargetMode === 'BATCH' ? [...bankTargetBatches] : [],
      targetStudents: bankTargetMode === 'STUDENT' ? [...bankTargetStudents] : [],
    };
    const res = await api<any>('/assignments/from-bank', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setBankSaving(false);
    if (res.success) {
      setShowBankFlow(false);
      refetchCourse();
    } else {
      alert(res.error || 'Failed to create assignment');
    }
  };

  const addBuilderQuestion = (type: 'MCQ' | 'THEORY') => {
    setBuilderQuestions(prev => [...prev, {
      type,
      text: '',
      points: 10,
      explanation: '',
      wordLimit: 0,
      options: type === 'MCQ' ? [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ] : [],
    }]);
  };

  const updateBuilderQuestion = (index: number, updates: Partial<typeof builderQuestions[0]>) => {
    setBuilderQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const removeBuilderQuestion = (index: number) => {
    setBuilderQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const moveBuilderQuestion = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= builderQuestions.length) return;
    setBuilderQuestions(prev => {
      const copy = [...prev];
      [copy[index], copy[newIdx]] = [copy[newIdx], copy[index]];
      return copy;
    });
  };

  const handleQuizSubmit = async () => {
    if (!selectedAssignmentId) return;
    setQuizSubmitting(true);
    const answers = Object.entries(quizAnswers).map(([questionId, ans]) => ({
      questionId,
      selectedOptionId: ans.selectedOptionId || undefined,
      textAnswer: ans.textAnswer || undefined,
    }));
    const res = await api<any>('/questions/submit', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: selectedAssignmentId, answers }),
    });
    if (res.success) {
      setQuizSubmitted(true);
      setQuizTimeLeft(null);
      await loadAssignmentDetail(selectedAssignmentId);
    }
    setQuizSubmitting(false);
  };

  const handleGradeTheory = async (submissionId: string) => {
    setSavingTheoryGrades(true);
    const grades = Object.entries(theoryGrades).map(([answerId, g]) => ({
      answerId,
      pointsAwarded: g.pointsAwarded,
      feedback: g.feedback,
    }));
    const res = await api<any>('/questions/grade-theory', {
      method: 'PATCH',
      body: JSON.stringify({ submissionId, grades }),
    });
    if (res.success && selectedAssignmentId) {
      setTheoryGrades({});
      setGradingQuizSubmissionId(null);
      await loadAssignmentDetail(selectedAssignmentId);
    }
    setSavingTheoryGrades(false);
  };

  // Timer effect for quiz countdown
  React.useEffect(() => {
    if (quizTimeLeft === null || quizTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setQuizTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          if (prev === 1) handleQuizSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizTimeLeft !== null && quizTimeLeft > 0]);

  const handleSaveGrade = async () => {
    if (!gradingSubmissionId) return;
    setSavingGrade(true);
    const res = await api<any>(`/submissions/${gradingSubmissionId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ score: gradeScore, feedback: gradeFeedback }),
    });
    if (res.success && selectedAssignmentId) {
      setGradingSubmissionId(null);
      setGradeScore(0);
      setGradeFeedback('');
      await loadAssignmentDetail(selectedAssignmentId);
    }
    setSavingGrade(false);
  };

  if (loading || !course) return <LoadingSpinner />;

  const studentNavItems = [
    { label: 'Home' }, { label: 'Assignments' }, { label: 'Grades' },
    { label: 'Pages' }, { label: 'Files' },
    { label: 'Quizzes' }
  ];

  const teacherNavItems = [
    { label: 'Home' }, { label: 'Announcements' }, { label: 'Assignments' },
    { label: 'Question Banks' },
    { label: 'Grades' }, { label: 'People' }, { label: 'Pages' },
    { label: 'Files' }, { label: 'Rubrics' },
    { label: 'Quizzes' }, { label: 'Settings' }
  ];

  const effectiveRole = viewAsStudent ? 'STUDENT' : user?.role;
  const navItems = effectiveRole === 'TEACHER' ? teacherNavItems : studentNavItems;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="h-16 border-b border-[#E1E1E1] flex items-center justify-between px-8 bg-white shrink-0">
        <div className="flex items-center">
          <Menu size={24} className="mr-6 text-[#2D3B45] cursor-pointer" />
          <span className="text-[#008EE2] hover:underline cursor-pointer text-lg font-medium">{course.code}</span>
        </div>
        {user?.role === 'TEACHER' && (
          <button
            onClick={() => setViewAsStudent(!viewAsStudent)}
            className={`flex items-center px-4 py-2 border rounded text-sm font-medium transition-colors ${viewAsStudent ? 'bg-[#008EE2] text-white border-[#008EE2] hover:bg-[#0077BE]' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            <Eye size={18} className="mr-2" /> {viewAsStudent ? 'Return to Teacher View' : 'View as Student'}
          </button>
        )}
      </header>

      {viewAsStudent && (
        <div className="bg-[#008EE2] text-white text-center py-1.5 text-sm font-medium">
          Viewing as Student &mdash; Click "Return to Teacher View" to go back.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 border-r border-[#E1E1E1] overflow-y-auto py-4 shrink-0">
          {navItems.map(item => (
            <div key={item.label} onClick={() => setActiveSection(item.label)}
              className={`flex items-center px-4 py-1.5 cursor-pointer border-l-[3px] ${activeSection === item.label ? 'border-black text-black font-bold' : 'border-transparent text-[#008EE2] hover:bg-gray-50'}`}>
              <span className="text-[16px]">{item.label}</span>
            </div>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto p-12">
          {activeSection === 'Home' ? (
            <div className="max-w-4xl">
              <h1 className="text-[32px] font-medium text-[#2D3B45] mb-10">{course.name}</h1>
              {course.description && <p className="text-[16px] text-[#2D3B45] mb-6">{course.description}</p>}

              {course.modules?.length > 0 && (
                <>
                  <h2 className="text-[28px] font-medium text-[#2D3B45] mb-4">Course Modules</h2>
                  <table className="w-full border-collapse border border-[#E1E1E1] text-[16px]">
                    <thead>
                      <tr className="bg-[#2D3B45] text-white">
                        <th className="border border-[#E1E1E1] px-4 py-3 text-center font-medium w-16">#</th>
                        <th className="border border-[#E1E1E1] px-4 py-3 text-left font-medium">Module</th>
                        {course.modules.some((m: any) => m.weight) && (
                          <th className="border border-[#E1E1E1] px-4 py-3 text-center font-medium w-24">Weight</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-[#2D3B45]">
                      {course.modules.map((mod: any) => (
                        <tr key={mod.id} className="hover:bg-gray-50">
                          <td className="border border-[#E1E1E1] px-4 py-2.5 font-bold text-center">{mod.position}</td>
                          <td className="border border-[#E1E1E1] px-4 py-2.5">{mod.name}</td>
                          {course.modules.some((m: any) => m.weight) && (
                            <td className="border border-[#E1E1E1] px-4 py-2.5 text-center font-medium">{mod.weight ? `${mod.weight}%` : '-'}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {course.modules.some((m: any) => m.weight) && (
                      <tfoot>
                        <tr className="bg-[#F5F5F5] font-bold">
                          <td className="border border-[#E1E1E1] px-4 py-2.5 text-center" colSpan={2}>Total</td>
                          <td className="border border-[#E1E1E1] px-4 py-2.5 text-center">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </>
              )}
            </div>
          ) : activeSection === 'Assignments' ? (
            <div className="max-w-6xl">
              {/* Create From Question Bank Flow */}
              {showBankFlow ? (
                <div>
                  <button onClick={() => setShowBankFlow(false)} className="flex items-center text-[#008EE2] text-sm mb-6 hover:underline">
                    <ChevronLeft size={16} className="mr-1" /> Back to Assignments
                  </button>
                  <h2 className="text-[28px] font-medium text-[#2D3B45] mb-6">Create Assignment from Question Bank</h2>

                  <div className="border border-[#E1E1E1] rounded-sm bg-white p-6 space-y-6">
                    {/* Step 1: Pick Source Bank */}
                    <div>
                      <label className="block text-sm font-bold text-[#2D3B45] mb-2">1. Pick Source (a module's question pool)</label>
                      <select value={bankSourceId} onChange={e => onPickBankSource(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]">
                        <option value="">— Select a question bank —</option>
                        {bankList.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.title} ({b._count.questions} questions)</option>
                        ))}
                      </select>
                    </div>

                    {/* Step 2: Pick Questions */}
                    {bankQuestions.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-bold text-[#2D3B45]">2. Select Questions ({bankSelectedQuestionIds.size} / {bankQuestions.length})</label>
                          <div className="flex space-x-2 text-xs">
                            <button onClick={() => setBankSelectedQuestionIds(new Set(bankQuestions.map(q => q.id)))} className="text-[#008EE2] hover:underline">Select All</button>
                            <button onClick={() => setBankSelectedQuestionIds(new Set())} className="text-[#008EE2] hover:underline">Clear</button>
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded max-h-64 overflow-y-auto divide-y divide-gray-100">
                          {bankQuestions.map((q: any, i: number) => (
                            <label key={q.id} className="flex items-start px-3 py-2 hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" className="mt-1 mr-3"
                                checked={bankSelectedQuestionIds.has(q.id)}
                                onChange={e => {
                                  const next = new Set(bankSelectedQuestionIds);
                                  if (e.target.checked) next.add(q.id); else next.delete(q.id);
                                  setBankSelectedQuestionIds(next);
                                }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-[#2D3B45]"><span className="text-gray-400 mr-1">{i + 1}.</span>{q.text}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{q.type} · {q.points} pts{q.options?.length ? ` · ${q.options.length} options` : ''}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Assignment Metadata */}
                    {bankSourceId && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">3. Title *</label>
                          <input type="text" value={newAssignTitle} onChange={e => setNewAssignTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. Macro Economics – Quiz 2 (Batch HTE06)" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Description</label>
                          <textarea value={newAssignDesc} onChange={e => setNewAssignDesc(e.target.value)} rows={2}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Total Points</label>
                          <input type="number" value={newAssignPoints} onChange={e => setNewAssignPoints(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" min={0} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Due Date</label>
                          <input type="datetime-local" value={newAssignDueDate} onChange={e => setNewAssignDueDate(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Time Limit (min)</label>
                          <input type="number" value={newAssignTimeLimit} onChange={e => setNewAssignTimeLimit(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" min={0} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Negative Marking</label>
                          <input type="number" step="0.25" value={newAssignNegativeMarking} onChange={e => setNewAssignNegativeMarking(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm" min={0} />
                        </div>
                        <label className="col-span-2 flex items-center text-sm">
                          <input type="checkbox" checked={newAssignShuffleQuestions} onChange={e => setNewAssignShuffleQuestions(e.target.checked)} className="mr-2" />
                          Shuffle questions per student
                        </label>
                        <label className="col-span-2 flex items-center text-sm">
                          <input type="checkbox" checked={newAssignShowResults} onChange={e => setNewAssignShowResults(e.target.checked)} className="mr-2" />
                          Show results to student after submit
                        </label>
                      </div>
                    )}

                    {/* Step 4: Targets */}
                    {bankSourceId && (
                      <div>
                        <label className="block text-sm font-bold text-[#2D3B45] mb-2">4. Assign to</label>
                        <div className="space-y-2">
                          <label className="flex items-center text-sm">
                            <input type="radio" name="bankTargetMode" checked={bankTargetMode === 'COURSE'} onChange={() => setBankTargetMode('COURSE')} className="mr-2" />
                            All students in this course (course-wide)
                          </label>
                          <label className="flex items-center text-sm">
                            <input type="radio" name="bankTargetMode" checked={bankTargetMode === 'BATCH'} onChange={() => setBankTargetMode('BATCH')} className="mr-2" />
                            Specific batches
                          </label>
                          <label className="flex items-center text-sm">
                            <input type="radio" name="bankTargetMode" checked={bankTargetMode === 'STUDENT'} onChange={() => setBankTargetMode('STUDENT')} className="mr-2" />
                            Specific students
                          </label>
                        </div>

                        {bankTargetMode === 'BATCH' && (
                          <div className="mt-3 border border-gray-200 rounded max-h-48 overflow-y-auto">
                            {courseBatches.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">No batches in this course.</div>
                            ) : courseBatches.map((b: any) => (
                              <label key={b.batchCode} className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                                <input type="checkbox" className="mr-2"
                                  checked={bankTargetBatches.has(b.batchCode)}
                                  onChange={e => {
                                    const next = new Set(bankTargetBatches);
                                    if (e.target.checked) next.add(b.batchCode); else next.delete(b.batchCode);
                                    setBankTargetBatches(next);
                                  }} />
                                {b.batchCode} <span className="text-gray-400 ml-2">({b.count} students)</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {bankTargetMode === 'STUDENT' && (
                          <div className="mt-3 border border-gray-200 rounded max-h-64 overflow-y-auto">
                            {courseStudents.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">No students enrolled.</div>
                            ) : courseStudents.map((s: any) => (
                              <label key={s.id} className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                                <input type="checkbox" className="mr-2"
                                  checked={bankTargetStudents.has(s.id)}
                                  onChange={e => {
                                    const next = new Set(bankTargetStudents);
                                    if (e.target.checked) next.add(s.id); else next.delete(s.id);
                                    setBankTargetStudents(next);
                                  }} />
                                {s.firstName} {s.lastName} <span className="text-gray-400 ml-2">{s.email}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end space-x-2 pt-2">
                      <button onClick={() => setShowBankFlow(false)} className="px-6 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={submitBankAssignment}
                        disabled={!bankSourceId || bankSelectedQuestionIds.size === 0 || !newAssignTitle || bankSaving ||
                          (bankTargetMode === 'BATCH' && bankTargetBatches.size === 0) ||
                          (bankTargetMode === 'STUDENT' && bankTargetStudents.size === 0)}
                        className="px-6 py-2 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                        {bankSaving ? 'Creating…' : 'Create Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : showCreateAssignment ? (
                <div>
                  <button onClick={() => { resetCreateForm(); }} className="flex items-center text-[#008EE2] text-sm mb-6 hover:underline">
                    <ChevronLeft size={16} className="mr-1" /> Back to Assignments
                  </button>
                  <h2 className="text-[28px] font-medium text-[#2D3B45] mb-6">New Assignment</h2>
                  <div className="border border-[#E1E1E1] rounded-sm bg-white p-6 space-y-5">
                    {/* Format Selector */}
                    <div>
                      <label className="block text-sm font-bold text-[#2D3B45] mb-2">Format *</label>
                      <div className="flex items-center space-x-2">
                        {(['FILE', 'MCQ', 'THEORY', 'MIXED'] as const).map(fmt => (
                          <button key={fmt} onClick={() => setNewAssignFormat(fmt)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${
                              newAssignFormat === fmt
                                ? fmt === 'FILE' ? 'bg-gray-600 text-white border-gray-600'
                                : fmt === 'MCQ' ? 'bg-[#008EE2] text-white border-[#008EE2]'
                                : fmt === 'THEORY' ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-[#2D3B45] border-gray-300 hover:bg-gray-50'
                            }`}>
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#2D3B45] mb-1">Module</label>
                      <select value={newAssignModuleId} onChange={e => setNewAssignModuleId(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2] bg-white">
                        <option value="">— No module —</option>
                        {(course.modules || []).map((m: any) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#2D3B45] mb-1">Title *</label>
                      <input type="text" value={newAssignTitle} onChange={e => setNewAssignTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                        placeholder="Assignment title" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#2D3B45] mb-1">Description</label>
                      <textarea value={newAssignDesc} onChange={e => setNewAssignDesc(e.target.value)} rows={3}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                        placeholder="Brief description" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#2D3B45] mb-1">Instructions</label>
                      <textarea value={newAssignInstructions} onChange={e => setNewAssignInstructions(e.target.value)} rows={5}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                        placeholder="Detailed instructions for students..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#2D3B45] mb-1">Points *</label>
                        <input type="number" value={newAssignPoints} onChange={e => setNewAssignPoints(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={0} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#2D3B45] mb-1">Due Date</label>
                        <input type="datetime-local" value={newAssignDueDate} onChange={e => setNewAssignDueDate(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                      </div>
                    </div>

                    {/* FILE-specific fields */}
                    {newAssignFormat === 'FILE' && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Allowed Formats</label>
                          <input type="text" value={newAssignFormats} onChange={e => setNewAssignFormats(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                            placeholder=".pdf,.doc,.docx" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-[#2D3B45] mb-1">Attachment (PDF)</label>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                              <Upload size={16} />
                              <span>{newAssignFile ? newAssignFile.name : 'Choose file...'}</span>
                              <input type="file" accept=".pdf" className="hidden" onChange={e => setNewAssignFile(e.target.files?.[0] || null)} />
                            </label>
                            {newAssignFile && (
                              <button onClick={() => setNewAssignFile(null)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Quiz-specific fields */}
                    {newAssignFormat !== 'FILE' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-[#2D3B45] mb-1">Time Limit (minutes, 0 = no limit)</label>
                            <input type="number" value={newAssignTimeLimit} onChange={e => setNewAssignTimeLimit(Number(e.target.value))}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={0} />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-[#2D3B45] mb-1">Negative Marking (points deducted per wrong MCQ)</label>
                            <input type="number" value={newAssignNegativeMarking} onChange={e => setNewAssignNegativeMarking(Number(e.target.value))}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={0} step={0.5} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center space-x-2 text-sm text-[#2D3B45]">
                            <input type="checkbox" checked={newAssignShuffleQuestions} onChange={e => setNewAssignShuffleQuestions(e.target.checked)} className="rounded border-gray-300" />
                            <span>Shuffle Questions</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-[#2D3B45]">
                            <input type="checkbox" checked={newAssignShowResults} onChange={e => setNewAssignShowResults(e.target.checked)} className="rounded border-gray-300" />
                            <span>Show Results After Submission</span>
                          </label>
                        </div>

                        {/* Question Builder */}
                        <div className="border-t border-[#E1E1E1] pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#2D3B45]">Questions ({builderQuestions.length})</h3>
                            <div className="flex items-center space-x-2">
                              {(newAssignFormat === 'MCQ' || newAssignFormat === 'MIXED') && (
                                <button onClick={() => addBuilderQuestion('MCQ')}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] transition-colors">
                                  <Plus size={14} /> <span>MCQ</span>
                                </button>
                              )}
                              {(newAssignFormat === 'THEORY' || newAssignFormat === 'MIXED') && (
                                <button onClick={() => addBuilderQuestion('THEORY')}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors">
                                  <Plus size={14} /> <span>Theory</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {builderQuestions.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                              No questions yet. Click the button above to add questions.
                            </div>
                          )}

                          <div className="space-y-4">
                            {builderQuestions.map((q, qIdx) => (
                              <div key={qIdx} className={`border rounded-lg overflow-hidden ${q.type === 'MCQ' ? 'border-[#008EE2]' : 'border-purple-400'}`}>
                                <div className={`px-4 py-2 flex items-center justify-between ${q.type === 'MCQ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                                  <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-0.5 text-[16px] font-bold rounded ${q.type === 'MCQ' ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{q.type}</span>
                                    <span className="text-sm font-bold text-[#2D3B45]">Question {qIdx + 1}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => moveBuilderQuestion(qIdx, -1)} disabled={qIdx === 0}
                                      className="p-1 hover:bg-white rounded disabled:opacity-30 transition-colors text-gray-500" title="Move up">
                                      <ChevronLeft size={16} className="rotate-90" />
                                    </button>
                                    <button onClick={() => moveBuilderQuestion(qIdx, 1)} disabled={qIdx === builderQuestions.length - 1}
                                      className="p-1 hover:bg-white rounded disabled:opacity-30 transition-colors text-gray-500" title="Move down">
                                      <ChevronRight size={16} className="rotate-90" />
                                    </button>
                                    <button onClick={() => removeBuilderQuestion(qIdx)}
                                      className="p-1 hover:bg-red-100 rounded transition-colors text-red-400 hover:text-red-600 ml-2" title="Delete">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div>
                                    <label className="block text-[16px] font-bold text-gray-500 mb-1">Question Text *</label>
                                    <textarea value={q.text} onChange={e => updateBuilderQuestion(qIdx, { text: e.target.value })} rows={2}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                      placeholder="Enter question text..." />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[16px] font-bold text-gray-500 mb-1">Points</label>
                                      <input type="number" value={q.points} onChange={e => updateBuilderQuestion(qIdx, { points: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={1} />
                                    </div>
                                    {q.type === 'THEORY' && (
                                      <div>
                                        <label className="block text-[16px] font-bold text-gray-500 mb-1">Word Limit (0 = no limit)</label>
                                        <input type="number" value={q.wordLimit} onChange={e => updateBuilderQuestion(qIdx, { wordLimit: Number(e.target.value) })}
                                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={0} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[16px] font-bold text-gray-500 mb-1">Explanation (shown after submission)</label>
                                    <input type="text" value={q.explanation} onChange={e => updateBuilderQuestion(qIdx, { explanation: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                      placeholder="Optional explanation..." />
                                  </div>

                                  {/* MCQ Options */}
                                  {q.type === 'MCQ' && (
                                    <div>
                                      <label className="block text-[16px] font-bold text-gray-500 mb-2">Options (select correct answer)</label>
                                      <div className="space-y-2">
                                        {q.options.map((opt, oIdx) => (
                                          <div key={oIdx} className="flex items-center space-x-2">
                                            <input type="radio" name={`q-${qIdx}-correct`} checked={opt.isCorrect}
                                              onChange={() => {
                                                const newOptions = q.options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
                                                updateBuilderQuestion(qIdx, { options: newOptions });
                                              }}
                                              className="text-[#008EE2]" />
                                            <input type="text" value={opt.text}
                                              onChange={e => {
                                                const newOptions = [...q.options];
                                                newOptions[oIdx] = { ...newOptions[oIdx], text: e.target.value };
                                                updateBuilderQuestion(qIdx, { options: newOptions });
                                              }}
                                              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                              placeholder={`Option ${oIdx + 1}`} />
                                            {q.options.length > 2 && (
                                              <button onClick={() => {
                                                const newOptions = q.options.filter((_, i) => i !== oIdx);
                                                if (opt.isCorrect && newOptions.length > 0) newOptions[0].isCorrect = true;
                                                updateBuilderQuestion(qIdx, { options: newOptions });
                                              }}
                                                className="text-gray-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      {q.options.length < 6 && (
                                        <button onClick={() => {
                                          updateBuilderQuestion(qIdx, { options: [...q.options, { text: '', isCorrect: false }] });
                                        }}
                                          className="mt-2 text-[#008EE2] text-sm hover:underline flex items-center space-x-1">
                                          <Plus size={14} /> <span>Add Option</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {builderQuestions.length > 0 && (
                            <div className="mt-3 text-sm text-gray-500">
                              Total question points: <span className="font-bold">{builderQuestions.reduce((s, q) => s + q.points, 0)}</span>
                              {builderQuestions.reduce((s, q) => s + q.points, 0) !== newAssignPoints && (
                                <span className="text-amber-600 ml-2">(does not match assignment points: {newAssignPoints})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Target picker */}
                    <div className="border-t border-[#E1E1E1] pt-5">
                      <label className="block text-sm font-bold text-[#2D3B45] mb-2">Assign to</label>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm">
                          <input type="radio" name="newAssignTargetMode" checked={bankTargetMode === 'COURSE'} onChange={() => setBankTargetMode('COURSE')} className="mr-2" />
                          All students in this course (course-wide)
                        </label>
                        <label className="flex items-center text-sm">
                          <input type="radio" name="newAssignTargetMode" checked={bankTargetMode === 'BATCH'} onChange={() => setBankTargetMode('BATCH')} className="mr-2" />
                          Specific batches
                        </label>
                        <label className="flex items-center text-sm">
                          <input type="radio" name="newAssignTargetMode" checked={bankTargetMode === 'STUDENT'} onChange={() => setBankTargetMode('STUDENT')} className="mr-2" />
                          Specific students
                        </label>
                      </div>
                      {bankTargetMode === 'BATCH' && (
                        <div className="mt-3 border border-gray-200 rounded max-h-48 overflow-y-auto">
                          {courseBatches.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No batches in this course.</div>
                          ) : courseBatches.map((b: any) => (
                            <label key={b.batchCode} className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                              <input type="checkbox" className="mr-2"
                                checked={bankTargetBatches.has(b.batchCode)}
                                onChange={e => {
                                  const next = new Set(bankTargetBatches);
                                  if (e.target.checked) next.add(b.batchCode); else next.delete(b.batchCode);
                                  setBankTargetBatches(next);
                                }} />
                              {b.batchCode} <span className="text-gray-400 ml-2">({b.count} students)</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {bankTargetMode === 'STUDENT' && (
                        <div className="mt-3 border border-gray-200 rounded max-h-64 overflow-y-auto">
                          {courseStudents.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No students enrolled.</div>
                          ) : courseStudents.map((s: any) => (
                            <label key={s.id} className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                              <input type="checkbox" className="mr-2"
                                checked={bankTargetStudents.has(s.id)}
                                onChange={e => {
                                  const next = new Set(bankTargetStudents);
                                  if (e.target.checked) next.add(s.id); else next.delete(s.id);
                                  setBankTargetStudents(next);
                                }} />
                              {s.firstName} {s.lastName} <span className="text-gray-400 ml-2">{s.email}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-sm text-[#2D3B45]">
                        <input type="checkbox" checked={newAssignPublished} onChange={e => setNewAssignPublished(e.target.checked)} className="rounded border-gray-300" />
                        <span>Published</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-[#E1E1E1]">
                      <button onClick={handleCreateAssignment} disabled={!newAssignTitle || creating || (newAssignFormat !== 'FILE' && builderQuestions.length === 0) ||
                        (bankTargetMode === 'BATCH' && bankTargetBatches.size === 0) ||
                        (bankTargetMode === 'STUDENT' && bankTargetStudents.size === 0)}
                        className="px-6 py-2 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                        {creating ? 'Creating...' : 'Create Assignment'}
                      </button>
                      <button onClick={() => resetCreateForm()} className="px-6 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

              ) : selectedAssignmentId ? (
                /* Assignment Detail View */
                <div>
                  <button onClick={() => { setSelectedAssignmentId(null); setAssignmentDetail(null); }} className="flex items-center text-[#008EE2] text-sm mb-6 hover:underline">
                    <ChevronLeft size={16} className="mr-1" /> Back to Assignments
                  </button>
                  {assignmentDetailLoading ? <LoadingSpinner /> : assignmentDetail ? (
                    <div>
                      {/* Assignment Header */}
                      <div className="border-b border-[#E1E1E1] pb-6 mb-6">
                        <div className="flex items-start justify-between">
                          <h2 className="text-[28px] font-medium text-[#2D3B45] mb-2">{assignmentDetail.title}</h2>
                          {(effectiveRole === 'TEACHER' || effectiveRole === 'ADMIN') && (
                            <button onClick={openTargetsModal}
                              className="px-3 py-1.5 border border-purple-600 text-purple-700 rounded text-sm font-medium hover:bg-purple-50 transition-colors">
                              Manage Targets
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-[16px] text-gray-500 flex-wrap">
                          <span className="font-bold text-[#2D3B45]">{assignmentDetail.points} pts</span>
                          {assignmentDetail.format && (
                            <span className={`px-2 py-0.5 text-[16px] font-bold rounded-full ${
                              assignmentDetail.format === 'FILE' ? 'bg-gray-200 text-gray-700' :
                              assignmentDetail.format === 'MCQ' ? 'bg-[#008EE2]/10 text-[#008EE2]' :
                              assignmentDetail.format === 'THEORY' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{assignmentDetail.format}</span>
                          )}
                          {assignmentDetail.dueDate && <span>Due: {new Date(assignmentDetail.dueDate).toLocaleString()}</span>}
                          {assignmentDetail.timeLimit && <span>{assignmentDetail.timeLimit} min</span>}
                          {!assignmentDetail.published && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[16px] font-bold rounded-full">UNPUBLISHED</span>}
                          {assignmentDetail.targets?.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[12px] font-bold rounded-full">
                              {assignmentDetail.targets.filter((t: any) => t.kind === 'BATCH').length > 0 && `${assignmentDetail.targets.filter((t: any) => t.kind === 'BATCH').length} batches`}
                              {assignmentDetail.targets.filter((t: any) => t.kind === 'BATCH').length > 0 && assignmentDetail.targets.filter((t: any) => t.kind === 'STUDENT').length > 0 && ' · '}
                              {assignmentDetail.targets.filter((t: any) => t.kind === 'STUDENT').length > 0 && `${assignmentDetail.targets.filter((t: any) => t.kind === 'STUDENT').length} students`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Manage Targets Modal */}
                      {showTargetsModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTargetsModal(false)}>
                          <div className="bg-white rounded-lg shadow-xl w-[700px] max-w-[95vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                              <h2 className="text-[16px] font-bold text-[#2D3B45]">Manage Targets — {assignmentDetail.title}</h2>
                              <button onClick={() => setShowTargetsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                            </div>
                            <div className="px-5 py-4 overflow-y-auto flex-1">
                              <div className="space-y-2 mb-4">
                                <label className="flex items-center text-sm">
                                  <input type="radio" name="editTargetMode" checked={editTargetMode === 'COURSE'} onChange={() => setEditTargetMode('COURSE')} className="mr-2" />
                                  All students in this course (course-wide)
                                </label>
                                <label className="flex items-center text-sm">
                                  <input type="radio" name="editTargetMode" checked={editTargetMode === 'BATCH'} onChange={() => setEditTargetMode('BATCH')} className="mr-2" />
                                  Specific batches
                                </label>
                                <label className="flex items-center text-sm">
                                  <input type="radio" name="editTargetMode" checked={editTargetMode === 'STUDENT'} onChange={() => setEditTargetMode('STUDENT')} className="mr-2" />
                                  Specific students
                                </label>
                              </div>
                              {editTargetMode === 'BATCH' && (
                                <div className="border border-gray-200 rounded max-h-64 overflow-y-auto">
                                  {courseBatches.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">No batches in this course.</div>
                                  ) : courseBatches.map((b: any) => (
                                    <label key={b.batchCode} className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                                      <input type="checkbox" className="mr-2"
                                        checked={editTargetBatches.has(b.batchCode)}
                                        onChange={e => {
                                          const next = new Set(editTargetBatches);
                                          if (e.target.checked) next.add(b.batchCode); else next.delete(b.batchCode);
                                          setEditTargetBatches(next);
                                        }} />
                                      {b.batchCode} <span className="text-gray-400 ml-2">({b.count} students)</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                              {editTargetMode === 'STUDENT' && (
                                <div className="border border-gray-200 rounded max-h-72 overflow-y-auto">
                                  {courseStudents.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-gray-500">No students enrolled.</div>
                                  ) : courseStudents.map((s: any) => (
                                    <label key={s.id} className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-sm cursor-pointer">
                                      <input type="checkbox" className="mr-2"
                                        checked={editTargetStudents.has(s.id)}
                                        onChange={e => {
                                          const next = new Set(editTargetStudents);
                                          if (e.target.checked) next.add(s.id); else next.delete(s.id);
                                          setEditTargetStudents(next);
                                        }} />
                                      {s.firstName} {s.lastName} <span className="text-gray-400 ml-2">{s.email}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end space-x-2 px-5 py-3 border-t border-gray-200">
                              <button onClick={() => setShowTargetsModal(false)} className="px-4 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">Cancel</button>
                              <button onClick={saveTargets} disabled={editTargetSaving ||
                                (editTargetMode === 'BATCH' && editTargetBatches.size === 0) ||
                                (editTargetMode === 'STUDENT' && editTargetStudents.size === 0)}
                                className="px-4 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                                {editTargetSaving ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description & Instructions */}
                      {assignmentDetail.description && (
                        <div className="mb-4">
                          <p className="text-[16px] text-[#2D3B45]">{assignmentDetail.description}</p>
                        </div>
                      )}
                      {assignmentDetail.instructions && (
                        <div className="bg-[#F5F5F5] border border-[#E1E1E1] rounded p-4 mb-6">
                          <h3 className="font-bold text-sm text-[#2D3B45] mb-2">Instructions</h3>
                          <p className="text-[16px] text-[#2D3B45] whitespace-pre-wrap">{assignmentDetail.instructions}</p>
                        </div>
                      )}

                      {/* Attachment PDF Viewer */}
                      {assignmentDetail.hasAttachment && (
                        <div className="mb-6">
                          <h3 className="font-bold text-sm text-[#2D3B45] mb-2">
                            Attachment: {assignmentDetail.attachmentName || 'Document'}
                          </h3>
                          <iframe
                            src={`/api/assignments/${assignmentDetail.id}/attachment?token=${getAccessToken()}`}
                            className="w-full h-[500px] border border-[#E1E1E1] rounded"
                            title="Assignment attachment"
                          />
                        </div>
                      )}

                      {/* Student Submission Section */}
                      {(effectiveRole === 'STUDENT') && (
                        <div className="border border-[#E1E1E1] rounded-sm overflow-hidden mt-6">
                          <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1] flex items-center justify-between">
                            <span className="font-bold text-[16px]">Your Submission</span>
                            {/* Quiz timer */}
                            {quizTimeLeft !== null && quizTimeLeft > 0 && (assignmentDetail.format !== 'FILE') && (
                              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-bold ${quizTimeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : quizTimeLeft < 300 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                <Clock size={14} />
                                <span>{Math.floor(quizTimeLeft / 60)}:{String(quizTimeLeft % 60).padStart(2, '0')}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            {(() => {
                              const mySubmission = assignmentDetail.submissions?.find((s: any) => s.studentId === user?.id);
                              const isQuizFormat = assignmentDetail.format && assignmentDetail.format !== 'FILE';

                              // If quiz format and already submitted/graded, show results
                              if (isQuizFormat && mySubmission && (mySubmission.status === 'GRADED' || mySubmission.status === 'SUBMITTED')) {
                                return (
                                  <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                      <span className={`px-3 py-1 text-[16px] font-bold rounded-full ${mySubmission.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{mySubmission.status}</span>
                                      {mySubmission.isLate && <span className="px-3 py-1 bg-red-100 text-red-600 text-[16px] font-bold rounded-full">LATE</span>}
                                    </div>
                                    {mySubmission.score !== null && (
                                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                                        <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Score</div>
                                        <div className="text-2xl font-bold text-green-700">{mySubmission.score} / {assignmentDetail.points}</div>
                                      </div>
                                    )}
                                    {mySubmission.feedback && (
                                      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                                        <h4 className="font-bold text-sm text-[#2D3B45] mb-1">Feedback</h4>
                                        <p className="text-[16px] text-[#2D3B45] whitespace-pre-wrap">{mySubmission.feedback}</p>
                                      </div>
                                    )}
                                    {/* Show answer results if showResults is enabled */}
                                    {assignmentDetail.showResults && assignmentQuestions.length > 0 && (
                                      <div className="space-y-4 mt-4">
                                        <h4 className="font-bold text-sm text-[#2D3B45]">Your Answers</h4>
                                        {assignmentQuestions.map((question: any, qIdx: number) => {
                                          const answer = question.answers?.find((a: any) => a.studentId === user?.id);
                                          return (
                                            <div key={question.id} className={`border rounded-lg p-4 ${
                                              question.type === 'MCQ'
                                                ? answer?.isCorrect ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'
                                                : 'border-gray-200'
                                            }`}>
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-[#2D3B45]">Q{qIdx + 1}. {question.text}</span>
                                                <div className="flex items-center space-x-2">
                                                  <span className={`px-2 py-0.5 text-[16px] font-bold rounded ${question.type === 'MCQ' ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{question.type}</span>
                                                  {answer?.pointsAwarded != null && (
                                                    <span className="text-sm font-bold">{answer.pointsAwarded}/{question.points}</span>
                                                  )}
                                                </div>
                                              </div>
                                              {question.type === 'MCQ' && question.options && (
                                                <div className="space-y-1 mt-2">
                                                  {question.options.map((opt: any) => {
                                                    const isSelected = answer?.selectedOptionId === opt.id;
                                                    const isCorrectOption = opt.isCorrect;
                                                    return (
                                                      <div key={opt.id} className={`px-3 py-2 rounded text-sm flex items-center space-x-2 ${
                                                        isCorrectOption ? 'bg-green-100 border border-green-300' :
                                                        isSelected && !isCorrectOption ? 'bg-red-100 border border-red-300' :
                                                        'bg-white border border-gray-200'
                                                      }`}>
                                                        {isSelected && <span className="font-bold">{isCorrectOption ? <CheckCircle size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />}</span>}
                                                        {!isSelected && isCorrectOption && <CheckCircle size={16} className="text-green-600" />}
                                                        {!isSelected && !isCorrectOption && <span className="w-4" />}
                                                        <span>{opt.text}</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                              {question.type === 'THEORY' && answer && (
                                                <div className="mt-2">
                                                  <div className="bg-white border border-gray-200 rounded p-3 text-sm text-[#2D3B45] whitespace-pre-wrap">{answer.textAnswer || '(no answer)'}</div>
                                                  {answer.feedback && (
                                                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                                                      <span className="font-bold text-[#2D3B45]">Feedback: </span>{answer.feedback}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                              {question.explanation && (
                                                <div className="mt-2 text-[16px] text-gray-500 italic">Explanation: {question.explanation}</div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // Quiz format - not yet submitted: show quiz interface
                              if (isQuizFormat && !mySubmission) {
                                return (
                                  <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                      <span className="px-3 py-1 bg-red-100 text-red-600 text-[16px] font-bold rounded-full">NOT STARTED</span>
                                    </div>
                                    {assignmentQuestions.length === 0 ? (
                                      <div className="text-center py-8 text-gray-400 text-sm">No questions available for this assignment.</div>
                                    ) : (
                                      <div className="space-y-6">
                                        {assignmentQuestions.map((question: any, qIdx: number) => (
                                          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center space-x-2">
                                                <span className="text-sm font-bold text-[#2D3B45]">Q{qIdx + 1}.</span>
                                                <span className={`px-2 py-0.5 text-[16px] font-bold rounded ${question.type === 'MCQ' ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{question.type}</span>
                                              </div>
                                              <span className="text-[16px] text-gray-500">{question.points} pts</span>
                                            </div>
                                            <p className="text-[16px] text-[#2D3B45] mb-3">{question.text}</p>

                                            {question.type === 'MCQ' && question.options && (
                                              <div className="space-y-2">
                                                {question.options.map((opt: any) => (
                                                  <label key={opt.id}
                                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                                                      quizAnswers[question.id]?.selectedOptionId === opt.id
                                                        ? 'border-[#008EE2] bg-blue-50'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}>
                                                    <input type="radio" name={`quiz-q-${question.id}`}
                                                      checked={quizAnswers[question.id]?.selectedOptionId === opt.id}
                                                      onChange={() => setQuizAnswers(prev => ({ ...prev, [question.id]: { selectedOptionId: opt.id } }))}
                                                      className="text-[#008EE2]" />
                                                    <span className="text-sm text-[#2D3B45]">{opt.text}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            )}

                                            {question.type === 'THEORY' && (
                                              <div>
                                                <textarea
                                                  value={quizAnswers[question.id]?.textAnswer || ''}
                                                  onChange={e => setQuizAnswers(prev => ({ ...prev, [question.id]: { textAnswer: e.target.value } }))}
                                                  rows={4}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                                  placeholder="Write your answer here..." />
                                                {question.wordLimit > 0 && (
                                                  <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[16px] text-gray-400">Word limit: {question.wordLimit}</span>
                                                    <span className={`text-[16px] ${
                                                      (quizAnswers[question.id]?.textAnswer || '').split(/\s+/).filter(Boolean).length > question.wordLimit
                                                        ? 'text-red-500 font-bold' : 'text-gray-400'
                                                    }`}>
                                                      {(quizAnswers[question.id]?.textAnswer || '').split(/\s+/).filter(Boolean).length} words
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}

                                        <div className="pt-4 border-t border-[#E1E1E1]">
                                          <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-500">
                                              Answered: {Object.keys(quizAnswers).length} / {assignmentQuestions.length}
                                            </span>
                                          </div>
                                          <button onClick={handleQuizSubmit} disabled={quizSubmitting || Object.keys(quizAnswers).length === 0}
                                            className="px-8 py-3 bg-[#008EE2] text-white rounded text-sm font-bold hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                                            {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // FILE format: existing behavior
                              if (mySubmission && mySubmission.status === 'GRADED') {
                                return (
                                  <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                      <span className="px-3 py-1 bg-green-100 text-green-700 text-[16px] font-bold rounded-full">GRADED</span>
                                      {mySubmission.isLate && <span className="px-3 py-1 bg-red-100 text-red-600 text-[16px] font-bold rounded-full">LATE</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="bg-green-50 rounded-lg p-4">
                                        <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Score</div>
                                        <div className="text-2xl font-bold text-green-700">{mySubmission.score} / {assignmentDetail.points}</div>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Submitted</div>
                                        <div className="text-sm font-medium text-[#2D3B45]">{mySubmission.submittedAt ? new Date(mySubmission.submittedAt).toLocaleString() : 'N/A'}</div>
                                        {mySubmission.fileName && <div className="text-[16px] text-gray-500 mt-1">{mySubmission.fileName}</div>}
                                      </div>
                                    </div>
                                    {mySubmission.feedback && (
                                      <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                        <h4 className="font-bold text-sm text-[#2D3B45] mb-1">Feedback</h4>
                                        <p className="text-[16px] text-[#2D3B45] whitespace-pre-wrap">{mySubmission.feedback}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              if (mySubmission && mySubmission.status === 'SUBMITTED') {
                                return (
                                  <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[16px] font-bold rounded-full">SUBMITTED</span>
                                      {mySubmission.isLate && <span className="px-3 py-1 bg-red-100 text-red-600 text-[16px] font-bold rounded-full">LATE</span>}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                      <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">File</div>
                                      <div className="text-sm font-medium text-[#2D3B45]">{mySubmission.fileName || 'Submitted file'}</div>
                                      <div className="text-[16px] text-gray-500 mt-1">{mySubmission.submittedAt ? new Date(mySubmission.submittedAt).toLocaleString() : ''}</div>
                                    </div>
                                    {mySubmission.comment && (
                                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Your Comment</div>
                                        <p className="text-[16px] text-[#2D3B45]">{mySubmission.comment}</p>
                                      </div>
                                    )}
                                    <p className="text-sm text-gray-500">Your submission is being reviewed. You can resubmit below.</p>
                                    <div className="mt-4 space-y-3">
                                      <div>
                                        <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                                          <Upload size={16} />
                                          <span>{submissionFile ? submissionFile.name : 'Choose file to resubmit...'}</span>
                                          <input type="file" accept={assignmentDetail.allowedFormats || undefined} className="hidden"
                                            onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
                                        </label>
                                      </div>
                                      <textarea value={submissionComment} onChange={e => setSubmissionComment(e.target.value)} rows={2}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                        placeholder="Add a comment (optional)" />
                                      <button onClick={handleSubmitWork} disabled={!submissionFile || submitting}
                                        className="px-6 py-2 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                                        {submitting ? 'Submitting...' : 'Resubmit'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                              // MISSING - no submission yet (FILE format)
                              return (
                                <div>
                                  <div className="flex items-center space-x-3 mb-4">
                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[16px] font-bold rounded-full">MISSING</span>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="flex items-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 hover:border-[#008EE2] transition-colors w-full justify-center">
                                        <Upload size={20} className="text-gray-400" />
                                        <span className="text-gray-500">{submissionFile ? submissionFile.name : 'Click to upload your file'}</span>
                                        <input type="file" accept={assignmentDetail.allowedFormats || undefined} className="hidden"
                                          onChange={e => setSubmissionFile(e.target.files?.[0] || null)} />
                                      </label>
                                      {assignmentDetail.allowedFormats && (
                                        <p className="text-[16px] text-gray-400 mt-1">Accepted formats: {assignmentDetail.allowedFormats}</p>
                                      )}
                                    </div>
                                    <textarea value={submissionComment} onChange={e => setSubmissionComment(e.target.value)} rows={3}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                      placeholder="Add a comment (optional)" />
                                    <button onClick={handleSubmitWork} disabled={!submissionFile || submitting}
                                      className="px-6 py-2 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Teacher Grading Interface */}
                      {(effectiveRole === 'TEACHER' || effectiveRole === 'ADMIN') && (
                        <div className="border border-[#E1E1E1] rounded-sm overflow-hidden mt-6">
                          <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1] flex items-center justify-between">
                            <span className="font-bold text-[16px]">Submissions ({assignmentDetail.submissions?.length || 0})</span>
                          </div>

                          {/* Teacher: Show questions overview for quiz formats */}
                          {assignmentDetail.format && assignmentDetail.format !== 'FILE' && assignmentQuestions.length > 0 && (
                            <div className="bg-blue-50/50 border-b border-[#E1E1E1] px-4 py-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-bold text-[#2D3B45]">Questions ({assignmentQuestions.length})</span>
                                <span className={`px-2 py-0.5 text-[16px] font-bold rounded ${
                                  assignmentDetail.format === 'MCQ' ? 'bg-[#008EE2] text-white' :
                                  assignmentDetail.format === 'THEORY' ? 'bg-purple-600 text-white' :
                                  'bg-amber-500 text-white'
                                }`}>{assignmentDetail.format}</span>
                              </div>
                              <div className="text-[16px] text-gray-500 space-x-4">
                                <span>MCQ: {assignmentQuestions.filter((q: any) => q.type === 'MCQ').length}</span>
                                <span>Theory: {assignmentQuestions.filter((q: any) => q.type === 'THEORY').length}</span>
                                <span>Total Points: {assignmentQuestions.reduce((s: number, q: any) => s + q.points, 0)}</span>
                                {assignmentDetail.timeLimit && <span>Time: {assignmentDetail.timeLimit} min</span>}
                              </div>
                            </div>
                          )}

                          <div className="bg-white">
                            {!assignmentDetail.submissions?.length ? (
                              <div className="p-8 text-center text-gray-400 text-sm">No submissions yet.</div>
                            ) : (
                              <table className="w-full text-left text-[16px]">
                                <thead>
                                  <tr className="bg-gray-50 text-[#2D3B45] font-bold text-[16px]">
                                    <th className="py-3 px-4">Student</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Submitted</th>
                                    <th className="py-3 px-4">Score</th>
                                    <th className="py-3 px-4 w-[260px]">Grade</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E1E1E1]">
                                  {assignmentDetail.submissions.map((sub: any) => {
                                    const editing = gradingSubmissionId === sub.id;
                                    return (
                                    <React.Fragment key={sub.id}>
                                      <tr className="hover:bg-gray-50 align-top">
                                        <td className="py-3 px-4">
                                          <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[16px] font-medium text-gray-600 bg-gray-50">
                                              {sub.student?.firstName?.[0]}{sub.student?.lastName?.[0]}
                                            </div>
                                            <span className="font-medium">{sub.student?.firstName} {sub.student?.lastName}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className={`px-2 py-0.5 text-[16px] font-bold rounded-full ${
                                            sub.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                                            sub.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-600'
                                          }`}>{sub.status}</span>
                                        </td>
                                        <td className="py-3 px-4 text-[16px] text-gray-500">
                                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="py-3 px-4 font-bold">
                                          {sub.score !== null ? `${sub.score} / ${assignmentDetail.points}` : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                          {editing ? (
                                            <div className="space-y-1">
                                              <div className="flex items-center space-x-1">
                                                <input
                                                  type="number" min={0} max={assignmentDetail.points || 100}
                                                  value={gradeScore}
                                                  onChange={e => setGradeScore(parseFloat(e.target.value) || 0)}
                                                  placeholder={`/${assignmentDetail.points}`}
                                                  className="w-20 border border-gray-300 rounded px-2 py-1 text-[14px]" autoFocus
                                                />
                                                <span className="text-gray-400 text-[14px]">/{assignmentDetail.points}</span>
                                              </div>
                                              <textarea
                                                value={gradeFeedback}
                                                onChange={e => setGradeFeedback(e.target.value)}
                                                placeholder="Feedback (optional)"
                                                rows={2}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-[12px]"
                                              />
                                              <div className="flex items-center space-x-2">
                                                <button disabled={savingGrade} onClick={handleSaveGrade}
                                                  className="px-3 py-1 bg-[#008EE2] text-white text-[12px] rounded font-medium disabled:opacity-50">
                                                  {savingGrade ? 'Saving…' : 'Save'}
                                                </button>
                                                <button onClick={() => { setGradingSubmissionId(null); setGradeScore(0); setGradeFeedback(''); }}
                                                  className="px-3 py-1 text-gray-500 text-[12px]">Cancel</button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setGradingSubmissionId(sub.id);
                                                setGradeScore(typeof sub.score === 'number' ? sub.score : 0);
                                                setGradeFeedback(sub.feedback || '');
                                              }}
                                              className="text-[#008EE2] text-[14px] font-medium hover:underline">
                                              {sub.status === 'GRADED' ? 'Edit grade' : 'Grade'}
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <div className="text-center text-gray-400 py-12">Assignment not found.</div>}
                </div>

              ) : (() => {
                /* Assignment List — for student/auditor views, restrict to canonical
                 * "<Module name> - <Final|Participation|Assignment|Quiz>" assignments
                 * to match the Module Grades table and hide imported orphan/test rows. */
                const allowedSuffixes = course.code === 'AC'
                  ? new Set(['Final', 'Participation', 'Assignment', 'Quiz'])
                  : course.code === 'CSW'
                  ? new Set(['Final', 'Participation', 'Assignment'])
                  : course.code === 'IBA'
                  ? new Set(['Final', 'Participation'])
                  : null;
                const isPrivilegedViewer = effectiveRole === 'TEACHER' || effectiveRole === 'ADMIN';
                const visibleAssignments = (allowedSuffixes && !isPrivilegedViewer)
                  ? (course.assignments || []).filter((a: any) => {
                      const moduleName = course.modules?.find((m: any) => a.title.startsWith(m.name + ' - '))?.name;
                      if (!moduleName) return false;
                      const suffix = a.title.slice((moduleName + ' - ').length).trim();
                      return allowedSuffixes.has(suffix);
                    })
                  : (course.assignments || []);
                return (
                <div className="border border-[#E1E1E1] rounded-sm overflow-hidden">
                  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1] flex items-center justify-between">
                    <span className="font-bold text-[16px]">Assignments ({visibleAssignments.length})</span>
                    {(effectiveRole === 'TEACHER' || effectiveRole === 'ADMIN') && (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openBankFlow()}
                          className="flex items-center space-x-1 bg-purple-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-purple-700 transition-colors">
                          <Plus size={16} /> <span>From Question Bank</span>
                        </button>
                        <button onClick={openCreateAssignment}
                          className="flex items-center space-x-1 bg-[#008EE2] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#0074BF] transition-colors">
                          <Plus size={16} /> <span>New Assignment</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-white divide-y divide-[#E1E1E1]">
                    {!visibleAssignments.length ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No assignments yet.</div>
                    ) : visibleAssignments.map((a: any) => {
                      const mySub = a.submissions?.find((s: any) => s.status === 'GRADED' && s.score !== null && s.score !== undefined)
                        || a.submissions?.find((s: any) => s.status === 'GRADED')
                        || a.submissions?.[0];
                      const showGrade = (effectiveRole === 'STUDENT') && mySub && mySub.score !== null && mySub.score !== undefined;
                      const pct = showGrade && a.points > 0 ? (mySub.score / a.points) * 100 : 0;
                      const pctColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-[#008EE2]' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
                      return (
                        <div key={a.id} className="px-4 py-4 flex items-center hover:bg-gray-50 group cursor-pointer"
                          onClick={() => loadAssignmentDetail(a.id)}>
                          <div className="mr-4 text-gray-400 group-hover:text-[#008EE2]"><FileText size={20} /></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-[16px] text-[#2D3B45] group-hover:underline">{a.title}</h4>
                              {a.format && a.format !== 'FILE' && (
                                <span className={`px-1.5 py-0.5 text-[16px] font-bold rounded ${
                                  a.format === 'MCQ' ? 'bg-[#008EE2]/10 text-[#008EE2]' :
                                  a.format === 'THEORY' ? 'bg-purple-100 text-purple-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>{a.format}</span>
                              )}
                            </div>
                            <p className="text-[16px] text-gray-500 mt-0.5">
                              {a.points} pts {a.dueDate && `• Due ${new Date(a.dueDate).toLocaleDateString()}`}
                              {a.timeLimit ? ` • ${a.timeLimit} min` : ''}
                            </p>
                          </div>
                          {showGrade ? (
                            <div className="mr-3 text-right">
                              <div className={`text-[18px] font-bold ${pctColor}`}>{mySub.score}/{a.points}</div>
                              <div className="text-[12px] text-gray-500">{pct.toFixed(2)}%</div>
                            </div>
                          ) : effectiveRole === 'STUDENT' && mySub?.status === 'MISSING' ? (
                            <div className="mr-3 text-right">
                              <div className="text-[13px] text-gray-400 italic">Missing</div>
                            </div>
                          ) : null}
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-[#008EE2]" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })()}
            </div>
          ) : activeSection === 'Question Banks' ? (
            <div className="max-w-5xl">
              {previewBankId ? (
                <div>
                  <button onClick={() => { setPreviewBankId(null); setPreviewBankQuestions([]); }} className="flex items-center text-[#008EE2] text-sm mb-4 hover:underline">
                    <ChevronLeft size={16} className="mr-1" /> Back to Banks
                  </button>
                  {(() => {
                    const bank = bankList.find(b => b.id === previewBankId);
                    return (
                      <>
                        <h2 className="text-[24px] font-medium text-[#2D3B45]">{bank?.title}</h2>
                        <div className="text-sm text-gray-500 mb-4">
                          {previewBankQuestions.length} questions ·
                          {' '}{previewBankQuestions.filter(q => q.type === 'MCQ').length} MCQ ·
                          {' '}{previewBankQuestions.filter(q => q.type === 'THEORY').length} Theory ·
                          {' '}Total {previewBankQuestions.reduce((s, q) => s + (q.points || 0), 0)} pts
                        </div>
                        <div className="mb-6">
                          <button onClick={() => { setPreviewBankId(null); openBankFlow(bank?.id); }}
                            className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors">
                            Use this bank → Create Assignment
                          </button>
                        </div>
                        <div className="border border-[#E1E1E1] rounded divide-y divide-[#E1E1E1] bg-white">
                          {previewBankQuestions.map((q: any, i: number) => (
                            <div key={q.id} className="p-4">
                              <div className="flex items-start">
                                <span className="text-gray-400 mr-2 text-sm font-medium">{i + 1}.</span>
                                <div className="flex-1">
                                  <div className="text-sm text-[#2D3B45]">{q.text}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    <span className={`px-2 py-0.5 rounded ${q.type === 'MCQ' ? 'bg-[#008EE2]/10 text-[#008EE2]' : 'bg-purple-100 text-purple-700'}`}>{q.type}</span>
                                    <span className="ml-2">{q.points} pts</span>
                                  </div>
                                  {q.type === 'MCQ' && q.options?.length > 0 && (
                                    <ul className="mt-2 ml-2 space-y-0.5">
                                      {q.options.map((o: any) => (
                                        <li key={o.id} className={`text-sm ${o.isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                          {o.isCorrect ? '✓ ' : '○ '}{o.text}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <>
                  <h1 className="text-[28px] font-medium text-[#2D3B45] mb-2">Question Banks</h1>
                  <p className="text-sm text-gray-500 mb-6">Existing question pools for {course.code}. Click a bank to preview, or use it to create a new assignment for any batch or student.</p>
                  {bankList.length === 0 ? (
                    <div className="border border-[#E1E1E1] rounded p-8 text-center text-gray-400 text-sm">No question banks found in this course.</div>
                  ) : (
                    <div className="border border-[#E1E1E1] rounded divide-y divide-[#E1E1E1] bg-white">
                      {bankList.map((b: any) => (
                        <div key={b.id} className="px-4 py-3 flex items-center hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-medium text-[#2D3B45] truncate">{b.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {b._count.questions} questions · {b.points} pts ·
                              <span className={`ml-2 px-2 py-0.5 rounded ${b.format === 'FILE' ? 'bg-gray-100 text-gray-600' : b.format === 'MCQ' ? 'bg-[#008EE2]/10 text-[#008EE2]' : b.format === 'THEORY' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{b.format}</span>
                            </div>
                          </div>
                          <button onClick={() => openBankPreview(b.id)} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 mr-2">Preview</button>
                          <button onClick={() => openBankFlow(b.id)} className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors">Use</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeSection === 'Grades' ? (
            (() => {
              // CSW: static syllabus reference table (display-only).
              // CSW: static syllabus reference only for non-student viewers.
              // Students get the dynamic Module Grades view (same as IBA/AC).
              if (course.code === 'CSW' && effectiveRole === 'ADMIN') {
                const CSW_TABLE: { module: string; weight: number; items: { name: string; pts: number }[] }[] = [
                  { module: 'Essential Skills',                                weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Microsoft Windows',                               weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Inclusive Communication Skills',                  weight: 7.41, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Introduction to Community Service Work',          weight: 5.56, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Employment Achievement Strategies',               weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Basic Business Communications',                   weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Harm Reduction and Crisis Intervention',          weight: 5.56, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Introduction to Sociology',                       weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Mental Health & Addictions',                      weight: 9.26, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Populations at Risk',                             weight: 7.41, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Support Resources & Community Capacity Building', weight: 5.56, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Law for Support Workers',                         weight: 5.56, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Self Care and Team Building',                     weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Basic Counselling Techniques',                    weight: 5.56, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Solution-Focused Intervention Techniques',        weight: 3.70, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Family Development, Functions, and Social Issues',weight: 7.41, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Introduction to Psychology',                      weight: 5.56, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                  { module: 'Professional Documentation & Case Management',    weight: 1.85, items: [{ name: 'Final', pts: 90 }, { name: 'Participation', pts: 10 }] },
                  { module: 'Behaviour Modification',                          weight: 7.41, items: [{ name: 'Final', pts: 50 }, { name: 'Participation', pts: 10 }, { name: 'Assignment', pts: 40 }] },
                ];
                const totalWeight = CSW_TABLE.reduce((s, m) => s + m.weight, 0);
                const totalAssessments = CSW_TABLE.reduce((s, m) => s + m.items.length, 0);
                return (
                  <div className="max-w-5xl">
                    <h2 className="text-[28px] font-medium text-[#2D3B45] mb-2">Grading Structure</h2>
                    <p className="text-sm text-gray-500 mb-6">{CSW_TABLE.length} modules · {totalAssessments} assessments · Total weight {totalWeight.toFixed(2)}%. One group per module. Copy the weight from the template's Module % column.</p>
                    <table className="w-full border-collapse border border-[#E1E1E1] text-[14px] bg-white">
                      <thead>
                        <tr className="bg-[#2D3B45] text-white">
                          <th className="border border-[#E1E1E1] px-3 py-2 text-left">Assignment Group (Module)</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-24">Weight</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-20"># Items</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-left">Assignments Inside (pts)</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#2D3B45]">
                        {CSW_TABLE.map((row) => (
                          <tr key={row.module} className="hover:bg-gray-50 align-top">
                            <td className="border border-[#E1E1E1] px-3 py-2">{row.module}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center font-medium">{row.weight.toFixed(2)}%</td>
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center">{row.items.length}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2">
                              {row.items.map((it, idx) => (
                                <span key={idx} className="inline-block mr-2">
                                  {it.name} ({it.pts} pts){idx < row.items.length - 1 ? ',' : ''}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#F5F5F5] font-bold">
                          <td className="border border-[#E1E1E1] px-3 py-2 text-right">TOTAL</td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-center">{totalWeight.toFixed(2)}%</td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-center">{totalAssessments}</td>
                          <td className="border border-[#E1E1E1] px-3 py-2"></td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-[12px] text-gray-500 italic mt-3">Weight: When you create this Assignment Group, set its weight to this number.</p>
                  </div>
                );
              }

              // AC: static syllabus reference table (display-only) for non-student
              // viewers. Students fall through to the dynamic Module Grades view
              // (same as IBA) so they see their actual per-assignment scores.
              if (course.code === 'AC' && effectiveRole === 'ADMIN') {
                const AC_TABLE: { module: string; weight: number; hours: number; items: { name: string; pts: number; pct: number }[] }[] = [
                  { module: 'Microsoft Windows',                          weight: 1.96,  hours: 20,  items: [{ name: 'Final', pts: 90, pct: 90 }, { name: 'Participation', pts: 10, pct: 10 }] },
                  { module: 'Microsoft Word 2',                           weight: 1.96,  hours: 20,  items: [{ name: 'Final', pts: 90, pct: 90 }, { name: 'Participation', pts: 10, pct: 10 }] },
                  { module: 'Accounting Fundamentals and Book Keeping',   weight: 23.53, hours: 240, items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 30, pct: 30 }, { name: 'Quiz', pts: 10, pct: 10 }] },
                  { module: 'Computerized Accounting with Quickbooks',    weight: 11.76, hours: 120, items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 30, pct: 30 }, { name: 'Quiz', pts: 10, pct: 10 }] },
                  { module: 'Computerized Accounting with Sage50/Sage300',weight: 21.57, hours: 220, items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 30, pct: 30 }, { name: 'Quiz', pts: 10, pct: 10 }] },
                  { module: 'Payroll Fundamentals 1',                     weight: 4.90,  hours: 50,  items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 40, pct: 40 }] },
                  { module: 'Payroll Fundamental 2',                      weight: 4.90,  hours: 50,  items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 40, pct: 40 }] },
                  { module: 'Canadian Income Tax',                        weight: 7.84,  hours: 80,  items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 30, pct: 30 }, { name: 'Quiz', pts: 10, pct: 10 }] },
                  { module: 'Job Search',                                 weight: 1.96,  hours: 20,  items: [{ name: 'Final', pts: 90, pct: 90 }, { name: 'Participation', pts: 10, pct: 10 }] },
                  { module: 'Microsoft Excel 1 and Excel 2',              weight: 5.88,  hours: 60,  items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 40, pct: 40 }] },
                  { module: 'Microsoft Powerpoint',                       weight: 1.96,  hours: 20,  items: [{ name: 'Final', pts: 90, pct: 90 }, { name: 'Participation', pts: 10, pct: 10 }] },
                  { module: 'Microsoft Outlook',                          weight: 1.96,  hours: 20,  items: [{ name: 'Final', pts: 90, pct: 90 }, { name: 'Participation', pts: 10, pct: 10 }] },
                  { module: 'Office Procedures',                          weight: 9.80,  hours: 100, items: [{ name: 'Final', pts: 50, pct: 50 }, { name: 'Participation', pts: 10, pct: 10 }, { name: 'Assignment', pts: 40, pct: 40 }] },
                ];
                const totalWeight = AC_TABLE.reduce((s, m) => s + m.weight, 0);
                const totalAssessments = AC_TABLE.reduce((s, m) => s + m.items.length, 0);
                return (
                  <div className="max-w-5xl">
                    <h2 className="text-[28px] font-medium text-[#2D3B45] mb-2">Grading Structure</h2>
                    <p className="text-sm text-gray-500 mb-6">{AC_TABLE.length} modules · {totalAssessments} assessments · Total weight {totalWeight.toFixed(2)}%</p>
                    <table className="w-full border-collapse border border-[#E1E1E1] text-[14px] bg-white">
                      <thead>
                        <tr className="bg-[#2D3B45] text-white">
                          <th className="border border-[#E1E1E1] px-3 py-2 text-left">Assignment Group (Module)</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-24">Weight</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-20"># Items</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-left">Assignments Inside (pts)</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#2D3B45]">
                        {AC_TABLE.map((row) => (
                          <tr key={row.module} className="hover:bg-gray-50 align-top">
                            <td className="border border-[#E1E1E1] px-3 py-2">{row.module}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center font-medium">{row.weight.toFixed(2)}%</td>
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center">{row.items.length}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2">
                              {row.items.map((it, idx) => (
                                <span key={idx} className="inline-block mr-2">
                                  {it.name} ({it.pts} pts){idx < row.items.length - 1 ? ',' : ''}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#F5F5F5] font-bold">
                          <td className="border border-[#E1E1E1] px-3 py-2 text-right">TOTAL</td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-center">{totalWeight.toFixed(2)}%</td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-center">{totalAssessments}</td>
                          <td className="border border-[#E1E1E1] px-3 py-2"></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Per-module detail tables */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-12 mb-6">Module Details</h2>
                    {AC_TABLE.map((row, i) => {
                      const total = row.items.reduce((s, it) => s + it.pts, 0);
                      return (
                        <div key={row.module} className="mb-8 border border-[#E1E1E1] rounded bg-white">
                          <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1]">
                            <div className="text-[16px] font-bold text-[#2D3B45]">Module {i + 1}: {row.module}</div>
                            <div className="text-[12px] text-gray-600 mt-1">
                              Group Weight: {row.weight.toFixed(2)}%  |  Hours: {row.hours}  |  Points add up to: 100
                            </div>
                          </div>
                          <table className="w-full text-[13px]">
                            <thead className="bg-gray-50 text-gray-600">
                              <tr>
                                <th className="text-left px-4 py-2 font-medium">Assignment Name in Canvas</th>
                                <th className="text-center px-4 py-2 font-medium w-20">Points</th>
                                <th className="text-center px-4 py-2 font-medium w-16">Qty</th>
                                <th className="text-center px-4 py-2 font-medium w-24">Template %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {row.items.map((it, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-2 text-[#2D3B45]">{row.module} - {it.name}</td>
                                  <td className="px-4 py-2 text-center font-medium">{it.pts} pts</td>
                                  <td className="px-4 py-2 text-center">1</td>
                                  <td className="px-4 py-2 text-center text-gray-600">{it.pct}%</td>
                                </tr>
                              ))}
                              <tr className="bg-[#F5F5F5] font-bold">
                                <td className="px-4 py-2">Total</td>
                                <td className="px-4 py-2 text-center">{total} pts</td>
                                <td className="px-4 py-2"></td>
                                <td className="px-4 py-2 text-center">100%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}

                    {/* Worked example */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-12 mb-3">Example: How Grading Works</h2>
                    <div className="border border-[#E1E1E1] rounded bg-white mb-6">
                      <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1]">
                        <div className="text-[15px] font-bold text-[#2D3B45]">Accounting Fundamentals and Book Keeping (23.53% of course)</div>
                        <div className="text-[12px] text-gray-600 mt-1">This module has 4 items: Final (50) + Participation (10) + Assignment (30) + Quiz (10)</div>
                      </div>
                      <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium">Assessment</th><th className="text-center px-4 py-2 font-medium">Max Pts</th><th className="text-center px-4 py-2 font-medium">Score</th><th className="text-center px-4 py-2 font-medium">%</th><th className="text-left px-4 py-2 font-medium"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-4 py-2">Acct Fundamentals - Final</td><td className="text-center px-4 py-2">50</td><td className="text-center px-4 py-2">40 / 50</td><td className="text-center px-4 py-2">80%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Acct Fundamentals - Participation</td><td className="text-center px-4 py-2">10</td><td className="text-center px-4 py-2">9 / 10</td><td className="text-center px-4 py-2">90%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Acct Fundamentals - Assignment</td><td className="text-center px-4 py-2">30</td><td className="text-center px-4 py-2">24 / 30</td><td className="text-center px-4 py-2">80%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Acct Fundamentals - Quiz</td><td className="text-center px-4 py-2">10</td><td className="text-center px-4 py-2">8 / 10</td><td className="text-center px-4 py-2">80%</td><td className="px-4 py-2"></td></tr>
                          <tr className="bg-[#F5F5F5] font-bold"><td className="px-4 py-2">Module Total</td><td className="text-center px-4 py-2">100</td><td className="text-center px-4 py-2">81 / 100</td><td className="text-center px-4 py-2">81%</td><td className="px-4 py-2 text-gray-600">81% × 23.53% = 19.06%</td></tr>
                        </tbody>
                      </table>
                      <div className="px-4 py-2 text-[12px] text-gray-600 border-t border-gray-100">Teacher enters: 40, 9, 24, 8. The system adds them (81/100), then applies the 23.53% module weight.</div>
                    </div>
                    <p className="text-[13px] text-gray-700 mb-8">The student's overall course grade = sum of contributions from all 13 modules.</p>

                    {/* Quick Reference: Module Patterns */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-8 mb-3">Quick Reference: Module Patterns</h2>

                    <div className="mb-6">
                      <div className="text-[14px] font-bold text-[#2D3B45] mb-2">Pattern 1: Final 90 + Participation 10 (5 modules)</div>
                      <table className="w-full text-[13px] border border-[#E1E1E1] bg-white">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium">Module</th><th className="text-center px-4 py-2 font-medium w-24">Weight</th><th className="text-left px-4 py-2 font-medium">Items</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {['Microsoft Windows','Microsoft Word 2','Job Search','Microsoft Powerpoint','Microsoft Outlook'].map(m => (
                            <tr key={m}><td className="px-4 py-2">{m}</td><td className="px-4 py-2 text-center">1.96%</td><td className="px-4 py-2 text-gray-700">Final (90) + Participation (10)</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-6">
                      <div className="text-[14px] font-bold text-[#2D3B45] mb-2">Pattern 2: Final 50 + Participation 10 + Assignment 40 (4 modules)</div>
                      <table className="w-full text-[13px] border border-[#E1E1E1] bg-white">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium">Module</th><th className="text-center px-4 py-2 font-medium w-24">Weight</th><th className="text-left px-4 py-2 font-medium">Items</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            ['Payroll Fundamentals 1','4.90%'],
                            ['Payroll Fundamental 2','4.90%'],
                            ['Microsoft Excel 1 and Excel 2','5.88%'],
                            ['Office Procedures','9.80%'],
                          ].map(([m,w]) => (
                            <tr key={m}><td className="px-4 py-2">{m}</td><td className="px-4 py-2 text-center">{w}</td><td className="px-4 py-2 text-gray-700">Final (50) + Participation (10) + Assignment (40)</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-6">
                      <div className="text-[14px] font-bold text-[#2D3B45] mb-2">Pattern 3: Final 50 + Participation 10 + Assignment 30 + Quiz 10 (4 modules)</div>
                      <table className="w-full text-[13px] border border-[#E1E1E1] bg-white">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium">Module</th><th className="text-center px-4 py-2 font-medium w-24">Weight</th><th className="text-left px-4 py-2 font-medium">Items</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            ['Accounting Fundamentals and Book Keeping','23.53%'],
                            ['Computerized Accounting with Quickbooks','11.76%'],
                            ['Computerized Accounting with Sage50/Sage300','21.57%'],
                            ['Canadian Income Tax','7.84%'],
                          ].map(([m,w]) => (
                            <tr key={m}><td className="px-4 py-2">{m}</td><td className="px-4 py-2 text-center">{w}</td><td className="px-4 py-2 text-gray-700">Final (50) + Particip (10) + Assign (30) + Quiz (10)</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Final verification checklist */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-8 mb-3">Final Verification Checklist</h2>
                    <p className="text-sm text-gray-500 mb-4">After setup, verify all of the following against the original course template:</p>
                    <div className="border border-[#E1E1E1] rounded bg-white mb-6">
                      <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium w-1/3">Check</th><th className="text-left px-4 py-2 font-medium">How to Verify</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            ['Weighted grades enabled', 'Verify in your environment that weighted assignment groups are active'],
                            ['13 Assignment Groups exist', 'One per module, named exactly as shown'],
                            ['Weights match template', 'Each group weight = Module % from the template spreadsheet'],
                            ['Weights add to 100%', 'All module weights combined = 100%'],
                            ['Points add to 100 per group', "Every module's assignments total exactly 100 pts"],
                            ['Pattern 1 modules correct', '5 modules with Final (90) + Participation (10)'],
                            ['Pattern 2 modules correct', '4 modules with Final (50) + Participation (10) + Assignment (40)'],
                            ['Pattern 3 modules correct', '4 modules with Final (50) + Participation (10) + Assignment (30) + Quiz (10)'],
                            ['No extra assignments', "No items exist that aren't in the template"],
                            ['No orphaned assignments', 'Every assignment is inside its correct module group'],
                            ['Cross-reference with template', 'Open the original template side-by-side and verify every row'],
                            ['Test with sample grades', 'Enter sample scores and verify the final grade calculation'],
                          ].map(([check, how], idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-[#2D3B45] font-medium">{check}</td>
                              <td className="px-4 py-2 text-gray-700">{how}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // PSW: render a fixed reference table (display-only, not linked
              // to assignments / submissions). Used only for the static view
              // of weights and assessment items per the program syllabus.
              if (course.code === 'PSW' && effectiveRole === 'ADMIN') {
                const PSW_TABLE: { module: string; weight: number; hours: number; items: { name: string; pts: number; qty: number; note: string }[] }[] = [
                  { module: 'PSW Foundations', weight: 7.86, hours: 55, items: [
                    { name: 'PSW Foundations - Theory', pts: 60, qty: 3, note: '60% of module' },
                    { name: 'PSW Foundations - Assignment', pts: 40, qty: 1, note: '40% of module' },
                  ]},
                  { module: 'Safety and Mobility', weight: 5.71, hours: 40, items: [
                    { name: 'Safety and Mobility - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Safety and Mobility - Practical', pts: 10, qty: 1, note: '10% of module' },
                    { name: 'Safety and Mobility - Assignment', pts: 30, qty: 1, note: '30% of module' },
                  ]},
                  { module: 'Body Systems', weight: 5.71, hours: 40, items: [
                    { name: 'Body Systems - Theory 1', pts: 50, qty: 1, note: '100% split into 2 = 50 pts each' },
                    { name: 'Body Systems - Theory 2', pts: 50, qty: 1, note: '100% split into 2 = 50 pts each' },
                  ]},
                  { module: 'Assisting with Personal Hygiene', weight: 4.29, hours: 30, items: [
                    { name: 'Assisting with Personal Hygiene - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Assisting with Personal Hygiene - Practical', pts: 40, qty: 1, note: '40% of module' },
                  ]},
                  { module: 'Abuse and Neglect', weight: 2.14, hours: 15, items: [
                    { name: 'Abuse and Neglect - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Abuse and Neglect - Assignment', pts: 40, qty: 1, note: '40% of module' },
                  ]},
                  { module: 'Household Management, Nutrition and Hydration', weight: 3.57, hours: 25, items: [
                    { name: 'Household Management, Nutrition and Hydration - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Household Management, Nutrition and Hydration - Assignment 1', pts: 20, qty: 1, note: '40% split into 2 = 20 pts each' },
                    { name: 'Household Management, Nutrition and Hydration - Assignment 2', pts: 20, qty: 1, note: '40% split into 2 = 20 pts each' },
                  ]},
                  { module: 'Care Planning/Restorative/Documentation/Working in the Community', weight: 4.29, hours: 30, items: [
                    { name: 'Care Planning/Restorative/Documentation/Working in the Community - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Care Planning/Restorative/Documentation/Working in the Community - Assignment 1', pts: 20, qty: 1, note: '40% split into 2 = 20 pts each' },
                    { name: 'Care Planning/Restorative/Documentation/Working in the Community - Assignment 2', pts: 20, qty: 1, note: '40% split into 2 = 20 pts each' },
                  ]},
                  { module: 'Assisting the Family, Growth and Development', weight: 3.57, hours: 25, items: [
                    { name: 'Assisting the Family, Growth and Development - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Assisting the Family, Growth and Development - Assignment', pts: 40, qty: 1, note: '40% of module' },
                  ]},
                  { module: 'Assisting the Dying Person', weight: 4.29, hours: 30, items: [
                    { name: 'Assisting the Dying Person - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Assisting the Dying Person - Assignment', pts: 40, qty: 1, note: '40% of module' },
                  ]},
                  { module: 'Assisting with Medications', weight: 2.86, hours: 20, items: [
                    { name: 'Assisting with Medications - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Assisting with Medications - Practical', pts: 20, qty: 1, note: '20% of module' },
                    { name: 'Assisting with Medications - Assignment 1', pts: 10, qty: 1, note: '20% split into 2 = 10 pts each' },
                    { name: 'Assisting with Medications - Assignment 2', pts: 10, qty: 1, note: '20% split into 2 = 10 pts each' },
                  ]},
                  { module: 'Cognitive and Mental Health Issues and Brain Injuries', weight: 5.71, hours: 40, items: [
                    { name: 'Cognitive and Mental Health Issues and Brain Injuries - Theory', pts: 60, qty: 1, note: '60% of module' },
                    { name: 'Cognitive and Mental Health Issues and Brain Injuries - Assignment 1', pts: 20, qty: 1, note: '40% split into 2 = 20 pts each' },
                    { name: 'Cognitive and Mental Health Issues and Brain Injuries - Assignment 2', pts: 20, qty: 1, note: '40% split into 2 = 20 pts each' },
                  ]},
                  { module: 'Health Conditions', weight: 5.71, hours: 40, items: [
                    { name: 'Health Conditions - Theory', pts: 80, qty: 1, note: '80% of module' },
                    { name: 'Health Conditions - Assignment', pts: 20, qty: 1, note: '20% of module' },
                  ]},
                  { module: 'Gentle Persuasive Approaches in Dementia Care', weight: 1.43, hours: 10, items: [
                    { name: 'Gentle Persuasive Approaches in Dementia Care - Theory', pts: 100, qty: 1, note: '100% of module' },
                  ]},
                  { module: 'Clinical Placement (Facility)', weight: 28.57, hours: 200, items: [
                    { name: 'Clinical Placement (Facility) - Practical', pts: 100, qty: 1, note: '100% of module' },
                  ]},
                  { module: 'Clinical Placement (Community)', weight: 14.29, hours: 100, items: [
                    { name: 'Clinical Placement (Community) - Practical', pts: 100, qty: 1, note: '100% of module' },
                  ]},
                ];
                const totalWeight = PSW_TABLE.reduce((s, m) => s + m.weight, 0);
                const totalAssessments = PSW_TABLE.reduce((s, m) => s + m.items.length, 0);
                return (
                  <div className="max-w-5xl">
                    <h2 className="text-[28px] font-medium text-[#2D3B45] mb-2">Grading Structure</h2>
                    <p className="text-sm text-gray-500 mb-6">{PSW_TABLE.length} modules · {totalAssessments} assessments · Total weight {totalWeight.toFixed(2)}%</p>
                    <table className="w-full border-collapse border border-[#E1E1E1] text-[14px] bg-white">
                      <thead>
                        <tr className="bg-[#2D3B45] text-white">
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-12">#</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-left">Module</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-24">Weight</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-center w-20"># Items</th>
                          <th className="border border-[#E1E1E1] px-3 py-2 text-left">Assignments Inside (pts)</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#2D3B45]">
                        {PSW_TABLE.map((row, i) => (
                          <tr key={row.module} className="hover:bg-gray-50 align-top">
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center font-bold">{i + 1}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2">{row.module}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center font-medium">{row.weight.toFixed(2)}%</td>
                            <td className="border border-[#E1E1E1] px-3 py-2 text-center">{row.items.length}</td>
                            <td className="border border-[#E1E1E1] px-3 py-2">
                              {row.items.map((it, idx) => {
                                // Show just the suffix after " - " for compact display
                                const idxDash = it.name.indexOf(' - ');
                                const short = idxDash >= 0 ? it.name.slice(idxDash + 3) : it.name;
                                return (
                                  <span key={idx} className="inline-block mr-2">
                                    {short} ({it.pts} pts){idx < row.items.length - 1 ? ',' : ''}
                                  </span>
                                );
                              })}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[#F5F5F5] font-bold">
                          <td className="border border-[#E1E1E1] px-3 py-2"></td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-right">TOTAL</td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-center">{totalWeight.toFixed(2)}%</td>
                          <td className="border border-[#E1E1E1] px-3 py-2 text-center">{totalAssessments}</td>
                          <td className="border border-[#E1E1E1] px-3 py-2"></td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Step 3 — per-module breakdown */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-12 mb-2">Step 3: Create Assignments Inside Each Group</h2>
                    <p className="text-sm text-gray-500 mb-6">For each module group, create the following assignments with the exact point values shown.</p>

                    {PSW_TABLE.map((row, i) => {
                      const total = row.items.reduce((s, it) => s + it.pts * it.qty, 0);
                      return (
                        <div key={row.module} className="mb-8 border border-[#E1E1E1] rounded bg-white">
                          <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1]">
                            <div className="text-[16px] font-bold text-[#2D3B45]">Module {i + 1}: {row.module}</div>
                            <div className="text-[12px] text-gray-600 mt-1">
                              Group Weight: {row.weight.toFixed(2)}%  |  Hours: {row.hours}  |  Points add up to: 100
                            </div>
                          </div>
                          <table className="w-full text-[13px]">
                            <thead className="bg-gray-50 text-gray-600">
                              <tr>
                                <th className="text-left px-4 py-2 font-medium">Assignment Name in Canvas</th>
                                <th className="text-center px-4 py-2 font-medium w-20">Points</th>
                                <th className="text-center px-4 py-2 font-medium w-16">Qty</th>
                                <th className="text-left px-4 py-2 font-medium">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {row.items.map((it, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-2 text-[#2D3B45]">{it.name}</td>
                                  <td className="px-4 py-2 text-center font-medium">{it.pts} pts</td>
                                  <td className="px-4 py-2 text-center">{it.qty}</td>
                                  <td className="px-4 py-2 text-gray-600">{it.note}</td>
                                </tr>
                              ))}
                              <tr className="bg-[#F5F5F5] font-bold">
                                <td className="px-4 py-2">Total</td>
                                <td className="px-4 py-2 text-center">{total} pts</td>
                                <td className="px-4 py-2"></td>
                                <td className="px-4 py-2 text-gray-600">Must equal 100</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}

                    {/* Examples */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-12 mb-3">Example: How Grading Works</h2>
                    <div className="border border-[#E1E1E1] rounded bg-white mb-6">
                      <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1]">
                        <div className="text-[15px] font-bold text-[#2D3B45]">Safety and Mobility (5.71% of course)</div>
                        <div className="text-[12px] text-gray-600 mt-1">Module has: Theory (60 pts) + Practical (10 pts) + Assignment (30 pts) = 100 pts</div>
                      </div>
                      <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium">Assessment</th><th className="text-center px-4 py-2 font-medium">Max Pts</th><th className="text-center px-4 py-2 font-medium">Score</th><th className="text-center px-4 py-2 font-medium">%</th><th className="text-left px-4 py-2 font-medium"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-4 py-2">Safety and Mobility - Theory</td><td className="text-center px-4 py-2">60</td><td className="text-center px-4 py-2">48 / 60</td><td className="text-center px-4 py-2">80%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Safety and Mobility - Practical</td><td className="text-center px-4 py-2">10</td><td className="text-center px-4 py-2">9 / 10</td><td className="text-center px-4 py-2">90%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Safety and Mobility - Assignment</td><td className="text-center px-4 py-2">30</td><td className="text-center px-4 py-2">24 / 30</td><td className="text-center px-4 py-2">80%</td><td className="px-4 py-2"></td></tr>
                          <tr className="bg-[#F5F5F5] font-bold"><td className="px-4 py-2">Module Total</td><td className="text-center px-4 py-2">100</td><td className="text-center px-4 py-2">81 / 100</td><td className="text-center px-4 py-2">81%</td><td className="px-4 py-2 text-gray-600">81% × 5.71% = 4.62%</td></tr>
                        </tbody>
                      </table>
                      <div className="px-4 py-2 text-[12px] text-gray-600 border-t border-gray-100">Teacher enters: 48, 9, and 24. The system adds them (81/100), then applies the 5.71% module weight.</div>
                    </div>

                    <div className="border border-[#E1E1E1] rounded bg-white mb-6">
                      <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1]">
                        <div className="text-[15px] font-bold text-[#2D3B45]">Qty 2 Example: Household Management (3.57% of course)</div>
                        <div className="text-[12px] text-gray-600 mt-1">Assignment is 40% with Qty 2, so split into two items at 20 pts each.</div>
                      </div>
                      <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium">Assessment</th><th className="text-center px-4 py-2 font-medium">Max Pts</th><th className="text-center px-4 py-2 font-medium">Score</th><th className="text-center px-4 py-2 font-medium">%</th><th className="text-left px-4 py-2 font-medium"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr><td className="px-4 py-2">Household Mgmt - Theory</td><td className="text-center px-4 py-2">60</td><td className="text-center px-4 py-2">51 / 60</td><td className="text-center px-4 py-2">85%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Household Mgmt - Assignment 1</td><td className="text-center px-4 py-2">20</td><td className="text-center px-4 py-2">16 / 20</td><td className="text-center px-4 py-2">80%</td><td className="px-4 py-2"></td></tr>
                          <tr><td className="px-4 py-2">Household Mgmt - Assignment 2</td><td className="text-center px-4 py-2">20</td><td className="text-center px-4 py-2">18 / 20</td><td className="text-center px-4 py-2">90%</td><td className="px-4 py-2"></td></tr>
                          <tr className="bg-[#F5F5F5] font-bold"><td className="px-4 py-2">Module Total</td><td className="text-center px-4 py-2">100</td><td className="text-center px-4 py-2">85 / 100</td><td className="text-center px-4 py-2">85%</td><td className="px-4 py-2 text-gray-600">85% × 3.57% = 3.03%</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[13px] text-gray-700 mb-8">The student's overall course grade = sum of contributions from all 15 modules.</p>

                    {/* Final verification checklist */}
                    <h2 className="text-[24px] font-medium text-[#2D3B45] mt-8 mb-3">Final Verification Checklist</h2>
                    <p className="text-sm text-gray-500 mb-4">After setup, verify all of the following against the original course template:</p>
                    <div className="border border-[#E1E1E1] rounded bg-white mb-6">
                      <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr><th className="text-left px-4 py-2 font-medium w-1/3">Check</th><th className="text-left px-4 py-2 font-medium">How to Verify</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            ['Weighted grades enabled', 'Verify in your environment that weighted assignment groups are active'],
                            ['15 Assignment Groups exist', 'One per module, named exactly as shown'],
                            ['Weights match template', 'Each group weight = Module % from the template spreadsheet'],
                            ['Weights add to 100%', 'All module weights combined = 100%'],
                            ['Points add to 100 per group', "Every module's assignments total exactly 100 pts"],
                            ['Qty 2 splits correct', 'Body Systems: 50+50, Household Mgmt: 20+20, Care Planning: 20+20, Medications: 10+10, Cognitive: 20+20'],
                            ['Clinical Placements correct', 'Facility (28.57%) and Community (14.29%) each have Practical at 100 pts'],
                            ['No extra assignments', "No items exist that aren't in the template"],
                            ['No orphaned assignments', 'Every assignment is inside its correct module group'],
                            ['Cross-reference with template', 'Open the original template side-by-side and verify every row'],
                            ['Test with sample grades', 'Enter sample scores and verify the final grade calculation'],
                          ].map(([check, how], idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-[#2D3B45] font-medium">{check}</td>
                              <td className="px-4 py-2 text-gray-700">{how}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[12px] text-gray-500 italic mb-12">Once setup is complete, send screenshots of the Assignment Groups page for final verification. Always keep the original course template as the source of truth.</p>
                  </div>
                );
              }

              // Restrict per-module assessments to the canonical components
              // for each course's syllabus. IBA uses Final + Participation;
              // AC uses Final + Participation + Assignment + Quiz.
              const allowedSuffix = (s: string) => {
                const t = s.trim();
                if (course.code === 'AC') {
                  return t === 'Final' || t === 'Participation' || t === 'Assignment' || t === 'Quiz';
                }
                if (course.code === 'CSW') {
                  return t === 'Final' || t === 'Participation' || t === 'Assignment';
                }
                return t === 'Final' || t === 'Participation';
              };
              // Specific assignment titles to always exclude. (Empty for now.)
              const excludeTitles = new Set<string>();
              // Normalize British/American spelling variants (e.g.
              // "Organizational" vs "Organisational") so the assignment
              // matcher doesn't drop modules whose assignments use the
              // opposite spelling.
              const norm = (s: string) => s.toLowerCase()
                .replace(/anis(ational|ation|ed|ing|e)/g, 'aniz$1');

              // IBA per-student schedule window: hide grades on modules the
              // student hasn't reached yet (per their startDate vs today).
              const IBA_SCHEDULE: { date: string; track: 'weekday' | 'weekend'; module: string }[] = [
                { date: '2025-08-04', track: 'weekday', module: 'Macro Economics' },
                { date: '2025-08-18', track: 'weekday', module: 'Computer Applications in Business' },
                { date: '2025-09-01', track: 'weekday', module: 'Business Law' },
                { date: '2025-09-15', track: 'weekday', module: 'Business Ethics' },
                { date: '2025-09-29', track: 'weekday', module: 'English Fundamentals' },
                { date: '2025-10-13', track: 'weekday', module: 'Statistics for Business' },
                { date: '2025-10-27', track: 'weekday', module: 'Fundamentals of Accounting' },
                { date: '2025-11-10', track: 'weekday', module: 'Strategic Management' },
                { date: '2025-11-24', track: 'weekday', module: 'International Law' },
                { date: '2025-11-28', track: 'weekend', module: 'Introduction to HRM' },
                { date: '2025-12-08', track: 'weekday', module: 'E Commerce & Digital Marketing' },
                { date: '2025-12-12', track: 'weekend', module: 'Management Fundamentals' },
                { date: '2025-12-29', track: 'weekday', module: 'Leadership' },
                { date: '2026-01-02', track: 'weekend', module: 'Sales Management' },
                { date: '2026-01-12', track: 'weekday', module: 'Intercultural Communication' },
                { date: '2026-01-16', track: 'weekend', module: 'Project Management' },
                { date: '2026-01-26', track: 'weekday', module: 'Cross Cultural Management' },
                { date: '2026-01-30', track: 'weekend', module: 'Fundamentals of Marketing' },
                { date: '2026-02-09', track: 'weekday', module: 'International Business Strategy' },
                { date: '2026-02-13', track: 'weekend', module: 'Operations Research' },
                { date: '2026-02-23', track: 'weekday', module: 'International Banking & Finance' },
                { date: '2026-02-27', track: 'weekend', module: 'Organizational Behaviour' },
                { date: '2026-03-09', track: 'weekday', module: 'Entrepreneurship' },
                { date: '2026-03-13', track: 'weekend', module: 'Strategic Management' },
                { date: '2026-03-23', track: 'weekday', module: 'Introduction to HRM' },
                { date: '2026-03-27', track: 'weekend', module: 'Micro Economics' },
                { date: '2026-04-06', track: 'weekday', module: 'Management Fundamentals' },
                { date: '2026-04-10', track: 'weekend', module: 'Macro Economics' },
                { date: '2026-04-20', track: 'weekday', module: 'Sales Management' },
                { date: '2026-04-24', track: 'weekend', module: 'Statistics for Business' },
                { date: '2026-05-04', track: 'weekday', module: 'Project Management' },
                { date: '2026-05-08', track: 'weekend', module: 'Fundamentals of Accounting' },
                { date: '2026-05-18', track: 'weekday', module: 'Fundamentals of Marketing' },
                { date: '2026-05-22', track: 'weekend', module: 'Computer Applications in Business' },
                { date: '2026-06-01', track: 'weekday', module: 'Operations Research' },
                { date: '2026-06-05', track: 'weekend', module: 'Business Law' },
                { date: '2026-06-15', track: 'weekday', module: 'Organizational Behaviour' },
                { date: '2026-06-19', track: 'weekend', module: 'Business Ethics' },
                { date: '2026-06-29', track: 'weekday', module: 'Micro Economics' },
                { date: '2026-07-03', track: 'weekend', module: 'English Fundamentals' },
                { date: '2026-07-13', track: 'weekday', module: 'Macro Economics' },
                { date: '2026-07-17', track: 'weekend', module: 'International Law' },
                { date: '2026-07-27', track: 'weekday', module: 'Computer Applications in Business' },
                { date: '2026-07-31', track: 'weekend', module: 'E Commerce & Digital Marketing' },
                { date: '2026-08-10', track: 'weekday', module: 'Business Law' },
                { date: '2026-08-14', track: 'weekend', module: 'Leadership' },
                { date: '2026-08-24', track: 'weekday', module: 'Business Ethics' },
                { date: '2026-08-28', track: 'weekend', module: 'Entrepreneurship' },
                { date: '2026-09-07', track: 'weekday', module: 'English Fundamentals' },
                { date: '2026-09-11', track: 'weekend', module: 'Intercultural Communication' },
                { date: '2026-09-21', track: 'weekday', module: 'Statistics for Business' },
                { date: '2026-09-25', track: 'weekend', module: 'Cross Cultural Management' },
                { date: '2026-10-05', track: 'weekday', module: 'Fundamentals of Accounting' },
                { date: '2026-10-09', track: 'weekend', module: 'International Business Strategy' },
                { date: '2026-10-19', track: 'weekday', module: 'Strategic Management' },
                { date: '2026-10-23', track: 'weekend', module: 'International Banking & Finance' },
                { date: '2026-11-02', track: 'weekday', module: 'International Law' },
                { date: '2026-11-16', track: 'weekday', module: 'E Commerce & Digital Marketing' },
                { date: '2026-11-30', track: 'weekday', module: 'Leadership' },
                { date: '2026-12-14', track: 'weekday', module: 'Intercultural Communication' },
              ];
              // Track inferred from the student's IBA batchCode (IBAW* = weekend,
              // anything else including IBAE / IBA / IBACOOP = weekday).
              const ibaTrack: 'weekday' | 'weekend' = (() => {
                if (course.code !== 'IBA') return 'weekday';
                const en = (course.enrollments || []).find((x: any) => x.userId === (user as any)?.id);
                const bc = (en?.batchCode || '').toUpperCase();
                return bc.startsWith('IBAW') ? 'weekend' : 'weekday';
              })();
              const ibaCoveredModules = (() => {
                if (course.code !== 'IBA') return null;
                const startStr = (user as any)?.startDate;
                if (!startStr) return null; // no startDate -> show everything (legacy admin view)
                const start = new Date(startStr);
                const today = new Date();
                const set = new Set<string>();
                for (const s of IBA_SCHEDULE) {
                  if (s.track !== ibaTrack) continue;
                  const d = new Date(s.date + 'T00:00:00Z');
                  if (d.getTime() < start.getTime()) continue;
                  if (d.getTime() > today.getTime()) continue;
                  set.add(s.module);
                }
                return set;
              })();
              const ibaModuleCovered = (modName: string) => {
                if (!ibaCoveredModules) return true;
                // Normalize spelling variant for the lookup
                const target = norm(modName);
                for (const m of ibaCoveredModules) {
                  if (norm(m) === target) return true;
                }
                return false;
              };
              // True if module's first window (on student's track) has ENDED
              // before today. Used to count "missing" modules as 0% in the
              // average; the in-progress current module is excluded.
              const ibaEndedByName = new Map<string, number>();
              if (course.code === 'IBA') {
                const startStr = (user as any)?.startDate;
                if (startStr) {
                  const start = new Date(startStr);
                  const today = new Date();
                  const sorted = [...IBA_SCHEDULE]
                    .filter(s => s.track === ibaTrack)
                    .map(s => ({ ...s, when: new Date(s.date + 'T00:00:00Z') }))
                    .sort((a, b) => a.when.getTime() - b.when.getTime());
                  for (let i = 0; i < sorted.length; i++) {
                    const s = sorted[i];
                    if (s.when.getTime() < start.getTime() || s.when.getTime() > today.getTime()) continue;
                    const next = sorted[i + 1];
                    const endTs = next ? next.when.getTime() : s.when.getTime() + 7 * 86400000;
                    const key = norm(s.module);
                    if (!ibaEndedByName.has(key)) ibaEndedByName.set(key, endTs);
                  }
                }
              }
              const ibaModuleEnded = (modName: string) => {
                const e = ibaEndedByName.get(norm(modName));
                return e !== undefined && e <= Date.now();
              };

              // AC weekday schedule. Each row lists the program module taught
              // that week (and an optional filler MS module). A student covers
              // a module once its scheduled date is between their startDate
              // and today.
              const AC_SCHEDULE: { date: string; modules: string[] }[] = [
                { date: '2025-08-04', modules: ['Microsoft Word 2', 'Payroll Fundamentals 1'] },
                { date: '2025-08-11', modules: ['Payroll Fundamentals 1'] },
                { date: '2025-08-18', modules: ['Microsoft Excel 1 and Excel 2', 'Payroll Fundamental 2'] },
                { date: '2025-08-25', modules: ['Payroll Fundamental 2'] },
                { date: '2025-09-01', modules: ['Microsoft Outlook', 'Payroll Fundamental 2'] },
                { date: '2025-09-08', modules: ['Microsoft Powerpoint', 'Office Procedures'] },
                { date: '2025-09-15', modules: ['Microsoft Windows', 'Office Procedures'] },
                { date: '2025-09-22', modules: ['Microsoft Word 2', 'Office Procedures'] },
                { date: '2025-09-29', modules: ['Office Procedures'] },
                { date: '2025-10-06', modules: ['Microsoft Excel 1 and Excel 2', 'Office Procedures'] },
                { date: '2025-10-13', modules: ['Job Search'] },
                { date: '2025-10-20', modules: ['Microsoft Outlook', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-10-27', modules: ['Microsoft Powerpoint', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-11-03', modules: ['Microsoft Windows', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-11-10', modules: ['Microsoft Word 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-11-17', modules: ['Microsoft Excel 1 and Excel 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-11-24', modules: ['Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-12-01', modules: ['Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-12-08', modules: ['Microsoft Outlook', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2025-12-15', modules: ['Microsoft Powerpoint', 'Computerized Accounting with Sage50/Sage300'] },
                // 2025-12-22 WINTER BREAK
                { date: '2025-12-29', modules: ['Microsoft Windows', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-01-05', modules: ['Microsoft Word 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-01-12', modules: ['Microsoft Excel 1 and Excel 2', 'Canadian Income Tax'] },
                { date: '2026-01-19', modules: ['Canadian Income Tax'] },
                { date: '2026-01-26', modules: ['Canadian Income Tax'] },
                { date: '2026-02-02', modules: ['Microsoft Outlook', 'Canadian Income Tax'] },
                { date: '2026-02-09', modules: ['Microsoft Powerpoint', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-02-16', modules: ['Microsoft Windows', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-02-23', modules: ['Microsoft Word 2', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-03-02', modules: ['Accounting Fundamentals and Book Keeping'] },
                { date: '2026-03-09', modules: ['Microsoft Excel 1 and Excel 2', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-03-16', modules: ['Accounting Fundamentals and Book Keeping'] },
                { date: '2026-03-23', modules: ['Microsoft Outlook', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-03-30', modules: ['Microsoft Powerpoint', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-04-06', modules: ['Microsoft Windows', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-04-13', modules: ['Microsoft Word 2', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-04-20', modules: ['Microsoft Excel 1 and Excel 2', 'Accounting Fundamentals and Book Keeping'] },
                { date: '2026-04-27', modules: ['Accounting Fundamentals and Book Keeping'] },
                { date: '2026-05-04', modules: ['Computerized Accounting with Quickbooks'] },
                { date: '2026-05-11', modules: ['Microsoft Outlook', 'Computerized Accounting with Quickbooks'] },
                { date: '2026-05-18', modules: ['Microsoft Powerpoint', 'Computerized Accounting with Quickbooks'] },
                { date: '2026-05-25', modules: ['Microsoft Windows', 'Computerized Accounting with Quickbooks'] },
                { date: '2026-06-01', modules: ['Microsoft Word 2', 'Computerized Accounting with Quickbooks'] },
                { date: '2026-06-08', modules: ['Microsoft Excel 1 and Excel 2', 'Computerized Accounting with Quickbooks'] },
                { date: '2026-06-15', modules: ['Payroll Fundamentals 1'] },
                { date: '2026-06-22', modules: ['Payroll Fundamentals 1'] },
                { date: '2026-06-29', modules: ['Microsoft Outlook', 'Payroll Fundamental 2'] },
                { date: '2026-07-06', modules: ['Microsoft Powerpoint', 'Payroll Fundamental 2'] },
                { date: '2026-07-13', modules: ['Microsoft Windows', 'Payroll Fundamental 2'] },
                { date: '2026-07-20', modules: ['Microsoft Word 2', 'Office Procedures'] },
                { date: '2026-07-27', modules: ['Microsoft Excel 1 and Excel 2', 'Office Procedures'] },
                { date: '2026-08-03', modules: ['Office Procedures'] },
                { date: '2026-08-10', modules: ['Office Procedures'] },
                { date: '2026-08-17', modules: ['Microsoft Outlook', 'Office Procedures'] },
                { date: '2026-08-24', modules: ['Microsoft Powerpoint', 'Job Search'] },
                { date: '2026-08-31', modules: ['Microsoft Windows', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-09-07', modules: ['Microsoft Word 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-09-14', modules: ['Microsoft Excel 1 and Excel 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-09-21', modules: ['Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-09-28', modules: ['Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-10-05', modules: ['Microsoft Outlook', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-10-12', modules: ['Microsoft Powerpoint', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-10-19', modules: ['Microsoft Windows', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-10-26', modules: ['Microsoft Word 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-11-02', modules: ['Microsoft Excel 1 and Excel 2', 'Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-11-09', modules: ['Computerized Accounting with Sage50/Sage300'] },
                { date: '2026-11-16', modules: ['Canadian Income Tax'] },
                { date: '2026-11-23', modules: ['Microsoft Outlook', 'Canadian Income Tax'] },
                { date: '2026-11-30', modules: ['Microsoft Powerpoint', 'Canadian Income Tax'] },
                { date: '2026-12-07', modules: ['Microsoft Windows', 'Canadian Income Tax'] },
              ];
              const acCoveredModules = (() => {
                if (course.code !== 'AC') return null;
                const startStr = (user as any)?.startDate;
                if (!startStr) return null;
                const start = new Date(startStr);
                const today = new Date();
                const set = new Set<string>();
                for (const row of AC_SCHEDULE) {
                  const d = new Date(row.date + 'T00:00:00Z');
                  if (d.getTime() < start.getTime()) continue;
                  if (d.getTime() > today.getTime()) continue;
                  for (const m of row.modules) set.add(m);
                }
                return set;
              })();
              const acModuleCovered = (modName: string) => {
                if (!acCoveredModules) return true;
                const target = norm(modName);
                for (const m of acCoveredModules) {
                  if (norm(m) === target) return true;
                }
                return false;
              };

              // CSW schedule (single module per week, cyclical M1-M19).
              const CSW_SCHEDULE: { date: string; module: string }[] = [
                { date: '2025-08-04', module: 'Basic Counselling Techniques' },
                { date: '2025-08-11', module: 'Basic Counselling Techniques' },
                { date: '2025-08-18', module: 'Basic Counselling Techniques' },
                { date: '2025-08-25', module: 'Solution-Focused Intervention Techniques' },
                { date: '2025-09-01', module: 'Solution-Focused Intervention Techniques' },
                { date: '2025-09-08', module: 'Family Development, Functions, and Social Issues' },
                { date: '2025-09-15', module: 'Family Development, Functions, and Social Issues' },
                { date: '2025-09-22', module: 'Family Development, Functions, and Social Issues' },
                { date: '2025-09-29', module: 'Family Development, Functions, and Social Issues' },
                { date: '2025-10-06', module: 'Introduction to Psychology' },
                { date: '2025-10-13', module: 'Introduction to Psychology' },
                { date: '2025-10-20', module: 'Introduction to Psychology' },
                { date: '2025-10-27', module: 'Professional Documentation & Case Management' },
                { date: '2025-11-03', module: 'Behaviour Modification' },
                { date: '2025-11-10', module: 'Behaviour Modification' },
                { date: '2025-11-17', module: 'Behaviour Modification' },
                { date: '2025-11-24', module: 'Behaviour Modification' },
                { date: '2025-12-01', module: 'Support Resources & Community Capacity Building' },
                { date: '2025-12-08', module: 'Support Resources & Community Capacity Building' },
                { date: '2025-12-15', module: 'Support Resources & Community Capacity Building' },
                // 2025-12-22, 2025-12-29 WINTER BREAK
                { date: '2026-01-05', module: 'Essential Skills' },
                { date: '2026-01-12', module: 'Essential Skills' },
                { date: '2026-01-19', module: 'Microsoft Windows' },
                { date: '2026-01-26', module: 'Microsoft Windows' },
                { date: '2026-02-02', module: 'Inclusive Communication Skills' },
                { date: '2026-02-09', module: 'Inclusive Communication Skills' },
                { date: '2026-02-16', module: 'Inclusive Communication Skills' },
                { date: '2026-02-23', module: 'Inclusive Communication Skills' },
                { date: '2026-03-02', module: 'Introduction to Community Service Work' },
                { date: '2026-03-09', module: 'Introduction to Community Service Work' },
                { date: '2026-03-16', module: 'Introduction to Community Service Work' },
                { date: '2026-03-23', module: 'Employment Achievement Strategies' },
                { date: '2026-03-30', module: 'Employment Achievement Strategies' },
                { date: '2026-04-06', module: 'Basic Business Communications' },
                { date: '2026-04-13', module: 'Basic Business Communications' },
                { date: '2026-04-20', module: 'Harm Reduction and Crisis Intervention' },
                { date: '2026-04-27', module: 'Harm Reduction and Crisis Intervention' },
                { date: '2026-05-04', module: 'Harm Reduction and Crisis Intervention' },
                { date: '2026-05-11', module: 'Introduction to Sociology' },
                { date: '2026-05-18', module: 'Introduction to Sociology' },
                { date: '2026-05-25', module: 'Mental Health & Addictions' },
                { date: '2026-06-01', module: 'Mental Health & Addictions' },
                { date: '2026-06-08', module: 'Mental Health & Addictions' },
                { date: '2026-06-15', module: 'Mental Health & Addictions' },
                { date: '2026-06-22', module: 'Mental Health & Addictions' },
                { date: '2026-06-29', module: 'Populations at Risk' },
                { date: '2026-07-06', module: 'Populations at Risk' },
                { date: '2026-07-13', module: 'Populations at Risk' },
                { date: '2026-07-20', module: 'Populations at Risk' },
                { date: '2026-07-27', module: 'Law for Support Workers' },
                { date: '2026-08-03', module: 'Law for Support Workers' },
                { date: '2026-08-10', module: 'Law for Support Workers' },
                { date: '2026-08-17', module: 'Self Care and Team Building' },
                { date: '2026-08-24', module: 'Self Care and Team Building' },
                { date: '2026-08-31', module: 'Basic Counselling Techniques' },
                { date: '2026-09-07', module: 'Basic Counselling Techniques' },
                { date: '2026-09-14', module: 'Basic Counselling Techniques' },
                { date: '2026-09-21', module: 'Solution-Focused Intervention Techniques' },
                { date: '2026-09-28', module: 'Solution-Focused Intervention Techniques' },
                { date: '2026-10-05', module: 'Family Development, Functions, and Social Issues' },
                { date: '2026-10-12', module: 'Family Development, Functions, and Social Issues' },
                { date: '2026-10-19', module: 'Family Development, Functions, and Social Issues' },
                { date: '2026-10-26', module: 'Family Development, Functions, and Social Issues' },
                { date: '2026-11-02', module: 'Introduction to Psychology' },
                { date: '2026-11-09', module: 'Introduction to Psychology' },
                { date: '2026-11-16', module: 'Introduction to Psychology' },
              ];
              const cswCoveredModules = (() => {
                if (course.code !== 'CSW') return null;
                const startStr = (user as any)?.startDate;
                if (!startStr) return null;
                const start = new Date(startStr);
                const today = new Date();
                const set = new Set<string>();
                for (const row of CSW_SCHEDULE) {
                  const d = new Date(row.date + 'T00:00:00Z');
                  if (d.getTime() < start.getTime()) continue;
                  if (d.getTime() > today.getTime()) continue;
                  set.add(row.module);
                }
                return set;
              })();
              const cswModuleCovered = (modName: string) => {
                if (!cswCoveredModules) return true;
                const target = norm(modName);
                for (const m of cswCoveredModules) {
                  if (norm(m) === target) return true;
                }
                return false;
              };

              // Filler MS modules taught alongside AC program modules — they
              // appear in the Module Grades syllabus table but are excluded
              // from the average %.
              const AC_FILLER_MODULES = new Set([
                'Microsoft Windows', 'Microsoft Word 2',
                'Microsoft Excel 1 and Excel 2', 'Microsoft Outlook',
                'Microsoft Powerpoint',
              ]);
              const moduleData = (course.modules || []).map((mod: any) => {
                const modPrefix = norm(mod.name + ' - ');
                let assignments = (course.assignments || []).filter((a: any) => {
                  const t = norm(a.title);
                  return t.startsWith(modPrefix) || t.startsWith(norm(mod.name + ' -'));
                });
                assignments = assignments.filter((a: any) => {
                  if (excludeTitles.has(a.title)) return false;
                  const sfx = (a.title.split(' - ').pop() || '');
                  return allowedSuffix(sfx);
                });
                // Normalize: any assignment with points = 100 should display
                // and compute as out of 90 in the gradebook.
                assignments = assignments.map((a: any) => a.points === 100 ? { ...a, points: 90 } : a);

                const theory = assignments.filter((a: any) =>
                  /Final|Quiz|Midterm|Exam|Test|Theory/i.test(a.title.split(' - ').pop() || '')
                );
                const practical = assignments.filter((a: any) =>
                  /Assignment|Participation|Project|Attendance|Practical/i.test(a.title.split(' - ').pop() || '')
                );

                const theoryPts = theory.reduce((s: number, a: any) => s + a.points, 0);
                const practicalPts = practical.reduce((s: number, a: any) => s + a.points, 0);
                const totalPts = theoryPts + practicalPts;

                // For IBA, every module is a flat 4.17% (per syllabus table) regardless of DB value.
                const weight = course.code === 'IBA' ? 4.17 : (mod.weight || 0);
                return { mod, assignments, theory, practical, theoryPts, practicalPts, totalPts, weight };
              });

              const totalWeight = moduleData.reduce((s: number, m: any) => s + m.weight, 0);
              const totalHours = moduleData.reduce((s: number, m: any) => s + (m.mod.hours || 0), 0);
              const totalTheory = moduleData.reduce((s: number, m: any) => s + m.theoryPts, 0);
              const totalPractical = moduleData.reduce((s: number, m: any) => s + m.practicalPts, 0);
              const totalAssignments = moduleData.reduce((s: number, m: any) => s + m.assignments.length, 0);

              // Count patterns
              const patterns: Record<string, number> = {};
              moduleData.forEach((m: any) => {
                const key = m.assignments.map((a: any) => {
                  const t = (a.title.split(' - ').pop() || '').trim();
                  return `${t} (${a.points})`;
                }).join(' + ');
                patterns[key] = (patterns[key] || 0) + 1;
              });

              return (
                <div className="max-w-6xl">
                  {/* Course Header */}
                  <h1 className="text-[28px] font-medium text-[#2D3B45] mb-1">{course.name}</h1>
                  <p className="text-[16px] text-gray-500 mb-6">
                    Total Hours: {totalHours} | {moduleData.length} Modules | {totalAssignments} Assessments | Weight: {'100'}%
                  </p>

                  {/* Course Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#2D3B45] text-white rounded-lg p-4">
                      <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Modules</div>
                      <div className="text-2xl font-bold">{moduleData.length}</div>
                    </div>
                    <div className="bg-[#c0392b] text-white rounded-lg p-4">
                      <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Theory Pts (per module)</div>
                      <div className="text-2xl font-bold">{moduleData.length > 0 ? `${Math.min(...moduleData.map((m: any) => m.theoryPts))}–${Math.max(...moduleData.map((m: any) => m.theoryPts))}` : '0'}</div>
                    </div>
                    <div className="bg-[#2980b9] text-white rounded-lg p-4">
                      <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Practical Pts (per module)</div>
                      <div className="text-2xl font-bold">{moduleData.length > 0 ? `${Math.min(...moduleData.map((m: any) => m.practicalPts))}–${Math.max(...moduleData.map((m: any) => m.practicalPts))}` : '0'}</div>
                    </div>
                    <div className="bg-[#008744] text-white rounded-lg p-4">
                      <div className="text-[16px] uppercase tracking-wider opacity-70 mb-1">Total Hours</div>
                      <div className="text-2xl font-bold">{totalHours}</div>
                    </div>
                  </div>

                  {/* Assessment Patterns */}
                  {Object.keys(patterns).length > 0 && (
                    <div className="bg-gray-50 border border-[#E1E1E1] rounded-lg p-4 mb-8">
                      <h3 className="text-[16px] font-bold text-[#2D3B45] mb-3">Assessment Patterns</h3>
                      <div className="space-y-2">
                        {Object.entries(patterns).map(([pattern, count], idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-[16px]">
                            <span className="bg-[#008EE2] text-white text-[16px] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">{count}</span>
                            <span className="text-gray-600">
                              <span className="font-bold">{count} module{count > 1 ? 's' : ''}:</span> {pattern} = 100 pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── SECTION 1: Student Grades Table ── */}
                  {(() => {
                    // Compute overall grade
                    let overallGrade = 0;
                    let hasAnyGrade = false;
                    // For non-student viewers (admin/auditor/teacher) opening
                    // the course-level Grades tab without a specific student
                    // context, suppress all scores. The page would otherwise
                    // mash up the first GRADED submission per assignment from
                    // arbitrary students, which is meaningless.
                    const isStudentViewer = (effectiveRole === 'STUDENT');
                    const moduleGrades = moduleData.map((m: any) => {
                      let moduleScore = 0;
                      let moduleMax = 0;
                      // For AC and CSW, suppress scores for modules the student
                      // hasn't reached yet per their schedule. IBA shows
                      // everything recorded (its window check is informational).
                      const inWindow = course.code === 'AC' ? acModuleCovered(m.mod.name)
                        : course.code === 'CSW' ? cswModuleCovered(m.mod.name)
                        : ibaModuleCovered(m.mod.name);
                      const assignmentGrades = m.assignments.map((a: any) => {
                        const sub = isStudentViewer
                          ? a.submissions?.find((s: any) => s.studentId === user?.id && s.status === 'GRADED')
                          : null;
                        const gated = (course.code === 'AC' || course.code === 'CSW') && !inWindow;
                        const score = isStudentViewer && !gated ? (sub?.score ?? null) : null;
                        if (score !== null) hasAnyGrade = true;
                        moduleScore += score ?? 0;
                        moduleMax += a.points;
                        return { ...a, score, sub };
                      });
                      const modulePct = moduleMax > 0 ? (moduleScore / moduleMax) * 100 : 0;
                      const contribution = (modulePct / 100) * m.weight;
                      if (assignmentGrades.some((a: any) => a.score !== null)) overallGrade += contribution;
                      return { ...m, assignmentGrades, moduleScore, moduleMax, modulePct, contribution, inWindow };
                    });

                    // A module counts as attempted if the student has any
                    // submission against it (GRADED or MISSING). Modules with
                    // no submission at all, and the currently in-progress
                    // module, are excluded from the average.
                    const myEnrollment = (course.enrollments || []).find((x: any) => x.userId === (user as any)?.id);
                    const inProgressModuleId = myEnrollment?.currentModuleId || null;
                    const attemptedModules = moduleGrades.filter((m: any) => {
                      if (course.code === 'AC' && AC_FILLER_MODULES.has(m.mod.name)) return false;
                      if (isStudentViewer) {
                        if (m.mod.id === inProgressModuleId) return false;
                        return m.assignments.some((a: any) => (a.submissions?.length || 0) > 0);
                      }
                      if (course.code === 'IBA') {
                        return ibaModuleEnded(m.mod.name) ||
                          m.assignmentGrades.some((a: any) => a.score !== null);
                      }
                      return m.assignmentGrades.some((a: any) => a.score !== null);
                    });
                    const averagePct = attemptedModules.length > 0
                      ? attemptedModules.reduce((s: number, m: any) => s + m.modulePct, 0) / attemptedModules.length
                      : 0;

                    return (
                      <>
                        {/* Overall Grade Card */}
                        {hasAnyGrade && (
                          <div className="bg-gradient-to-r from-[#2D3B45] to-[#4A5568] rounded-lg p-6 mb-8 text-white">
                            <div className="grid grid-cols-3 gap-6 items-center">
                              <div>
                                <div className="text-[14px] uppercase tracking-wider opacity-70">Overall Course Grade</div>
                                <div className="text-5xl font-bold mt-1">{overallGrade.toFixed(2)}%</div>
                                <div className="text-[11px] opacity-60 mt-1">Weighted, out of full course</div>
                              </div>
                              <div>
                                <div className="text-[14px] uppercase tracking-wider opacity-70">Average %</div>
                                <div className="text-5xl font-bold mt-1 text-[#4FC3F7]">{averagePct.toFixed(2)}%</div>
                                <div className="text-[11px] opacity-60 mt-1">Mean across attempted modules</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[14px] uppercase tracking-wider opacity-70">Graded Modules</div>
                                <div className="text-2xl font-bold mt-1">{attemptedModules.length} / {moduleData.length}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        <h2 className="text-[18px] font-bold text-[#2D3B45] mb-4 border-b-2 border-[#008EE2] pb-2">
                          {isStudentViewer ? 'Module Grades' : 'Course Structure'}
                        </h2>
                        <table className="w-full border-collapse text-[16px] mb-10">
                          <thead>
                            <tr className="bg-[#2D3B45] text-white">
                              <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-8">#</th>
                              <th className="border border-[#3d4d5a] px-3 py-2.5 text-left font-medium">Module</th>
                              <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-16">Weight</th>
                              <th className="border border-[#3d4d5a] px-3 py-2.5 text-left font-medium">Assessments</th>
                              {isStudentViewer && <>
                                <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-20">Score</th>
                                <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-16">%</th>
                                <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-20">Weighted</th>
                              </>}
                            </tr>
                          </thead>
                          <tbody className="text-[#2D3B45]">
                            {moduleGrades.map((m: any, idx: number) => {
                              const hasGrades = m.assignmentGrades.some((a: any) => a.score !== null);
                              return (
                                <tr key={m.mod.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} hover:bg-yellow-50/50`}>
                                  <td className="border border-[#E1E1E1] px-2 py-2.5 text-center text-gray-400 text-[16px]">{m.mod.position}</td>
                                  <td className="border border-[#E1E1E1] px-3 py-2.5 font-bold text-[16px]">{m.mod.name}</td>
                                  <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold text-[#008EE2]">{m.weight}%</td>
                                  <td className="border border-[#E1E1E1] px-3 py-2.5">
                                    {m.assignmentGrades.map((a: any) => {
                                      const type = (a.title.split(' - ').pop() || '').trim();
                                      return (
                                        <div key={a.id} className="flex items-center justify-between text-[16px] py-0.5">
                                          <span>{type}</span>
                                          <span className={`font-bold ${a.score !== null ? (a.score / a.points >= 0.7 ? 'text-green-600' : a.score / a.points >= 0.5 ? 'text-amber-600' : 'text-red-600') : 'text-gray-300'}`}>
                                            {a.score !== null ? `${a.score}/${a.points}` : `—/${a.points}`}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </td>
                                  {isStudentViewer && <>
                                    <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold">
                                      {hasGrades ? `${m.moduleScore}/${m.moduleMax}` : '—'}
                                    </td>
                                    <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold">
                                      {hasGrades ? (
                                        <span className={`${m.modulePct >= 70 ? 'text-green-600' : m.modulePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{m.modulePct.toFixed(2)}%</span>
                                      ) : '—'}
                                    </td>
                                    <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold text-[#008744]">
                                      {hasGrades ? `${m.contribution.toFixed(2)}%` : '—'}
                                    </td>
                                  </>}
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-[#2D3B45] text-white font-bold text-[16px]">
                              <td className="border border-[#3d4d5a] px-2 py-3" colSpan={2}>TOTAL</td>
                              <td className="border border-[#3d4d5a] px-2 py-3 text-center">{'100'}%</td>
                              <td className="border border-[#3d4d5a] px-2 py-3 text-center">{totalAssignments} assessments</td>
                              {isStudentViewer && <>
                                <td className="border border-[#3d4d5a] px-2 py-3" colSpan={2}></td>
                                <td className="border border-[#3d4d5a] px-2 py-3 text-center text-[#4FC3F7]">{hasAnyGrade ? `${overallGrade.toFixed(2)}%` : '—'}</td>
                              </>}
                            </tr>
                            {isStudentViewer && (
                            <tr className="bg-[#3d4d5a] text-white font-bold text-[16px]">
                              <td className="border border-[#3d4d5a] px-2 py-3" colSpan={5}>AVERAGE (across attempted modules)</td>
                              <td className="border border-[#3d4d5a] px-2 py-3 text-center">{attemptedModules.length} / {moduleData.length}</td>
                              <td className="border border-[#3d4d5a] px-2 py-3 text-center text-[#4FC3F7]">{hasAnyGrade ? `${averagePct.toFixed(2)}%` : '—'}</td>
                            </tr>
                            )}
                          </tfoot>
                        </table>
                      </>
                    );
                  })()}

                  {/* ── SECTION 2: Detailed Module Cards ── */}
                  <h2 className="text-[18px] font-bold text-[#2D3B45] mb-4 border-b-2 border-[#008EE2] pb-2">
                    Detailed Module Assessment View
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {moduleData.map((m: any) => (
                      <div key={m.mod.id} className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                        {/* Module header */}
                        <div className="bg-[#2D3B45] text-white px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[16px]">{m.mod.name}</div>
                            <div className="text-[16px] opacity-70">{m.mod.hours ? `${m.mod.hours} hours` : ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-bold text-[#4FC3F7]">{m.weight}%</div>
                            <div className="text-[16px] opacity-70">weight</div>
                          </div>
                        </div>
                        {/* Assessments */}
                        <div className="divide-y divide-[#E1E1E1]">
                          {m.assignments.map((a: any) => {
                            const typeName = (a.title.split(' - ').pop() || '').trim();
                            const isTheory = /Final|Quiz|Midterm|Exam|Test|Theory/i.test(typeName);
                            return (
                              <div key={a.id} className={`px-4 py-2.5 flex items-center justify-between ${isTheory ? 'bg-red-50/30' : 'bg-blue-50/30'}`}>
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${isTheory ? 'bg-red-400' : 'bg-blue-400'}`} />
                                  <span className="text-[16px] font-medium">{typeName}</span>
                                  <span className={`px-1.5 py-0.5 text-[16px] font-bold rounded ${isTheory ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {isTheory ? 'THEORY' : 'PRACTICAL'}
                                  </span>
                                </div>
                                <span className="text-[16px] font-bold">{a.points} pts</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Module total bar */}
                        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between text-[16px]">
                          <div className="flex items-center space-x-4">
                            <span>Theory: <span className="font-bold text-red-700">{m.theoryPts}</span></span>
                            <span>Practical: <span className="font-bold text-blue-700">{m.practicalPts}</span></span>
                          </div>
                          <span className="font-bold">Total: {m.totalPts} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── SECTION 3: Example Calculation ── */}
                  {moduleData.length > 0 && moduleData[0].weight > 0 && (() => {
                    const example = moduleData.find((m: any) => m.theory.length > 0 && m.practical.length > 1) || moduleData[0];
                    const sampleScores = example.assignments.map((a: any) => ({
                      ...a, typeName: a.title.split(' - ').pop(),
                      score: Math.round(a.points * 0.8),
                    }));
                    const theoryScores = sampleScores.filter((a: any) => /Final|Quiz|Midterm|Exam|Test|Theory/i.test(a.typeName));
                    const practicalScores = sampleScores.filter((a: any) => /Assignment|Participation|Project|Practical/i.test(a.typeName));
                    const totalScore = sampleScores.reduce((s: number, a: any) => s + a.score, 0);
                    const modulePct = (totalScore / example.totalPts) * 100;
                    const contribution = (modulePct / 100) * example.weight;

                    return (
                      <>
                        <h2 className="text-[18px] font-bold text-[#2D3B45] mb-4 border-b-2 border-[#008EE2] pb-2">
                          Example: How Grade Calculation Works
                        </h2>
                        <div className="bg-[#F8F9FA] border border-[#E1E1E1] rounded-lg p-6 mb-8">
                          <p className="text-[16px] text-gray-500 mb-5">
                            <span className="font-bold text-[#2D3B45]">{example.mod.name}</span> ({example.weight}% of course
                            {example.mod.hours && ` • ${example.mod.hours} hours`})
                            — This module has {example.assignments.length} items: {example.assignments.map((a: any) => `${a.title.split(' - ').pop()} (${a.points})`).join(' + ')}
                          </p>

                          <table className="w-full border-collapse text-[16px] mb-5">
                            <thead>
                              <tr className="bg-[#2D3B45] text-white">
                                <th className="border border-[#3d4d5a] px-4 py-2.5 text-left font-medium">Assessment</th>
                                <th className="border border-[#3d4d5a] px-4 py-2.5 text-center font-medium w-20">Category</th>
                                <th className="border border-[#3d4d5a] px-4 py-2.5 text-center font-medium w-20">Max Pts</th>
                                <th className="border border-[#3d4d5a] px-4 py-2.5 text-center font-medium w-24">Score</th>
                                <th className="border border-[#3d4d5a] px-4 py-2.5 text-center font-medium w-16">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sampleScores.map((a: any, i: number) => {
                                const isT = /Final|Quiz|Midterm|Exam|Test|Theory/i.test(a.typeName);
                                return (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="border border-[#E1E1E1] px-4 py-2.5 flex items-center space-x-2">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${isT ? 'bg-red-400' : 'bg-blue-400'}`} />
                                      <span>{example.mod.name} - {a.typeName}</span>
                                    </td>
                                    <td className="border border-[#E1E1E1] px-4 py-2.5 text-center">
                                      <span className={`px-2 py-0.5 text-[16px] font-medium rounded-full ${isT ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{isT ? 'Theory' : 'Practical'}</span>
                                    </td>
                                    <td className="border border-[#E1E1E1] px-4 py-2.5 text-center">{a.points}</td>
                                    <td className="border border-[#E1E1E1] px-4 py-2.5 text-center font-bold">{a.score} / {a.points}</td>
                                    <td className="border border-[#E1E1E1] px-4 py-2.5 text-center">{Math.round((a.score / a.points) * 100)}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-red-50 font-bold text-red-700">
                                <td className="border border-[#E1E1E1] px-4 py-2" colSpan={2}>Theory Subtotal</td>
                                <td className="border border-[#E1E1E1] px-4 py-2 text-center">{example.theoryPts}</td>
                                <td className="border border-[#E1E1E1] px-4 py-2 text-center">{theoryScores.reduce((s: number, a: any) => s + a.score, 0)} / {example.theoryPts}</td>
                                <td className="border border-[#E1E1E1] px-4 py-2 text-center">{example.theoryPts > 0 ? Math.round((theoryScores.reduce((s: number, a: any) => s + a.score, 0) / example.theoryPts) * 100) : 0}%</td>
                              </tr>
                              <tr className="bg-blue-50 font-bold text-blue-700">
                                <td className="border border-[#E1E1E1] px-4 py-2" colSpan={2}>Practical Subtotal</td>
                                <td className="border border-[#E1E1E1] px-4 py-2 text-center">{example.practicalPts}</td>
                                <td className="border border-[#E1E1E1] px-4 py-2 text-center">{practicalScores.reduce((s: number, a: any) => s + a.score, 0)} / {example.practicalPts}</td>
                                <td className="border border-[#E1E1E1] px-4 py-2 text-center">{example.practicalPts > 0 ? Math.round((practicalScores.reduce((s: number, a: any) => s + a.score, 0) / example.practicalPts) * 100) : 0}%</td>
                              </tr>
                              <tr className="bg-[#2D3B45] text-white font-bold">
                                <td className="border border-[#3d4d5a] px-4 py-2.5" colSpan={2}>Module Total</td>
                                <td className="border border-[#3d4d5a] px-4 py-2.5 text-center">{example.totalPts}</td>
                                <td className="border border-[#3d4d5a] px-4 py-2.5 text-center">{totalScore} / {example.totalPts}</td>
                                <td className="border border-[#3d4d5a] px-4 py-2.5 text-center">{modulePct.toFixed(2)}%</td>
                              </tr>
                            </tfoot>
                          </table>

                          <div className="bg-white border-2 border-[#008EE2] rounded-lg p-5 mb-4">
                            <div className="flex items-center justify-center space-x-4 text-[16px] flex-wrap">
                              <div className="text-center px-3">
                                <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Module Score</div>
                                <div className="font-bold text-[20px]">{totalScore}/{example.totalPts}</div>
                              </div>
                              <span className="text-2xl text-gray-300">×</span>
                              <div className="text-center px-3">
                                <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Module Weight</div>
                                <div className="font-bold text-[20px] text-[#008EE2]">{example.weight}%</div>
                              </div>
                              <span className="text-2xl text-gray-300">=</span>
                              <div className="text-center px-3">
                                <div className="text-[16px] text-gray-400 uppercase tracking-wider mb-1">Contribution to Final Grade</div>
                                <div className="font-bold text-[24px] text-[#008744]">{contribution.toFixed(2)}%</div>
                              </div>
                            </div>
                            <div className="text-center text-[16px] text-gray-400 mt-2">{modulePct.toFixed(2)}% × {example.weight}% = {contribution.toFixed(2)}%</div>
                          </div>

                          <p className="text-[16px] text-gray-500">
                            <span className="font-bold">Teacher enters:</span> {sampleScores.map((a: any) => a.score).join(', ')}.
                            Canvas adds them ({totalScore}/{example.totalPts}), then applies {example.weight}% weight.
                            Student's overall course grade = sum of contributions from all {moduleData.length} modules.
                          </p>
                        </div>
                      </>
                    );
                  })()}

                  {/* Legend */}
                  <div className="flex items-center space-x-8 text-[16px] text-gray-600 mb-4">
                    <div className="flex items-center space-x-2"><span className="w-4 h-4 rounded bg-red-50 border border-red-200" /><span><span className="font-bold">Theory:</span> Final, Quiz, Midterm, Exam</span></div>
                    <div className="flex items-center space-x-2"><span className="w-4 h-4 rounded bg-blue-50 border border-blue-200" /><span><span className="font-bold">Practical:</span> Assignment, Participation</span></div>
                  </div>
                </div>
              );
            })()
          ) : activeSection === 'Syllabus' ? (
            <div className="max-w-6xl">
              <h1 className="text-[28px] font-medium text-[#2D3B45] mb-2">{course.name} — Syllabus</h1>
              <p className="text-[16px] text-gray-500 mb-6">{course.description || ''}</p>

              {/* Course Overview */}
              <div className="border border-[#E1E1E1] rounded-lg overflow-hidden mb-6">
                <div className="bg-[#2D3B45] text-white px-6 py-4">
                  <h2 className="text-lg font-bold">Course Overview</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#F5F5F5] rounded-lg p-4 text-center">
                      <div className="text-[16px] uppercase tracking-wider text-gray-500 mb-1">Total Modules</div>
                      <div className="text-2xl font-bold text-[#2D3B45]">{course.modules?.length || 0}</div>
                    </div>
                    <div className="bg-[#F5F5F5] rounded-lg p-4 text-center">
                      <div className="text-[16px] uppercase tracking-wider text-gray-500 mb-1">Total Hours</div>
                      <div className="text-2xl font-bold text-[#2D3B45]">{(course.modules || []).reduce((s: number, m: any) => s + (m.hours || 0), 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-[#F5F5F5] rounded-lg p-4 text-center">
                      <div className="text-[16px] uppercase tracking-wider text-gray-500 mb-1">Total Assessments</div>
                      <div className="text-2xl font-bold text-[#2D3B45]">{course.assignments?.length || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Breakdown */}
              <div className="border border-[#E1E1E1] rounded-lg overflow-hidden mb-6">
                <div className="bg-[#008EE2] text-white px-6 py-4">
                  <h2 className="text-lg font-bold">Module Breakdown</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F5F5]">
                    <tr>
                      <th className="text-left px-6 py-3 font-bold text-[#2D3B45]">#</th>
                      <th className="text-left px-6 py-3 font-bold text-[#2D3B45]">Module</th>
                      <th className="text-center px-6 py-3 font-bold text-[#2D3B45]">Weight</th>
                      <th className="text-center px-6 py-3 font-bold text-[#2D3B45]">Hours</th>
                      <th className="text-center px-6 py-3 font-bold text-[#2D3B45]">Start Date</th>
                      <th className="text-left px-6 py-3 font-bold text-[#2D3B45]">Assessments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E1E1]">
                    {(() => {
                      const _mods = course.modules || [];
                      const _now = new Date();
                      const _statuses: string[] = _mods.map((mod: any, idx: number) => {
                        if (!mod.startDate) return 'upcoming';
                        const mStart = new Date(mod.startDate);
                        const nextMod = _mods[idx + 1];
                        const mEnd = nextMod?.startDate ? new Date(nextMod.startDate) : new Date(mStart.getTime() + 14 * 86400000);
                        if (_now >= mEnd) return 'completed';
                        if (_now >= mStart) return 'current';
                        return 'upcoming';
                      });
                      const _curIdxs = _statuses.map((s, i) => (s === 'current' ? i : -1)).filter(i => i >= 0);
                      if (_curIdxs.length > 1) {
                        let keep = _curIdxs[0];
                        let keepStart = _mods[keep].startDate ? new Date(_mods[keep].startDate).getTime() : -Infinity;
                        for (const i of _curIdxs) {
                          const t = _mods[i].startDate ? new Date(_mods[i].startDate).getTime() : -Infinity;
                          if (t > keepStart) { keep = i; keepStart = t; }
                        }
                        for (const i of _curIdxs) if (i !== keep) _statuses[i] = 'completed';
                      }
                      return _mods.map((mod: any, idx: number) => {
                      const modAssignments = (course.assignments || []).filter((a: any) =>
                        a.title.startsWith(mod.name + ' - ') || a.title.startsWith(mod.name + ' -')
                      );
                      const status = _statuses[idx];
                      return (
                        <tr key={mod.id} className={`${status === 'current' ? 'bg-blue-50' : status === 'completed' ? 'bg-green-50/30' : ''}`}>
                          <td className="px-6 py-3 text-gray-400 font-bold">{idx + 1}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-[#2D3B45]">{mod.name}</span>
                              {status === 'current' && <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-[#008EE2] text-white animate-pulse">CURRENT</span>}
                              {status === 'completed' && <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-green-100 text-green-700">DONE</span>}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center font-bold text-[#008EE2]">{mod.weight ? `${mod.weight}%` : '—'}</td>
                          <td className="px-6 py-3 text-center text-gray-600">{mod.hours || '—'}</td>
                          <td className="px-6 py-3 text-center text-gray-500">{mod.startDate ? new Date(mod.startDate).toLocaleDateString() : '—'}</td>
                          <td className="px-6 py-3">
                            {modAssignments.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {modAssignments.map((a: any) => {
                                  const type = (a.title.split(' - ').pop() || '').trim();
                                  return (
                                    <span key={a.id} className={`px-2 py-0.5 text-[16px] font-medium rounded ${
                                      /Final/i.test(type) ? 'bg-red-100 text-red-700' :
                                      /Midterm/i.test(type) ? 'bg-amber-100 text-amber-700' :
                                      /Quiz/i.test(type) ? 'bg-purple-100 text-purple-700' :
                                      /Assignment/i.test(type) ? 'bg-blue-100 text-blue-700' :
                                      /Participation/i.test(type) ? 'bg-green-100 text-green-700' :
                                      /Practical/i.test(type) ? 'bg-teal-100 text-teal-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>{type} ({a.points}pts)</span>
                                  );
                                })}
                              </div>
                            ) : <span className="text-gray-400 text-[16px]">—</span>}
                          </td>
                        </tr>
                      );
                    });
                    })()}
                  </tbody>
                  {(course.modules || []).some((m: any) => m.weight) && (
                    <tfoot>
                      <tr className="bg-[#2D3B45] text-white font-bold">
                        <td className="px-6 py-3" colSpan={2}>Total</td>
                        <td className="px-6 py-3 text-center">100%</td>
                        <td className="px-6 py-3 text-center">{(course.modules || []).reduce((s: number, m: any) => s + (m.hours || 0), 0).toLocaleString()}</td>
                        <td className="px-6 py-3" colSpan={2}>{course.assignments?.length || 0} assessments</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

            </div>
          ) : activeSection === 'Settings' ? (
            <div className="max-w-4xl">
              <h1 className="text-[28px] font-medium text-[#2D3B45] mb-6">{course.name} — Settings</h1>

              {/* Course Details */}
              <div className="border border-[#E1E1E1] rounded-lg overflow-hidden mb-6">
                <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                  <h2 className="font-bold text-[16px] text-[#2D3B45]">Course Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[16px] font-bold text-gray-500 uppercase tracking-wider">Course Name</label>
                      <p className="text-[16px] text-[#2D3B45] mt-1">{course.name}</p>
                    </div>
                    <div>
                      <label className="text-[16px] font-bold text-gray-500 uppercase tracking-wider">Course Code (SIS ID)</label>
                      <p className="text-[16px] text-[#2D3B45] mt-1">{course.code}</p>
                    </div>
                    <div>
                      <label className="text-[16px] font-bold text-gray-500 uppercase tracking-wider">Term</label>
                      <p className="text-[16px] text-[#2D3B45] mt-1">{course.term || 'Default Term'}</p>
                    </div>
                    <div>
                      <label className="text-[16px] font-bold text-gray-500 uppercase tracking-wider">Sub-Account</label>
                      <p className="text-[16px] text-[#2D3B45] mt-1">{course.subAccount || 'TAHA College'}</p>
                    </div>
                  </div>
                  {course.description && (
                    <div>
                      <label className="text-[16px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                      <p className="text-[16px] text-gray-600 mt-1">{course.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Grading Configuration */}
              <div className="border border-[#E1E1E1] rounded-lg overflow-hidden mb-6">
                <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                  <h2 className="font-bold text-[16px] text-[#2D3B45]">Grading</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="text-[16px] font-medium text-[#2D3B45]">Weighted Assignment Groups</p>
                      <p className="text-[16px] text-gray-500">Weight final grade based on assignment groups (modules)</p>
                    </div>
                    <span className="px-3 py-1 text-[16px] font-bold rounded-full bg-green-100 text-green-700">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="text-[16px] font-medium text-[#2D3B45]">Total Modules</p>
                      <p className="text-[16px] text-gray-500">Number of assignment groups</p>
                    </div>
                    <span className="text-[16px] font-bold text-[#2D3B45]">{course.modules?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="text-[16px] font-medium text-[#2D3B45]">Total Weight</p>
                      <p className="text-[16px] text-gray-500">Sum of all module weights (should equal 100%)</p>
                    </div>
                    <span className={`text-[16px] font-bold ${Math.abs((course.modules || []).reduce((s: number, m: any) => s + (m.weight || 0), 0) - 100) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {(course.modules || []).reduce((s: number, m: any) => s + (m.weight || 0), 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[16px] font-medium text-[#2D3B45]">Points per Module</p>
                      <p className="text-[16px] text-gray-500">Each module's assessments total 100 points</p>
                    </div>
                    <span className="text-[16px] font-bold text-[#2D3B45]">100 pts</span>
                  </div>
                </div>
              </div>

              {/* Course Statistics */}
              <div className="border border-[#E1E1E1] rounded-lg overflow-hidden mb-6">
                <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                  <h2 className="font-bold text-[16px] text-[#2D3B45]">Course Statistics</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#008EE2]/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[#008EE2]">{course.enrollments?.filter((e: any) => e.role === 'STUDENT').length || 0}</div>
                      <div className="text-[16px] text-gray-500 mt-1">Students</div>
                    </div>
                    <div className="bg-[#2D3B45]/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[#2D3B45]">{course.enrollments?.filter((e: any) => e.role === 'TEACHER').length || 0}</div>
                      <div className="text-[16px] text-gray-500 mt-1">Teachers</div>
                    </div>
                    <div className="bg-[#008744]/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[#008744]">{course.assignments?.length || 0}</div>
                      <div className="text-[16px] text-gray-500 mt-1">Assignments</div>
                    </div>
                    <div className="bg-[#C23C2D]/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[#C23C2D]">{(course.modules || []).reduce((s: number, m: any) => s + (m.hours || 0), 0)}</div>
                      <div className="text-[16px] text-gray-500 mt-1">Total Hours</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Visibility */}
              <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                  <h2 className="font-bold text-[16px] text-[#2D3B45]">Navigation</h2>
                </div>
                <div className="p-6">
                  <p className="text-[16px] text-gray-500 mb-4">Course navigation items visible to students and teachers.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Home', 'Announcements', 'Assignments', 'Grades', 'People', 'Pages', 'Files', 'Syllabus', 'Quizzes', 'Modules'].map(item => (
                      <div key={item} className="flex items-center space-x-2 px-3 py-2 bg-[#F5F5F5] rounded">
                        <Check size={14} className="text-green-600" />
                        <span className="text-[16px] text-[#2D3B45]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeSection === 'Files' ? (
            <CourseFilesTab
              courseId={courseId}
              canUpload={!viewAsStudent && (user?.role === 'TEACHER' || user?.role === 'ADMIN')}
              canDelete={(uploaderId) => !viewAsStudent && (user?.role === 'ADMIN' || uploaderId === user?.id)}
              userId={user?.id || ''}
            />
          ) : activeSection === 'People' && !viewAsStudent && (user?.role === 'TEACHER' || user?.role === 'ADMIN') ? (
            <CoursePeopleTab courseId={courseId} userId={user?.id || ''} userRole={user?.role || ''} />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 py-20">
              <p>This section is currently empty or under construction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Calendar View ---

interface CalendarEventData {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  type: 'schedule' | 'event';
  track?: string;
  course?: { id: string; name: string; code: string; color: string };
}

interface CalendarApiResponse {
  events: CalendarEventData[];
  assignmentEvents: {
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    type: 'assignment';
    course?: { id: string; name: string; code: string; color: string };
    points?: number;
  }[];
}

function CalendarView() {
  const { user } = useAuth();
  const isWithdrawn = /withdraw/i.test((user as any)?.campusStatus || '');
  // Cut-off for hiding events: actual withdrawal date (finishDate) when present;
  // otherwise fall back to today (no future schedule for an undated withdrawal).
  const cutoffMs = isWithdrawn
    ? ((user as any)?.finishDate ? new Date((user as any).finishDate).setHours(0, 0, 0, 0)
                                  : new Date().setHours(0, 0, 0, 0))
    : Number.MAX_SAFE_INTEGER;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trackFilter, setTrackFilter] = useState<'all' | 'Weekday' | 'Weekend'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build date range for current month view (include overflow days)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const viewStart = new Date(year, month, 1 - startOffset);
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const viewEnd = new Date(viewStart);
  viewEnd.setDate(viewEnd.getDate() + totalCells);

  const apiStart = viewStart.toISOString().slice(0, 10);
  const apiEnd = viewEnd.toISOString().slice(0, 10);

  const { data, loading } = useApi<CalendarApiResponse>(`/calendar?start=${apiStart}&end=${apiEnd}`);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Build day cells
  const days: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(viewStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  // Group events by date key
  const eventsByDate = new Map<string, (CalendarEventData & { isAssignment?: boolean })[]>();
  const todayMs = new Date().setHours(0, 0, 0, 0);

  if (data) {
    // Schedule & regular events
    for (const evt of data.events) {
      // For schedule events spanning multiple days, add to each day
      const start = new Date(evt.startTime);
      const end = evt.endTime ? new Date(evt.endTime) : start;

      // Apply track filter
      if (evt.type === 'schedule' && trackFilter !== 'all' && evt.track !== trackFilter) continue;

      const cursor = new Date(start);
      while (cursor <= end) {
        // Withdrawn students: hide each day that lies on or after today
        // (schedule events span multiple days, so we have to gate per day).
        if (isWithdrawn && cursor.getTime() >= cutoffMs) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        if (!eventsByDate.has(key)) eventsByDate.set(key, []);
        // Only add once per event per day (use start date for single-day display)
        const existing = eventsByDate.get(key)!;
        if (!existing.some(e => e.id === evt.id)) {
          existing.push(evt);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    // Assignment events
    for (const a of data.assignmentEvents) {
      if (!a.startTime) continue;
      const d = new Date(a.startTime);
      if (isWithdrawn && d.getTime() >= cutoffMs) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!eventsByDate.has(key)) eventsByDate.set(key, []);
      eventsByDate.get(key)!.push({ ...a, type: 'event', isAssignment: true });
    }
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build sidebar list of current month schedule events
  const monthSchedule = (data?.events || [])
    .filter(e => e.type === 'schedule')
    .filter(e => trackFilter === 'all' || e.track === trackFilter)
    .filter(e => !isWithdrawn || new Date(e.startTime).getTime() < cutoffMs)
    .filter(e => {
      const d = new Date(e.startTime);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    // Deduplicate by title+startTime
    .filter((e, i, arr) => arr.findIndex(x => x.title === e.title && x.startTime === e.startTime) === i)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[#E1E1E1] flex items-center px-6 bg-white shrink-0 justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-[#2D3B45] min-w-[200px] text-center">{monthName}</h2>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
          <button onClick={goToday}
            className="px-3 py-1 text-sm border border-[#E1E1E1] rounded hover:bg-gray-50 text-[#2D3B45] transition-colors">
            Today
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {(['all', 'Weekday', 'Weekend'] as const).map(t => (
            <button key={t} onClick={() => setTrackFilter(t)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                trackFilter === t
                  ? 'bg-[#008EE2] text-white'
                  : 'border border-[#E1E1E1] text-[#2D3B45] hover:bg-gray-50'
              }`}>
              {t === 'all' ? 'All Tracks' : t}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#E1E1E1] bg-[#F5F5F5]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
            {days.map((day, i) => {
              const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const isCurrentMonth = day.getMonth() === month;
              const isToday = key === todayKey;
              const dayEvents = eventsByDate.get(key) || [];

              return (
                <div key={i}
                  className={`border-b border-r border-[#E1E1E1] p-1 min-h-[100px] ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  }`}>
                  <div className={`text-right text-sm mb-1 ${
                    isToday
                      ? 'font-bold'
                      : isCurrentMonth ? 'text-[#2D3B45]' : 'text-gray-300'
                  }`}>
                    <span className={isToday ? 'bg-[#008EE2] text-white rounded-full w-7 h-7 inline-flex items-center justify-center' : ''}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt, j) => {
                      const color = evt.course?.color || (evt.title.includes('WINTER BREAK') ? '#6B7280' : '#2D3B45');
                      const isSchedule = evt.type === 'schedule' || evt.title.includes('WINTER BREAK');
                      return (
                        <div key={`${evt.id}-${j}`}
                          className="text-[16px] leading-tight px-1.5 py-0.5 rounded truncate cursor-default"
                          style={{
                            backgroundColor: isSchedule ? color : 'transparent',
                            color: isSchedule ? '#fff' : color,
                            border: isSchedule ? 'none' : `1px solid ${color}`,
                          }}
                          title={evt.title}>
                          {evt.title.replace('Weekday — ', '').replace('Weekend — ', '')}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[16px] text-gray-400 pl-1.5">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar — Month Schedule */}
        <aside className="w-[280px] border-l border-[#E1E1E1] overflow-y-auto bg-[#FAFAFA] shrink-0">
          <div className="p-4 border-b border-[#E1E1E1]">
            <h3 className="text-sm font-bold text-[#2D3B45]">Module Schedule</h3>
            <p className="text-[16px] text-gray-400 mt-0.5">{monthName}</p>
          </div>
          {monthSchedule.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No modules this month</div>
          ) : (
            <div className="divide-y divide-[#E1E1E1]">
              {monthSchedule.map(evt => {
                const startDate = new Date(evt.startTime);
                const endDate = evt.endTime ? new Date(evt.endTime) : startDate;
                const color = evt.course?.color || '#6B7280';
                const moduleName = evt.title.replace('Weekday — ', '').replace('Weekend — ', '');
                return (
                  <div key={evt.id} className="p-3 hover:bg-white transition-colors">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[16px] font-semibold text-[#2D3B45] truncate">{moduleName}</span>
                    </div>
                    <div className="pl-[18px]">
                      <span className={`text-[16px] font-medium px-1.5 py-0.5 rounded ${
                        evt.track === 'Weekday' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {evt.track}
                      </span>
                      <span className="text-[16px] text-gray-400 ml-2">
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' — '}
                        {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// --- Inbox View ---

function InboxView() {
  const { data, loading } = useApi<{ messages: Message[] }>('/messages');
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (loading || !data) return <LoadingSpinner />;

  const messages = data.messages || [];
  const selected = messages[selectedIdx];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <header className="h-16 border-b border-[#E1E1E1] flex items-center px-4 bg-white shrink-0 space-x-4">
        <div className="flex-1 relative">
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-[#E1E1E1] rounded text-sm focus:outline-none" />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        <div className="flex items-center space-x-1 border-l border-[#E1E1E1] pl-4">
          <button className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600"><Reply size={20} /></button>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600"><Archive size={20} /></button>
          <button className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600"><Trash2 size={20} /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[350px] border-r border-[#E1E1E1] overflow-y-auto bg-white shrink-0">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No messages</div>
          ) : messages.map((msg, idx) => (
            <div key={msg.id} onClick={() => setSelectedIdx(idx)}
              className={`p-4 border-b border-[#E1E1E1] cursor-pointer ${idx === selectedIdx ? 'bg-[#E8F4FB]' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[16px] text-[#008EE2] font-medium">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
                {!msg.read && <span className="bg-[#2D3B45] text-white text-[16px] font-bold rounded-full w-5 h-5 flex items-center justify-center">!</span>}
              </div>
              <div className="flex items-start space-x-3">
                {!msg.read && <div className="w-3 h-3 bg-[#008EE2] rounded-full mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#2D3B45] truncate">{msg.sender.firstName} {msg.sender.lastName}</h4>
                  <p className="text-[16px] text-[#2D3B45] font-medium truncate mt-0.5">{msg.subject}</p>
                  <p className="text-[16px] text-gray-500 truncate mt-0.5">{msg.body.slice(0, 50)}...</p>
                </div>
              </div>
            </div>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {selected ? (
            <>
              <div className="p-6 border-b border-[#E1E1E1]">
                <h2 className="text-xl font-bold text-[#2D3B45]">{selected.subject}</h2>
              </div>
              <div className="p-8">
                <div className="flex items-start space-x-4 mb-8">
                  <div className="w-12 h-12 rounded-full border border-[#E1E1E1] flex items-center justify-center bg-white shrink-0">
                    <span className="text-xl text-[#008EE2] font-light">{selected.sender.firstName[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[16px] text-[#2D3B45]">{selected.sender.firstName} {selected.sender.lastName}</h3>
                      <span className="text-[16px] text-gray-500">{new Date(selected.createdAt).toLocaleString()}</span>
                    </div>
                    {selected.course && <p className="text-[16px] text-gray-500 mt-0.5">{selected.course.name}</p>}
                    <div className="mt-8 text-[16px] text-[#2D3B45] leading-relaxed whitespace-pre-wrap">{selected.body}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Select a message to read</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- All Assignments View (Top-Level Sidebar) ---

function AllAssignmentsView({ user, allAssignments, loading, onLoad, onSelectCourse }: {
  user: any;
  allAssignments: any[];
  loading: boolean;
  onLoad: () => void;
  onSelectCourse: (courseId: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    if (!loaded) {
      onLoad();
      setLoaded(true);
    }
  }, [loaded]);

  if (loading) return <LoadingSpinner />;

  // For students, only show submitted assignments and upcoming (not yet due)
  // ones. An assignment counts as upcoming only if it has a dueDate in the
  // future; assignments with no due date and no submission are hidden.
  const visibleAssignments = user.role === 'STUDENT'
    ? allAssignments.filter((a: any) => {
        const sub = a.submissions?.[0];
        if (sub && sub.status !== 'MISSING') return true;
        return !!(a.dueDate && new Date(a.dueDate) > new Date());
      })
    : allAssignments;

  // Group assignments by course
  const byCourse = new Map<string, { course: any; assignments: any[] }>();
  for (const a of visibleAssignments) {
    const courseId = a.courseId || a.course?.id || 'unknown';
    if (!byCourse.has(courseId)) {
      byCourse.set(courseId, {
        course: a.course || { id: courseId, name: 'Unknown Course', color: '#2D3B45' },
        assignments: [],
      });
    }
    byCourse.get(courseId)!.assignments.push(a);
  }

  const getStatusBadge = (a: any) => {
    if (user.role === 'STUDENT') {
      // Backend already filters submissions to the logged-in student for STUDENT role
      const sub = a.submissions?.[0];
      const pastDue = a.dueDate && new Date() > new Date(a.dueDate);
      if (!sub) {
        return pastDue
          ? <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-red-100 text-red-600">MISSING</span>
          : <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-gray-100 text-gray-600">NOT SUBMITTED</span>;
      }
      if (sub.status === 'MISSING') return <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-red-100 text-red-600">MISSING</span>;
      if (sub.status === 'SUBMITTED') return <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-blue-100 text-blue-700">SUBMITTED</span>;
      if (sub.status === 'GRADED') return <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-green-100 text-green-700">GRADED ({sub.score}/{a.points})</span>;
    }
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      const stats = a.submissionStats || { GRADED: 0, SUBMITTED: 0, MISSING: 0 };
      const graded = stats.GRADED || 0;
      const needsGrading = stats.SUBMITTED || 0;
      const total = graded + needsGrading;
      return (
        <div className="flex items-center space-x-2">
          <span className="text-[16px] text-gray-500">{total} submitted{graded > 0 ? ` • ${graded} graded` : ''}</span>
          {needsGrading > 0 && <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-amber-100 text-amber-700">{needsGrading} to grade</span>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="h-16 border-b border-[#E1E1E1] flex items-center justify-between px-8 bg-white shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <span className="text-sm text-gray-500">{visibleAssignments.length} total</span>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {visibleAssignments.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <NotebookPen size={48} className="mx-auto mb-4 opacity-40" />
              <p>No assignments found.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Array.from(byCourse.values()).map(({ course, assignments }) => (
                <div key={course.id}>
                  {/* Course Section Header */}
                  <div className="flex items-center space-x-3 mb-3 pb-2 border-b-2" style={{ borderColor: course.color || '#2D3B45' }}>
                    <div className="w-3 h-6 rounded" style={{ backgroundColor: course.color || '#2D3B45' }} />
                    <h2 className="text-lg font-bold text-[#2D3B45] cursor-pointer hover:underline" onClick={() => onSelectCourse(course.id)}>
                      {course.name}
                    </h2>
                    <span className="text-[16px] text-gray-400">{course.code}</span>
                    <span className="text-[16px] text-gray-400 ml-auto">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Assignment Rows */}
                  <div className="border border-[#E1E1E1] rounded-sm overflow-hidden">
                    <div className="bg-white divide-y divide-[#E1E1E1]">
                      {assignments.map((a: any) => {
                        const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();
                        return (
                          <div key={a.id} className="px-4 py-3 flex items-center hover:bg-gray-50 group cursor-pointer"
                            onClick={() => onSelectCourse(course.id)}>
                            <div className="mr-4 text-gray-400 group-hover:text-[#008EE2]"><FileText size={18} /></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[16px] text-[#2D3B45] group-hover:underline truncate">{a.title}</h4>
                              <p className="text-[16px] text-gray-500 mt-0.5">
                                {a.points} pts
                                {a.dueDate && (
                                  <span className={isPastDue ? 'text-red-500 font-medium' : ''}>
                                    {' '}• Due {new Date(a.dueDate).toLocaleDateString()}
                                    {isPastDue && ' (Past due)'}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="ml-4 shrink-0">
                              {getStatusBadge(a)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const [loginMode, setLoginMode] = useState<'student' | 'teacher'>('student');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isCoursesDrawerOpen, setIsCoursesDrawerOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [allAssignmentsLoading, setAllAssignmentsLoading] = useState(false);

  // Fetch user's courses for the drawer
  const { data: coursesData } = useApi<{ courses: Course[] }>(isLoggedIn ? '/courses' : null);

  const closeDrawers = () => {
    setIsAccountDrawerOpen(false);
    setIsCoursesDrawerOpen(false);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-white"><LoadingSpinner /></div>;
  }

  if (!isLoggedIn) {
    if (loginMode === 'teacher') {
      return <TeacherLoginView onSwitchRole={() => setLoginMode('student')} />;
    }
    return <StudentLoginView onSwitchRole={() => setLoginMode('teacher')} />;
  }

  const userRole = user!.role;

  return (
    <div className={`flex h-screen bg-white text-[#2D3B45] ${dyslexiaFont ? 'font-mono' : ''}`}>
      {/* Sidebar */}
      <aside className={`bg-[#2D3B45] flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-24'} overflow-y-auto overflow-x-hidden border-r border-[#E1E1E1] z-50`}>
        <CanvasLogo />
        <nav className="flex-1">
          <div onClick={() => { setIsAccountDrawerOpen(!isAccountDrawerOpen); setIsCoursesDrawerOpen(false); }}
            className={`flex flex-col items-center py-3 cursor-pointer transition-colors relative group ${isAccountDrawerOpen ? 'bg-white text-[#2D3B45]' : 'text-white hover:bg-[#3d4d5a]'}`}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-gray-400">
                <span className="text-white text-sm font-bold">{user!.firstName[0]}{user!.lastName[0]}</span>
              </div>
            </div>
            <span className="text-[16px] mt-1 font-medium">Account</span>
            {isAccountDrawerOpen && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#008EE2]" />}
          </div>

          {userRole === 'ADMIN' && (
            <SidebarItem icon={Shield} label="Admin" active={activeTab === 'Admin'}
              onClick={() => { setActiveTab('Admin'); setSelectedCourseId(null); closeDrawers(); }} />
          )}
          <SidebarItem icon={LayoutDashboard} label="Dashboard"
            active={activeTab === 'Dashboard' && !isAccountDrawerOpen && !isCoursesDrawerOpen}
            onClick={() => { setActiveTab('Dashboard'); setSelectedCourseId(null); closeDrawers(); }} />
          <SidebarItem icon={Book} label="Courses"
            active={isCoursesDrawerOpen || activeTab === 'Courses'}
            onClick={() => { setIsCoursesDrawerOpen(!isCoursesDrawerOpen); setIsAccountDrawerOpen(false); }} />
          {!(user as any)?.isAuditor && userRole !== 'STUDENT' && (
            <SidebarItem icon={NotebookPen} label="Assignments" active={activeTab === 'Assignments'}
              onClick={() => { setActiveTab('Assignments'); setSelectedCourseId(null); closeDrawers(); }} />
          )}
          <SidebarItem icon={Calendar} label="Calendar" active={activeTab === 'Calendar'}
            onClick={() => { setActiveTab('Calendar'); setSelectedCourseId(null); closeDrawers(); }} />
          <SidebarItem icon={Inbox} label="Inbox" active={activeTab === 'Inbox'}
            onClick={() => { setActiveTab('Inbox'); setSelectedCourseId(null); closeDrawers(); }} />
          <SidebarItem icon={HelpCircle} label="Help" active={activeTab === 'Help'}
            onClick={() => { setActiveTab('Help'); setSelectedCourseId(null); closeDrawers(); }} />
        </nav>

        <div className="p-4 flex justify-center cursor-pointer text-white hover:bg-[#3d4d5a] transition-colors"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          <ChevronLeft className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} size={24} />
        </div>
      </aside>

      {/* Account Drawer */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isAccountDrawerOpen ? 0 : -350 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 bottom-0 w-[300px] bg-white shadow-2xl z-40 border-r border-[#E1E1E1] flex flex-col"
        style={{ left: isSidebarCollapsed ? '64px' : '96px' }}>
        <div className="p-6 relative flex flex-col items-center">
          <button onClick={() => setIsAccountDrawerOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-[#008EE2] text-white flex items-center justify-center rounded-sm hover:bg-[#0077BE] transition-colors">
            <Plus size={20} className="rotate-45" />
          </button>
          <div className="mt-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-2 border-[#E1E1E1] flex items-center justify-center mb-4">
              <span className="text-4xl text-[#008EE2] font-light">{user!.firstName[0]}</span>
            </div>
            <h2 className="text-xl font-bold mb-4">{user!.firstName} {user!.lastName}</h2>
            <p className="text-sm text-gray-500 mb-4">{user!.email}</p>
            <button onClick={logout}
              className="px-4 py-1.5 bg-[#F5F5F5] border border-[#E1E1E1] rounded text-sm font-medium hover:bg-gray-100 transition-colors">
              Logout
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 border-t border-[#E1E1E1]">
          <nav className="flex flex-col space-y-3">
            {['Notifications', 'Files'].map(link => (
              <a key={link} href="#" className="text-[#008EE2] text-sm hover:underline">{link}</a>
            ))}
            <a className="text-[#008EE2] text-sm hover:underline cursor-pointer" onClick={() => { setActiveTab('Settings'); setSelectedCourseId(null); closeDrawers(); }}>Settings</a>
          </nav>

          <div className="mt-10 pt-6 border-t border-[#E1E1E1]">
            <h3 className="text-lg font-bold mb-6">Accessibility Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm">Use High Contrast UI</span>
                <div onClick={() => setHighContrast(!highContrast)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${highContrast ? 'bg-[#008EE2]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${highContrast ? 'left-[22px]' : 'left-0.5'} shadow-sm`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Use a Dyslexia Friendly Font</span>
                <div onClick={() => setDyslexiaFont(!dyslexiaFont)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${dyslexiaFont ? 'bg-[#008EE2]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${dyslexiaFont ? 'left-[22px]' : 'left-0.5'} shadow-sm`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Courses Drawer */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isCoursesDrawerOpen ? 0 : -350 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 bottom-0 w-[300px] bg-white shadow-2xl z-40 border-r border-[#E1E1E1] flex flex-col"
        style={{ left: isSidebarCollapsed ? '64px' : '96px' }}>
        <div className="p-6 relative flex flex-col">
          <button onClick={() => setIsCoursesDrawerOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-[#008EE2] text-white flex items-center justify-center rounded-sm hover:bg-[#0077BE] transition-colors">
            <Plus size={20} className="rotate-45" />
          </button>
          <h2 className="text-xl font-bold mb-8">Courses</h2>
          <nav className="flex flex-col space-y-6">
            <a href="#" className="text-[#008EE2] text-sm hover:underline">All Courses</a>
            <div className="pt-4 border-t border-[#E1E1E1] space-y-4">
              {coursesData?.courses.map(course => (
                <div key={course.id}>
                  <button onClick={() => { setSelectedCourseId(course.id); setActiveTab('Courses'); closeDrawers(); }}
                    className="text-[#008EE2] text-sm font-medium hover:underline leading-tight text-left">
                    {course.name}
                  </button>
                  <span className="text-[16px] text-gray-500 mt-1 block">{course.code}</span>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isAccountDrawerOpen || isCoursesDrawerOpen ? 'opacity-50' : 'opacity-100'}`}>
        {userRole === 'ADMIN' && activeTab === 'Admin' ? (
          <AdminCoursesView onCourseSelect={id => { setSelectedCourseId(id); setActiveTab('Courses'); }} />
        ) : userRole === 'ADMIN' && activeTab === 'Dashboard' && !selectedCourseId ? (
          <AdminDashboardView onCourseSelect={id => setSelectedCourseId(id)} onNavigate={tab => setActiveTab(tab)} />
        ) : userRole === 'TEACHER' && activeTab === 'Dashboard' && !selectedCourseId ? (
          <TeacherDashboardView onCourseSelect={id => setSelectedCourseId(id)} />
        ) : activeTab === 'Calendar' ? (
          <CalendarView />
        ) : activeTab === 'Inbox' ? (
          <InboxView />
        ) : activeTab === 'Assignments' ? (
          <AllAssignmentsView
            user={user!}
            allAssignments={allAssignments}
            loading={allAssignmentsLoading}
            onLoad={async () => {
              setAllAssignmentsLoading(true);
              const res = await api<any>('/assignments');
              if (res.success) setAllAssignments(res.data || []);
              setAllAssignmentsLoading(false);
            }}
            onSelectCourse={(courseId: string) => { setSelectedCourseId(courseId); setActiveTab('Courses'); }}
          />
        ) : selectedCourseId ? (
          <CourseView courseId={selectedCourseId} />
        ) : activeTab === 'Dashboard' ? (
          <StudentDashboardView onCourseSelect={id => setSelectedCourseId(id)} />
        ) : activeTab === 'Settings' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <header className="h-16 border-b border-[#E1E1E1] flex items-center px-8 bg-white shrink-0">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-6">

                {/* Profile Settings */}
                <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                  <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                    <h2 className="font-bold text-[16px] text-[#2D3B45]">Profile</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="w-20 h-20 rounded-full border-2 border-[#E1E1E1] flex items-center justify-center bg-gray-100">
                        <span className="text-3xl text-[#008EE2] font-light">{user!.firstName[0]}{user!.lastName[0]}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#2D3B45]">{user!.firstName} {user!.lastName}</h3>
                        <p className="text-sm text-gray-500">{user!.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[16px] font-bold rounded-full ${userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : userRole === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{userRole}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Name:</span> <span className="font-medium">{user!.firstName} {user!.lastName}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="font-medium">{user!.email}</span></div>
                      <div><span className="text-gray-500">Role:</span> <span className="font-medium">{userRole}</span></div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                  <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                    <h2 className="font-bold text-[16px] text-[#2D3B45]">Notification Preferences</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { label: 'Assignment due date reminders', desc: 'Get notified before assignments are due' },
                      { label: 'Grade posted notifications', desc: 'Get notified when a grade is posted' },
                      { label: 'Course announcements', desc: 'Receive course announcement notifications' },
                      ...(userRole === 'TEACHER' || userRole === 'ADMIN' ? [
                        { label: 'New submission alerts', desc: 'Get notified when students submit work' },
                      ] : []),
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-[16px] font-medium text-[#2D3B45]">{item.label}</p>
                          <p className="text-[16px] text-gray-500">{item.desc}</p>
                        </div>
                        <span className="px-3 py-1 text-[16px] font-bold rounded-full bg-green-100 text-green-700">On</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Display Settings */}
                <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                  <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                    <h2 className="font-bold text-[16px] text-[#2D3B45]">Display Settings</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[16px] font-medium text-[#2D3B45]">High Contrast Mode</p>
                        <p className="text-[16px] text-gray-500">Increase contrast for better readability</p>
                      </div>
                      <button onClick={() => setHighContrast(!highContrast)}
                        className={`w-12 h-6 rounded-full transition-colors ${highContrast ? 'bg-[#008EE2]' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${highContrast ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[16px] font-medium text-[#2D3B45]">Dyslexia-Friendly Font</p>
                        <p className="text-[16px] text-gray-500">Use a monospace font for easier reading</p>
                      </div>
                      <button onClick={() => setDyslexiaFont(!dyslexiaFont)}
                        className={`w-12 h-6 rounded-full transition-colors ${dyslexiaFont ? 'bg-[#008EE2]' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${dyslexiaFont ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[16px] font-medium text-[#2D3B45]">Language</p>
                        <p className="text-[16px] text-gray-500">Interface language</p>
                      </div>
                      <span className="text-[16px] font-medium text-[#2D3B45]">English (EN)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[16px] font-medium text-[#2D3B45]">Time Zone</p>
                        <p className="text-[16px] text-gray-500">Used for due dates and scheduling</p>
                      </div>
                      <span className="text-[16px] font-medium text-[#2D3B45]">Eastern Time (ET)</span>
                    </div>
                  </div>
                </div>

                {/* Admin-specific settings */}
                {userRole === 'ADMIN' && (
                  <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                      <h2 className="font-bold text-[16px] text-[#2D3B45]">Administration</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      {[
                        { label: 'Allow student self-enrollment', desc: 'Students can enroll themselves in published courses' },
                        { label: 'Require email verification', desc: 'New accounts must verify email before accessing courses' },
                        { label: 'Enable course evaluations', desc: 'Allow students to evaluate courses at the end of term' },
                        { label: 'Auto-grade MCQ quizzes', desc: 'Automatically grade and show results for MCQ-only quizzes' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-[16px] font-medium text-[#2D3B45]">{item.label}</p>
                            <p className="text-[16px] text-gray-500">{item.desc}</p>
                          </div>
                          <span className="px-3 py-1 text-[16px] font-bold rounded-full bg-green-100 text-green-700">Enabled</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher-specific settings */}
                {userRole === 'TEACHER' && (
                  <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                    <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                      <h2 className="font-bold text-[16px] text-[#2D3B45]">Teaching Preferences</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      {[
                        { label: 'Show quiz results to students immediately', desc: 'Students see their MCQ scores right after submission' },
                        { label: 'Allow late submissions', desc: 'Accept submissions after the due date (marked as late)' },
                        { label: 'Enable negative marking for MCQs', desc: 'Deduct points for wrong MCQ answers' },
                        { label: 'Auto-publish assignments', desc: 'New assignments are published by default' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-[16px] font-medium text-[#2D3B45]">{item.label}</p>
                            <p className="text-[16px] text-gray-500">{item.desc}</p>
                          </div>
                          <span className="px-3 py-1 text-[16px] font-bold rounded-full bg-green-100 text-green-700">On</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        ) : activeTab === 'Help' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <header className="h-16 border-b border-[#E1E1E1] flex items-center px-8 bg-white shrink-0">
              <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-8">

                {/* Student Help */}
                {(userRole === 'STUDENT' || userRole === 'ADMIN') && (
                  <>
                    <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                      <div className="bg-[#008EE2] text-white px-6 py-4">
                        <h2 className="text-lg font-bold">How to Submit an Assignment</h2>
                      </div>
                      <div className="p-6">
                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008EE2] text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Navigate to your Course</h3>
                              <p className="text-sm text-gray-600">Click on <strong>Courses</strong> in the sidebar, then select your course from the list.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008EE2] text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Go to Assignments</h3>
                              <p className="text-sm text-gray-600">Click the <strong>Assignments</strong> tab in the left course navigation menu.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008EE2] text-white flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Select the Assignment</h3>
                              <p className="text-sm text-gray-600">Click on the assignment you want to submit. You'll see the assignment details, instructions, and any attached documents.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008EE2] text-white flex items-center justify-center font-bold shrink-0">4</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Submit your Work</h3>
                              <p className="text-sm text-gray-600"><strong>For File-based assignments:</strong> Click "Choose File", select your PDF or document, add an optional comment, and click <strong>Submit</strong>.</p>
                              <p className="text-sm text-gray-600 mt-2"><strong>For MCQ/Quiz assignments:</strong> Read each question, select your answer from the options, and click <strong>Submit Answers</strong> when done. MCQ quizzes are auto-graded instantly.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008EE2] text-white flex items-center justify-center font-bold shrink-0">5</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Check your Status</h3>
                              <p className="text-sm text-gray-600">After submission, your status will show as <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-blue-100 text-blue-700">SUBMITTED</span>. Once your teacher grades it, it will change to <span className="px-2 py-0.5 text-[16px] font-bold rounded-full bg-green-100 text-green-700">GRADED</span> with your score and feedback.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                      <div className="bg-[#2D3B45] text-white px-6 py-4">
                        <h2 className="text-lg font-bold">Tips for Students</h2>
                      </div>
                      <div className="p-6">
                        <ul className="space-y-3 text-sm text-gray-600">
                          <li className="flex items-start space-x-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /><span>Check the <strong>due date</strong> before starting — late submissions are marked accordingly.</span></li>
                          <li className="flex items-start space-x-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /><span>For file uploads, only <strong>PDF, DOC, and DOCX</strong> formats are accepted.</span></li>
                          <li className="flex items-start space-x-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /><span>For timed quizzes, keep an eye on the <strong>countdown timer</strong> — the quiz auto-submits when time runs out.</span></li>
                          <li className="flex items-start space-x-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /><span>You can <strong>resubmit</strong> file-based assignments before they are graded.</span></li>
                          <li className="flex items-start space-x-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /><span>Check the <strong>Syllabus</strong> tab for the full course schedule and module breakdown.</span></li>
                          <li className="flex items-start space-x-2"><Check size={16} className="text-green-600 shrink-0 mt-0.5" /><span>Your <strong>Dashboard</strong> shows your course progress and current module.</span></li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* Teacher Help */}
                {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
                  <>
                    <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                      <div className="bg-[#008744] text-white px-6 py-4">
                        <h2 className="text-lg font-bold">How to Create Assignments & Questions</h2>
                      </div>
                      <div className="p-6">
                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008744] text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Go to your Course</h3>
                              <p className="text-sm text-gray-600">Click <strong>Courses</strong> in the sidebar, then select the course you want to add an assignment to.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008744] text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Click "New Assignment"</h3>
                              <p className="text-sm text-gray-600">In the <strong>Assignments</strong> tab, click the blue <strong>+ New Assignment</strong> button in the top right.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008744] text-white flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Choose the Format</h3>
                              <p className="text-sm text-gray-600">Select the assignment format:</p>
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center space-x-2"><span className="px-2 py-0.5 text-[16px] font-bold rounded bg-gray-200 text-gray-700">FILE</span><span className="text-sm text-gray-600">Students upload a PDF/document</span></div>
                                <div className="flex items-center space-x-2"><span className="px-2 py-0.5 text-[16px] font-bold rounded bg-[#008EE2] text-white">MCQ</span><span className="text-sm text-gray-600">Multiple choice questions — auto-graded</span></div>
                                <div className="flex items-center space-x-2"><span className="px-2 py-0.5 text-[16px] font-bold rounded bg-purple-600 text-white">THEORY</span><span className="text-sm text-gray-600">Open-ended text answers — manual grading</span></div>
                                <div className="flex items-center space-x-2"><span className="px-2 py-0.5 text-[16px] font-bold rounded bg-amber-500 text-white">MIXED</span><span className="text-sm text-gray-600">Both MCQ and theory questions</span></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008744] text-white flex items-center justify-center font-bold shrink-0">4</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Add Questions (MCQ/Theory/Mixed)</h3>
                              <p className="text-sm text-gray-600">Use the question builder to add questions:</p>
                              <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                                <li>Click <strong>"+ Add MCQ"</strong> or <strong>"+ Add Theory"</strong></li>
                                <li>Type the question text and set points</li>
                                <li>For MCQ: add 2-6 options and mark the correct answer</li>
                                <li>For Theory: optionally set a word limit</li>
                                <li>Use the arrow buttons to reorder questions</li>
                                <li>Add an explanation (shown to students after grading)</li>
                              </ul>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#008744] text-white flex items-center justify-center font-bold shrink-0">5</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Configure & Publish</h3>
                              <p className="text-sm text-gray-600">Set optional settings like <strong>time limit</strong>, <strong>negative marking</strong>, <strong>shuffle questions</strong>, and <strong>show results</strong>. Then click <strong>Create Assignment</strong>.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                      <div className="bg-[#C23C2D] text-white px-6 py-4">
                        <h2 className="text-lg font-bold">How to Grade Submissions</h2>
                      </div>
                      <div className="p-6">
                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#C23C2D] text-white flex items-center justify-center font-bold shrink-0">1</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">View Submissions</h3>
                              <p className="text-sm text-gray-600">Click on any assignment to see the list of student submissions with their status.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#C23C2D] text-white flex items-center justify-center font-bold shrink-0">2</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Review & Grade</h3>
                              <p className="text-sm text-gray-600"><strong>File submissions:</strong> Click to view the uploaded file, enter a score and feedback, then save.</p>
                              <p className="text-sm text-gray-600 mt-1"><strong>MCQ quizzes:</strong> Auto-graded — you can review answers but scores are calculated automatically.</p>
                              <p className="text-sm text-gray-600 mt-1"><strong>Theory answers:</strong> Read the student's response, assign points per question, add feedback, and save.</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#C23C2D] text-white flex items-center justify-center font-bold shrink-0">3</div>
                            <div>
                              <h3 className="font-bold text-[#2D3B45] mb-1">Use "View as Student"</h3>
                              <p className="text-sm text-gray-600">Click the <strong>"View as Student"</strong> button in the course header to preview how students see your assignments and quizzes.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Contact Support */}
                <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                  <div className="bg-[#F5F5F5] px-6 py-4 border-b border-[#E1E1E1]">
                    <h2 className="font-bold text-[16px] text-[#2D3B45]">Need More Help?</h2>
                  </div>
                  <div className="p-6 text-sm text-gray-600">
                    <p>If you're experiencing issues or have questions not covered here, please contact the IT support team:</p>
                    <div className="mt-4 space-y-2">
                      <p><strong>Email:</strong> portal@tahacollege.ca</p>
                      <p><strong>Phone:</strong> Available during office hours</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>{activeTab} — coming soon</p>
          </div>
        )}

        {/* Footer */}
        <footer className="h-16 border-t border-[#E1E1E1] flex items-center justify-between px-8 bg-white text-[16px] text-gray-500 shrink-0">
          <div className="flex items-center space-x-4">
            <img src="/taha-logo-full.png" alt="TAHA College" className="h-8 w-auto" />
          </div>
        </footer>
      </main>
    </div>
  );
}
