/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { CalendarDays, User, BookOpen, RefreshCw, Timer, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GlassPanel } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useQueryClient } from '@tanstack/react-query';

interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentName: string;
  teacherName: string;
  classTitle: string;
  sessionDate: string;
  joinTime: string | null;
  leaveTime: string | null;
  duration: number | null;
  attendanceStatus: string;
}

interface OverviewData {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalSessions: number;
    totalAttendances: number;
    present: number;
    late: number;
    absent: number;
    overallPercentage: number;
  };
}

const statusBadge: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  LATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  ABSENT: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  LEFT_EARLY: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  PARTIAL: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  EXCUSED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
};

export const Route = createLazyFileRoute('/attendance')({
  component: AttendancePage,
});

function AttendancePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (statusFilter) params.set('status', statusFilter);
  if (fromDate) params.set('from', fromDate);
  if (toDate) params.set('to', toDate);

  const { data, isLoading } = useApiQuery<OverviewData>({
    queryKey: ['attendance', page, statusFilter, fromDate, toDate],
    path: `/live-sessions/attendance/overview?${params}`,
    refetchInterval: 30_000,
  });

  const summary = data?.summary;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-2">Admin</p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Attendance Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">Comprehensive attendance tracking across all sessions.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => queryClient.invalidateQueries({ queryKey: ['attendance'] })}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Attendances', value: summary.totalAttendances, color: 'text-foreground' },
              { label: 'Present', value: summary.present, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Late', value: summary.late, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Absent', value: summary.absent, color: 'text-rose-600 dark:text-rose-400' },
              { label: 'Overall Rate', value: `${summary.overallPercentage}%`, color: summary.overallPercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' },
              { label: 'Sessions Tracked', value: summary.totalSessions, color: 'text-foreground' },
            ].map((card) => (
              <GlassPanel key={card.label} className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <p className={cn("text-2xl font-bold mt-1 font-mono", card.color)}>{card.value}</p>
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Filters */}
        <GlassPanel className="p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
                <option value="LEFT_EARLY">Left Early</option>
                <option value="PARTIAL">Partial</option>
                <option value="EXCUSED">Excused</option>
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
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => {
                setStatusFilter(''); setFromDate(''); setToDate(''); setPage(1);
              }}>
                Clear All Filters
              </Button>
            )}
          </div>
        </GlassPanel>

        {/* Table */}
        {isLoading ? (
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
              {data.data.map((record) => {
                const statusClass = statusBadge[record.attendanceStatus] || statusBadge.ABSENT;
                const joinTime = record.joinTime
                  ? new Date(record.joinTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '—';
                const leaveTime = record.leaveTime
                  ? new Date(record.leaveTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '—';

                return (
                  <div key={record.id} className="bg-card hover:bg-muted/30 transition-colors rounded-2xl p-4 border">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-sm text-foreground truncate">{record.studentName}</h3>
                          <Badge variant="outline" className={cn("text-[10px] px-2 py-0 font-semibold", statusClass)}>
                            {record.attendanceStatus}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{record.teacherName}</span>
                          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{record.classTitle}</span>
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{record.sessionDate}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{joinTime} — {leaveTime}</span>
                          {record.duration !== null && (
                            <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" />{record.duration}m</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <h3 className="text-lg font-bold text-foreground">No attendance records found</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Adjust your filters to see attendance data across sessions.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
