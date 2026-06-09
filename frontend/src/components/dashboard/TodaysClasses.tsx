import { ChevronLeft, ChevronRight, Clock, MapPin, Wifi } from 'lucide-react';
import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

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

import { API_BASE, apiHeaders } from '@/lib/api';

const ITEMS_PER_PAGE = 2;

export const TodaysClasses = memo(function TodaysClasses() {
  const { t } = useApp();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${API_BASE}/schedules`, {
          headers: apiHeaders(),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const data = await response.json();
        
        // Filter classes for today
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];

        if (Array.isArray(data)) {
          const todays = data.filter((schedule: any) => {
            return schedule.dayOfWeek?.toLowerCase() === todayName.toLowerCase();
          });

          const formatted = todays.map((schedule: any) => {
            const teacherName = schedule.teacher?.fullName || 'Assigned Teacher';
            const initials = teacherName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            
            const isOnline = schedule.classType?.toLowerCase() === 'online' || !!schedule.meetingLink;
            
            const location = isOnline
              ? (schedule.meetingLink ? `Online Room` : 'Online Class')
              : (schedule.notes || 'Classroom');

            const category = (schedule.classType || 'tajweed').toUpperCase();
            let categoryColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
            if (category.includes('TAJWEED')) {
              categoryColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
            } else if (category.includes('KIDS') || category.includes('FOUNDATION')) {
              categoryColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
            } else if (category.includes('TAFSIR')) {
              categoryColor = 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
            }

            return {
              id: schedule.id,
              title: schedule.className || 'Quran Class',
              teacher: teacherName,
              teacherInitials: initials || 'AT',
              location: location,
              time: schedule.startTimeString && schedule.endTimeString 
                ? `${schedule.startTimeString} - ${schedule.endTimeString}`
                : 'N/A',
              category: (schedule.classType || 'Tajweed').toUpperCase(),
              categoryColor: categoryColor,
              isOnline: isOnline,
            };
          });

          setClasses(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch today\'s classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const maxPage = Math.max(0, Math.ceil(classes.length / ITEMS_PER_PAGE) - 1);
  const visible = classes.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.todaysClasses}</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {classes.length > 0
              ? `${page * ITEMS_PER_PAGE + 1}–${Math.min((page + 1) * ITEMS_PER_PAGE, classes.length)} of ${classes.length}`
              : '0 of 0'}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            onClick={() => setPage(Math.min(maxPage, page + 1))}
            disabled={page === maxPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-1 md:col-span-2 py-8 text-center text-gray-450 dark:text-gray-400 font-medium">
            Loading today's classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-8 text-center text-gray-450 dark:text-gray-400 font-medium">
            No classes scheduled for today
          </div>
        ) : (
          visible.map((cls) => (
            <div
              key={cls.id}
              className={cn(
                'group relative rounded-xl border border-gray-100 dark:border-gray-700 p-4',
                'bg-gray-50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-700/50',
                'hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700',
                'transition-all duration-200 cursor-pointer'
              )}
            >
              {/* Category + Time */}
              <div className="flex items-start justify-between mb-3">
                <Badge className={cn('text-[10px] font-semibold uppercase tracking-wider rounded-md px-2 py-0.5 border-0', cls.categoryColor)}>
                  {cls.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{cls.time}</span>
                </div>
              </div>

              {/* Title */}
              <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {cls.title}
              </h4>

              {/* Teacher row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                    {cls.teacherInitials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{cls.teacher}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {cls.isOnline ? (
                        <Wifi className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <MapPin className="h-3 w-3 text-gray-400" />
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{cls.location}</p>
                    </div>
                  </div>
                </div>
                {cls.isOnline && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
