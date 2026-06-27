import { memo, useState, useEffect } from 'react';
import { Clock, Users, Timer, CheckCircle2, ExternalLink } from 'lucide-react';
import { GlassPanel, PanelHeader } from './design-system';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';

interface CompletedSession {
  id: string;
  teacherName: string;
  studentName: string;
  className: string;
  durationMinutes: number;
  actualStart: string;
  actualEnd: string;
  participantCount: number;
  teacherId: string;
}

export const RecentCompletedSessions = memo(function RecentCompletedSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const base = API_BASE;

        const res = await fetch(
          `${base}/live-sessions?status=COMPLETED&limit=5&sortBy=actualEnd&sortOrder=DESC`,
          { headers, signal: controller.signal },
        );

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        const items = data?.data || [];

        const formatted: CompletedSession[] = items.map((s: any) => ({
          id: s.id,
          teacherName: s.teacher?.fullName || s.teacherId || 'Unknown Teacher',
          studentName: s.student?.fullName || '—',
          className: s.metadata?.className || s.schedule?.className || 'Quran Class',
          durationMinutes: s.durationMinutes || 0,
          actualStart: s.actualStart,
          actualEnd: s.actualEnd,
          participantCount: s.attendances?.length || 0,
          teacherId: s.teacherId,
        }));

        setSessions(formatted);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Failed to fetch completed sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
    return () => controller.abort();
  }, []);

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  return (
    <GlassPanel className="overflow-hidden">
      <PanelHeader
        title="Recent Completed Sessions"
        action={
          <button
            onClick={() => navigate({ to: '/live-sessions' })}
            className="text-xs font-bold text-nejah-sapphire hover:underline flex items-center gap-1"
          >
            View All <ExternalLink className="h-3 w-3" />
          </button>
        }
      />
      <div className="p-6">
        {loading ? (
          <div className="py-8 text-center font-medium text-nejah-slate-blue">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center font-medium text-nejah-slate-blue">
            No completed sessions yet
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate({ to: '/live-sessions/$id', params: { id: session.id } })}
                className="group flex items-center justify-between p-4 rounded-xl bg-background/30 hover:bg-background/60 border border-transparent hover:border-nejah-electric/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-nejah-electric transition-colors">
                      {session.className}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground truncate">
                        {session.teacherName}
                      </span>
                      <span className="text-[10px] text-nejah-slate-blue">•</span>
                      <span className="text-[10px] font-semibold text-nejah-slate-blue">
                        {formatDate(session.actualEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0 ml-4">
                  {session.durationMinutes > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-nejah-slate-blue" />
                      <span className="text-xs font-bold tabular-nums text-foreground">
                        {session.durationMinutes}m
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-nejah-slate-blue" />
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {session.participantCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-nejah-slate-blue" />
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {formatTime(session.actualStart)} – {formatTime(session.actualEnd)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
});
