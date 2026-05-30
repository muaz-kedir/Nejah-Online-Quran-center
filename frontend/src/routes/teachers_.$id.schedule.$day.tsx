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

export const Route = createFileRoute('/teachers_/$id/schedule/$day')({
  component: TeacherDailySchedulePage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function TeacherDailySchedulePage() {
  const { id, day } = useParams({ from: '/teachers_/$id/schedule/$day' });
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule State
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);
  const [confirmDeleteScheduleId, setConfirmDeleteScheduleId] = useState<string | null>(null);

  const fetchTeacher = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/teachers/${id}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setTeacher(data);
    } catch (error) {
      toast.error('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id, day]);

  const executeDeleteSchedule = async () => {
    if (!confirmDeleteScheduleId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/schedules/${confirmDeleteScheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      toast.success('Schedule deleted successfully');
      setConfirmDeleteScheduleId(null);
      fetchTeacher();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete schedule');
      setConfirmDeleteScheduleId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-500 animate-pulse font-serif">
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

  // Ensure 'day' matches one of the week days or redirect/default
  const displayDay = day.charAt(0).toUpperCase() + day.slice(1);
  
  const dailySchedules = teacher.schedules?.filter((s: any) => s.dayOfWeek.toLowerCase() === day.toLowerCase()) || [];
  const filteredDailySchedules = dailySchedules.filter((s: any) => {
    if (!searchQuery) return true;
    const studentName = s.student?.fullName || s.studentId;
    return studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.classType?.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a: any, b: any) => a.startTimeString.localeCompare(b.startTimeString));

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate({ to: `/teachers/${id}` })}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-emerald-800 uppercase tracking-widest transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Teacher Profile
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-emerald-900 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <Badge className="bg-emerald-800 text-emerald-100 hover:bg-emerald-700 border-none font-bold uppercase tracking-wider mb-3">
                {teacher.fullName}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white font-serif flex items-center justify-center md:justify-start gap-3">
                <Calendar className="h-8 w-8 text-emerald-300" />
                {displayDay}'s Schedule
              </h1>
              <p className="text-emerald-100 mt-2 font-medium">
                Managing {filteredDailySchedules.length} assigned classes for this day
              </p>
            </div>
            
            <Button
              onClick={() => {
                setScheduleToEdit(null);
                setIsEditScheduleOpen(true);
              }}
              className="bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl h-11 px-6 shadow-lg shadow-emerald-950/20 gap-2 font-bold"
            >
              <Plus className="h-4 w-4" /> Schedule a Class
            </Button>
          </div>
        </div>

        {/* Daily Schedule List */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-750 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-serif">
              Class Roster
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-shadow"
                />
              </div>
              <Button variant="outline" className="h-10 px-3 rounded-xl border-gray-200 dark:border-gray-700 text-gray-500">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6">
            {filteredDailySchedules.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h4 className="text-gray-900 dark:text-gray-100 font-bold font-serif">No classes found</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {searchQuery ? "Try adjusting your search query." : `There are no scheduled classes for ${displayDay}.`}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => {
                      setScheduleToEdit(null);
                      setIsEditScheduleOpen(true);
                    }}
                    variant="outline"
                    className="mt-6 rounded-xl text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Schedule a Class
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDailySchedules.map((schedule: any) => {
                  const studentName = schedule.student?.fullName || 'Unknown Student';
                  const studentAvatar = studentName.charAt(0);
                  
                  return (
                    <div key={schedule.id} className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all hover:border-emerald-100 dark:hover:border-emerald-900/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shadow-sm border border-emerald-100/50">
                            {studentAvatar}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-gray-900 dark:text-gray-100 line-clamp-1">{studentName}</h4>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500">{schedule.classType || schedule.className || 'Quran Class'}</p>
                          </div>
                        </div>
                        
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                          <button
                            onClick={() => {
                              setScheduleToEdit(schedule);
                              setIsEditScheduleOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteScheduleId(schedule.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-400">
                          <Clock className="h-4 w-4 opacity-70" />
                          <span className="text-sm font-bold tracking-tight">
                            {schedule.startTimeString} - {schedule.endTimeString}
                          </span>
                        </div>
                        <Badge className="bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none text-[10px] font-bold uppercase tracking-wider px-2">
                          {schedule.status || 'Active'}
                        </Badge>
                      </div>
                      
                      {schedule.notes && (
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic border-l-2 border-gray-200 dark:border-gray-700 pl-2">
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
        onSuccess={fetchTeacher}
        teacher={teacher}
        schedule={scheduleToEdit}
        defaultDay={displayDay}
      />

      {/* Delete Schedule Confirmation */}
      <Dialog open={!!confirmDeleteScheduleId} onOpenChange={(open) => !open && setConfirmDeleteScheduleId(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="bg-white dark:bg-gray-900 p-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-serif">Delete Schedule?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
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
                className="rounded-2xl h-11 font-bold text-sm text-gray-400 hover:text-gray-600"
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
