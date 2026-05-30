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

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachers: Teacher[];
}

export function AddStudentModal({ open, onClose, onSuccess, teachers }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    age: '',
    currentResidency: '',
    level: 'Beginner',
    email: '',
    teacherId: '',
    familyName: '',
    familyPhone: '',
    familyAddress: '',
    familyCountry: '',
    learningGoals: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const body: any = {
        ...formData,
        age: parseInt(formData.age, 10),
      };
      delete body.confirmPassword;
      if (!body.password) delete body.password;
      if (!body.teacherId) delete body.teacherId;
      if (!body.familyName) delete body.familyName;
      if (!body.familyPhone) delete body.familyPhone;
      if (!body.familyAddress) delete body.familyAddress;
      if (!body.familyCountry) delete body.familyCountry;
      if (!body.learningGoals) delete body.learningGoals;

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
        familyName: '',
        familyPhone: '',
        familyAddress: '',
        familyCountry: '',
        learningGoals: '',
        password: '',
        confirmPassword: '',
      });
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
          <DialogTitle className="text-xl font-bold dark:text-gray-100">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Assign Teacher</Label>
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

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Account Credentials (Optional)</p>
              <p className="text-xs text-gray-400 mb-3">Set a password so the student can log in using their email, family email, or family phone number.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="dark:text-gray-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>
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
                  <Label htmlFor="familyName" className="dark:text-gray-300">Parent/Guardian Name</Label>
                  <Input
                    id="familyName"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. Ahmed Al-Fayid"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="familyPhone" className="dark:text-gray-300">Phone Number</Label>
                  <Input
                    id="familyPhone"
                    value={formData.familyPhone}
                    onChange={(e) => setFormData({ ...formData, familyPhone: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. +251 912 345 678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="familyAddress" className="dark:text-gray-300">Address</Label>
                  <Input
                    id="familyAddress"
                    value={formData.familyAddress}
                    onChange={(e) => setFormData({ ...formData, familyAddress: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. 123 Main St"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="familyCountry" className="dark:text-gray-300">Country</Label>
                  <Input
                    id="familyCountry"
                    value={formData.familyCountry}
                    onChange={(e) => setFormData({ ...formData, familyCountry: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. Ethiopia"
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
              {loading ? 'Creating...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
