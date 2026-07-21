import { ChevronLeft, ChevronRight, Clock, MapPin, Wifi } from 'lucide-react';
import { memo, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { GlassPanel, PanelHeader } from './design-system';
import { useApiQuery } from '@/hooks/useApiQuery';

interface ClassSession {
  id: string;
  title: string;
  teacher: string;
  teacherInitials: string;
  location: string;
  time: string;
  category: string;
  categoryColor: string;
  isOnline?: boolean;
}

const ITEMS_PER_PAGE = 2;

export const TodaysClasses = memo(function TodaysClasses() {
  const { t } = useApp();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useApiQuery<any[]>({
    queryKey: ['dashboard', 'schedules'],
    path: '/schedules',
    refetchInterval: 30_000,
  });

  const classes = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const todays = data.filter(
      (schedule: any) => schedule.dayOfWeek?.toLowerCase() === todayName.toLowerCase(),
    );

    return todays.map((schedule: any) => {
      const teacherName = schedule.teacher?.fullName || 'Assigned Teacher';
      const initials = teacherName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const isOnline = schedule.classType?.toLowerCase() === 'online' || !!schedule.meetingLink;
      const location = isOnline
        ? schedule.meetingLink ? 'Online Room' : 'Online Class'
        : schedule.notes || 'Classroom';

      const category = (schedule.classType || 'tajweed').toUpperCase();
      let categoryColor = 'bg-primary/10 text-nejah-electric border-nejah-electric/20';
      if (category.includes('KIDS') || category.includes('FOUNDATION')) {
        categoryColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      } else if (category.includes('TAFSIR')) {
        categoryColor = 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      }

      return {
        id: schedule.id,
        title: schedule.className || 'Quran Class',
        teacher: teacherName,
        teacherInitials: initials || 'AT',
        location,
        time:
          schedule.startTimeString && schedule.endTimeString
            ? `${schedule.startTimeString} - ${schedule.endTimeString}`
            : 'N/A',
        category: (schedule.classType || 'Tajweed').toUpperCase(),
        categoryColor,
        isOnline,
      };
    });
  }, [data]);

  const maxPage = Math.max(0, Math.ceil(classes.length / ITEMS_PER_PAGE) - 1);
  const visible = classes.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  return (
    <GlassPanel className="overflow-hidden">
      <PanelHeader
        title={t.todaysClasses}
        action={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-nejah-slate-blue">
              {classes.length > 0
                ? `${page * ITEMS_PER_PAGE + 1}–${Math.min((page + 1) * ITEMS_PER_PAGE, classes.length)} of ${classes.length}`
                : '0 of 0'}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setPage(Math.min(maxPage, page + 1))}
              disabled={page === maxPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        {isLoading ? (
          <div className="col-span-1 py-8 text-center font-medium text-nejah-slate-blue md:col-span-2">
            Loading today's classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-1 py-8 text-center font-medium text-nejah-slate-blue md:col-span-2">
            No classes scheduled for today
          </div>
        ) : (
          visible.map((cls) => (
            <div
              key={cls.id}
              className={cn(
                'group relative cursor-pointer rounded-xl border border-white/5 p-4 transition-all duration-200',
                'bg-background/30 hover:border-nejah-electric/30 hover:shadow-[0_0_20px_rgba(0,102,204,0.12)]',
                'dark:bg-background/50',
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
                    cls.categoryColor,
                  )}
                >
                  {cls.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-nejah-slate-blue">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono font-medium">{cls.time}</span>
                </div>
              </div>

              <h4 className="mb-3 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-nejah-electric">
                {cls.title}
              </h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nejah-sapphire to-nejah-electric text-xs font-bold text-white shadow-sm">
                    {cls.teacherInitials}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{cls.teacher}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {cls.isOnline ? (
                        <Wifi className="h-3 w-3 text-nejah-electric" />
                      ) : (
                        <MapPin className="h-3 w-3 text-nejah-slate-blue" />
                      )}
                      <p className="text-[10px] text-nejah-slate-blue">{cls.location}</p>
                    </div>
                  </div>
                </div>
                {cls.isOnline && (
                  <span className="badge-live-pulse flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassPanel>
  );
});
