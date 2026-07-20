/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { CalendarDays, Clock, BookOpen, Users, BarChart3, TrendingUp, User, Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GlassPanel } from '@/components/dashboard/design-system';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionDetailView } from '@/components/sessions/SessionDetailView';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/admin_student-history')({
  component: AdminStudentHistoryPage,
});

function AdminStudentHistoryPage() {
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentName, setStudentName] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api<any>(`/live-sessions/admin/student-stats/${studentId}?from=${fromDate}&to=${toDate}`),
        api<any>(`/live-sessions/student-class-history?page=1&limit=50&from=${fromDate}&to=${toDate}`),
      ]);
      setStats(statsRes);
      setSessions(sessionsRes.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [studentId, fromDate, toDate]);

  const searchStudent = async () => {
    if (!studentSearch.trim()) return;
    try {
      const students = await api<any[]>(`/students?search=${encodeURIComponent(studentSearch)}`);
      if (students?.length > 0) {
        setStudentId(students[0].id);
        setStudentName(students[0].fullName || students[0].name || studentSearch);
      } else {
        toast.error('Student not found');
      }
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    }
  };

  if (selectedSessionId) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <SessionDetailView
            sessionId={selectedSessionId}
            onBack={() => setSelectedSessionId(null)}
            isAdmin
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-2">Admin</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Student Learning History</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review student attendance, progress, and class participation.</p>
        </div>

        <GlassPanel className="p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Search Student</label>
              <div className="flex gap-2">
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                  placeholder="Student name..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <Button variant="outline" size="sm" className="rounded-xl" onClick={searchStudent}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            {studentId && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchData}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Load
              </Button>
            )}
          </div>
        </GlassPanel>

        {studentName && (
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">{studentName}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 border animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Sessions', value: stats.totalSessions, color: 'text-foreground' },
                { label: 'Attended', value: stats.attended, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Attendance %', value: `${stats.attendancePercentage}%`, color: stats.attendancePercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600' },
                { label: 'Teachers', value: stats.uniqueTeachers, color: 'text-blue-600 dark:text-blue-400' },
              ].map((card) => (
                <GlassPanel key={card.label} className="p-4">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className={cn("text-2xl font-bold mt-1 font-mono", card.color)}>{card.value}</p>
                </GlassPanel>
              ))}
            </div>

            {stats.monthlyBreakdown?.length > 0 && (
              <GlassPanel className="p-5 mb-6">
                <h3 className="text-sm font-bold text-foreground mb-3">Monthly Attendance</h3>
                <div className="space-y-2">
                  {stats.monthlyBreakdown.map((m: any) => {
                    const pct = m.sessions > 0 ? Math.round((m.attended / m.sessions) * 100) : 0;
                    return (
                      <div key={m.month} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30">
                        <span className="text-sm text-foreground">{m.month}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{m.attended}/{m.sessions} attended</span>
                          <span className={cn("font-mono", pct >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassPanel>
            )}

            {sessions.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-foreground mb-3">Recent Classes</h3>
                <div className="space-y-2">
                  {sessions.map((s: any) => (
                    <SessionCard
                      key={s.id}
                      id={s.sessionId || s.id}
                      classTitle={s.classTitle}
                      teacherName={s.teacherName}
                      scheduledStart={s.scheduledStart}
                      scheduledEnd={s.scheduledEnd}
                      durationMinutes={s.durationMinutes}
                      status={s.status}
                      attendanceStatus={s.attendanceStatus}
                      onViewDetail={(id) => setSelectedSessionId(id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : studentId ? (
          <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No data available</h3>
            <p className="text-muted-foreground text-sm mt-2">Try adjusting the date range.</p>
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">Search for a student</h3>
            <p className="text-muted-foreground text-sm mt-2">Enter a student name above to view their learning history.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
