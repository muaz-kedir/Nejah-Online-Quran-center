import { API_BASE, apiAssetUrl } from "@/lib/api";
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

const API = API_BASE;

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
      <DialogContent aria-describedby={undefined} className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto dark:bg-nejah-surface dark:border-nejah-border-blue rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-nejah-sapphire text-foreground flex items-center gap-2">
            <Pencil className="h-6 w-6 text-primary" />
            Edit Teacher Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-5">
            <div
              onClick={handleAvatarClick}
              className={cn(
                'w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface dark:to-nejah-surface flex items-center justify-center cursor-pointer border-2 border-dashed border-primary/300 dark:border-primary/700 hover:border-primary/500 transition-colors relative group',
                avatarUploading && 'animate-pulse',
              )}
            >
              {formData.avatarUrl ? (
                <img
                  src={apiAssetUrl(formData.avatarUrl)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-nejah-electric group-hover:text-primary transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground dark:text-foreground">Profile Picture</p>
              <p className="text-xs text-muted-foreground">Click to upload (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {avatarUploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className="bg-muted/50 dark:bg-nejah-surface/30 p-4 rounded-2xl border border-border dark:border-nejah-border-blue space-y-4">
            <div className="flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-2">
              <span className="p-1.5 bg-primary/10 dark:bg-primary/10 rounded-lg text-primary">
                <GraduationCap className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-foreground dark:text-foreground">Personal Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-fullName" className="text-xs font-semibold dark:text-muted-foreground">Full Name *</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder="e.g. Dr. Amina Mansour"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-gender" className="text-xs font-semibold dark:text-muted-foreground">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold dark:text-muted-foreground">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="name@nejah-center.com"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-phoneNumber" className="text-xs font-semibold dark:text-muted-foreground">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              {/* Address Information */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Country</Label>
                <Select
                  value={getCountryIsoByName(formData.country)}
                  onValueChange={(val) => {
                    const country = Country.getCountryByCode(val);
                    setFormData({ ...formData, country: country?.name || val, city: '' });
                  }}
                >
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select Country" /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue max-h-60">
                    {Country.getAllCountries().map((c) => (
                      <SelectItem key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-muted-foreground">City</Label>
                <Select
                  value={formData.city}
                  onValueChange={(val) => setFormData({ ...formData, city: val })}
                  disabled={!formData.country}
                >
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select City" /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue max-h-60">
                    {cityOptions.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Street Address</Label>
                <Input
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="Enter street address"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              {/* Professional Details merged */}
              <div className="grid gap-1.5">
                <Label htmlFor="edit-status" className="text-xs font-semibold dark:text-muted-foreground">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
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
          <div className="bg-muted/50 dark:bg-nejah-surface/30 p-4 rounded-2xl border border-border dark:border-nejah-border-blue space-y-4">
            <div className="flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
                <BookOpen className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-foreground dark:text-foreground">Academic Qualifications</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-specialization" className="text-xs font-semibold dark:text-muted-foreground">Specialization</Label>
                <Input
                  id="edit-specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Islamic Jurisprudence, Quranic Sciences"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-experience" className="text-xs font-semibold dark:text-muted-foreground">Experience (Years)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  min={0}
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="0"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-qualification" className="text-xs font-semibold dark:text-muted-foreground">Certifications / Ijazah</Label>
              <Textarea
                id="edit-qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="List all formal certifications and ijazahs received with respective institutions..."
                className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl min-h-[80px]"
              />
            </div>
          </div>

          {/* Section 3: Islamic Education Level & Topics */}
          <div className="bg-muted/50 dark:bg-nejah-surface/30 p-4 rounded-2xl border border-border dark:border-nejah-border-blue space-y-4">
            <div className="flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-2">
              <span className="p-1.5 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600">
                <Star className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-foreground dark:text-foreground">Islamic Education & Topics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-islamicEducationLevel" className="text-xs font-semibold dark:text-muted-foreground">Islamic Education Level</Label>
                <Select
                  value={formData.islamicEducationLevel}
                  onValueChange={(v) => setFormData({ ...formData, islamicEducationLevel: v })}
                >
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Ijazah">Ijazah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="edit-monthlySalary" className="text-xs font-semibold dark:text-muted-foreground">Monthly Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-monthlySalary"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                    placeholder="0.00"
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-teachingTopics" className="text-xs font-semibold dark:text-muted-foreground">Teaching Topics</Label>
              <Input
                id="edit-teachingTopics"
                value={formData.teachingTopics}
                onChange={(e) => setFormData({ ...formData, teachingTopics: e.target.value })}
                placeholder="e.g. Quran Recitation, Tajweed, Fiqh, Hadith (comma separated)"
                className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
              />
            </div>
          </div>



          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-border dark:border-nejah-border-blue dark:text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || avatarUploading} className="bg-primary hover:bg-nejah-azure text-white rounded-xl px-6">
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
