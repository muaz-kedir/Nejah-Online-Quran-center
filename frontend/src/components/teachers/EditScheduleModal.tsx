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
import { Calendar, Clock, Video, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

interface EditScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: any;
  schedule?: any;
  defaultDay?: string;
}

export function EditScheduleModal({
  open,
  onClose,
  onSuccess,
  teacher,
  schedule,
  defaultDay,
}: EditScheduleModalProps) {
  const [saving, setSaving] = useState(false);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.startTimeString || !formData.endTimeString) {
      toast.error('Please fill in all required fields');
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
        ? `http://localhost:3000/api/schedules/${schedule.id}`
        : `http://localhost:3000/api/schedules`;
        
      const response = await fetch(url, {
        method: schedule ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          teacherId: teacher.id,
        }),
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-emerald-950 dark:text-gray-100 flex items-center gap-2 font-serif">
            <Calendar className="h-5.5 w-5.5 text-emerald-700" />
            {schedule ? 'Edit Schedule' : 'Create New Schedule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Student & Class Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Student
              </label>
              <Select
                value={formData.studentId}
                onValueChange={(val) => setFormData({ ...formData, studentId: val })}
                disabled={!!schedule}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {teacher.students?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Class Type
              </label>
              <Select
                value={formData.classType}
                onValueChange={(val) => setFormData({ ...formData, classType: val })}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11">
                  <SelectValue placeholder="Class Type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Day
              </label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(val) => setFormData({ ...formData, dayOfWeek: val })}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Start
              </label>
              <input
                type="time"
                value={formData.startTimeString}
                onChange={(e) => setFormData({ ...formData, startTimeString: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> End
              </label>
              <input
                type="time"
                value={formData.endTimeString}
                onChange={(e) => setFormData({ ...formData, endTimeString: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Meeting Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Video className="h-3.5 w-3.5" /> Meeting Link (Zoom/Meet)
            </label>
            <input
              type="url"
              placeholder="https://zoom.us/j/..."
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11 px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Notes
            </label>
            <textarea
              placeholder="Any specific instructions for this schedule..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="pt-4 grid grid-cols-2 gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-gray-250 dark:border-gray-700 dark:text-gray-300 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl h-11"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
