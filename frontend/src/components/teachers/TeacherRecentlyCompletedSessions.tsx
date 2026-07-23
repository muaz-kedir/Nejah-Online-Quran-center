import { memo, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, ChevronRight, Clock, Timer, Users } from 'lucide-react';
import { API_BASE } from '@/lib/api';

type CompletedSession = {
  id: string;
  metadata?: { className?: string };
  student?: { fullName?: string };
  studentName?: string;
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  attendances?: unknown[];
  participantCount?: number;
};

type TeacherRecentlyCompletedSessionsProps = {
  teacherId: string;
  teacherName?: string;
};

function getStudentLabel(session: CompletedSession): string {
  if (session.student?.fullName) return session.student.fullName;
  if (session.studentName) return session.studentName;
  const present = session.attendances?.filter(
    (a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE' || a.joinTime,
  );
  if (present?.length === 1 && (present[0] as any).student?.fullName) {
    return (present[0] as any).student.fullName;
  }
  return '—';
}

export const TeacherRecentlyCompletedSessions = memo(function TeacherRecentlyCompletedSessions({
  teacherId,
  teacherName,
}: TeacherRecentlyCompletedSessionsProps) {
  const navigate = useNavigate();
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [averageDuration, setAverageDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      try {
        // Zoom analytics commented out -- manual meeting links
        // const [todayRes, analyticsRes] = await Promise.all([
        //   fetch(
        //     `${API_BASE}/live-sessions/today?teacherId=${encodeURIComponent(teacherId)}`,
        //     { headers, signal: controller.signal },
        //   ),
        //   fetch(`${API_BASE}/zoom-analytics/teacher/${teacherId}`, {
        //     headers,
        //     signal: controller.signal,
        //   }),
        // ]);
        const [todayRes] = await Promise.all([
          fetch(
            `${API_BASE}/live-sessions/today?teacherId=${encodeURIComponent(teacherId)}`,
            { headers, signal: controller.signal },
          ),
        ]);

        if (todayRes.ok) {
          const allToday: CompletedSession[] = await todayRes.json();
          const completed = allToday.filter(
            (s) =>
              s &&
              ((s as any).status === 'COMPLETED' || (s as any).status === 'completed'),
          );
          setCompletedSessions(completed);
        }

        // Zoom analytics block commented out
        // if (analyticsRes.ok) {
        //   const analytics = await analyticsRes.json();
        //   if (analytics?.averageSessionDuration) {
        //     setAverageDuration(analytics.averageSessionDuration);
        //   }
        // }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Failed to load completed sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
        Loading completed sessions...
      </div>
    );
  }

  if (completedSessions.length === 0) {
    return (
      <div className="bg-card dark:bg-nejah-surface rounded-3xl border border-border dark:border-nejah-border-blue p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">
          No sessions completed today
          {teacherName ? ` for ${teacherName}` : ''}.
        </p>
      </div>
    );
  }

  const completedToday = completedSessions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground font-serif">Recently Completed</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {completedToday} session{completedToday !== 1 ? 's' : ''} completed today
              {averageDuration ? ` · Avg ${averageDuration} min` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/live-sessions' })}
          className="text-xs font-bold text-foreground flex items-center gap-1 hover:underline"
        >
          View All Sessions <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {completedSessions.slice(0, 5).map((session) => (
          <div
            key={session.id}
            className="group bg-card dark:bg-nejah-surface rounded-2xl p-5 border border-border dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate group-hover:text-emerald-600 transition-colors">
                    {session.metadata?.className || 'Quran Class'}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground truncate">
                    {getStudentLabel(session)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 shrink-0">
                {session.actualStart && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {new Date(session.actualStart).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {session.actualEnd &&
                        ` - ${new Date(session.actualEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {session.durationMinutes ?? '—'}m
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {session.attendances?.length || session.participantCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
