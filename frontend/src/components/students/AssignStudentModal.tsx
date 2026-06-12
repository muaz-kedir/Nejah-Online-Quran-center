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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, UserCheck, GraduationCap } from 'lucide-react';
import { API_BASE } from '@/lib/api';

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

export function AssignStudentModal({ open, onClose, onSuccess }: AssignStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');

      const tRes = await fetch(`${API_BASE}/teachers?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tData = await tRes.json();
      setTeachers(Array.isArray(tData) ? tData : tData.data || []);

      const sRes = await fetch(`${API_BASE}/students/assignments/unassigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sData = await sRes.json();
      setUnassignedStudents(sData);
    } catch (error) {
      console.error('Failed to fetch assignment data', error);
      toast.error('Failed to load students or teachers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedStudentId) {
      toast.error('Please select both a teacher and a student');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/students/assignments/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          teacherId: selectedTeacherId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to assign student');
      }

      toast.success('Student assigned to teacher successfully');
      onSuccess();
      onClose();
      setSelectedStudentId('');
      setSelectedTeacherId('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="assign-student-desc"
        className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden dark:bg-nejah-surface dark:border-nejah-border-blue"
      >
        <div className="bg-gradient-to-r from-[#084133] to-[#0a5c48] px-8 pt-8 pb-7">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <UserCheck className="h-6 w-6 text-nejah-electric" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                  Assign Student to Teacher
                </DialogTitle>
                <DialogDescription
                  id="assign-student-desc"
                  className="text-nejah-electric/80 text-sm mt-0.5 font-medium"
                >
                  Link a student to their instructor. Set up recurring class times from the
                  teacher&apos;s Faculty profile.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 bg-white/50 dark:bg-transparent backdrop-blur-sm">
          <div className="space-y-2.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.15em] text-nejah-sapphire/60 text-nejah-electric/60 flex items-center gap-2">
              <Search className="h-3 w-3" /> Select Student
            </Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/50 dark:bg-nejah-surface/50 border-border dark:border-nejah-border-blue focus:ring-primary/500/20 data-[placeholder]:text-muted-foreground">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl dark:bg-nejah-surface dark:border-nejah-border-blue">
                {unassignedStudents.length === 0 ? (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No unassigned students available
                  </div>
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
            <Label className="text-[11px] font-bold uppercase tracking-[0.15em] text-nejah-sapphire/60 text-nejah-electric/60 flex items-center gap-2">
              <GraduationCap className="h-3 w-3" /> Select Teacher
            </Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/50 dark:bg-nejah-surface/50 border-border dark:border-nejah-border-blue focus:ring-primary/500/20 data-[placeholder]:text-muted-foreground">
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl dark:bg-nejah-surface dark:border-nejah-border-blue">
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="rounded-xl">
                    {t.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed rounded-xl bg-primary/10/50 dark:bg-nejah-sapphire/20 border border-primary/100 dark:border-nejah-border-blue/30 px-4 py-3">
            After assigning, open the teacher&apos;s Faculty profile to add recurring weekly
            schedules using <strong>Add Schedule</strong>.
          </p>

          <DialogFooter className="grid grid-cols-2 gap-4 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-2xl h-12 text-muted-foreground dark:text-muted-foreground font-bold hover:bg-muted dark:hover:bg-nejah-surface"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-2xl h-12 bg-gradient-to-br from-[#084133] to-[#0a5c48] hover:shadow-lg hover:shadow-nejah-glow text-white font-bold transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning...
                </div>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
