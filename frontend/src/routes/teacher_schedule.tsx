import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { Calendar, Clock, ChevronLeft, ChevronRight, MapPin, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/api';
import {
  DAYS_OF_WEEK,
  getSchedulesForDay,
  getTodayDayName,
  sortSchedulesByStartTime,
} from '@/lib/schedule-day';

export const Route = createFileRoute('/teacher_schedule')({
  component: TeacherSchedulePage,
  beforeLoad: () => requireAuth(['teacher']),
});

function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'day' | 'week'>('week');
  const [selectedDay, setSelectedDay] = useState<string>(getTodayDayName());

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/teachers/schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const schedulesForSelectedDay = sortSchedulesByStartTime(
    getSchedulesForDay(schedules, selectedDay),
  );
  const schedulesForToday = sortSchedulesByStartTime(
    getSchedulesForDay(schedules, getTodayDayName()),
  );

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 tracking-widest uppercase mb-1">
              Class Schedule
            </p>
            <h1 className="text-4xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">
              My Schedule
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('day')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                currentView === 'day' ? 'bg-emerald-900 text-white' : 'text-gray-600 dark:text-gray-300'
              )}
            >
              Day View
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('week')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                currentView === 'week' ? 'bg-emerald-900 text-white' : 'text-gray-600 dark:text-gray-300'
              )}
            >
              Week View
            </Button>
          </div>
        </div>

        {/* Day Selector (Week View) */}
        {currentView === 'week' && (
          <div className="flex gap-2 overflow-x-auto pb-4">
            {DAYS_OF_WEEK.map(day => (
              <Button
                key={day}
                variant={selectedDay === day ? 'default' : 'outline'}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap',
                  selectedDay === day 
                    ? 'bg-emerald-900 text-white hover:bg-emerald-800' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                )}
              >
                {day}
              </Button>
            ))}
          </div>
        )}

        {/* Schedule Container */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-900 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Loading schedule...</p>
            </div>
          ) : (
            <>
              {currentView === 'day' ? (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-emerald-950 dark:text-gray-100 mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  {schedulesForToday.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No classes scheduled for today</p>
                    </div>
                  ) : (
                    schedulesForToday.map(schedule => (
                      <div key={schedule.id} className="mb-4 last:mb-0">
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all">
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 bg-emerald-900 dark:bg-emerald-800 rounded-xl flex flex-col items-center justify-center text-white">
                              <span className="text-xs font-medium uppercase">{schedule.dayOfWeek?.substring(0, 3)}</span>
                              <span className="text-xl font-bold">{schedule.startTimeString?.split(':')[0]}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-emerald-950 dark:text-gray-100">{schedule.studentName}</h3>
                              <Badge className={cn(
                                "text-xs px-3 py-1 rounded-lg",
                                schedule.status === 'active' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {schedule.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                              </div>
                              {schedule.meetingLink && (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <Wifi className="h-4 w-4" />
                                  <span>Online Class</span>
                                </div>
                              )}
                            </div>
                            {schedule.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                <span className="font-semibold">Notes: </span>
                                {schedule.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                  <h2 className="text-xl font-bold text-emerald-950 dark:text-gray-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {selectedDay} Schedule
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {schedulesForSelectedDay.length}{' '}
                    {schedulesForSelectedDay.length === 1 ? 'class' : 'classes'} scheduled
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {schedulesForSelectedDay.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-400">
                            No classes scheduled for {selectedDay}
                          </td>
                        </tr>
                      ) : (
                        schedulesForSelectedDay.map((schedule) => (
                          <tr key={schedule.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors">
                            <td className="py-4 px-6">
                              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm font-bold text-emerald-900 dark:text-gray-100">{schedule.studentName}</p>
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={cn(
                                "text-xs px-3 py-1 rounded-lg",
                                schedule.status === 'active' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {schedule.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                {schedule.meetingLink ? (
                                  <Wifi className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                )}
                                <span>{schedule.meetingLink ? 'Online' : 'In-Person'}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
