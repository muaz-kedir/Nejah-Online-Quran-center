/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { CalendarDays, Clock, User, BookOpen, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Timer, Filter, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  sessionId: string;
  classTitle: string;
  teacherName: string;
  sessionDate: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  joinTime: string | null;
  leaveTime: string | null;
  duration: number | null;
  attendanceStatus: string;
  status: string;
}

interface AttendanceData {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    leftEarly: number;
    partial: number;
    excused: number;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PRESENT: { label: 'Present', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  LATE: { label: 'Late', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  ABSENT: { label: 'Absent', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle },
  LEFT_EARLY: { label: 'Left Early', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', icon: Timer },
  PARTIAL: { label: 'Partial', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', icon: Clock },
  EXCUSED: { label: 'Excused', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEFT_EARLY', label: 'Left Early' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'EXCUSED', label: 'Excused' },
];

export const Route = createLazyFileRoute('/student_/attendance')({
  component: StudentAttendance,
});

function StudentAttendance() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isPolling, setIsPolling] = useState(false);

  const fetchAttendance = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsPolling(true);

      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await api<AttendanceData>(`/live-sessions/my-attendance?${params}`);
      setData(res);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      if (isInitial) setLoading(false);
      setIsPolling(false);
    }
  }, [page, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchAttendance(true);
  }, [fetchAttendance]);

  if (loading) return <StudentPageLoader />;

  const summary = data?.summary;

  const SummaryCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="bg-card rounded-2xl p-4 border shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
    </div>
  );

  return (
    <StudentPortalLayout activePath={studentPaths.attendance}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-2">Student Portal</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground font-serif tracking-tight">My Attendance</h1>
            <p className="text-muted-foreground mt-2">Track your attendance history across all sessions.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isPolling ? (
              <RefreshCw className="h-4 w-4 animate-spin text-nejah-electric" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            )}
            Live data
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            <SummaryCard label="Total" value={summary.total} color="text-foreground" />
            <SummaryCard label="Present" value={summary.present} color="text-emerald-600 dark:text-emerald-400" />
            <SummaryCard label="Late" value={summary.late} color="text-amber-600 dark:text-amber-400" />
            <SummaryCard label="Absent" value={summary.absent} color="text-rose-600 dark:text-rose-400" />
            <SummaryCard label="Left Early" value={summary.leftEarly} color="text-orange-600 dark:text-orange-400" />
            <SummaryCard label="Partial" value={summary.partial} color="text-purple-600 dark:text-purple-400" />
            <SummaryCard label="Excused" value={summary.excused} color="text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-2xl p-4 border shadow-sm mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            {(statusFilter || fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); setPage(1); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Attendance Table */}
        {data?.data?.length ? (
          <div className="space-y-3">
            {data.data.map((record) => {
              const cfg = statusConfig[record.attendanceStatus] || statusConfig.ABSENT;
              const Icon = cfg.icon;
              const joinTime = record.joinTime ? new Date(record.joinTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
              const leaveTime = record.leaveTime ? new Date(record.leaveTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

              return (
                <div key={record.id} className="bg-card hover:bg-muted/30 transition-colors rounded-2xl p-5 border shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground truncate">{record.classTitle}</h3>
                        <Badge variant="outline" className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-semibold border", cfg.color)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {record.sessionDate}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {record.teacherName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {joinTime} — {leaveTime}
                        </span>
                        {record.duration !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5" />
                            {record.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages} ({data.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={data.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={data.page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No attendance records found</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              {statusFilter || fromDate || toDate
                ? 'No records match your filters. Try adjusting your search criteria.'
                : 'Your attendance records will appear here once you start attending classes.'}
            </p>
          </div>
        )}
      </main>
    </StudentPortalLayout>
  );
}
