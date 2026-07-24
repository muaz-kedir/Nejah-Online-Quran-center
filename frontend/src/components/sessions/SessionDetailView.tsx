import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Clock, User, BookOpen, Timer, Users, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/dashboard/design-system';

interface SessionDetail {
  session: any;
  notes: Array<{
    id: string;
    content: string;
    lessonSummary?: string;
    topicsCovered?: string;
    homeworkAssigned?: string;
    completionRemarks?: string;
    studentPerformance?: string;
    visibility?: string;
    teacherName?: string;
    createdAt: string;
  }>;
  timeline: Array<{
    event: string;
    timestamp: string | null;
    description: string;
  }>;
}

const statusBadge: Record<string, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400',
  LIVE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  NO_SHOW: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  EXPIRED: 'bg-muted text-foreground border-gray-200 dark:bg-gray-900/30 dark:text-muted-foreground',
};

const attendanceBadge: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  LATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  ABSENT: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  LEFT_EARLY: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  PARTIAL: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  EXCUSED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
};

interface SessionDetailViewProps {
  sessionId: string;
  onBack?: () => void;
  isTeacher?: boolean;
  isAdmin?: boolean;
  onAddNote?: (sessionId: string) => void;
}

export function SessionDetailView({
  sessionId,
  onBack,
  isTeacher = false,
  isAdmin = false,
  onAddNote,
}: SessionDetailViewProps) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    api<SessionDetail>(`/live-sessions/session-detail/${sessionId}`)
      .then(setDetail)
      .catch((err) => toast.error(err.message || 'Failed to load session details'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-5 border animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-3" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-muted/30 border border-dashed rounded-2xl p-12 text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground">Session not found</h3>
      </div>
    );
  }

  const session = detail.session;
  const attendances = session.attendances || [];
  const startDate = new Date(session.scheduledStart);
  const endDate = new Date(session.scheduledEnd);
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  const presentCount = attendances.filter((a: any) => a.attendanceStatus === 'PRESENT').length;
  const lateCount = attendances.filter((a: any) => a.attendanceStatus === 'LATE').length;
  const absentCount = attendances.filter((a: any) => a.attendanceStatus === 'ABSENT').length;
  const leftEarlyCount = attendances.filter((a: any) => a.attendanceStatus === 'LEFT_EARLY').length;
  const partialCount = attendances.filter((a: any) => a.attendanceStatus === 'PARTIAL').length;
  const excusedCount = attendances.filter((a: any) => a.attendanceStatus === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      {onBack && (
        <Button variant="ghost" size="sm" className="rounded-xl -ml-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      )}

      {/* Session header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-foreground">{session.metadata?.className || session.schedule?.className || 'Quran Class'}</h2>
            <Badge variant="outline" className={cn("text-xs px-2.5 py-0.5 font-semibold", statusBadge[session.status] || statusBadge.SCHEDULED)}>
              {session.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{dateStr} · {timeStr}</p>
        </div>
        {session.durationMinutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-1.5">
            <Timer className="h-4 w-4" />
            Duration: {session.durationMinutes} minutes
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Teacher</p>
          <p className="text-sm font-semibold text-foreground">{session.teacher?.fullName || '—'}</p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Class</p>
          <p className="text-sm font-semibold text-foreground">{session.schedule?.className || session.metadata?.className || 'Quran Class'}</p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Students</p>
          <p className="text-sm font-semibold text-foreground">{attendances.length} enrolled</p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Attendance Rate</p>
          <p className={cn("text-sm font-semibold", attendances.length > 0 && ((presentCount + lateCount) / attendances.length) >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600')}>
            {attendances.length > 0 ? Math.round(((presentCount + lateCount) / attendances.length) * 100) : 0}%
          </p>
        </GlassPanel>
      </div>

      {/* Attendance summary */}
      {attendances.length > 0 && (
        <GlassPanel className="p-5">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Attendance Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Present', value: presentCount, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Late', value: lateCount, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Absent', value: absentCount, color: 'text-rose-600 dark:text-rose-400' },
              { label: 'Left Early', value: leftEarlyCount, color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Partial', value: partialCount, color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Excused', value: excusedCount, color: 'text-blue-600 dark:text-blue-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-2 rounded-xl bg-muted/30">
                <p className={cn("text-lg font-bold font-mono", stat.color)}>{stat.value}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Student list */}
          <div className="mt-4 space-y-1.5">
            {attendances.map((att: any) => (
              <div key={att.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{att.student?.fullName || 'Unknown Student'}</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px] px-2 py-0 font-semibold", attendanceBadge[att.attendanceStatus] || attendanceBadge.ABSENT)}>
                  {att.attendanceStatus}
                </Badge>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Timeline */}
      <GlassPanel className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Session Timeline
        </h3>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
          {detail.timeline.map((event, idx) => (
            <div key={idx} className="relative">
              <div className={cn(
                "absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-background",
                event.event === 'SCHEDULED' ? 'bg-sky-500' :
                event.event === 'LIVE' ? 'bg-green-500' :
                event.event === 'COMPLETED' ? 'bg-emerald-500' :
                event.event === 'CANCELLED' ? 'bg-rose-500' :
                'bg-orange-500',
              )} />
              <div>
                <p className="text-sm font-semibold text-foreground">{event.event}</p>
                <p className="text-xs text-muted-foreground">
                  {event.description}
                  {event.timestamp && ` · ${new Date(event.timestamp).toLocaleString()}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Notes section */}
      <GlassPanel className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Session Notes
          </h3>
          {(isTeacher || isAdmin) && onAddNote && (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onAddNote(sessionId)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Note
            </Button>
          )}
        </div>
        {detail.notes.length > 0 ? (
          <div className="space-y-3">
            {detail.notes.map((note) => (
              <div key={note.id} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    {note.teacherName && <span className="font-medium text-foreground">{note.teacherName}</span>}
                    {note.createdAt && ` · ${new Date(note.createdAt).toLocaleDateString()}`}
                    {note.visibility === 'teacher_only' && (
                      <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">Private</Badge>
                    )}
                  </p>
                </div>
                {note.lessonSummary && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Lesson Summary</p>
                    <p className="text-sm text-foreground">{note.lessonSummary}</p>
                  </div>
                )}
                {note.topicsCovered && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Topics Covered</p>
                    <p className="text-sm text-foreground">{note.topicsCovered}</p>
                  </div>
                )}
                {note.homeworkAssigned && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Homework</p>
                    <p className="text-sm text-foreground">{note.homeworkAssigned}</p>
                  </div>
                )}
                {note.studentPerformance && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Student Performance</p>
                    <p className="text-sm text-foreground">{note.studentPerformance}</p>
                  </div>
                )}
                {note.completionRemarks && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Remarks</p>
                    <p className="text-sm text-foreground">{note.completionRemarks}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No notes for this session.</p>
        )}
      </GlassPanel>
    </div>
  );
}
