import { useState, useEffect, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, Clock, BookOpen, Users, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionDetailView } from '@/components/sessions/SessionDetailView';
import { GlassPanel } from '@/components/dashboard/design-system';
import { toast } from 'sonner';

interface ClassHistoryData {
  data: Array<{
    id: string;
    sessionId: string;
    classTitle: string;
    teacherName: string;
    teacherId: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart: string | null;
    actualEnd: string | null;
    durationMinutes: number | null;
    status: string;
    attendanceStatus: string | null;
    joinTime: string | null;
    leaveTime: string | null;
    duration: number | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    attendancePercentage: number;
  };
}

function StudentHistoryPage() {
  const [data, setData] = useState<ClassHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'history' | 'stats'>('history');

  const fetchHistory = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api<ClassHistoryData>(`/live-sessions/student-class-history?${params}`);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load class history');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  if (selectedSessionId) {
    return (
      <StudentPortalLayout activePath={studentPaths.classes}>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <SessionDetailView
            sessionId={selectedSessionId}
            onBack={() => setSelectedSessionId(null)}
          />
        </div>
      </StudentPortalLayout>
    );
  }

  return (
    <StudentPortalLayout activePath={studentPaths.classes}>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-2">Student</p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Class History</h1>
            <p className="text-muted-foreground mt-1 text-sm">Review your past sessions and attendance records.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-muted/50 rounded-xl p-0.5">
              <button
                onClick={() => setTab('history')}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors", tab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >History</button>
              <button
                onClick={() => setTab('stats')}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors", tab === 'stats' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >Statistics</button>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchHistory(false)}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {tab === 'stats' && data?.summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Sessions', value: data.summary.total, icon: CalendarDays, color: 'text-foreground' },
                { label: 'Present', value: data.summary.present, icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Late', value: data.summary.late, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Attendance Rate', value: `${data.summary.attendancePercentage}%`, icon: TrendingUp, color: data.summary.attendancePercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600' },
              ].map((card) => (
                <GlassPanel key={card.label} className="p-4">
                  <card.icon className={cn("h-4 w-4 mb-2", card.color)} />
                  <p className={cn("text-2xl font-bold font-mono", card.color)}>{card.value}</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">{card.label}</p>
                </GlassPanel>
              ))}
            </div>

            <GlassPanel className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Attendance Breakdown</h3>
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                {[
                  { value: data.summary.present, color: 'bg-emerald-500' },
                  { value: data.summary.late, color: 'bg-amber-500' },
                  { value: data.summary.absent, color: 'bg-rose-500' },
                ].map((seg, i) => {
                  const pct = data.summary.total > 0 ? (seg.value / data.summary.total) * 100 : 0;
                  if (pct === 0) return null;
                  return <div key={i} className={seg.color} style={{ width: `${pct}%` }} title={`${seg.value}`} />;
                })}
              </div>
              <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present ({data.summary.present})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Late ({data.summary.late})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Absent ({data.summary.absent})</span>
              </div>
            </GlassPanel>
          </div>
        ) : (
          <>
            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
                <option value="EXPIRED">Expired</option>
              </select>
              {statusFilter && (
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => { setStatusFilter(''); setPage(1); }}>
                  Clear
                </Button>
              )}
            </div>

            {/* Session list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-5 border animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : data?.data?.length ? (
              <>
                <div className="space-y-2">
                  {data.data.map((record) => (
                    <SessionCard
                      key={record.id}
                      id={record.sessionId}
                      classTitle={record.classTitle}
                      teacherName={record.teacherName}
                      scheduledStart={record.scheduledStart}
                      scheduledEnd={record.scheduledEnd}
                      durationMinutes={record.durationMinutes}
                      status={record.status}
                      attendanceStatus={record.attendanceStatus}
                      onViewDetail={(id) => setSelectedSessionId(id)}
                    />
                  ))}
                </div>

                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6">
                    <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages} ({data.total} records)</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" disabled={data.page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                      <Button variant="outline" size="sm" className="rounded-xl" disabled={data.page >= data.totalPages}
                        onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">No class history found</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                  Your completed sessions will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/history')({
  component: StudentHistoryPage,
  beforeLoad: () => requireStudentAuth(),
});
