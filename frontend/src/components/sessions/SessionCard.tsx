import { CalendarDays, Clock, User, BookOpen, Timer, Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400',
  LIVE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 animate-pulse',
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

interface SessionCardProps {
  id: string;
  classTitle: string;
  teacherName?: string;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes?: number | null;
  status: string;
  attendanceStatus?: string | null;
  attendanceSummary?: {
    present: number;
    late: number;
    absent: number;
    total: number;
  };
  studentCount?: number;
  onViewDetail?: (id: string) => void;
  showTeacher?: boolean;
}

export function SessionCard({
  id,
  classTitle,
  teacherName,
  scheduledStart,
  scheduledEnd,
  durationMinutes,
  status,
  attendanceStatus,
  attendanceSummary,
  studentCount,
  onViewDetail,
  showTeacher = true,
}: SessionCardProps) {
  const startDate = new Date(scheduledStart);
  const endDate = new Date(scheduledEnd);
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
  const timeStr = `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="bg-card hover:bg-muted/30 transition-colors rounded-2xl border p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-sm text-foreground truncate">{classTitle}</h3>
            <Badge variant="outline" className={cn("text-[10px] px-2 py-0 font-semibold", statusStyles[status] || statusStyles.SCHEDULED)}>
              {status}
            </Badge>
            {attendanceStatus && (
              <Badge variant="outline" className={cn("text-[10px] px-2 py-0 font-semibold", attendanceBadge[attendanceStatus])}>
                {attendanceStatus}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {showTeacher && teacherName && (
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{teacherName}</span>
            )}
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{dateStr}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{timeStr}</span>
            {durationMinutes && (
              <span className="inline-flex items-center gap-1"><Timer className="h-3 w-3" />{durationMinutes}m</span>
            )}
            {attendanceSummary && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {attendanceSummary.present + attendanceSummary.late}/{attendanceSummary.total} attended
              </span>
            )}
            {studentCount !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />{studentCount} student{studentCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {onViewDetail && (
          <Button variant="ghost" size="sm" className="rounded-xl shrink-0" onClick={() => onViewDetail(id)}>
            Details <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
