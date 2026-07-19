/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { requireAuth } from '@/lib/auth';
import { Calendar, Clock, ChevronLeft, ChevronRight, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  DAYS_OF_WEEK,
  getSchedulesForDay,
  getTodayDayName,
  sortSchedulesByStartTime,
} from '@/lib/schedule-day';

export const Route = createLazyFileRoute('/teacher_schedule')({
  component: TeacherSchedulePage,
});

function TeacherSchedulePage() {
  const { data: schedules = [], isLoading: loading } = useApiQuery<any[]>({
    queryKey: ['teacher-schedule'],
    path: '/teachers/schedule',
    refetchInterval: 30_000,
  });
  const [currentView, setCurrentView] = useState<'day' | 'week'>('week');
  const [selectedDay, setSelectedDay] = useState<string>(getTodayDayName());

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
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-primary dark:text-primary tracking-widest uppercase mb-1">
              Class Schedule
            </p>
            <h1 className="text-4xl font-extrabold text-nejah-sapphire text-foreground font-serif">
              My Schedule
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-card dark:bg-nejah-surface p-1 rounded-xl border border-border dark:border-nejah-border-blue">
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('day')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                currentView === 'day' ? 'bg-primary text-white' : 'text-muted-foreground dark:text-muted-foreground'
              )}
            >
              Day View
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('week')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                currentView === 'week' ? 'bg-primary text-white' : 'text-muted-foreground dark:text-muted-foreground'
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
                    ? 'bg-primary text-white hover:bg-nejah-azure' 
                    : 'bg-card dark:bg-nejah-surface text-muted-foreground dark:text-muted-foreground hover:bg-primary/10 dark:hover:bg-nejah-surface border-border dark:border-nejah-border-blue'
                )}
              >
                {day}
              </Button>
            ))}
          </div>
        )}

        {/* Schedule Container */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-sm border border-border dark:border-nejah-border-blue overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nejah-border-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground dark:text-muted-foreground font-medium">Loading schedule...</p>
            </div>
          ) : (
            <>
              {currentView === 'day' ? (
                <div className="p-6">
                  <h2 className="text-xl font-bold text-nejah-sapphire text-foreground mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  {schedulesForToday.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-primary/10 dark:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-primary text-nejah-electric" />
                      </div>
                      <p className="text-muted-foreground dark:text-muted-foreground font-medium">No classes scheduled for today</p>
                    </div>
                  ) : (
                    schedulesForToday.map(schedule => (
                      <div key={schedule.id} className="mb-4 last:mb-0">
                        <div className="flex items-start gap-4 p-6 rounded-2xl bg-muted/50 dark:bg-nejah-surface/30 border border-border dark:border-nejah-border-blue hover:border-primary/50 dark:hover:border-primary/700 transition-all">
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 bg-primary dark:bg-primary/10 rounded-xl flex flex-col items-center justify-center text-white">
                              <span className="text-xs font-medium uppercase">{schedule.dayOfWeek?.substring(0, 3)}</span>
                              <span className="text-xl font-bold">{schedule.startTimeString?.split(':')[0]}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-foreground">{schedule.studentName}</h3>
                              <Badge className={cn(
                                "text-xs px-3 py-1 rounded-lg",
                                schedule.status === 'active' ? "bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric" :
                                "bg-muted text-foreground dark:bg-nejah-surface dark:text-muted-foreground"
                              )}>
                                {schedule.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                              </div>
                              {schedule.meetingLink && (
                                <div className="flex items-center gap-1 text-primary">
                                  <Wifi className="h-4 w-4" />
                                  <span>Online Class</span>
                                </div>
                              )}
                            </div>
                            {schedule.notes && (
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground bg-muted dark:bg-nejah-surface p-3 rounded-lg">
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
                <div className="p-6 border-b border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/20">
                  <h2 className="text-xl font-bold text-nejah-sapphire text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {selectedDay} Schedule
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    {schedulesForSelectedDay.length}{' '}
                    {schedulesForSelectedDay.length === 1 ? 'class' : 'classes'} scheduled
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 dark:bg-nejah-surface/50 border-b border-border dark:border-nejah-border-blue">
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time</th>
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Student</th>
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                        <th className="py-4 px-6 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-nejah-border-blue">
                      {schedulesForSelectedDay.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-muted-foreground">
                            No classes scheduled for {selectedDay}
                          </td>
                        </tr>
                      ) : (
                        schedulesForSelectedDay.map((schedule) => (
                          <tr key={schedule.id} className="hover:bg-muted/50 dark:hover:bg-nejah-surface/30 transition-colors">
                            <td className="py-4 px-6">
                              <div className="text-sm text-foreground dark:text-muted-foreground font-medium">
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-sm font-bold text-foreground">{schedule.studentName}</p>
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={cn(
                                "text-xs px-3 py-1 rounded-lg",
                                schedule.status === 'active' ? "bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric" :
                                "bg-muted text-foreground dark:bg-nejah-surface dark:text-muted-foreground"
                              )}>
                                {schedule.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-muted-foreground">
                                <Wifi className="h-3 w-3 text-primary" />
                                <span>Online</span>
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
    </TeacherLayout>
  );
}
