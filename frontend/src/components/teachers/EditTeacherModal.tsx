import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Pencil, BookOpen, GraduationCap, Briefcase, Upload, DollarSign, Star, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Country, City } from 'country-state-city';
import { getCountryIsoByName } from '@/lib/geo-data';
import { buildUpdateTeacherPayload } from '@/lib/teacher-payload';

const API = 'http://localhost:3000/api';

interface EditTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: any;
}

export function EditTeacherModal({ open, onClose, onSuccess, teacher }: EditTeacherModalProps) {
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: 'Male',
    phoneNumber: '',
    qualification: '',
    specialization: '',
    experience: '',
    status: 'active',
    monthlySalary: '',
    islamicEducationLevel: '',
    teachingTopics: '',
    avatarUrl: '',
    country: '',
    city: '',
    streetAddress: '',
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
        status: teacher.status || 'active',
        monthlySalary: teacher.monthlySalary !== undefined ? String(teacher.monthlySalary) : '',
        islamicEducationLevel: teacher.islamicEducationLevel || '',
        teachingTopics: teacher.teachingTopics || '',
        avatarUrl: teacher.avatarUrl || '',
        country: teacher.country || '',
        city: teacher.city || '',
        streetAddress: teacher.streetAddress || '',
      });
    }
  }, [teacher]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', file);

      const response = await fetch(`${API}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setFormData({ ...formData, avatarUrl: data.url });
      toast.success('Profile picture uploaded');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const body = buildUpdateTeacherPayload({
        ...formData,
        experience: formData.experience ? parseInt(formData.experience, 10) : 0,
        monthlySalary: formData.monthlySalary ? parseFloat(formData.monthlySalary) : undefined,
      });

      const response = await fetch(`${API}/teachers/${teacher.id}`, {
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const cityOptions = useMemo(() => {
    const iso = getCountryIsoByName(formData.country);
    if (!iso) return [];
    const cities = City.getCitiesOfCountry(iso) ?? [];
    return [...new Set(cities.map((c) => c.name))];
  }, [formData.country]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900 dark:text-gray-100 flex items-center gap-2">
            <Pencil className="h-6 w-6 text-emerald-700" />
            Edit Teacher Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div
              onClick={handleAvatarClick}
              className={cn(
                'w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center cursor-pointer border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 transition-colors relative group',
                avatarUploading && 'animate-pulse',
              )}
            >
              {formData.avatarUrl ? (
                <img
                  src={`http://localhost:3000${formData.avatarUrl}`}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Profile Picture</p>
              <p className="text-xs text-gray-400">Click to upload (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {avatarUploading && <p className="text-xs text-emerald-600 mt-1">Uploading...</p>}
            </div>
          </div>

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

              {/* Address Information */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-gray-300">Country</Label>
                <Select
                  value={getCountryIsoByName(formData.country)}
                  onValueChange={(val) => {
                    const country = Country.getCountryByCode(val);
                    setFormData({ ...formData, country: country?.name || val, city: '' });
                  }}
                >
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"><SelectValue placeholder="Select Country" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                    {Country.getAllCountries().map((c) => (
                      <SelectItem key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-gray-300">City</Label>
                <Select
                  value={formData.city}
                  onValueChange={(val) => setFormData({ ...formData, city: val })}
                  disabled={!formData.country}
                >
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"><SelectValue placeholder="Select City" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                    {cityOptions.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-semibold dark:text-gray-300">Street Address</Label>
                <Input
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="Enter street address"
                  className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
                />
              </div>

              {/* Professional Details merged */}
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

          {/* Section 3: Islamic Education Level & Topics */}
          <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
              <span className="p-1.5 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600">
                <Star className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Islamic Education & Topics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-islamicEducationLevel" className="text-xs font-semibold dark:text-gray-300">Islamic Education Level</Label>
                <Select
                  value={formData.islamicEducationLevel}
                  onValueChange={(v) => setFormData({ ...formData, islamicEducationLevel: v })}
                >
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Ijazah">Ijazah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-monthlySalary" className="text-xs font-semibold dark:text-gray-300">Monthly Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-monthlySalary"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                    placeholder="0.00"
                    className="dark:bg-gray-900 dark:border-gray-600 rounded-xl pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-teachingTopics" className="text-xs font-semibold dark:text-gray-300">Teaching Topics</Label>
              <Input
                id="edit-teachingTopics"
                value={formData.teachingTopics}
                onChange={(e) => setFormData({ ...formData, teachingTopics: e.target.value })}
                placeholder="e.g. Quran Recitation, Tajweed, Fiqh, Hadith (comma separated)"
                className="dark:bg-gray-900 dark:border-gray-600 rounded-xl"
              />
            </div>
          </div>



          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-gray-200 dark:border-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || avatarUploading} className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl px-6">
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
