import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  fullName?: string;
  user?: { name: string };
  specialization?: string;
}

interface Student {
  id: string;
  fullName: string;
  gender: string;
  age: number;
  currentResidency: string;
  level: string;
  email: string;
  status: string;
  teacherId?: string;
  familyName?: string;
  familyPhone?: string;
  familyAddress?: string;
  familyCountry?: string;
  learningGoals?: string;
}

interface EditStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: Student | null;
  teachers: Teacher[];
}

export function EditStudentModal({ open, onClose, onSuccess, student, teachers }: EditStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    age: '',
    currentResidency: '',
    level: 'Beginner',
    email: '',
    status: 'active',
    teacherId: '',
    familyName: '',
    familyPhone: '',
    familyAddress: '',
    familyCountry: '',
    learningGoals: '',
  });

  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.fullName || '',
        gender: student.gender || 'Male',
        age: student.age?.toString() || '',
        currentResidency: student.currentResidency || '',
        level: student.level || 'Beginner',
        email: student.email || '',
        status: student.status || 'active',
        teacherId: student.teacherId || '',
        familyName: student.familyName || '',
        familyPhone: student.familyPhone || '',
        familyAddress: student.familyAddress || '',
        familyCountry: student.familyCountry || '',
        learningGoals: student.learningGoals || '',
      });
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const body: any = {
        ...formData,
        age: parseInt(formData.age, 10),
      };

      if (!body.teacherId) body.teacherId = null;
      if (!body.familyName) delete body.familyName;
      if (!body.familyPhone) delete body.familyPhone;
      if (!body.familyAddress) delete body.familyAddress;
      if (!body.familyCountry) delete body.familyCountry;
      if (!body.learningGoals) delete body.learningGoals;

      const response = await fetch(`http://localhost:3000/api/students/${student.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update student');
      }

      toast.success('Student updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[640px] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-gray-100">Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-fullName" className="dark:text-gray-300">Full Name *</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email" className="dark:text-gray-300">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-age" className="dark:text-gray-300">Age *</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Level *</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Hifz">Hifz</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Status *</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-residency" className="dark:text-gray-300">Residency</Label>
                <Input
                  id="edit-residency"
                  value={formData.currentResidency}
                  onChange={(e) => setFormData({ ...formData, currentResidency: e.target.value })}
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Teacher</Label>
              <Select value={formData.teacherId} onValueChange={(v) => setFormData({ ...formData, teacherId: v })}>
                <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue placeholder="Select teacher..." /></SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName || t.user?.name || 'Unknown'} {t.specialization ? `— ${t.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Learning Goals</Label>
              <Textarea
                value={formData.learningGoals}
                onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
                className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g. Memorize Juz 30, improve Tajweed..."
                rows={2}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Family Information (Optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-familyName" className="dark:text-gray-300">Parent/Guardian Name</Label>
                  <Input
                    id="edit-familyName"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-familyPhone" className="dark:text-gray-300">Phone Number</Label>
                  <Input
                    id="edit-familyPhone"
                    value={formData.familyPhone}
                    onChange={(e) => setFormData({ ...formData, familyPhone: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-familyAddress" className="dark:text-gray-300">Address</Label>
                  <Input
                    id="edit-familyAddress"
                    value={formData.familyAddress}
                    onChange={(e) => setFormData({ ...formData, familyAddress: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-familyCountry" className="dark:text-gray-300">Country</Label>
                  <Input
                    id="edit-familyCountry"
                    value={formData.familyCountry}
                    onChange={(e) => setFormData({ ...formData, familyCountry: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
