import { useState, useEffect } from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  ChevronLeft,
  MessageSquare,
  Pencil,
  UserPlus,
  BookOpen,
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
  Filter
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
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';
import { EditScheduleModal } from '@/components/teachers/EditScheduleModal';

export const Route = createFileRoute('/teachers_/$id')({
  component: TeacherProfilePage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TeacherProfilePage() {
  const { id } = useParams({ from: '/teachers_/$id' });
  const [teacher, setTeacher] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Assign Student Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [confirmUnassignId, setConfirmUnassignId] = useState<string | null>(null);
  const [confirmUnassignName, setConfirmUnassignName] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Schedule State
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);
  const [confirmDeleteScheduleId, setConfirmDeleteScheduleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeacher = async () => {
    if (!teacher) setLoading(true);
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
      if (!teacher) setLoading(false);
    }
  };

  const fetchUnassignedStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/students?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const filtered = data.data.filter((s: any) => !s.teacherId || s.teacherId === null);
        setAllStudents(filtered);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  useEffect(() => {
    if (isAssignModalOpen) {
      fetchUnassignedStudents();
    }
  }, [isAssignModalOpen]);

  const handleAssignStudent = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student to assign');
      return;
    }
    setAssigning(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/teachers/${id}/assign-students`, {
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
      fetchTeacher();
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
      const response = await fetch('http://localhost:3000/api/students/assignments/unassign', {
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
        fetchTeacher();
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

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'active': return 'bg-emerald-500';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'on leave': return 'bg-amber-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-500 animate-pulse font-serif">
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

  // Filter schedules for the selected day and apply search query
  const dailySchedules = teacher.schedules?.filter((s: any) => s.dayOfWeek === selectedDay) || [];
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
            onClick={() => window.location.href = '/teachers'}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-emerald-800 uppercase tracking-widest transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Faculty
          </button>
        </div>

        {/* Profile Header Block */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center font-bold text-3xl text-emerald-850 dark:text-emerald-300">
                {teacher.fullName.charAt(0)}
              </div>

              <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">{teacher.fullName}</h1>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-250/30 rounded-full px-2.5 font-bold uppercase text-[9px] tracking-widest flex items-center gap-1">
                    <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(teacher.status))} />
                    {teacher.status || 'Active'}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1">
                  <GraduationCap className="h-4 w-4" /> {teacher.specialization || 'Quranic Sciences & Hadith'}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {teacher.city || 'Cairo, Egypt'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {teacher.experience || 0} Years Experience</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                className="h-10 rounded-xl px-4 dark:border-gray-700 gap-1.5 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300"
              >
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="h-10 rounded-xl px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-250/20 gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Pencil className="h-4 w-4" /> Edit Profile
              </Button>
              <Button
                onClick={() => {
                  setScheduleToEdit(null);
                  setIsEditScheduleOpen(true);
                }}
                className="h-10 rounded-xl px-4 bg-emerald-900 hover:bg-emerald-800 text-white gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" /> Add Schedule
              </Button>
            </div>
          </div>
        </div>

        {/* Schedule Detail Section (Redesigned) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2">
              <Calendar className="h-6 w-6 text-emerald-700" />
              Weekly Schedule Management
            </h2>
          </div>

          {/* Interactive Day Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = teacher.schedules?.filter((s: any) => s.dayOfWeek === day) || [];
              const isSelected = selectedDay === day;
              
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 text-center relative overflow-hidden",
                    isSelected 
                      ? "bg-emerald-900 border-emerald-900 shadow-md transform -translate-y-1" 
                      : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:shadow-sm"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400" />
                  )}
                  <span className={cn(
                    "text-sm font-extrabold font-serif mb-1",
                    isSelected ? "text-white" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {day.substring(0, 3)}
                  </span>
                  <Badge className={cn(
                    "font-bold text-[10px] px-2 py-0.5 rounded-full",
                    isSelected 
                      ? "bg-emerald-800/80 text-emerald-100 border-none" 
                      : daySlots.length > 0 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-gray-100 text-gray-400 border-none dark:bg-gray-800"
                  )}>
                    {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule List */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-750 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/20">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-serif flex items-center gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400">{selectedDay}</span> Schedule
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {filteredDailySchedules.length} assigned classes for this day
                </p>
              </div>

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
                    {searchQuery ? "Try adjusting your search query." : `There are no scheduled classes for ${selectedDay}.`}
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
        defaultDay={selectedDay}
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

      {/* Assign Student Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[480px] dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-950 dark:text-gray-100 flex items-center gap-2">
              <UserPlus className="h-5.5 w-5.5 text-emerald-700" />
              Assign Student to Teacher
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Select an active student to map to <span className="font-bold text-gray-850 dark:text-gray-200">{teacher.fullName}</span>. 
            </p>

            <div className="grid gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Select Student</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl">
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-[200px]">
                  {allStudents.length === 0 ? (
                    <div className="py-2 text-center text-xs text-gray-400">All students assigned.</div>
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
              className="rounded-xl border-gray-250 dark:border-gray-700 dark:text-gray-300 h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignStudent}
              disabled={assigning || !selectedStudentId}
              className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl h-10"
            >
              {assigning ? 'Assigning...' : 'Assign Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog open={!!confirmUnassignId} onOpenChange={(open) => !open && setConfirmUnassignId(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
          <div className="bg-white dark:bg-gray-900 p-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-serif">Remove Student?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-gray-100">{confirmUnassignName}</span> from this teacher's assignment?
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
                className="rounded-2xl h-11 font-bold text-sm text-gray-400 hover:text-gray-600"
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
        onSuccess={fetchTeacher}
        teacher={teacher}
      />
    </DashboardLayout>
  );
}
