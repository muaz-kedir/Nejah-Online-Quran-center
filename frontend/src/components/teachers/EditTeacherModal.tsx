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
import { Pencil, BookOpen, GraduationCap, Briefcase } from 'lucide-react';

interface EditTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: any;
}

export function EditTeacherModal({ open, onClose, onSuccess, teacher }: EditTeacherModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: 'Male',
    phoneNumber: '',
    qualification: '',
    specialization: '',
    experience: '',
    currentResidency: '',
    status: 'active',
  });

  useEffect(() => {
    if (teacher) {
      setFormData({
        fullName: teacher.fullName || '',
        email: teacher.email || '',
        gender: teacher.gender || 'Male',
        phoneNumber: teacher.phoneNumber || '',
        qualification: teacher.qualification || '',
        specialization: teacher.specialization || '',
        experience: teacher.experience !== undefined ? String(teacher.experience) : '',
        currentResidency: teacher.currentResidency || '',
        status: teacher.status || 'active',
      });
    }
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const body = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience, 10) : 0,
      };

      const response = await fetch(`http://localhost:3000/api/teachers/${teacher.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update teacher');
      }

      toast.success('Teacher updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900 dark:text-gray-100 flex items-center gap-2">
            <Pencil className="h-6 w-6 text-emerald-700" />
            Edit Teacher Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Section 1: Personal Details */}
          <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
                <GraduationCap className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Personal Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-fullName" className="text-xs font-semibold dark:text-gray-300">Full Name *</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder="e.g. Dr. Amina Mansour"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-gender" className="text-xs font-semibold dark:text-gray-300">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold dark:text-gray-300">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="name@nejah-center.com"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-phoneNumber" className="text-xs font-semibold dark:text-gray-300">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Qualifications */}
          <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
                <BookOpen className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Academic Qualifications</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-specialization" className="text-xs font-semibold dark:text-gray-300">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Islamic Jurisprudence, Quranic Sciences"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-experience" className="text-xs font-semibold dark:text-gray-300">Experience (Years)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  min={0}
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="0"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-qualification" className="text-xs font-semibold dark:text-gray-300">Certifications / Ijazah</Label>
              <Textarea
                id="edit-qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="List all formal certifications and ijazahs received with respective institutions..."
                className="dark:bg-gray-900 dark:border-gray-600 rounded-xl min-h-[80px]"
              />
            </div>
          </div>

          {/* Section 3: Professional Details */}
          <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
                <Briefcase className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Professional Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-residency" className="text-xs font-semibold dark:text-gray-300">Current Residency</Label>
                <Input
                  id="edit-residency"
                  value={formData.currentResidency}
                  onChange={(e) => setFormData({ ...formData, currentResidency: e.target.value })}
                  placeholder="e.g. Cairo, Egypt (Remote)"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-status" className="text-xs font-semibold dark:text-gray-300">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="on leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl px-6">
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
