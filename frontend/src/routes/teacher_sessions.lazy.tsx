/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, BookOpen, Users, BarChart3, Timer, Filter, RefreshCw, FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionDetailView } from '@/components/sessions/SessionDetailView';
import { SessionNoteModal } from '@/components/sessions/SessionNoteModal';
import { GlassPanel } from '@/components/dashboard/design-system';
import { TeacherPortalLayout } from '@/components/teachers/TeacherPortalLayout';
import { toast } from 'sonner';
import { useApiQuery } from '@/hooks/useApiQuery';

interface TeacherSessionHistory {
  data: Array<{
    id: string;
    classTitle: string;
    teacherId: string;
    studentId: string | null;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart: string | null;
    actualEnd: string | null;
    durationMinutes: number | null;
    status: string;
    studentCount: number;
    attendanceSummary: {
      present: number;
      late: number;
      absent: number;
      leftEarly: number;
      partial: number;
      excused: number;
      total: number;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalSessions: number;
    completedSessions: number;
    totalHours: number;
    uniqueStudents: number;
  };
}

export const Route = createLazyFileRoute('/teacher_sessions')({
  component: TeacherSessionsPage,
});

function TeacherSessionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [noteModalSessionId, setNoteModalSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<'sessions' | 'summary'>('sessions');

  const { data, isLoading: loading } = useApiQuery<TeacherSessionHistory>({
    queryKey: ['teacher-sessions', page, statusFilter],
    path: `/live-sessions/teacher-history?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`,
    refetchInterval: 30_000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-sessions'] });
  };

  if (selectedSessionId) {
    return (
      <TeacherPortalLayout activePath="/teacher_sessions">
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <SessionDetailView
            sessionId={selectedSessionId}
            onBack={() => setSelectedSessionId(null)}
            isTeacher
            onAddNote={(id) => setNoteModalSessionId(id)}
          />
          {noteModalSessionId && (
            <SessionNoteModal
              sessionId={noteModalSessionId}
              onClose={() => setNoteModalSessionId(null)}
              onSaved={() => {
                setSelectedSessionId(null);
                setTimeout(() => setSelectedSessionId(noteModalSessionId), 100);
              }}
            />
          )}
        </div>
      </TeacherPortalLayout>
    );
  }

  return (
    <TeacherPortalLayout activePath="/teacher_sessions">
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-2">Teacher</p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Session History</h1>
            <p className="text-muted-foreground mt-1 text-sm">Review all your conducted classes, manage notes, and track attendance.</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-muted/50 rounded-xl p-0.5">
              <button
                onClick={() => setTab('sessions')}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors", tab === 'sessions' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >Sessions</button>
              <button
                onClick={() => setTab('summary')}
                className={cn("px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors", tab === 'summary' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >Summary</button>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleRefresh}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        {data?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sessions', value: data.summary.totalSessions, color: 'text-foreground' },
              { label: 'Completed', value: data.summary.completedSessions, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Total Hours', value: `${data.summary.totalHours}h`, color: 'text-foreground' },
              { label: 'Students Taught', value: data.summary.uniqueStudents, color: 'text-blue-600 dark:text-blue-400' },
            ].map((card) => (
              <GlassPanel key={card.label} className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <p className={cn("text-2xl font-bold mt-1 font-mono", card.color)}>{card.value}</p>
              </GlassPanel>
            ))}
          </div>
        )}

        {tab === 'summary' ? (
          data?.summary && (
            <GlassPanel className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Teaching Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Total Sessions Conducted</span>
                  <span className="text-sm font-bold text-foreground">{data.summary.totalSessions}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Completed Sessions</span>
                  <span className="text-sm font-bold text-foreground">{data.summary.completedSessions}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Total Teaching Hours</span>
                  <span className="text-sm font-bold text-foreground">{data.summary.totalHours}h</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Unique Students Taught</span>
                  <span className="text-sm font-bold text-foreground">{data.summary.uniqueStudents}</span>
                </div>
              </div>
            </GlassPanel>
          )
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="LIVE">Live</option>
                <option value="SCHEDULED">Scheduled</option>
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
                  {data.data.map((session) => (
                    <SessionCard
                      key={session.id}
                      id={session.id}
                      classTitle={session.classTitle}
                      scheduledStart={session.scheduledStart}
                      scheduledEnd={session.scheduledEnd}
                      durationMinutes={session.durationMinutes}
                      status={session.status}
                      attendanceSummary={session.attendanceSummary}
                      studentCount={session.studentCount}
                      showTeacher={false}
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
                <h3 className="text-lg font-bold text-foreground">No sessions found</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                  Your session history will appear here once you conduct classes.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </TeacherPortalLayout>
  );
}
