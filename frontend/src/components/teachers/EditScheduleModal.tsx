import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Video, FileText, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: any;
  schedule?: any;
  defaultDay?: string;
  unassignedStudents?: any[];
}

type SessionMode = 'individual' | 'group';

function getScheduleStudentIds(schedule: any): string[] {
  if (schedule?.scheduleStudents?.length) {
    return schedule.scheduleStudents.map((ss: any) => ss.studentId || ss.student?.id).filter(Boolean);
  }
  return schedule?.studentId ? [schedule.studentId] : [];
}

export function EditScheduleModal({
  open,
  onClose,
  onSuccess,
  teacher,
  schedule,
  defaultDay,
  unassignedStudents = [],
}: EditScheduleModalProps) {
  const [saving, setSaving] = useState(false);
  const [sessionMode, setSessionMode] = useState<SessionMode>('individual');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    studentId: '',
    dayOfWeek: defaultDay || 'Monday',
    startTimeString: '',
    endTimeString: '',
    meetingLink: '',
    classType: 'Quran Class',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      if (schedule) {
        const isGroup = !!schedule.isGroupSession;
        setSessionMode(isGroup ? 'group' : 'individual');
        setSelectedStudentIds(getScheduleStudentIds(schedule));
        setFormData({
          studentId: schedule.studentId || '',
          dayOfWeek: schedule.dayOfWeek || 'Monday',
          startTimeString: schedule.startTimeString || '',
          endTimeString: schedule.endTimeString || '',
          meetingLink: schedule.meetingLink || '',
          classType: schedule.classType || schedule.className || 'Quran Class',
          notes: schedule.notes || '',
        });
      } else {
        setSessionMode('individual');
        setSelectedStudentIds([]);
        setFormData({
          studentId: '',
          dayOfWeek: defaultDay || 'Monday',
          startTimeString: '',
          endTimeString: '',
          meetingLink: '',
          classType: 'Quran Class',
          notes: '',
        });
      }
    }
  }, [open, schedule, defaultDay]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startTimeString || !formData.endTimeString) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (sessionMode === 'individual' && !formData.studentId) {
      toast.error('Please select a student');
      return;
    }

    if (sessionMode === 'group' && selectedStudentIds.length < 2) {
      toast.error('Group sessions require at least 2 students');
      return;
    }

    if (formData.startTimeString >= formData.endTimeString) {
      toast.error('Start time must be before end time');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = schedule
        ? apiUrl(`/schedules/${schedule.id}`)
        : apiUrl(`/schedules`);

      const payload =
        sessionMode === 'group'
          ? {
              teacherId: teacher.id,
              isGroupSession: true,
              studentIds: selectedStudentIds,
              dayOfWeek: formData.dayOfWeek,
              startTimeString: formData.startTimeString,
              endTimeString: formData.endTimeString,
              meetingLink: formData.meetingLink,
              classType: formData.classType,
              notes: formData.notes,
            }
          : {
              teacherId: teacher.id,
              isGroupSession: false,
              studentId: formData.studentId,
              dayOfWeek: formData.dayOfWeek,
              startTimeString: formData.startTimeString,
              endTimeString: formData.endTimeString,
              meetingLink: formData.meetingLink,
              classType: formData.classType,
              notes: formData.notes,
            };

      const response = await fetch(url, {
        method: schedule ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save schedule');
      }

      toast.success(`Schedule ${schedule ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // Check if teacher is valid
  const isValidTeacher = teacher?.id && teacher?.fullName;
  
  // Get students list from teacher or use unassigned students
  const assignedStudents = isValidTeacher ? (teacher?.students || []) : [];
  
  // Group student names for display
  const groupStudentNames = schedule?.isGroupSession
    ? (schedule.scheduleStudents || [])
        .map((ss: any) => ss.student?.fullName)
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-nejah-surface dark:border-nejah-border-blue rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-nejah-sapphire text-foreground flex items-center gap-2 font-serif">
            <Calendar className="h-5.5 w-5.5 text-primary" />
            {schedule ? 'Edit Schedule' : 'Create New Schedule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Session Mode Toggle */}
          {!schedule && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Session Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSessionMode('individual')}
                  className={cn(
                    'h-11 rounded-xl text-sm font-bold transition-colors',
                    sessionMode === 'individual'
                      ? 'bg-primary text-white'
                      : 'bg-muted dark:bg-nejah-surface text-muted-foreground',
                  )}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setSessionMode('group')}
                  className={cn(
                    'h-11 rounded-xl text-sm font-bold transition-colors',
                    sessionMode === 'group'
                      ? 'bg-primary text-white'
                      : 'bg-muted dark:bg-nejah-surface text-muted-foreground',
                  )}
                >
                  Group Session
                </button>
              </div>
            </div>
          )}

          {/* Student Selection */}
          <div className="grid grid-cols-1 gap-4">
            {sessionMode === 'individual' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Student
                </label>
                <Select
                  value={formData.studentId}
                  onValueChange={(val) => setFormData({ ...formData, studentId: val })}
                  disabled={!!schedule}
                >
                  <SelectTrigger className="bg-muted dark:bg-nejah-surface border-none rounded-xl h-11">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    {assignedStudents.length > 0 && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Assigned Students
                      </div>
                    )}
                    {assignedStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName}
                      </SelectItem>
                    ))}

                    {unassignedStudents.length > 0 && (
                      <div className="px-2 py-1.5 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border dark:border-nejah-border-blue">
                        Unassigned Students
                      </div>
                    )}
                    {unassignedStudents.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : schedule ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Group Students
                </label>
                <div className="bg-muted dark:bg-nejah-surface rounded-xl p-3 text-sm text-foreground dark:text-muted-foreground">
                  {groupStudentNames || 'No students assigned'}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Select Students (min. 2)
                </label>
                <div className="bg-muted dark:bg-nejah-surface rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {assignedStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students assigned to this teacher.</p>
                  ) : (
                    assignedStudents.map((s: any) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-nejah-surface rounded-lg p-2"
                      >
                        <Checkbox
                          checked={selectedStudentIds.includes(s.id)}
                          onCheckedChange={() => toggleStudent(s.id)}
                        />
                        <span className="text-sm font-medium">{s.fullName}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedStudentIds.length > 0 && (
                  <p className="text-xs text-primary font-semibold">
                    {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Class Type
              </label>
              <Select
                value={formData.classType}
                onValueChange={(val) => setFormData({ ...formData, classType: val })}
              >
                <SelectTrigger className="bg-muted dark:bg-nejah-surface border-none rounded-xl h-11">
                  <SelectValue placeholder="Class Type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  <SelectItem value="Hifz">Hifz</SelectItem>
                  <SelectItem value="Tajweed">Tajweed</SelectItem>
                  <SelectItem value="Noorani Qaida">Noorani Qaida</SelectItem>
                  <SelectItem value="Quran Class">Quran Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Day & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Day
              </label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(val) => setFormData({ ...formData, dayOfWeek: val })}
              >
                <SelectTrigger className="bg-muted dark:bg-nejah-surface border-none rounded-xl h-11">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Start
              </label>
              <input
                type="time"
                value={formData.startTimeString}
                onChange={(e) => setFormData({ ...formData, startTimeString: e.target.value })}
                className="w-full bg-muted dark:bg-nejah-surface border-none rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-primary/500 outline-none"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> End
              </label>
              <input
                type="time"
                value={formData.endTimeString}
                onChange={(e) => setFormData({ ...formData, endTimeString: e.target.value })}
                className="w-full bg-muted dark:bg-nejah-surface border-none rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-primary/500 outline-none"
              />
            </div>
          </div>

          {/* Meeting Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Video className="h-3.5 w-3.5" /> Meeting Link (Zoom/Meet)
            </label>
            <input
              type="url"
              placeholder="https://zoom.us/j/..."
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              className="w-full bg-muted dark:bg-nejah-surface border-none rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-primary/500 outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Notes
            </label>
            <textarea
              placeholder="Any specific instructions for this schedule..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-muted dark:bg-nejah-surface border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary/500 outline-none min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="pt-4 grid grid-cols-2 gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-border dark:border-nejah-border-blue dark:text-muted-foreground h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-nejah-azure text-white rounded-xl h-11"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
