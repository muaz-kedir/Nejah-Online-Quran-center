import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Calendar, Clock, Plus, Trash2, Search, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Teacher {
  id: string;
  fullName: string;
}

interface Student {
  id: string;
  fullName: string;
  parent?: { fullName: string };
}

interface ScheduleSlot {
  dayOfWeek: string;
  startTimeString: string;
  endTimeString: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AssignStudentModal({ open, onClose, onSuccess }: AssignStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([
    { dayOfWeek: 'Monday', startTimeString: '15:00', endTimeString: '16:00' }
  ]);

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Teachers
      const tRes = await fetch('http://localhost:3000/api/teachers?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tData = await tRes.json();
      setTeachers(Array.isArray(tData) ? tData : tData.data || []);

      // Fetch Unassigned Students
      const sRes = await fetch('http://localhost:3000/api/students/assignments/unassigned', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sData = await sRes.json();
      setUnassignedStudents(sData);
    } catch (error) {
      console.error('Failed to fetch assignment data', error);
      toast.error('Failed to load students or teachers');
    }
  };

  const addScheduleSlot = () => {
    setSchedules([...schedules, { dayOfWeek: 'Monday', startTimeString: '15:00', endTimeString: '16:00' }]);
  };

  const removeScheduleSlot = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedStudentId || schedules.length === 0) {
      toast.error('Please select a teacher, student, and at least one schedule slot');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/students/assignments/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          teacherId: selectedTeacherId,
          schedules
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to assign student');
      }

      toast.success('Assignment and schedules created successfully');
      onSuccess();
      onClose();
      // Reset
      setSelectedStudentId('');
      setSelectedTeacherId('');
      setSchedules([{ dayOfWeek: 'Monday', startTimeString: '15:00', endTimeString: '16:00' }]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby="assign-student-desc" className="sm:max-w-[650px] rounded-[2rem] p-0 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <div className="bg-gradient-to-r from-[#084133] to-[#0a5c48] px-8 pt-8 pb-7">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <UserCheck className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">Assign Student to Teacher</DialogTitle>
                <DialogDescription id="assign-student-desc" className="text-emerald-200/80 text-sm mt-0.5 font-medium">
                  Set up specialized 1-to-1 learning schedules for students
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8 bg-white/50 dark:bg-transparent backdrop-blur-sm">
          {/* Top Section: Student & Teacher Selection */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-900/60 dark:text-emerald-400/60 flex items-center gap-2">
                <Search className="h-3 w-3" /> Select Student
              </Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="h-12 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-emerald-500/20 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                  {unassignedStudents.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-gray-500">No unassigned students available</div>
                  ) : (
                    unassignedStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-xl">
                        {s.fullName} {s.parent ? `(${s.parent.fullName})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-900/60 dark:text-emerald-400/60 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Select Teacher
              </Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="h-12 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-emerald-500/20 data-[placeholder]:text-gray-400">
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="rounded-xl">
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />

          {/* Middle Section: Scheduling */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Recurring Schedule</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Establish the weekly learning blocks</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addScheduleSlot}
                className="rounded-xl h-9 px-4 border-emerald-900/10 text-emerald-900 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 gap-2 font-bold text-[10px] uppercase tracking-wider"
              >
                <Plus className="h-3 w-3" /> Add Slot
              </Button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {schedules.map((slot, index) => (
                <div 
                  key={index} 
                  className="group relative bg-gray-50/80 dark:bg-gray-800/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="grid grid-cols-12 gap-5 items-end">
                    <div className="col-span-4 space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Day</Label>
                       <Select 
                         value={slot.dayOfWeek} 
                         onValueChange={(v) => updateScheduleSlot(index, 'dayOfWeek', v)}
                       >
                         <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-gray-900 border-none shadow-sm">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl">
                           {DAYS.map(day => <SelectItem key={day} value={day} className="rounded-lg">{day}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="col-span-3 space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                         <Clock className="h-3 w-3" /> Start
                       </Label>
                       <Input
                         type="time"
                         value={slot.startTimeString}
                         onChange={(e) => updateScheduleSlot(index, 'startTimeString', e.target.value)}
                         className="h-10 rounded-xl bg-white dark:bg-gray-900 border-none shadow-sm focus-visible:ring-emerald-500/30"
                       />
                    </div>

                    <div className="col-span-3 space-y-2">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> End
                       </Label>
                       <Input
                         type="time"
                         value={slot.endTimeString}
                         onChange={(e) => updateScheduleSlot(index, 'endTimeString', e.target.value)}
                         className="h-10 rounded-xl bg-white dark:bg-gray-900 border-none shadow-sm focus-visible:ring-emerald-500/30"
                       />
                    </div>

                    <div className="col-span-2 flex justify-end pb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={schedules.length === 1}
                        onClick={() => removeScheduleSlot(index)}
                        className="h-9 w-9 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                      >
                        <Trash2 className="h-4.4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-2xl h-12 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-2xl h-12 bg-gradient-to-br from-[#084133] to-[#0a5c48] hover:shadow-lg hover:shadow-emerald-900/20 text-white font-bold transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finalizing...
                </div>
              ) : 'Confirm Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
