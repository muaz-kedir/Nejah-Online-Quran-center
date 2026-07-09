import { useState, useEffect } from 'react';
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ChevronLeft, Calendar, Plus, Pencil, Trash2, Clock, Search, Filter, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { EditScheduleModal } from '@/components/teachers/EditScheduleModal';

import { requireAuth } from '@/lib/auth';
import { api, API_BASE, apiUrl } from "@/lib/api";
import {
  getSchedulesForDay,
  normalizeDayOfWeek,
  sortSchedulesByStartTime,
} from '@/lib/schedule-day';
import { getScheduleSearchText, getScheduleStudentLabel } from '@/lib/schedule-display';

export const Route = createFileRoute('/teachers_/$id/schedule/$day')({
  component: TeacherDailySchedulePage,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
});

function TeacherDailySchedulePage() {
  const { id, day } = useParams({ from: '/teachers_/$id/schedule/$day' });
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState<any | null>(null);
  const [daySchedules, setDaySchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule State
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);
  const [confirmDeleteScheduleId, setConfirmDeleteScheduleId] = useState<string | null>(null);

  const fetchTeacher = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/teachers/${id}?t=${Date.now()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTeacher(data);
      return data;
    } catch (error) {
      toast.error('Failed to load teacher profile');
      return null;
    }
  };

  const fetchDaySchedules = async (teacherData?: any) => {
    try {
      const data = await api<any[]>(
        `/schedules/teacher/${id}/day/${encodeURIComponent(day)}`,
      );
      setDaySchedules(Array.isArray(data) ? data : []);
    } catch {
      const source = teacherData ?? teacher;
      setDaySchedules(getSchedulesForDay(source?.schedules, day));
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const teacherData = await fetchTeacher();
      await fetchDaySchedules(teacherData);
      setLoading(false);
    };
    load();
  }, [id, day]);

  const executeDeleteSchedule = async () => {
    if (!confirmDeleteScheduleId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/schedules/${confirmDeleteScheduleId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      toast.success('Schedule deleted successfully');
      setConfirmDeleteScheduleId(null);
      const teacherData = await fetchTeacher();
      await fetchDaySchedules(teacherData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete schedule');
      setConfirmDeleteScheduleId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted-foreground animate-pulse font-serif">
          Loading daily schedule...
        </div>
      </DashboardLayout>
    );
  }

  if (!teacher) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-red-500 font-serif">
          Teacher not found
        </div>
      </DashboardLayout>
    );
  }

  const displayDay = normalizeDayOfWeek(day) ?? day;

  const filteredDailySchedules = sortSchedulesByStartTime(
    daySchedules.filter((s: any) => {
      if (!searchQuery) return true;
      const studentName = getScheduleSearchText(s);
      return (
        studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.className?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }),
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate({ to: '/teachers/$id/profile', params: { id } })}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-nejah-sapphire uppercase tracking-widest transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Teacher Profile
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-primary rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-nejah-azure rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <Badge className="bg-nejah-azure text-nejah-electric hover:bg-primary border-none font-bold uppercase tracking-wider mb-3">
                {teacher.fullName}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white font-serif flex items-center justify-center md:justify-start gap-3">
                <Calendar className="h-8 w-8 text-nejah-electric" />
                {displayDay}'s Schedule
              </h1>
              <p className="text-nejah-electric mt-2 font-medium">
                Managing {filteredDailySchedules.length} assigned classes for this day
              </p>
            </div>
            
            <Button
              onClick={() => {
                setScheduleToEdit(null);
                setIsEditScheduleOpen(true);
              }}
              className="bg-white text-nejah-sapphire hover:bg-primary/10 rounded-xl h-11 px-6 shadow-lg shadow-nejah-glow gap-2 font-bold"
            >
              <Plus className="h-4 w-4" /> Schedule a Class
            </Button>
          </div>
        </div>

        {/* Daily Schedule List */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border dark:border-nejah-border-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50 dark:bg-nejah-surface/20">
            <h3 className="text-lg font-bold text-foreground text-foreground font-serif">
              Class Roster
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 h-10 bg-card dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/500/20 transition-shadow"
                />
              </div>
              <Button variant="outline" className="h-10 px-3 rounded-xl border-border dark:border-nejah-border-blue text-muted-foreground">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {filteredDailySchedules.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted dark:bg-nejah-surface border border-dashed border-border dark:border-nejah-border-blue flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="text-foreground text-foreground font-bold font-serif">No classes found</h4>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search query." : `There are no scheduled classes for ${displayDay}.`}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => {
                      setScheduleToEdit(null);
                      setIsEditScheduleOpen(true);
                    }}
                    variant="outline"
                    className="mt-6 rounded-xl text-primary border-primary/200 hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Schedule a Class
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDailySchedules.map((schedule: any) => {
                  const { name: studentName, avatar: studentAvatar } = getScheduleStudentLabel(schedule);

                  return (
                    <div key={schedule.id} className="group p-5 rounded-2xl border border-border dark:border-nejah-border-blue bg-card dark:bg-nejah-surface hover:shadow-md transition-all hover:border-primary/100 dark:hover:border-nejah-border-blue/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/100 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-nejah-sapphire/40 text-nejah-sapphire text-nejah-electric flex items-center justify-center font-bold text-lg shadow-sm border border-primary/50">
                            {studentAvatar}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-foreground text-foreground line-clamp-1">{studentName}</h4>
                            <p className="text-xs font-medium text-primary dark:text-primary">{schedule.classType || schedule.className || 'Quran Class'}</p>
                          </div>
                        </div>
                        
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button
                            onClick={() => {
                              setScheduleToEdit(schedule);
                              setIsEditScheduleOpen(true);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteScheduleId(schedule.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-muted dark:bg-nejah-surface/50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-nejah-sapphire text-nejah-electric">
                          <Clock className="h-4 w-4 opacity-70" />
                          <span className="text-sm font-bold tracking-tight">
                            {schedule.startTimeString} - {schedule.endTimeString}
                          </span>
                        </div>
                        <Badge className="bg-primary/10/80 text-nejah-sapphire dark:bg-primary/10 text-nejah-electric border-none text-[10px] font-bold uppercase tracking-wider px-2">
                          {schedule.status || 'Active'}
                        </Badge>
                      </div>
                      
                      {schedule.notes && (
                        <p className="mt-3 text-xs text-muted-foreground dark:text-muted-foreground line-clamp-2 italic border-l-2 border-border dark:border-nejah-border-blue pl-2">
                          "{schedule.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        open={isEditScheduleOpen}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setScheduleToEdit(null);
        }}
        onSuccess={async () => {
          const teacherData = await fetchTeacher();
          await fetchDaySchedules(teacherData);
        }}
        teacher={teacher}
        schedule={scheduleToEdit}
        defaultDay={displayDay}
      />

      {/* Delete Schedule Confirmation */}
      <Dialog open={!!confirmDeleteScheduleId} onOpenChange={(open) => !open && setConfirmDeleteScheduleId(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="bg-card dark:bg-nejah-surface p-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground text-foreground font-serif">Delete Schedule?</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                Are you sure you want to delete this schedule slot? This action cannot be undone.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                variant="destructive" 
                className="rounded-2xl h-11 font-bold text-sm bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none"
                onClick={executeDeleteSchedule}
              >
                Yes, Delete Schedule
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-2xl h-11 font-bold text-sm text-muted-foreground hover:text-muted-foreground"
                onClick={() => setConfirmDeleteScheduleId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
