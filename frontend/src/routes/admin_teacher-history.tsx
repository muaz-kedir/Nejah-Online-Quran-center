import { useState, useEffect, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, Clock, BookOpen, Users, BarChart3, TrendingUp, GraduationCap, Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, requireAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GlassPanel } from '@/components/dashboard/design-system';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionDetailView } from '@/components/sessions/SessionDetailView';
import { toast } from 'sonner';

function AdminTeacherHistoryPage() {
  const [teacherId, setTeacherId] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api<any>(`/live-sessions/admin/teacher-stats/${teacherId}?from=${fromDate}&to=${toDate}`),
        api<any>(`/live-sessions/teacher-history?page=1&limit=50&from=${fromDate}&to=${toDate}`),
      ]);
      setStats(statsRes);
      setSessions(sessionsRes.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [teacherId, fromDate, toDate]);

  const searchTeacher = async () => {
    if (!teacherSearch.trim()) return;
    try {
      const teachers = await api<any[]>(`/teachers?search=${encodeURIComponent(teacherSearch)}`);
      if (teachers?.length > 0) {
        setTeacherId(teachers[0].id);
        setTeacherName(teachers[0].fullName || teachers[0].name || teacherSearch);
      } else {
        toast.error('Teacher not found');
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Teacher Teaching History</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor teacher activity, session counts, and attendance rates.</p>
        </div>

        {/* Teacher search */}
        <GlassPanel className="p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Search Teacher</label>
              <div className="flex gap-2">
                <input
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTeacher()}
                  placeholder="Teacher name..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <Button variant="outline" size="sm" className="rounded-xl" onClick={searchTeacher}>
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
            {teacherId && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchData}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Load
              </Button>
            )}
          </div>
        </GlassPanel>

        {teacherName && (
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">{teacherName}</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: 'Total Sessions', value: stats.totalSessions, color: 'text-foreground' },
                { label: 'Completed', value: stats.completedSessions, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Cancelled', value: stats.cancelledSessions, color: 'text-rose-600 dark:text-rose-400' },
                { label: 'Total Hours', value: `${stats.totalHours}h`, color: 'text-foreground' },
                { label: 'Students Taught', value: stats.uniqueStudents, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Avg Attendance', value: `${stats.averageAttendanceRate}%`, color: stats.averageAttendanceRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600' },
              ].map((card) => (
                <GlassPanel key={card.label} className="p-4">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className={cn("text-2xl font-bold mt-1 font-mono", card.color)}>{card.value}</p>
                </GlassPanel>
              ))}
            </div>

            {stats.monthlyBreakdown?.length > 0 && (
              <GlassPanel className="p-5 mb-6">
                <h3 className="text-sm font-bold text-foreground mb-3">Monthly Breakdown</h3>
                <div className="space-y-2">
                  {stats.monthlyBreakdown.map((m: any) => (
                    <div key={m.month} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30">
                      <span className="text-sm text-foreground">{m.month}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">{m.sessions} sessions</span>
                        <span className="font-mono text-foreground">{m.hours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}

            {sessions.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-foreground mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  {sessions.map((s: any) => (
                    <SessionCard
                      key={s.id}
                      id={s.id}
                      classTitle={s.classTitle}
                      scheduledStart={s.scheduledStart}
                      scheduledEnd={s.scheduledEnd}
                      durationMinutes={s.durationMinutes}
                      status={s.status}
                      attendanceSummary={s.attendanceSummary}
                      studentCount={s.studentCount}
                      showTeacher={false}
                      onViewDetail={(id) => setSelectedSessionId(id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : teacherId ? (
          <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No data available</h3>
            <p className="text-muted-foreground text-sm mt-2">Try adjusting the date range.</p>
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">Search for a teacher</h3>
            <p className="text-muted-foreground text-sm mt-2">Enter a teacher name above to view their teaching history.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/admin_teacher-history')({
  component: AdminTeacherHistoryPage,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
});
