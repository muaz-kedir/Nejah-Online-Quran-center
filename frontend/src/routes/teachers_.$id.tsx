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
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';

export const Route = createFileRoute('/teachers_/$id')({
  component: TeacherProfilePage,
});

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

  const fetchTeacher = async () => {
    // Keep internal loading if it's a refresh, only show skeleton for first load
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
      // Fetch list of students
      const response = await fetch('http://localhost:3000/api/students?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        // Find students who are NOT assigned to ANY teacher (teacherId is null/undefined)
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
    // Find the student name for the dialog
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
      
      // Wait a bit for DB consistency before re-fetching
      setTimeout(() => {
        fetchTeacher();
        setUnassigningId(null);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove student');
      setUnassigningId(null);
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
              {/* Photo Avatar */}
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
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {teacher.currentResidency || 'Cairo, Egypt'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {teacher.experience || 0} Years Experience</span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
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
                onClick={() => setIsAssignModalOpen(true)}
                className="h-10 rounded-xl px-4 bg-emerald-900 hover:bg-emerald-800 text-white gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <UserPlus className="h-4 w-4" /> Assign Student
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Students</p>
            <h3 className="text-3xl font-extrabold text-gray-850 dark:text-gray-100 mt-1 font-serif">{teacher.students?.length || 0}</h3>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Teaching Quality</p>
            <h3 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 font-serif">98.5%</h3>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Punctuality</p>
            <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-500 mt-1 font-serif">99.2%</h3>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Feedback Rating</p>
            <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-gray-100 mt-1 font-serif">4.9/5.0</h3>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Students List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-700" />
                  Assigned Students List
                </h2>
                <Badge className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 rounded-full font-bold">
                  {teacher.students?.length || 0} Registered
                </Badge>
              </div>

              {teacher.students?.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium font-serif">
                  No students assigned to this teacher yet. Click 'Assign Student' to map them.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100 dark:border-gray-700 pb-2">
                        <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                        <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</th>
                        <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Progress</th>
                        <th className="py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {teacher.students?.map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-850 dark:text-emerald-300 font-bold text-sm flex items-center justify-center">
                                {s.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-gray-850 dark:text-gray-200">{s.fullName}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">{s.gender}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <Badge className="bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-full font-bold text-[9px] uppercase tracking-wider">
                              {s.level || 'Beginner'}
                            </Badge>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              {s.attendanceRate ? `${s.attendanceRate}%` : '95.0%'} Attendance
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                             <button
                               onClick={() => handleRemoveStudent(s.id)}
                               disabled={unassigningId === s.id}
                               className={cn(
                                 "p-1.5 rounded-lg transition-colors",
                                 unassigningId === s.id 
                                   ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                   : "hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-300 hover:text-red-500"
                               )}
                               title="Remove Student Assignment"
                             >
                               {unassigningId === s.id ? (
                                 <RotateCcw className="h-4 w-4 animate-spin" />
                               ) : (
                                 <Trash2 className="h-4 w-4" />
                               )}
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Performance Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2 border-b border-gray-100 dark:border-gray-750 pb-3">
                <Award className="h-5 w-5 text-emerald-700" />
                Performance Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30">
                  <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-400 font-serif flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Qualities & Strength
                  </h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 mt-2.5 space-y-1.5 list-disc pl-4 font-medium">
                    <li>Exemplary virtual tajwid instruction technique.</li>
                    <li>Highly active student checking & feedback notes.</li>
                    <li>Timely class logs & attendance uploads.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-500 font-serif flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Teaching Statistics
                  </h3>
                  <div className="mt-2.5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Syllabus Completion</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">92%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Monthly Teaching Hours</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">120 Hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Calendar Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <Calendar className="h-5 w-5 text-emerald-700" />
              Weekly Schedule
            </h2>

            <div className="space-y-3">
              {!teacher.schedules || teacher.schedules.length === 0 ? (
                <div className="py-12 text-center text-gray-400 font-medium font-serif border border-dashed rounded-2xl">
                  No classes scheduled yet.
                </div>
              ) : (
                // Group schedules by day of week for a cleaner view
                ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const daySlots = teacher.schedules.filter((s: any) => s.dayOfWeek === day);
                  if (daySlots.length === 0) return null;

                  return (
                    <div
                      key={day}
                      className="p-3.5 rounded-2xl border bg-gray-50/70 border-gray-100 dark:bg-gray-900/40 dark:border-gray-800 flex flex-col gap-2 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-emerald-950 dark:text-gray-200 font-serif">{day}</span>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 border-none font-bold text-[9px] uppercase tracking-wider rounded-lg px-2">
                          {daySlots.length} {daySlots.length === 1 ? 'Session' : 'Sessions'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {daySlots.map((slot: any, idx: number) => (
                          <div key={idx} className="flex border-t border-gray-100 dark:border-gray-800 pt-2 items-center justify-between">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{slot.startTimeString} - {slot.endTimeString}</span>
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 italic">
                               1:1 Session
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

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
              The student will automatically see the teacher's schedule on their dashboard and gain access to shared resources.
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
