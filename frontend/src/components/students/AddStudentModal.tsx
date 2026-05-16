import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Teacher {
  id: string;
  user?: { name: string };
  specialty: string;
}

interface Parent {
  id: string;
  fullName: string;
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachers: Teacher[];
  parents: Parent[];
}

export function AddStudentModal({ open, onClose, onSuccess, teachers, parents }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    age: '',
    currentResidency: '',
    level: 'Beginner',
    email: '',
    teacherId: '',
    parentId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const body: any = {
        ...formData,
        age: parseInt(formData.age, 10),
      };
      if (!body.teacherId) delete body.teacherId;
      if (!body.parentId) delete body.parentId;

      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create student');
      }

      toast.success('Student created successfully');
      onSuccess();
      onClose();
      setFormData({
        fullName: '',
        gender: 'Male',
        age: '',
        currentResidency: '',
        level: 'Beginner',
        email: '',
        teacherId: '',
        parentId: '',
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-gray-100">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="dark:text-gray-300">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  placeholder="e.g. Omar Al-Fayid"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="dark:text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  placeholder="student@example.com"
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
                <Label htmlFor="age" className="dark:text-gray-300">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={3}
                  max={80}
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

            <div className="grid gap-2">
              <Label htmlFor="residency" className="dark:text-gray-300">Current Residency</Label>
              <Input
                id="residency"
                value={formData.currentResidency}
                onChange={(e) => setFormData({ ...formData, currentResidency: e.target.value })}
                className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g. Addis Ababa, Ethiopia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Assign Teacher</Label>
                <Select value={formData.teacherId} onValueChange={(v) => setFormData({ ...formData, teacherId: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue placeholder="Select teacher..." /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {teachers?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.user?.name || 'Unknown'} — {t.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Assign Parent</Label>
                <Select value={formData.parentId} onValueChange={(v) => setFormData({ ...formData, parentId: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue placeholder="Select parent..." /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {parents?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {loading ? 'Creating...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
