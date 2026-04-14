/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard, Book, Calendar, Inbox, Clock, HelpCircle,
  ChevronLeft, Plus, NotebookPen, MoreVertical, ChevronRight,
  Megaphone, FileText, Folder,
  Menu, Eye, Check, Search, Reply, Archive, Trash2, Shield, Upload, X, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './context/AuthContext';
import { useApi } from './hooks/useApi';
import { api, getAccessToken } from './api/client';
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
        <span className="absolute -top-1 -right-1 bg-[#008EE2] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#2D3B45]">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[11px] mt-1 font-medium">{label}</span>
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
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <header className="h-24 bg-[#4A90E2] flex items-center px-12 shadow-md">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white rounded-sm mr-3 flex items-center justify-center">
            <div className="w-6 h-6 bg-[#4A90E2] transform rotate-45" />
          </div>
          <h1 className="text-white text-4xl font-bold tracking-tight drop-shadow-sm">TAHA College</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-20 px-4">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-bold text-black mb-10">Enter your username and password</h2>
          <p className="text-[15px] text-black mb-12">
            A service has requested you to authenticate yourself. Please enter your username and password in the form below.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center space-y-4 max-w-md mx-auto">
            <div className="flex items-center w-full">
              <label className="w-32 text-right pr-4 text-[15px]">Username</label>
              <input
                type="text" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 border border-[#4A90E2] rounded-sm px-2 py-1.5 focus:outline-none shadow-inner"
              />
            </div>
            <div className="flex items-center w-full">
              <label className="w-32 text-right pr-4 text-[15px]">Password</label>
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
            <h3 className="font-bold text-gray-600 text-[15px] mb-2">Help! I don't remember my password.</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Without your username and password you cannot authenticate yourself for access to the service. There may be someone that can help you. Consult the help desk at your organization!
            </p>
          </div>
        </div>
      </main>

      <footer className="h-24 bg-[#4A90E2] flex items-center justify-between px-12 text-white text-[13px]">
        <div className="flex-1 text-center">© 2026 TAHA College</div>
        <div className="flex items-center">
          <div className="w-6 h-6 bg-white rounded-sm mr-2 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#4A90E2] transform rotate-45" />
          </div>
          <span className="font-bold">Taha College</span>
        </div>
      </footer>

      {/* Role switcher for demo */}
      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <button onClick={() => onSwitchRole('teacher')} className="bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[10px] px-2 py-1 rounded shadow-lg border border-white/20">
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
    <div className="min-h-screen flex flex-col bg-[#3d4d5a] font-sans">
      <header className="h-16 bg-white flex items-center px-6 shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#E02020] rounded-sm mr-2 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[#E02020] font-bold text-sm tracking-tighter">TAHA</span>
            <span className="text-gray-800 font-bold text-sm tracking-tighter">CANVAS</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-[500px] rounded-sm shadow-2xl p-12 flex flex-col items-center">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center">
              <div className="w-12 h-12 border-2 border-[#008EE2] rounded-lg flex items-center justify-center mr-3">
                <span className="text-[#008EE2] text-3xl font-bold italic">T</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-[#008EE2] text-3xl font-bold tracking-tight">TAHACOLLEGE</h1>
                <span className="text-[#008EE2] text-[8px] font-bold tracking-[0.2em] uppercase">Beauty. Business. Health & Technology</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl text-gray-700 mb-8">Welcome to Canvas</h2>

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
        <button onClick={() => onSwitchRole('student')} className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded border border-white/20">
          Switch to Student Login
        </button>
      </div>
    </div>
  );
}

// --- Dashboard Components ---

function StudentDashboardView({ onCourseSelect }: { onCourseSelect: (id: string) => void }) {
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
                  <div className="flex items-center space-x-4 mt-2 text-[12px] text-white/60">
                    {profile.vNumber && <span>ID: {profile.vNumber}</span>}
                    {profile.program && <span>Program: {profile.program}</span>}
                    {profile.campus && <span>Campus: {profile.campus}</span>}
                    {profile.shift && <span>Shift: {profile.shift}</span>}
                  </div>
                </div>
                {profile.campusStatus && (
                  <span className={`px-3 py-1 text-[12px] font-bold rounded-full ${profile.campusStatus === 'Start' || profile.campusStatus === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {profile.campusStatus}
                  </span>
                )}
              </div>
            </div>
          )}

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
                const progressList = e.studentProgress || [];
                const completedCount = progressList.filter((p: any) => p.status === 'COMPLETED').length;
                const inProgressMod = progressList.find((p: any) => p.status === 'IN_PROGRESS');
                const currentModule = inProgressMod ? modules.find((m: any) => m.id === inProgressMod.moduleId) : null;
                const totalMods = modules.length;
                const progress = e.overallProgress || (totalMods > 0 ? (completedCount / totalMods) * 100 : 0);

                return (
                  <div key={e.id} className="border border-[#E1E1E1] rounded-lg overflow-hidden">
                    {/* Course header */}
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => onCourseSelect(e.course.id)}>
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-10 rounded" style={{ backgroundColor: e.course.color || '#2D3B45' }} />
                        <div>
                          <h3 className="font-bold text-[#2D3B45]">{e.course.name}</h3>
                          <div className="flex items-center space-x-3 text-[12px] text-gray-500 mt-1">
                            {e.batchCode && <span className="px-2 py-0.5 bg-[#2D3B45] text-white text-[10px] font-bold rounded">{e.batchCode}</span>}
                            {e.campus && <span>{e.campus}</span>}
                            {e.classTime && <span>{e.classTime}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#008EE2]">{Math.round(progress)}%</div>
                        <div className="text-[11px] text-gray-400">progress</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-4 pb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#008EE2] h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                        <span>{completedCount} of {totalMods} modules completed</span>
                        {currentModule && <span>Current: <span className="font-medium text-[#2D3B45]">{currentModule.name}</span></span>}
                      </div>
                    </div>

                    {/* Module timeline */}
                    {modules.length > 0 && (
                      <div className="px-4 pb-4">
                        <div className="flex items-center space-x-1 mt-2">
                          {modules.map((mod: any) => {
                            const mp = progressList.find((p: any) => p.moduleId === mod.id);
                            const status = mp?.status || 'NOT_STARTED';
                            const joinPos = e.joinedModulePosition || 1;
                            const isSkipped = mod.position < joinPos && status === 'NOT_STARTED';

                            return (
                              <div key={mod.id} className="group relative flex-1" title={`${mod.name} — ${status}`}>
                                <div className={`h-3 rounded-sm ${
                                  status === 'COMPLETED' ? 'bg-green-500' :
                                  status === 'IN_PROGRESS' ? 'bg-[#008EE2] animate-pulse' :
                                  isSkipped ? 'bg-gray-300' :
                                  'bg-gray-200'
                                }`} />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#2D3B45] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {mod.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-[10px] text-gray-400">
                          <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-green-500" /><span>Completed</span></div>
                          <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-[#008EE2]" /><span>Current</span></div>
                          <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-gray-200" /><span>Upcoming</span></div>
                          {e.joinedModulePosition > 1 && <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-gray-300" /><span>Before join</span></div>}
                        </div>
                      </div>
                    )}

                    {/* Details row */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-[#E1E1E1] grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-gray-500">
                      {e.startDate && <span>Start: <span className="font-medium text-gray-700">{new Date(e.startDate).toLocaleDateString()}</span></span>}
                      {e.endDate && <span>End: <span className="font-medium text-gray-700">{new Date(e.endDate).toLocaleDateString()}</span></span>}
                      {e.totalFees && <span>Fees: <span className="font-medium text-gray-700">${e.totalFees.toLocaleString()}</span></span>}
                      {e.lastStatus && <span>Status: <span className={`font-medium ${e.lastStatus.includes('Start') || e.lastStatus.includes('Active') ? 'text-green-600' : 'text-gray-700'}`}>{e.lastStatus}</span></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                          <span className="px-2.5 py-1 bg-[#2D3B45] text-white text-[11px] font-bold rounded">{b.batchCode}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${status === 'ACTIVE' ? 'bg-green-100 text-green-700' : status === 'COMPLETED' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{status}</span>
                        </div>
                        <span className="text-[12px] font-bold text-gray-600">{b.studentCount} students</span>
                      </div>
                      <h3 className="font-bold text-[#2D3B45] text-sm">{b.course.name}</h3>

                      {/* Current module indicator */}
                      {b.currentModuleName && (
                        <div className="mt-2 text-[12px]">
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

                      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
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
        </div>
      </div>
    </div>
  );
}

function AdminDashboardView({ onCourseSelect }: { onCourseSelect: (id: string) => void }) {
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
            <div className="bg-[#008EE2] text-white rounded-lg p-6">
              <div className="text-4xl font-bold">{data.stats.totalStudents}</div>
              <div className="text-sm opacity-80 mt-1">Active Students</div>
            </div>
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
              <a href="#" className="text-[#008EE2] text-[11px] flex items-center hover:underline">
                <Calendar size={12} className="mr-1" /> View Calendar
              </a>
            </div>
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nothing upcoming</p>
            ) : data.upcoming.map(a => (
              <div key={a.id} className="flex items-start space-x-3 mb-4">
                <div className="mt-1 text-gray-400"><NotebookPen size={16} /></div>
                <div className="flex-1 min-w-0">
                  <a href="#" className="text-[#008EE2] text-sm hover:underline block leading-tight">{a.title}</a>
                  <p className="text-[11px] text-gray-400">{a.points} points • {a.dueDate && new Date(a.dueDate).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-[#2D3B45] text-sm py-2 px-4 rounded transition-colors text-left">
              Start a New Course
            </button>
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-[#2D3B45] text-sm py-2 px-4 rounded transition-colors text-left">
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
  const [adminActiveSection, setAdminActiveSection] = useState('Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [peoplePage, setPeoplePage] = useState(1);
  const [peopleRole, setPeopleRole] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [selectedBatchCode, setSelectedBatchCode] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, loading } = useApi<{ courses: Course[]; total: number }>('/courses?limit=100');
  const { data: peopleData, loading: peopleLoading } = useApi<{ users: any[]; total: number; totalPages: number }>(
    adminActiveSection === 'People'
      ? `/users?page=${peoplePage}&limit=25${peopleRole ? `&role=${peopleRole}` : ''}${peopleSearch ? `&search=${encodeURIComponent(peopleSearch)}` : ''}`
      : null
  );
  const [batchSearch, setBatchSearch] = useState('');
  const [batchTypeFilter, setBatchTypeFilter] = useState<'all' | 'PRIMARY' | 'MID_COURSE'>('all');
  const { data: batchesData, loading: batchesLoading, refetch: refetchBatches } = useApi<any[]>(
    adminActiveSection === 'Batches' && !selectedBatchCode ? `/enrollments/batch-summary` : null
  );
  const [batchStudentPage, setBatchStudentPage] = useState(1);
  const { data: batchStudents, loading: batchStudentsLoading, refetch: refetchBatchStudents } = useApi<any>(
    selectedBatchCode ? `/enrollments?batchCode=${selectedBatchCode}&page=${batchStudentPage}&limit=50` : null
  );
  const { data: userProfile, loading: userProfileLoading } = useApi<any>(
    selectedUserId ? `/users/${selectedUserId}` : null
  );
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
    'Courses', 'Batches', 'People', 'Statistics', 'Permissions', 'Outcomes',
    'Rubrics', 'Grading', 'Question Banks', 'Sub-Accounts',
    'Account Calendars', 'Terms', 'Authentication', 'SIS Import',
    'Themes', 'Developer Keys', 'Analytics Hub', 'Apps', 'Admin Analytics'
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
              <span className="text-[15px]">{item}</span>
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
                  <table className="w-full text-left text-[14px]">
                    <thead>
                      <tr className="text-[#008EE2] font-bold">
                        <th className="py-4 px-4 w-16">Status</th>
                        <th className="py-4 px-4">Course</th>
                        <th className="py-4 px-4">SIS ID</th>
                        <th className="py-4 px-4">Term</th>
                        <th className="py-4 px-4">Teacher</th>
                        <th className="py-4 px-4">Sub-Account</th>
                        <th className="py-4 px-4">Students</th>
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
                          <td className="py-4 px-4">
                            {course.teachers?.map((t, idx) => (
                              <div key={idx} className="flex items-center space-x-2 mb-1">
                                <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[11px] font-medium text-gray-600 bg-white">
                                  {t.initial}
                                </div>
                                <a href="#" className="text-[#008EE2] hover:underline text-[13px]">{t.name}</a>
                              </div>
                            ))}
                          </td>
                          <td className="py-4 px-4"><a href="#" className="text-[#008EE2] hover:underline">{course.subAccount}</a></td>
                          <td className="py-4 px-4 text-gray-600">{course.studentCount}</td>
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
                    <table className="w-full text-left text-[14px]">
                      <thead>
                        <tr className="text-[#008EE2] font-bold">
                          <th className="py-4 px-4">Name</th>
                          <th className="py-4 px-4">Email</th>
                          <th className="py-4 px-4">Role</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4">Last Login</th>
                          <th className="py-4 px-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {peopleData?.users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedUserId(u.id); setAdminActiveSection('Batches'); }}>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-[12px] font-medium text-gray-600 bg-gray-50">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-medium text-[#008EE2] hover:underline">{u.firstName} {u.lastName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-600 text-[13px]">{u.email}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>{u.role}</span>
                            </td>
                            <td className="py-4 px-4">
                              {u.isActive ? (
                                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-100 text-green-700">Active</span>
                              ) : (
                                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-100 text-red-600">Inactive</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-[13px] text-gray-500">
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="py-4 px-4 text-[13px] text-gray-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
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
                      <div className="flex items-start space-x-6 mb-8">
                        <div className="w-20 h-20 rounded-full border-2 border-[#E1E1E1] flex items-center justify-center bg-gray-50 shrink-0">
                          <span className="text-3xl text-[#008EE2] font-light">{userProfile.firstName?.[0]}{userProfile.lastName?.[0]}</span>
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-[#2D3B45]">{userProfile.firstName} {userProfile.lastName}</h1>
                          <p className="text-gray-500">{userProfile.email}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${userProfile.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : userProfile.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{userProfile.role}</span>
                            {userProfile.isActive ? <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-100 text-green-700">Active</span> : <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-100 text-red-600">Inactive</span>}
                          </div>
                        </div>
                      </div>

                      {/* Student details grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {[
                          { label: 'Student ID', value: userProfile.vNumber },
                          { label: 'Email', value: userProfile.email },
                          { label: 'Contact', value: userProfile.contactNo },
                          { label: 'Address', value: userProfile.address },
                          { label: 'Campus', value: userProfile.campus },
                          { label: 'Program', value: userProfile.program },
                          { label: 'Shift', value: userProfile.shift },
                          { label: 'Start Date', value: userProfile.startDate ? new Date(userProfile.startDate).toLocaleDateString() : null },
                          { label: 'Finish Date', value: userProfile.finishDate ? new Date(userProfile.finishDate).toLocaleDateString() : null },
                          { label: 'Status', value: userProfile.campusStatus },
                          { label: 'Admission Rep', value: userProfile.admissionRep },
                          { label: 'Last Login', value: userProfile.lastLoginAt ? new Date(userProfile.lastLoginAt).toLocaleString() : 'Never' },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{f.label}</div>
                            <div className="text-[14px] font-medium text-[#2D3B45]">{f.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Enrollments */}
                      {userProfile.enrollments?.length > 0 && (
                        <>
                          <h2 className="text-lg font-bold text-[#2D3B45] mb-4 border-b border-gray-200 pb-2">Enrollments ({userProfile.enrollments.length})</h2>
                          <div className="space-y-3">
                            {userProfile.enrollments.map((e: any) => (
                              <div key={e.id} className="border border-[#E1E1E1] rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    {e.batchCode && <span className="px-2.5 py-1 bg-[#2D3B45] text-white text-[11px] font-bold rounded">{e.batchCode}</span>}
                                    <span className="font-bold text-[#2D3B45]">{e.course.name}</span>
                                  </div>
                                  {e.lastStatus && <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${e.lastStatus.includes('Start') || e.lastStatus.includes('Active') ? 'bg-green-100 text-green-700' : e.lastStatus.includes('Withdrawal') || e.lastStatus.includes('Cancel') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{e.lastStatus}</span>}
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[12px] text-gray-500">
                                  {e.campus && <span>Campus: <span className="font-medium text-gray-700">{e.campus}</span></span>}
                                  {e.classTime && <span>Time: <span className="font-medium text-gray-700">{e.classTime}</span></span>}
                                  {e.classDays && <span>Days: <span className="font-medium text-gray-700">{e.classDays}</span></span>}
                                  {e.totalFees && <span>Fees: <span className="font-medium text-gray-700">${e.totalFees.toLocaleString()}</span></span>}
                                  {e.startDate && <span>Start: <span className="font-medium text-gray-700">{new Date(e.startDate).toLocaleDateString()}</span></span>}
                                  {e.endDate && <span>End: <span className="font-medium text-gray-700">{new Date(e.endDate).toLocaleDateString()}</span></span>}
                                  {e.studyHours && <span>Hours: <span className="font-medium text-gray-700">{e.studyHours}</span></span>}
                                  {e.contractSigned && <span>Contract: <span className="font-medium text-gray-700">{e.contractSigned}</span></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

              ) : selectedBatchCode ? (
                /* Batch Student List */
                <div>
                  <button onClick={() => { setSelectedBatchCode(null); setBatchStudentPage(1); setShowEnrollDialog(false); setEnrollResult(null); }} className="flex items-center text-[#008EE2] text-sm mb-6 hover:underline">
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
                            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${bType === 'PRIMARY' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                              {bType === 'PRIMARY' ? 'Primary' : 'Mid-Course'}
                            </span>
                            {batchInfo.parentBatchCode && (
                              <button onClick={() => setSelectedBatchCode(batchInfo.parentBatchCode)} className="text-[11px] text-[#008EE2] hover:underline">
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
                              {sb.batchCode} <span className="text-[11px] text-amber-500">({sb.studentCount} students)</span>
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
                              {u.vNumber && <span className="text-[11px] text-gray-400">{u.vNumber}</span>}
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
                            {enrollResult.isMidCourseJoin && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[11px] rounded">Mid-course join</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {batchStudentsLoading ? <LoadingSpinner /> : (
                    <div className="border-t border-gray-200">
                      <table className="w-full text-left text-[14px]">
                        <thead>
                          <tr className="text-[#008EE2] font-bold">
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Student ID</th>
                            <th className="py-3 px-4">Joined Module</th>
                            <th className="py-3 px-4">Current Module</th>
                            <th className="py-3 px-4">Progress</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(batchStudents?.enrollments || []).map((e: any) => {
                            const joinPos = e.joinedModulePosition || 1;
                            const modules = e.course?.modules || [];
                            const currentMod = e.currentModuleId ? modules.find((m: any) => m.id === e.currentModuleId) : null;
                            const progress = e.overallProgress || 0;
                            return (
                            <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUserId(e.user.id)}>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[11px] font-medium text-gray-600 bg-gray-50">
                                    {e.user.firstName?.[0]}{e.user.lastName?.[0]}
                                  </div>
                                  <span className="font-medium text-[#008EE2] hover:underline">{e.user.firstName} {e.user.lastName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-500 text-[13px]">{e.user.email}</td>
                              <td className="py-3 px-4 text-gray-500 text-[13px]">{e.user.vNumber || '-'}</td>
                              <td className="py-3 px-4 text-[13px]">
                                {joinPos > 1 ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded-full">Module {joinPos}</span>
                                ) : (
                                  <span className="text-gray-400 text-[12px]">From start</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-[13px]">
                                {currentMod ? (
                                  <span className="text-[#2D3B45] font-medium">{currentMod.name}</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div className="bg-[#008EE2] h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                                  </div>
                                  <span className="text-[12px] font-medium text-gray-600">{Math.round(progress)}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {e.lastStatus ? <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${e.lastStatus.includes('Start') || e.lastStatus.includes('Active') || e.lastStatus.includes('Registered') ? 'bg-green-100 text-green-700' : e.lastStatus.includes('Withdrawal') || e.lastStatus.includes('Cancel') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{e.lastStatus}</span> : '-'}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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
                          className={`px-3 py-1.5 text-[12px] font-medium rounded transition-colors ${batchTypeFilter === t ? 'bg-[#008EE2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                          <span>{filtered.length} batches</span>
                          <span>•</span>
                          <span>{totalStudents} total students enrolled</span>
                        </div>
                        <div className="border-t border-gray-200">
                          <table className="w-full text-left text-[14px]">
                            <thead>
                              <tr className="text-[#008EE2] font-bold">
                                <th className="py-3 px-4">Batch Code</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Course Name</th>
                                <th className="py-3 px-4">Instructor</th>
                                <th className="py-3 px-4 text-center">Students</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filtered.map((b: any) => {
                                const bType = b.batchType || 'PRIMARY';
                                const bStatus = b.status || 'UPCOMING';
                                return (
                                <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedBatchCode(b.batchCode)}>
                                  <td className="py-3 px-4">
                                    <span className="px-2.5 py-1 bg-[#2D3B45] text-white text-[12px] font-bold rounded">{b.batchCode}</span>
                                    {b.parentBatchCode && (
                                      <span className="ml-2 text-[11px] text-gray-400">← {b.parentBatchCode}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${bType === 'PRIMARY' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                                      {bType === 'PRIMARY' ? 'Primary' : 'Mid-Course'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${bStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : bStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {bStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="text-[#008EE2] font-medium">{b.course.name}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[11px] font-medium text-gray-600 bg-gray-50">
                                        {b.teacher.firstName[0]}{(b.teacher.lastName || b.teacher.firstName)[0]}
                                      </div>
                                      <span className="font-medium text-[#2D3B45]">{b.teacher.firstName} {b.teacher.lastName !== b.teacher.firstName ? b.teacher.lastName : ''}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-1 text-[12px] font-bold rounded-full ${b.studentCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                      {b.studentCount}
                                    </span>
                                  </td>
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

          {adminActiveSection !== 'Courses' && adminActiveSection !== 'People' && adminActiveSection !== 'Batches' && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p>{adminActiveSection} — coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Course View ---

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
  const [creating, setCreating] = useState(false);

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

    if (newAssignFormat === 'FILE') {
      // Existing FILE-based creation
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('title', newAssignTitle);
      formData.append('description', newAssignDesc);
      formData.append('instructions', newAssignInstructions);
      formData.append('points', String(newAssignPoints));
      formData.append('format', 'FILE');
      if (newAssignDueDate) formData.append('dueDate', newAssignDueDate);
      formData.append('allowedFormats', newAssignFormats);
      formData.append('published', String(newAssignPublished));
      if (newAssignFile) formData.append('file', newAssignFile);
      const res = await api<any>('/assignments', { method: 'POST', body: formData });
      if (res.success) {
        resetCreateForm();
        refetchCourse();
      }
    } else {
      // Quiz-based creation: create assignment, then POST questions
      const formData = new FormData();
      formData.append('courseId', courseId);
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
    setBuilderQuestions([]);
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
    { label: 'Pages' }, { label: 'Files' }, { label: 'Syllabus' },
    { label: 'Quizzes' }, { label: 'Modules' }, { label: 'Collaborations' }
  ];

  const teacherNavItems = [
    { label: 'Home' }, { label: 'Announcements' }, { label: 'Assignments' },
    { label: 'Grades' }, { label: 'People' }, { label: 'Pages' },
    { label: 'Files' }, { label: 'Syllabus' }, { label: 'Rubrics' },
    { label: 'Quizzes' }, { label: 'Modules' }, { label: 'Settings' }
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
              <span className="text-[15px]">{item.label}</span>
            </div>
          ))}
        </aside>

        <div className="flex-1 overflow-y-auto p-12">
          {activeSection === 'Home' ? (
            <div className="max-w-4xl">
              <h1 className="text-[32px] font-medium text-[#2D3B45] mb-10">{course.name}</h1>
              {course.description && <p className="text-[15px] text-[#2D3B45] mb-6">{course.description}</p>}

              {course.modules?.length > 0 && (
                <>
                  <h2 className="text-[28px] font-medium text-[#2D3B45] mb-4">Course Modules</h2>
                  <table className="w-full border-collapse border border-[#E1E1E1] text-[15px]">
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
                            {course.modules.reduce((sum: number, m: any) => sum + (m.weight || 0), 0).toFixed(2)}%
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
              {/* Assignment Creation Form */}
              {showCreateAssignment ? (
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
                                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${q.type === 'MCQ' ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{q.type}</span>
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
                                    <label className="block text-[12px] font-bold text-gray-500 mb-1">Question Text *</label>
                                    <textarea value={q.text} onChange={e => updateBuilderQuestion(qIdx, { text: e.target.value })} rows={2}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                      placeholder="Enter question text..." />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[12px] font-bold text-gray-500 mb-1">Points</label>
                                      <input type="number" value={q.points} onChange={e => updateBuilderQuestion(qIdx, { points: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={1} />
                                    </div>
                                    {q.type === 'THEORY' && (
                                      <div>
                                        <label className="block text-[12px] font-bold text-gray-500 mb-1">Word Limit (0 = no limit)</label>
                                        <input type="number" value={q.wordLimit} onChange={e => updateBuilderQuestion(qIdx, { wordLimit: Number(e.target.value) })}
                                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" min={0} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[12px] font-bold text-gray-500 mb-1">Explanation (shown after submission)</label>
                                    <input type="text" value={q.explanation} onChange={e => updateBuilderQuestion(qIdx, { explanation: e.target.value })}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                      placeholder="Optional explanation..." />
                                  </div>

                                  {/* MCQ Options */}
                                  {q.type === 'MCQ' && (
                                    <div>
                                      <label className="block text-[12px] font-bold text-gray-500 mb-2">Options (select correct answer)</label>
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

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-sm text-[#2D3B45]">
                        <input type="checkbox" checked={newAssignPublished} onChange={e => setNewAssignPublished(e.target.checked)} className="rounded border-gray-300" />
                        <span>Published</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-[#E1E1E1]">
                      <button onClick={handleCreateAssignment} disabled={!newAssignTitle || creating || (newAssignFormat !== 'FILE' && builderQuestions.length === 0)}
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
                        <h2 className="text-[28px] font-medium text-[#2D3B45] mb-2">{assignmentDetail.title}</h2>
                        <div className="flex items-center space-x-4 text-[13px] text-gray-500">
                          <span className="font-bold text-[#2D3B45]">{assignmentDetail.points} pts</span>
                          {assignmentDetail.format && (
                            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                              assignmentDetail.format === 'FILE' ? 'bg-gray-200 text-gray-700' :
                              assignmentDetail.format === 'MCQ' ? 'bg-[#008EE2]/10 text-[#008EE2]' :
                              assignmentDetail.format === 'THEORY' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{assignmentDetail.format}</span>
                          )}
                          {assignmentDetail.dueDate && <span>Due: {new Date(assignmentDetail.dueDate).toLocaleString()}</span>}
                          {assignmentDetail.timeLimit && <span>{assignmentDetail.timeLimit} min</span>}
                          {!assignmentDetail.published && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[11px] font-bold rounded-full">UNPUBLISHED</span>}
                        </div>
                      </div>

                      {/* Description & Instructions */}
                      {assignmentDetail.description && (
                        <div className="mb-4">
                          <p className="text-[15px] text-[#2D3B45]">{assignmentDetail.description}</p>
                        </div>
                      )}
                      {assignmentDetail.instructions && (
                        <div className="bg-[#F5F5F5] border border-[#E1E1E1] rounded p-4 mb-6">
                          <h3 className="font-bold text-sm text-[#2D3B45] mb-2">Instructions</h3>
                          <p className="text-[14px] text-[#2D3B45] whitespace-pre-wrap">{assignmentDetail.instructions}</p>
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
                            <span className="font-bold text-[15px]">Your Submission</span>
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
                                      <span className={`px-3 py-1 text-[12px] font-bold rounded-full ${mySubmission.status === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{mySubmission.status}</span>
                                      {mySubmission.isLate && <span className="px-3 py-1 bg-red-100 text-red-600 text-[12px] font-bold rounded-full">LATE</span>}
                                    </div>
                                    {mySubmission.score !== null && (
                                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Score</div>
                                        <div className="text-2xl font-bold text-green-700">{mySubmission.score} / {assignmentDetail.points}</div>
                                      </div>
                                    )}
                                    {mySubmission.feedback && (
                                      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                                        <h4 className="font-bold text-sm text-[#2D3B45] mb-1">Feedback</h4>
                                        <p className="text-[14px] text-[#2D3B45] whitespace-pre-wrap">{mySubmission.feedback}</p>
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
                                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${question.type === 'MCQ' ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{question.type}</span>
                                                  {answer?.pointsAwarded !== null && (
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
                                                <div className="mt-2 text-[12px] text-gray-500 italic">Explanation: {question.explanation}</div>
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
                                      <span className="px-3 py-1 bg-red-100 text-red-600 text-[12px] font-bold rounded-full">NOT STARTED</span>
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
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${question.type === 'MCQ' ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{question.type}</span>
                                              </div>
                                              <span className="text-[12px] text-gray-500">{question.points} pts</span>
                                            </div>
                                            <p className="text-[14px] text-[#2D3B45] mb-3">{question.text}</p>

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
                                                    <span className="text-[11px] text-gray-400">Word limit: {question.wordLimit}</span>
                                                    <span className={`text-[11px] ${
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
                                      <span className="px-3 py-1 bg-green-100 text-green-700 text-[12px] font-bold rounded-full">GRADED</span>
                                      {mySubmission.isLate && <span className="px-3 py-1 bg-red-100 text-red-600 text-[12px] font-bold rounded-full">LATE</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="bg-green-50 rounded-lg p-4">
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Score</div>
                                        <div className="text-2xl font-bold text-green-700">{mySubmission.score} / {assignmentDetail.points}</div>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Submitted</div>
                                        <div className="text-sm font-medium text-[#2D3B45]">{mySubmission.submittedAt ? new Date(mySubmission.submittedAt).toLocaleString() : 'N/A'}</div>
                                        {mySubmission.fileName && <div className="text-[12px] text-gray-500 mt-1">{mySubmission.fileName}</div>}
                                      </div>
                                    </div>
                                    {mySubmission.feedback && (
                                      <div className="bg-blue-50 border border-blue-200 rounded p-4">
                                        <h4 className="font-bold text-sm text-[#2D3B45] mb-1">Feedback</h4>
                                        <p className="text-[14px] text-[#2D3B45] whitespace-pre-wrap">{mySubmission.feedback}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              if (mySubmission && mySubmission.status === 'SUBMITTED') {
                                return (
                                  <div>
                                    <div className="flex items-center space-x-3 mb-4">
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[12px] font-bold rounded-full">SUBMITTED</span>
                                      {mySubmission.isLate && <span className="px-3 py-1 bg-red-100 text-red-600 text-[12px] font-bold rounded-full">LATE</span>}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                      <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">File</div>
                                      <div className="text-sm font-medium text-[#2D3B45]">{mySubmission.fileName || 'Submitted file'}</div>
                                      <div className="text-[12px] text-gray-500 mt-1">{mySubmission.submittedAt ? new Date(mySubmission.submittedAt).toLocaleString() : ''}</div>
                                    </div>
                                    {mySubmission.comment && (
                                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Your Comment</div>
                                        <p className="text-[14px] text-[#2D3B45]">{mySubmission.comment}</p>
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
                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[12px] font-bold rounded-full">MISSING</span>
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
                                        <p className="text-[11px] text-gray-400 mt-1">Accepted formats: {assignmentDetail.allowedFormats}</p>
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
                            <span className="font-bold text-[15px]">Submissions ({assignmentDetail.submissions?.length || 0})</span>
                          </div>

                          {/* Teacher: Show questions overview for quiz formats */}
                          {assignmentDetail.format && assignmentDetail.format !== 'FILE' && assignmentQuestions.length > 0 && (
                            <div className="bg-blue-50/50 border-b border-[#E1E1E1] px-4 py-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-bold text-[#2D3B45]">Questions ({assignmentQuestions.length})</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  assignmentDetail.format === 'MCQ' ? 'bg-[#008EE2] text-white' :
                                  assignmentDetail.format === 'THEORY' ? 'bg-purple-600 text-white' :
                                  'bg-amber-500 text-white'
                                }`}>{assignmentDetail.format}</span>
                              </div>
                              <div className="text-[12px] text-gray-500 space-x-4">
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
                              <table className="w-full text-left text-[14px]">
                                <thead>
                                  <tr className="bg-gray-50 text-[#2D3B45] font-bold text-[13px]">
                                    <th className="py-3 px-4">Student</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Submitted</th>
                                    <th className="py-3 px-4">Late</th>
                                    <th className="py-3 px-4">Score</th>
                                    <th className="py-3 px-4">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E1E1E1]">
                                  {assignmentDetail.submissions.map((sub: any) => {
                                    const isQuizFormat = assignmentDetail.format && assignmentDetail.format !== 'FILE';
                                    const isExpandedFile = gradingSubmissionId === sub.id;
                                    const isExpandedQuiz = gradingQuizSubmissionId === sub.id;
                                    return (
                                    <React.Fragment key={sub.id}>
                                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                        if (isQuizFormat) {
                                          setGradingQuizSubmissionId(isExpandedQuiz ? null : sub.id);
                                          setTheoryGrades({});
                                        } else {
                                          setGradingSubmissionId(isExpandedFile ? null : sub.id);
                                        }
                                      }}>
                                        <td className="py-3 px-4">
                                          <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-[11px] font-medium text-gray-600 bg-gray-50">
                                              {sub.student?.firstName?.[0]}{sub.student?.lastName?.[0]}
                                            </div>
                                            <span className="font-medium">{sub.student?.firstName} {sub.student?.lastName}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                                            sub.status === 'GRADED' ? 'bg-green-100 text-green-700' :
                                            sub.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-600'
                                          }`}>{sub.status}</span>
                                        </td>
                                        <td className="py-3 px-4 text-[13px] text-gray-500">
                                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                          {sub.isLate ? <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-100 text-red-600">LATE</span> : <span className="text-gray-400 text-[12px]">On time</span>}
                                        </td>
                                        <td className="py-3 px-4 font-bold">
                                          {sub.score !== null ? `${sub.score} / ${assignmentDetail.points}` : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                          <button className="text-[#008EE2] text-sm hover:underline">
                                            {(isExpandedFile || isExpandedQuiz) ? 'Close' : 'Grade'}
                                          </button>
                                        </td>
                                      </tr>

                                      {/* Inline Grading Panel for FILE format */}
                                      {isExpandedFile && !isQuizFormat && (
                                        <tr>
                                          <td colSpan={6} className="p-4 bg-[#F5F5F5] border-t border-[#E1E1E1]">
                                            <div className="space-y-4">
                                              {sub.filePath && (
                                                <div>
                                                  <h4 className="font-bold text-sm text-[#2D3B45] mb-2">Student File: {sub.fileName || 'Submission'}</h4>
                                                  <iframe
                                                    src={`/api/submissions/${sub.id}/file?token=${getAccessToken()}`}
                                                    className="w-full h-[400px] border border-[#E1E1E1] rounded bg-white"
                                                    title="Student submission"
                                                  />
                                                </div>
                                              )}
                                              {sub.comment && (
                                                <div className="bg-white border border-[#E1E1E1] rounded p-3">
                                                  <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Student Comment</div>
                                                  <p className="text-[14px] text-[#2D3B45]">{sub.comment}</p>
                                                </div>
                                              )}
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <label className="block text-sm font-bold text-[#2D3B45] mb-1">Score (max {assignmentDetail.points})</label>
                                                  <input type="number" value={gradeScore} onChange={e => setGradeScore(Number(e.target.value))}
                                                    max={assignmentDetail.points} min={0}
                                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-sm font-bold text-[#2D3B45] mb-1">Feedback</label>
                                                <textarea value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} rows={3}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                                  placeholder="Feedback for the student..." />
                                              </div>
                                              <div className="flex items-center space-x-3">
                                                <button onClick={handleSaveGrade} disabled={savingGrade}
                                                  className="px-6 py-2 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                                                  {savingGrade ? 'Saving...' : 'Save Grade'}
                                                </button>
                                                <button onClick={() => setGradingSubmissionId(null)} className="px-6 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}

                                      {/* Inline Quiz Grading Panel for MCQ/THEORY/MIXED */}
                                      {isExpandedQuiz && isQuizFormat && (
                                        <tr>
                                          <td colSpan={6} className="p-4 bg-[#F5F5F5] border-t border-[#E1E1E1]">
                                            <div className="space-y-4">
                                              <h4 className="font-bold text-sm text-[#2D3B45]">Student Answers</h4>
                                              {assignmentQuestions.map((question: any, qIdx: number) => {
                                                const answer = question.answers?.find((a: any) => a.submissionId === sub.id);
                                                const isMCQ = question.type === 'MCQ';
                                                return (
                                                  <div key={question.id} className={`border rounded-lg p-4 bg-white ${
                                                    isMCQ
                                                      ? answer?.isCorrect ? 'border-green-300' : answer?.isCorrect === false ? 'border-red-300' : 'border-gray-200'
                                                      : 'border-gray-200'
                                                  }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                      <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-bold text-[#2D3B45]">Q{qIdx + 1}. {question.text}</span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${isMCQ ? 'bg-[#008EE2] text-white' : 'bg-purple-600 text-white'}`}>{question.type}</span>
                                                      </div>
                                                      <span className="text-sm text-gray-500">{question.points} pts</span>
                                                    </div>

                                                    {isMCQ && question.options && (
                                                      <div className="space-y-1 mt-2">
                                                        {question.options.map((opt: any) => {
                                                          const isSelected = answer?.selectedOptionId === opt.id;
                                                          const isCorrectOption = opt.isCorrect;
                                                          return (
                                                            <div key={opt.id} className={`px-3 py-2 rounded text-sm flex items-center space-x-2 ${
                                                              isCorrectOption ? 'bg-green-100 border border-green-300' :
                                                              isSelected && !isCorrectOption ? 'bg-red-100 border border-red-300' :
                                                              'bg-gray-50 border border-gray-200'
                                                            }`}>
                                                              {isSelected && <span className="font-bold">{isCorrectOption ? <CheckCircle size={14} className="text-green-600" /> : <X size={14} className="text-red-600" />}</span>}
                                                              {!isSelected && isCorrectOption && <CheckCircle size={14} className="text-green-600" />}
                                                              {!isSelected && !isCorrectOption && <span className="w-3.5" />}
                                                              <span>{opt.text}</span>
                                                            </div>
                                                          );
                                                        })}
                                                        <div className="mt-1 text-[12px] font-bold">
                                                          {answer?.isCorrect ? (
                                                            <span className="text-green-600">Correct (+{answer.pointsAwarded ?? question.points})</span>
                                                          ) : answer?.isCorrect === false ? (
                                                            <span className="text-red-600">Wrong {assignmentDetail.negativeMarking > 0 ? `(-${assignmentDetail.negativeMarking})` : '(0 pts)'}</span>
                                                          ) : (
                                                            <span className="text-gray-400">Not answered</span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}

                                                    {!isMCQ && (
                                                      <div className="mt-2 space-y-2">
                                                        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-[#2D3B45] whitespace-pre-wrap">
                                                          {answer?.textAnswer || '(no answer)'}
                                                        </div>
                                                        {/* Theory grading inputs */}
                                                        {answer && (
                                                          <div className="grid grid-cols-2 gap-3 mt-2">
                                                            <div>
                                                              <label className="block text-[12px] font-bold text-gray-500 mb-1">Points (max {question.points})</label>
                                                              <input type="number"
                                                                value={theoryGrades[answer.id]?.pointsAwarded ?? answer.pointsAwarded ?? 0}
                                                                onChange={e => setTheoryGrades(prev => ({
                                                                  ...prev,
                                                                  [answer.id]: {
                                                                    pointsAwarded: Math.min(Number(e.target.value), question.points),
                                                                    feedback: prev[answer.id]?.feedback ?? answer.feedback ?? '',
                                                                  }
                                                                }))}
                                                                max={question.points} min={0}
                                                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]" />
                                                            </div>
                                                            <div>
                                                              <label className="block text-[12px] font-bold text-gray-500 mb-1">Feedback</label>
                                                              <input type="text"
                                                                value={theoryGrades[answer.id]?.feedback ?? answer.feedback ?? ''}
                                                                onChange={e => setTheoryGrades(prev => ({
                                                                  ...prev,
                                                                  [answer.id]: {
                                                                    pointsAwarded: prev[answer.id]?.pointsAwarded ?? answer.pointsAwarded ?? 0,
                                                                    feedback: e.target.value,
                                                                  }
                                                                }))}
                                                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#008EE2]"
                                                                placeholder="Feedback..." />
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}

                                              {/* Grade All button for theory questions */}
                                              {assignmentQuestions.some((q: any) => q.type === 'THEORY') && (
                                                <div className="flex items-center space-x-3 pt-2">
                                                  <button onClick={() => handleGradeTheory(sub.id)} disabled={savingTheoryGrades || Object.keys(theoryGrades).length === 0}
                                                    className="px-6 py-2 bg-[#008EE2] text-white rounded text-sm font-medium hover:bg-[#0074BF] disabled:opacity-50 transition-colors">
                                                    {savingTheoryGrades ? 'Saving...' : 'Save Theory Grades'}
                                                  </button>
                                                  <button onClick={() => { setGradingQuizSubmissionId(null); setTheoryGrades({}); }}
                                                    className="px-6 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                                                    Cancel
                                                  </button>
                                                </div>
                                              )}

                                              {/* If pure MCQ, just show close */}
                                              {!assignmentQuestions.some((q: any) => q.type === 'THEORY') && (
                                                <button onClick={() => setGradingQuizSubmissionId(null)}
                                                  className="px-6 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                                                  Close
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
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

              ) : (
                /* Assignment List */
                <div className="border border-[#E1E1E1] rounded-sm overflow-hidden">
                  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E1E1E1] flex items-center justify-between">
                    <span className="font-bold text-[15px]">Assignments ({course.assignments?.length || 0})</span>
                    {(effectiveRole === 'TEACHER' || effectiveRole === 'ADMIN') && (
                      <button onClick={() => setShowCreateAssignment(true)}
                        className="flex items-center space-x-1 bg-[#008EE2] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#0074BF] transition-colors">
                        <Plus size={16} /> <span>New Assignment</span>
                      </button>
                    )}
                  </div>
                  <div className="bg-white divide-y divide-[#E1E1E1]">
                    {!course.assignments?.length ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No assignments yet.</div>
                    ) : course.assignments.map((a: any) => (
                      <div key={a.id} className="px-4 py-4 flex items-center hover:bg-gray-50 group cursor-pointer"
                        onClick={() => loadAssignmentDetail(a.id)}>
                        <div className="mr-4 text-gray-400 group-hover:text-[#008EE2]"><FileText size={20} /></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-[15px] text-[#2D3B45] group-hover:underline">{a.title}</h4>
                            {a.format && a.format !== 'FILE' && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                a.format === 'MCQ' ? 'bg-[#008EE2]/10 text-[#008EE2]' :
                                a.format === 'THEORY' ? 'bg-purple-100 text-purple-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>{a.format}</span>
                            )}
                          </div>
                          <p className="text-[12px] text-gray-500 mt-0.5">
                            {a.points} pts {a.dueDate && `• Due ${new Date(a.dueDate).toLocaleDateString()}`}
                            {a.timeLimit ? ` • ${a.timeLimit} min` : ''}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-[#008EE2]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeSection === 'Grades' ? (
            (() => {
              // Compute bifurcation data for each module
              const moduleData = (course.modules || []).map((mod: any) => {
                const assignments = (course.assignments || []).filter((a: any) =>
                  a.title.startsWith(mod.name + ' - ') || a.title.startsWith(mod.name + ' -')
                );

                const theory = assignments.filter((a: any) =>
                  /Final|Quiz|Midterm|Exam|Test|Theory/i.test(a.title.split(' - ').pop() || '')
                );
                const practical = assignments.filter((a: any) =>
                  /Assignment|Participation|Project|Attendance|Practical/i.test(a.title.split(' - ').pop() || '')
                );

                const theoryPts = theory.reduce((s: number, a: any) => s + a.points, 0);
                const practicalPts = practical.reduce((s: number, a: any) => s + a.points, 0);
                const totalPts = theoryPts + practicalPts;

                return { mod, assignments, theory, practical, theoryPts, practicalPts, totalPts, weight: mod.weight || 0 };
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
                  <p className="text-[14px] text-gray-500 mb-6">
                    Total Hours: {totalHours} | {moduleData.length} Modules | {totalAssignments} Assessments | Weight: {totalWeight.toFixed(2)}%
                  </p>

                  {/* Course Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#2D3B45] text-white rounded-lg p-4">
                      <div className="text-[11px] uppercase tracking-wider opacity-70 mb-1">Modules</div>
                      <div className="text-2xl font-bold">{moduleData.length}</div>
                    </div>
                    <div className="bg-[#c0392b] text-white rounded-lg p-4">
                      <div className="text-[11px] uppercase tracking-wider opacity-70 mb-1">Theory Pts (per module)</div>
                      <div className="text-2xl font-bold">{moduleData.length > 0 ? `${Math.min(...moduleData.map((m: any) => m.theoryPts))}–${Math.max(...moduleData.map((m: any) => m.theoryPts))}` : '0'}</div>
                    </div>
                    <div className="bg-[#2980b9] text-white rounded-lg p-4">
                      <div className="text-[11px] uppercase tracking-wider opacity-70 mb-1">Practical Pts (per module)</div>
                      <div className="text-2xl font-bold">{moduleData.length > 0 ? `${Math.min(...moduleData.map((m: any) => m.practicalPts))}–${Math.max(...moduleData.map((m: any) => m.practicalPts))}` : '0'}</div>
                    </div>
                    <div className="bg-[#008744] text-white rounded-lg p-4">
                      <div className="text-[11px] uppercase tracking-wider opacity-70 mb-1">Total Hours</div>
                      <div className="text-2xl font-bold">{totalHours}</div>
                    </div>
                  </div>

                  {/* Assessment Patterns */}
                  {Object.keys(patterns).length > 0 && (
                    <div className="bg-gray-50 border border-[#E1E1E1] rounded-lg p-4 mb-8">
                      <h3 className="text-[14px] font-bold text-[#2D3B45] mb-3">Assessment Patterns</h3>
                      <div className="space-y-2">
                        {Object.entries(patterns).map(([pattern, count], idx) => (
                          <div key={idx} className="flex items-center space-x-3 text-[13px]">
                            <span className="bg-[#008EE2] text-white text-[11px] font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">{count}</span>
                            <span className="text-gray-600">
                              <span className="font-bold">{count} module{count > 1 ? 's' : ''}:</span> {pattern} = 100 pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── SECTION 1: Full Module Breakdown ── */}
                  <h2 className="text-[18px] font-bold text-[#2D3B45] mb-4 border-b-2 border-[#008EE2] pb-2">
                    Module Breakdown — Theory vs Assignment
                  </h2>
                  <table className="w-full border-collapse text-[13px] mb-10">
                    <thead>
                      <tr className="bg-[#2D3B45] text-white">
                        <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-8">#</th>
                        <th className="border border-[#3d4d5a] px-3 py-2.5 text-left font-medium">Module</th>
                        <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-14">Hours</th>
                        <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-16">Weight</th>
                        <th className="border border-[#3d4d5a] px-3 py-2.5 text-center font-medium bg-[#a93226]">Theory</th>
                        <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium bg-[#a93226] w-12">Pts</th>
                        <th className="border border-[#3d4d5a] px-3 py-2.5 text-center font-medium bg-[#2471a3]">Assignment / Practical</th>
                        <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium bg-[#2471a3] w-12">Pts</th>
                        <th className="border border-[#3d4d5a] px-2 py-2.5 text-center font-medium w-14">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-[#2D3B45]">
                      {moduleData.map((m: any, idx: number) => (
                        <tr key={m.mod.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'} hover:bg-yellow-50/50`}>
                          <td className="border border-[#E1E1E1] px-2 py-2.5 text-center text-gray-400 text-[12px]">{m.mod.position}</td>
                          <td className="border border-[#E1E1E1] px-3 py-2.5 font-bold text-[13px]">{m.mod.name}</td>
                          <td className="border border-[#E1E1E1] px-2 py-2.5 text-center text-gray-500">{m.mod.hours || '-'}</td>
                          <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold text-[#008EE2]">{m.weight}%</td>
                          <td className="border border-[#E1E1E1] px-3 py-2.5 bg-red-50/40">
                            {m.theory.map((a: any) => (
                              <div key={a.id} className="text-[12px]">{a.title.split(' - ').pop()} <span className="text-red-400">({a.points})</span></div>
                            ))}
                          </td>
                          <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold text-red-700 bg-red-50/40">{m.theoryPts}</td>
                          <td className="border border-[#E1E1E1] px-3 py-2.5 bg-blue-50/40">
                            {m.practical.map((a: any) => (
                              <div key={a.id} className="text-[12px]">{a.title.split(' - ').pop()} <span className="text-blue-400">({a.points})</span></div>
                            ))}
                          </td>
                          <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold text-blue-700 bg-blue-50/40">{m.practicalPts}</td>
                          <td className="border border-[#E1E1E1] px-2 py-2.5 text-center font-bold">{m.totalPts}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#2D3B45] text-white font-bold text-[13px]">
                        <td className="border border-[#3d4d5a] px-2 py-3" colSpan={2}>TOTAL ({moduleData.length} modules)</td>
                        <td className="border border-[#3d4d5a] px-2 py-3 text-center">{totalHours}</td>
                        <td className="border border-[#3d4d5a] px-2 py-3 text-center">{totalWeight.toFixed(2)}%</td>
                        <td className="border border-[#3d4d5a] px-2 py-3 text-center" colSpan={2}>Theory: {totalTheory}</td>
                        <td className="border border-[#3d4d5a] px-2 py-3 text-center" colSpan={2}>Practical: {totalPractical}</td>
                        <td className="border border-[#3d4d5a] px-2 py-3 text-center">{totalTheory + totalPractical}</td>
                      </tr>
                    </tfoot>
                  </table>

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
                            <div className="font-bold text-[14px]">{m.mod.name}</div>
                            <div className="text-[11px] opacity-70">{m.mod.hours ? `${m.mod.hours} hours` : ''}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[18px] font-bold text-[#4FC3F7]">{m.weight}%</div>
                            <div className="text-[10px] opacity-70">weight</div>
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
                                  <span className="text-[13px] font-medium">{typeName}</span>
                                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${isTheory ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {isTheory ? 'THEORY' : 'PRACTICAL'}
                                  </span>
                                </div>
                                <span className="text-[14px] font-bold">{a.points} pts</span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Module total bar */}
                        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between text-[12px]">
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
                          <p className="text-[14px] text-gray-500 mb-5">
                            <span className="font-bold text-[#2D3B45]">{example.mod.name}</span> ({example.weight}% of course
                            {example.mod.hours && ` • ${example.mod.hours} hours`})
                            — This module has {example.assignments.length} items: {example.assignments.map((a: any) => `${a.title.split(' - ').pop()} (${a.points})`).join(' + ')}
                          </p>

                          <table className="w-full border-collapse text-[14px] mb-5">
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
                                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${isT ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{isT ? 'Theory' : 'Practical'}</span>
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
                                <td className="border border-[#3d4d5a] px-4 py-2.5 text-center">{modulePct.toFixed(0)}%</td>
                              </tr>
                            </tfoot>
                          </table>

                          <div className="bg-white border-2 border-[#008EE2] rounded-lg p-5 mb-4">
                            <div className="flex items-center justify-center space-x-4 text-[16px] flex-wrap">
                              <div className="text-center px-3">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Module Score</div>
                                <div className="font-bold text-[20px]">{totalScore}/{example.totalPts}</div>
                              </div>
                              <span className="text-2xl text-gray-300">×</span>
                              <div className="text-center px-3">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Module Weight</div>
                                <div className="font-bold text-[20px] text-[#008EE2]">{example.weight}%</div>
                              </div>
                              <span className="text-2xl text-gray-300">=</span>
                              <div className="text-center px-3">
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Contribution to Final Grade</div>
                                <div className="font-bold text-[24px] text-[#008744]">{contribution.toFixed(2)}%</div>
                              </div>
                            </div>
                            <div className="text-center text-[12px] text-gray-400 mt-2">{modulePct.toFixed(0)}% × {example.weight}% = {contribution.toFixed(2)}%</div>
                          </div>

                          <p className="text-[13px] text-gray-500">
                            <span className="font-bold">Teacher enters:</span> {sampleScores.map((a: any) => a.score).join(', ')}.
                            Canvas adds them ({totalScore}/{example.totalPts}), then applies {example.weight}% weight.
                            Student's overall course grade = sum of contributions from all {moduleData.length} modules.
                          </p>
                        </div>
                      </>
                    );
                  })()}

                  {/* Legend */}
                  <div className="flex items-center space-x-8 text-[13px] text-gray-600 mb-4">
                    <div className="flex items-center space-x-2"><span className="w-4 h-4 rounded bg-red-50 border border-red-200" /><span><span className="font-bold">Theory:</span> Final, Quiz, Midterm, Exam</span></div>
                    <div className="flex items-center space-x-2"><span className="w-4 h-4 rounded bg-blue-50 border border-blue-200" /><span><span className="font-bold">Practical:</span> Assignment, Participation</span></div>
                  </div>
                </div>
              );
            })()
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
                          className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-default"
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
                      <div className="text-[10px] text-gray-400 pl-1.5">+{dayEvents.length - 3} more</div>
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
            <p className="text-[11px] text-gray-400 mt-0.5">{monthName}</p>
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
                      <span className="text-[12px] font-semibold text-[#2D3B45] truncate">{moduleName}</span>
                    </div>
                    <div className="pl-[18px]">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        evt.track === 'Weekday' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {evt.track}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-2">
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
                <span className="text-[11px] text-[#008EE2] font-medium">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
                {!msg.read && <span className="bg-[#2D3B45] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">!</span>}
              </div>
              <div className="flex items-start space-x-3">
                {!msg.read && <div className="w-3 h-3 bg-[#008EE2] rounded-full mt-1.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#2D3B45] truncate">{msg.sender.firstName} {msg.sender.lastName}</h4>
                  <p className="text-[13px] text-[#2D3B45] font-medium truncate mt-0.5">{msg.subject}</p>
                  <p className="text-[12px] text-gray-500 truncate mt-0.5">{msg.body.slice(0, 50)}...</p>
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
                      <h3 className="font-bold text-[15px] text-[#2D3B45]">{selected.sender.firstName} {selected.sender.lastName}</h3>
                      <span className="text-[13px] text-gray-500">{new Date(selected.createdAt).toLocaleString()}</span>
                    </div>
                    {selected.course && <p className="text-[13px] text-gray-500 mt-0.5">{selected.course.name}</p>}
                    <div className="mt-8 text-[15px] text-[#2D3B45] leading-relaxed whitespace-pre-wrap">{selected.body}</div>
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

  // Group assignments by course
  const byCourse = new Map<string, { course: any; assignments: any[] }>();
  for (const a of allAssignments) {
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
      const sub = a.submissions?.find((s: any) => s.studentId === user.id);
      if (!sub || sub.status === 'MISSING') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-100 text-red-600">MISSING</span>;
      if (sub.status === 'SUBMITTED') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700">SUBMITTED</span>;
      if (sub.status === 'GRADED') return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-green-100 text-green-700">GRADED ({sub.score}/{a.points})</span>;
    }
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      const total = a.submissions?.length || 0;
      const needsGrading = a.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0;
      return (
        <div className="flex items-center space-x-2">
          <span className="text-[12px] text-gray-500">{total} submitted</span>
          {needsGrading > 0 && <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-700">{needsGrading} to grade</span>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <header className="h-16 border-b border-[#E1E1E1] flex items-center justify-between px-8 bg-white shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <span className="text-sm text-gray-500">{allAssignments.length} total</span>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {allAssignments.length === 0 ? (
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
                    <span className="text-[12px] text-gray-400">{course.code}</span>
                    <span className="text-[12px] text-gray-400 ml-auto">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</span>
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
                              <h4 className="font-bold text-[14px] text-[#2D3B45] group-hover:underline truncate">{a.title}</h4>
                              <p className="text-[12px] text-gray-500 mt-0.5">
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
    <div className={`flex h-screen bg-white font-sans text-[#2D3B45] ${dyslexiaFont ? 'font-mono' : ''}`}>
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
            <span className="text-[11px] mt-1 font-medium">Account</span>
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
          <SidebarItem icon={NotebookPen} label="Assignments" active={activeTab === 'Assignments'}
            onClick={() => { setActiveTab('Assignments'); setSelectedCourseId(null); closeDrawers(); }} />
          <SidebarItem icon={Calendar} label="Calendar" active={activeTab === 'Calendar'}
            onClick={() => { setActiveTab('Calendar'); setSelectedCourseId(null); closeDrawers(); }} />
          <SidebarItem icon={Inbox} label="Inbox" active={activeTab === 'Inbox'}
            onClick={() => { setActiveTab('Inbox'); setSelectedCourseId(null); closeDrawers(); }} />
          <SidebarItem icon={Clock} label="History" active={activeTab === 'History'}
            onClick={() => { setActiveTab('History'); setSelectedCourseId(null); closeDrawers(); }} />
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
            {['Notifications', 'Files', 'Settings'].map(link => (
              <a key={link} href="#" className="text-[#008EE2] text-sm hover:underline">{link}</a>
            ))}
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
                  <span className="text-[11px] text-gray-500 mt-1 block">{course.code}</span>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isAccountDrawerOpen || isCoursesDrawerOpen ? 'opacity-50' : 'opacity-100'}`}>
        {userRole === 'ADMIN' && activeTab === 'Admin' ? (
          <AdminCoursesView onCourseSelect={id => setSelectedCourseId(id)} />
        ) : userRole === 'ADMIN' && activeTab === 'Dashboard' && !selectedCourseId ? (
          <AdminDashboardView onCourseSelect={id => setSelectedCourseId(id)} />
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>{activeTab} — coming soon</p>
          </div>
        )}

        {/* Footer */}
        <footer className="h-16 border-t border-[#E1E1E1] flex items-center justify-between px-8 bg-white text-[11px] text-gray-500 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center grayscale opacity-60">
              <div className="w-4 h-4 bg-black rounded-sm mr-1 flex items-center justify-center">
                <div className="w-2 h-2 bg-white transform rotate-45" />
              </div>
              <span className="font-bold tracking-widest text-black">INSTRUCTURE</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-sm mr-1 flex items-center justify-center">
                <div className="w-2 h-2 bg-white transform rotate-45" />
              </div>
              <span className="font-bold tracking-widest text-[#2D3B45]">TAHA Canvas</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Cookie Notice</a>
            <a href="#" className="hover:underline">Acceptable Use Policy</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
