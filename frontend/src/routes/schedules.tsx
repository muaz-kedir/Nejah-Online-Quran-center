import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Clock, User, BookOpen, Pencil, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api, apiUrl } from "@/lib/api";
import { cn } from '@/lib/utils';
import {
  DAYS_OF_WEEK,
  getSchedulesForDay,
  getTodayDayName,
  normalizeDayOfWeek,
  sortSchedulesByStartTime,
} from '@/lib/schedule-day';
import { EditScheduleModal } from '@/components/teachers/EditScheduleModal';

export const Route = createFileRoute('/schedules')({
  component: SchedulesPage,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
});

function SchedulesPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>(getTodayDayName());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Edit Modal State
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);
  const [schedulesWithDetails, setSchedulesWithDetails] = useState<any[]>([]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await api<any[]>('/schedules');
      const schedulesArray = Array.isArray(data) ? data : [];
      setSchedules(schedulesArray);
      
      // Load teacher details for each schedule
      const detailedSchedules = await Promise.all(
        schedulesArray.map(async (schedule: any) => {
          if (schedule.teacherId) {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(apiUrl(`/teachers/${schedule.teacherId}`), {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                const teacherData = await response.json();
                return { ...schedule, teacher: teacherData };
              }
            } catch {
              // Continue with original data if fetch fails
            }
          }
          return schedule;
        })
      );
      setSchedulesWithDetails(detailedSchedules);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSchedules();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const daySchedules = useMemo(
    () => sortSchedulesByStartTime(getSchedulesForDay(schedulesWithDetails, selectedDay)),
    [schedulesWithDetails, selectedDay],
  );

  const filtered = useMemo(
    () =>
      daySchedules.filter((s: any) => {
        const q = search.toLowerCase();
        return (
          s.className?.toLowerCase().includes(q) ||
          s.teacher?.fullName?.toLowerCase().includes(q) ||
          (s.isGroupSession 
            ? (s.scheduleStudents?.length || 0) > 0 
            : s.student?.fullName?.toLowerCase().includes(q))
        );
      }),
    [daySchedules, search],
  );

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const day of DAYS_OF_WEEK) {
      counts[day] = getSchedulesForDay(schedules, day).length;
    }
    return counts;
  }, [schedules]);

  const handleEditSchedule = (schedule: any) => {
    setScheduleToEdit(schedule);
    setIsEditScheduleOpen(true);
  };

  const getStudentInfo = (schedule: any) => {
    if (schedule?.isGroupSession) {
      const count = schedule?.scheduleStudents?.length || 0;
      return `${count} ${count === 1 ? 'student' : 'students'}`;
    }
    return schedule?.student?.fullName || 'N/A';
  };

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Schedules</h1>
          <p className="text-muted-foreground mt-1">View and manage teaching schedules by day</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl px-4" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary"
            onClick={() => {
              navigate({ to: '/teachers' });
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Schedule a Class
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {DAYS_OF_WEEK.map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? 'default' : 'outline'}
            onClick={() => setSelectedDay(day)}
            className={cn(
              'px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap flex flex-col gap-1 h-auto min-w-[88px]',
              selectedDay === day
                ? 'bg-primary text-white hover:bg-nejah-azure'
                : 'bg-white text-muted-foreground hover:bg-primary/10 border-border',
            )}
          >
            <span>{day.substring(0, 3)}</span>
            <span className="text-[10px] opacity-80">
              {dayCounts[day]} {dayCounts[day] === 1 ? 'class' : 'classes'}
            </span>
          </Button>
        ))}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${selectedDay} schedules...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="font-semibold text-nejah-sapphire text-foreground">{selectedDay}</span>
        <span>
          — {filtered.length} {filtered.length === 1 ? 'class' : 'classes'}
        </span>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted">
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Class</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Teacher</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Student</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Day</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Time</th>
              <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
              <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  No schedules found for {selectedDay}
                </td>
              </tr>
            ) : (
              filtered.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-muted">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">{s.className || s.classType || 'Quran Class'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{s.teacher?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {getStudentInfo(s)}
                  </td>
                  <td className="p-4">
                    <Badge className="bg-blue-100 text-blue-700">
                      {normalizeDayOfWeek(s.dayOfWeek) || s.dayOfWeek}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {s.startTimeString || s.startTime} - {s.endTimeString || s.endTime}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>
                      {s.status || 'active'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditSchedule(s)}
                      className="flex items-center gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        open={isEditScheduleOpen}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setScheduleToEdit(null);
        }}
        onSuccess={async () => {
          // Refresh schedules
          try {
            const data = await api<any[]>('/schedules');
            const schedulesArray = Array.isArray(data) ? data : [];
            setSchedules(schedulesArray);
            
            const detailedSchedules = await Promise.all(
              schedulesArray.map(async (schedule: any) => {
                if (schedule.teacherId) {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(apiUrl(`/teachers/${schedule.teacherId}`), {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.ok) {
                      const teacherData = await response.json();
                      return { ...schedule, teacher: teacherData };
                    }
                  } catch {
                    // Continue with original data if fetch fails
                  }
                }
                return schedule;
              })
            );
            setSchedulesWithDetails(detailedSchedules);
            toast.success('Schedule updated successfully');
          } catch {
            toast.error('Failed to refresh schedules');
          }
        }}
        teacher={scheduleToEdit?.teacher || null}
        schedule={scheduleToEdit}
        defaultDay={selectedDay}
        unassignedStudents={[]}
      />
    </DashboardLayout>
  );
}
