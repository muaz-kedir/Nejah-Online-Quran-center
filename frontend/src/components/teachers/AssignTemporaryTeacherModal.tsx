import { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Loader2, UserCog } from 'lucide-react';

const REASONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'internet_problems', label: 'Internet Problems' },
  { value: 'personal_leave', label: 'Personal Leave' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

interface AssignTemporaryTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  originalTeacherId?: string;
  originalTeacherName?: string;
  preselectedStudentIds?: string[];
}

export function AssignTemporaryTeacherModal({
  open,
  onClose,
  onSuccess,
  originalTeacherId: initialTeacherId,
  originalTeacherName: initialTeacherName,
  preselectedStudentIds,
}: AssignTemporaryTeacherModalProps) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [originalTeacherId, setOriginalTeacherId] = useState('');
  const [originalTeacherName, setOriginalTeacherName] = useState('');
  const [replacementTeacherId, setReplacementTeacherId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');

  const preselectedKey = preselectedStudentIds?.join(',') ?? '';

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api<any>('/teachers?limit=100');
      setTeachers(res.data || res || []);
    } catch {
      toast.error('Failed to load teachers');
    }
  }, []);

  const fetchStudentsForTeacher = useCallback(async (teacherId: string) => {
    try {
      const res = await api<any>(`/students?teacherId=${teacherId}&limit=100`);
      setStudents(res.data || []);
    } catch {
      toast.error('Failed to load students');
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    setOriginalTeacherId(initialTeacherId || '');
    setOriginalTeacherName(initialTeacherName || '');
    setSelectedStudentIds(preselectedStudentIds ? [...preselectedStudentIds] : []);
    setSelectAllStudents(false);
    setReplacementTeacherId('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setCustomReason('');
    setNotes('');
    fetchTeachers();
  }, [open, initialTeacherId, initialTeacherName, preselectedKey, fetchTeachers]);

  useEffect(() => {
    if (!open || !originalTeacherId) {
      if (!open) setStudents([]);
      return;
    }
    fetchStudentsForTeacher(originalTeacherId);
  }, [open, originalTeacherId, fetchStudentsForTeacher]);

  useEffect(() => {
    if (!open || !originalTeacherId || teachers.length === 0) return;
    const teacher = teachers.find((t) => t.id === originalTeacherId);
    if (teacher && !initialTeacherName) {
      setOriginalTeacherName(teacher.fullName);
    }
  }, [open, originalTeacherId, teachers, initialTeacherName]);

  const handleOriginalTeacherChange = (teacherId: string) => {
    setOriginalTeacherId(teacherId);
    setSelectedStudentIds([]);
    setSelectAllStudents(false);
    const teacher = teachers.find((t) => t.id === teacherId);
    setOriginalTeacherName(teacher?.fullName || '');
  };

  const toggleStudent = (studentId: string) => {
    setSelectAllStudents(false);
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalTeacherId || !replacementTeacherId || !startDate || !endDate || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (reason === 'other' && !customReason.trim()) {
      toast.error('Please provide a custom reason');
      return;
    }
    if (!selectAllStudents && selectedStudentIds.length === 0) {
      toast.error('Select at least one student');
      return;
    }

    setLoading(true);
    try {
      await api('/teacher-replacements', {
        method: 'POST',
        body: JSON.stringify({
          originalTeacherId,
          replacementTeacherId,
          studentIds: selectAllStudents ? undefined : selectedStudentIds,
          selectAllStudents,
          startDate,
          endDate,
          reason,
          customReason: reason === 'other' ? customReason : undefined,
          notes: notes || undefined,
        }),
      });
      toast.success('Temporary teacher assignment created');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const replacementTeachers = teachers.filter(
    (t) =>
      t.id !== originalTeacherId &&
      (t.status?.toLowerCase() ?? 'active') === 'active',
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-emerald-600" />
            Assign Temporary Teacher
          </DialogTitle>
          <DialogDescription>
            Temporarily assign students to another teacher without changing the original assignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!initialTeacherId && (
            <div className="space-y-2">
              <Label>Original Teacher</Label>
              <Select
                value={originalTeacherId || undefined}
                onValueChange={handleOriginalTeacherChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select original teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {initialTeacherId && (
            <div className="space-y-2">
              <Label>Original Teacher</Label>
              <Input value={originalTeacherName} readOnly className="bg-gray-50" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Replacement Teacher</Label>
            <Select
              value={replacementTeacherId || undefined}
              onValueChange={setReplacementTeacherId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select replacement teacher" />
              </SelectTrigger>
              <SelectContent>
                {replacementTeachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Students</Label>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="selectAll"
                checked={selectAllStudents}
                onCheckedChange={(c) => {
                  setSelectAllStudents(!!c);
                  if (c) setSelectedStudentIds([]);
                }}
              />
              <label htmlFor="selectAll" className="text-sm cursor-pointer">
                Select all students of original teacher
              </label>
            </div>
            {!selectAllStudents && (
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-400 p-2">No assigned students</p>
                ) : (
                  students.map((s) => {
                    const checkboxId = `temp-student-${s.id}`;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={selectedStudentIds.includes(s.id)}
                          onCheckedChange={() => toggleStudent(s.id)}
                        />
                        <label htmlFor={checkboxId} className="text-sm cursor-pointer flex-1">
                          {s.fullName}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason || undefined} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'other' && (
            <div className="space-y-2">
              <Label>Custom Reason</Label>
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Additional Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Temporary Teacher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
