/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

import { useState, useEffect } from 'react';
import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  ChevronLeft,
  Pencil,
  UserPlus,
  BookOpen,
  UserCog,
  MapPin,
  Clock,
  CheckCircle,
  GraduationCap,
  Calendar,
  Award,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Users,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api, apiUrl } from "@/lib/api";
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  getSchedulesForDay,
  getTodayDayName,
  sortSchedulesByStartTime,
  WEEK_DISPLAY_ORDER_MONDAY_FIRST,
} from '@/lib/schedule-day';
import { getScheduleSearchText, getScheduleStudentLabel } from '@/lib/schedule-display';
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';
import { EditScheduleModal } from '@/components/teachers/EditScheduleModal';
import { AssignTemporaryTeacherModal } from '@/components/teachers/AssignTemporaryTeacherModal';
import { TeacherRecentlyCompletedSessions } from '@/components/teachers/TeacherRecentlyCompletedSessions';

export const Route = createLazyFileRoute('/teachers_/$id/profile')({
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: teacher, isLoading: loading } = useApiQuery<any>({
    queryKey: ['teacher-profile', id],
    path: `/teachers/${id}`,
    refetchInterval: 30_000,
  });

  const { data: allStudents } = useApiQuery<any[]>({
    queryKey: ['unassigned-students'],
    path: '/students/unassigned',
    refetchInterval: 30_000,
  });

  const [selectedDay, setSelectedDay] = useState<string>(getTodayDayName());
  const [daySchedules, setDaySchedules] = useState<any[]>([]);
  const [loadingDaySchedules, setLoadingDaySchedules] = useState(false);

  useEffect(() => {
    if (!id || !selectedDay) return;
    const fetchDaySchedules = async () => {
      setLoadingDaySchedules(true);
      try {
        const data = await api<any[]>(`/schedules/teacher/${id}/day/${encodeURIComponent(selectedDay)}`);
        setDaySchedules(Array.isArray(data) ? data : []);
      } catch {
        setDaySchedules(getSchedulesForDay(teacher?.schedules, selectedDay));
      } finally {
        setLoadingDaySchedules(false);
      }
    };
    fetchDaySchedules();
  }, [id, selectedDay, teacher?.schedules]);

  // Assign Student Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [confirmUnassignId, setConfirmUnassignId] = useState<string | null>(null);
  const [confirmUnassignName, setConfirmUnassignName] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Schedule State
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [isTempReplacementOpen, setIsTempReplacementOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);
  const [confirmDeleteScheduleId, setConfirmDeleteScheduleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-profile', id] });
    queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
  };

  const handleAssignStudent = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student to assign');
      return;
    }
    setAssigning(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/teachers/${id}/assign-students`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: [selectedStudentId] }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign student');
      }

      toast.success('Student successfully assigned to this teacher!');
      setIsAssignModalOpen(false);
      setSelectedStudentId('');
      invalidateAll();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    setConfirmUnassignId(studentId);
    const student = teacher.students?.find((s: any) => s.id === studentId);
    if (student) setConfirmUnassignName(student.fullName);
  };

  const executeUnassign = async () => {
    if (!confirmUnassignId) return;

    const studentId = confirmUnassignId;
    setConfirmUnassignId(null);
    setUnassigningId(studentId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/students/assignments/unassign`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove student');
      }

      toast.success('Student removed and schedule cleared');
      
      setTimeout(() => {
        invalidateAll();
        setUnassigningId(null);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove student');
      setUnassigningId(null);
    }
  };

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
      invalidateAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete schedule');
      setConfirmDeleteScheduleId(null);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'active': return 'bg-primary/100';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'on leave': return 'bg-amber-500';
      default: return 'bg-nejah-slate-blue';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-muted-foreground animate-pulse font-serif">
          Loading detailed profile...
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
            onClick={() => window.location.href = '/teachers'}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground dark:hover:text-nejah-electric uppercase tracking-widest transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Faculty
          </button>
        </div>

        {/* Profile Header Block */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl p-6 border border-border dark:border-nejah-border-blue shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface dark:to-nejah-surface border-4 border-white dark:border-nejah-border-blue shadow-lg flex items-center justify-center font-bold text-3xl text-nejah-electric">
                {teacher.fullName.charAt(0)}
              </div>

              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-extrabold text-foreground font-serif">{teacher.fullName}</h1>
                  <Badge className="bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric border border-primary/30 rounded-full px-2.5 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1">
                    <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(teacher.status))} />
                    {teacher.status || 'Active'}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1">
                  <GraduationCap className="h-4 w-4" /> {teacher.specialization || 'Quranic Sciences & Hadith'}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground dark:text-muted-foreground font-medium">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {teacher.city || 'Cairo, Egypt'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {teacher.experience || 0} Years Experience</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="h-10 rounded-xl px-4 bg-primary/10 hover:bg-primary/10 text-foreground border border-primary/250/20 gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Pencil className="h-4 w-4" /> Edit Profile
              </Button>
              <Button
                onClick={() => setIsAssignModalOpen(true)}
                className="h-10 rounded-xl px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <UserPlus className="h-4 w-4" /> Assign Student
              </Button>
              <Button
                onClick={() => setIsTempReplacementOpen(true)}
                variant="outline"
                className="h-10 rounded-xl px-4 border-amber-200 text-amber-800 gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <UserCog className="h-4 w-4" /> Assign Temporary Teacher
              </Button>
              <Button
                onClick={() => {
                  setScheduleToEdit(null);
                  setIsEditScheduleOpen(true);
                }}
                className="h-10 rounded-xl px-4 bg-primary hover:bg-nejah-azure text-white gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" /> Add Schedule
              </Button>
            </div>
          </div>
        </div>

        {/* Assigned Students Summary */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-foreground font-serif">Assigned Students</h2>
                <p className="text-sm text-muted-foreground">
                  {teacher.students?.length || 0} student{(teacher.students?.length || 0) !== 1 ? 's' : ''} under this teacher
                </p>
              </div>
            </div>
            <Button asChild className="rounded-xl gap-2">
              <Link to="/teachers/$id/students" params={{ id }}>
                View Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Recently Completed Sessions (same as teacher dashboard) */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm p-6">
          <TeacherRecentlyCompletedSessions teacherId={id} teacherName={teacher.fullName} />
        </div>

        {/* Schedule Detail Section (Redesigned) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-foreground font-serif flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Weekly Schedule Management
            </h2>
          </div>

          {/* Interactive Day Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {WEEK_DISPLAY_ORDER_MONDAY_FIRST.map((day) => {
              const daySlots = getSchedulesForDay(teacher.schedules, day);
              const isSelected = selectedDay === day;
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 text-center relative overflow-hidden",
                    isSelected 
                      ? "bg-primary border-nejah-border-blue shadow-md transform -translate-y-1" 
                      : "bg-card dark:bg-nejah-surface border-border dark:border-nejah-border-blue hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/10 dark:hover:bg-primary/10 hover:shadow-sm"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/40" />
                  )}
                  <span className={cn(
                    "text-sm font-extrabold font-serif mb-1",
                    isSelected ? "text-white" : "text-foreground dark:text-muted-foreground"
                  )}>
                    {day.substring(0, 3)}
                  </span>
                  <Badge className={cn(
                    "font-bold text-[10px] px-2 py-0.5 rounded-full",
                    isSelected 
                      ? "bg-nejah-azure/80 text-nejah-electric border-none" 
                      : daySlots.length > 0 
                        ? "bg-primary/10 text-primary border-primary/50 dark:bg-primary/10 text-nejah-electric" 
                        : "bg-muted text-muted-foreground border-none dark:bg-nejah-surface"
                  )}>
                    {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule List */}
          <div className="bg-card dark:bg-nejah-surface rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border dark:border-nejah-border-blue flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/50 dark:bg-nejah-surface/20">
              <div>
                <h3 className="text-lg font-bold text-foreground text-foreground font-serif flex items-center gap-2">
                  <span className="text-primary text-nejah-electric">{selectedDay}</span> Schedule
                </h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  {filteredDailySchedules.length} assigned classes for this day
                </p>
              </div>

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
              {loadingDaySchedules ? (
                <div className="py-16 text-center text-muted-foreground animate-pulse font-serif">
                  Loading {selectedDay}&apos;s schedule...
                </div>
              ) : filteredDailySchedules.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted dark:bg-nejah-surface border border-dashed border-border dark:border-nejah-border-blue flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="text-foreground text-foreground font-bold font-serif">No classes found</h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    {searchQuery ? "Try adjusting your search query." : `There are no scheduled classes for ${selectedDay}.`}
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
                            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-nejah-sapphire/40 text-nejah-electric flex items-center justify-center font-bold text-lg shadow-sm border border-primary/50">
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
                          <div className="flex items-center gap-2 text-nejah-electric">
                            <Clock className="h-4 w-4 opacity-70" />
                            <span className="text-sm font-bold tracking-tight">
                              {schedule.startTimeString} - {schedule.endTimeString}
                            </span>
                          </div>
                          <Badge className="bg-primary/10/80 text-foreground dark:bg-primary/10 text-nejah-electric border-none text-[10px] font-bold uppercase tracking-wider px-2">
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

      </div>

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        open={isEditScheduleOpen}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setScheduleToEdit(null);
        }}
        onSuccess={invalidateAll}
        teacher={teacher}
        schedule={scheduleToEdit}
        defaultDay={selectedDay}
        unassignedStudents={allStudents}
      />

      <AssignTemporaryTeacherModal
        open={isTempReplacementOpen}
        onClose={() => setIsTempReplacementOpen(false)}
        onSuccess={() => toast.success('Temporary assignment created')}
        originalTeacherId={teacher?.id}
        originalTeacherName={teacher?.fullName}
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

      {/* Assign Student Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[480px] dark:bg-nejah-surface dark:border-nejah-border-blue rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-5.5 w-5.5 text-primary" />
              Assign Student to Teacher
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
              Select an active student to map to <span className="font-bold text-foreground dark:text-foreground">{teacher.fullName}</span>. 
            </p>

            <div className="grid gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Select Student</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl">
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue max-h-[200px]">
                  {allStudents.length === 0 ? (
                    <div className="py-2 text-center text-xs text-muted-foreground">All students assigned.</div>
                  ) : (
                    allStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName} ({s.level || 'Beginner'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 mt-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-xl border-border dark:border-nejah-border-blue dark:text-muted-foreground h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignStudent}
              disabled={assigning || !selectedStudentId}
              className="bg-primary hover:bg-nejah-azure text-white rounded-xl h-10"
            >
              {assigning ? 'Assigning...' : 'Assign Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog open={!!confirmUnassignId} onOpenChange={(open) => !open && setConfirmUnassignId(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="bg-card dark:bg-nejah-surface p-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground text-foreground font-serif">Remove Student?</h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-foreground text-foreground">{confirmUnassignName}</span> from this teacher's assignment?
                <br /><br />
                <span className="text-red-500 font-bold">Warning:</span> This will permanently delete their current weekly study schedule.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                variant="destructive" 
                className="rounded-2xl h-11 font-bold text-sm bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none"
                onClick={executeUnassign}
              >
                Yes, Remove Student
              </Button>
              <Button 
                variant="ghost" 
                className="rounded-2xl h-11 font-bold text-sm text-muted-foreground hover:text-muted-foreground"
                onClick={() => setConfirmUnassignId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={invalidateAll}
        teacher={teacher}
      />
    </DashboardLayout>
  );
}
