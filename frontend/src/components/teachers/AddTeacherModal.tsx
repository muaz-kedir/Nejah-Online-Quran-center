import { useState, useRef, useMemo, useEffect } from 'react';
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
import { UserPlus, BookOpen, GraduationCap, Briefcase, Upload, DollarSign, Star, Globe, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Country } from 'country-state-city';
import { getCountryIsoByName, getUniqueCityNames } from '@/lib/geo-data';
import { buildCreateTeacherPayload } from '@/lib/teacher-payload';
import { API_BASE, apiAssetUrl, formatApiError, apiUrl } from "@/lib/api";

interface AddTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTeacherModal({ open, onClose, onSuccess }: AddTeacherModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: 'Male',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    qualification: '',
    specialization: '',
    experience: '',
    country: '',
    city: '',
    streetAddress: '',
    dateOfBirth: '',
    languages: [] as string[],
    internetConnectionType: '',
    qiratEducationLevel: '',
    islamicEducationLevel: '',
    teachingTimeAvailability: [] as string[],
    marketingSource: '',
    additionalComments: '',
    status: 'active',
    monthlySalary: '',
    teachingTopics: '',
    avatarUrl: '',
  });

  const [otherStates, setOtherStates] = useState({
    languages: '',
    internetConnectionType: '',
    qiratEducationLevel: '',
    islamicEducationLevel: '',
    marketingSource: '',
  });

  useEffect(() => {
    if (open) setSubmitError(null);
  }, [open]);

  const handleOtherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtherStates(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData((prev: any) => {
      const arr = prev[name] || [];
      if (arr.includes(value)) {
        return { ...prev, [name]: arr.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [name]: [...arr, value] };
      }
    });
  };

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

      const response = await fetch(apiUrl(`/uploads`), {
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
    setSubmitError(null);

    // Basic validation
    if (!formData.fullName.trim()) {
      toast.error('Full Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email Address is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.country) {
      toast.error('Country is required');
      return;
    }

    if (!formData.city) {
      toast.error('City is required');
      return;
    }

    // Validate "Other" fields have custom input
    if (formData.languages.includes('Other') && !otherStates.languages.trim()) {
      toast.error('Please specify other languages');
      return;
    }

    if (formData.internetConnectionType === 'Other' && !otherStates.internetConnectionType.trim()) {
      toast.error('Please specify internet connection type');
      return;
    }

    if (formData.qiratEducationLevel === 'Other' && !otherStates.qiratEducationLevel.trim()) {
      toast.error('Please specify your Qirat/Quran education level');
      return;
    }

    if (formData.islamicEducationLevel === 'Other' && !otherStates.islamicEducationLevel.trim()) {
      toast.error('Please specify your Islamic education level');
      return;
    }

    if (formData.marketingSource === 'Other' && !otherStates.marketingSource.trim()) {
      toast.error('Please specify where you heard about us');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      const msg = 'You must be logged in to add a teacher. Please sign in again.';
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const payload = buildCreateTeacherPayload(
        {
          ...formData,
          experience: formData.experience ? parseInt(formData.experience as string, 10) : 0,
          monthlySalary: formData.monthlySalary ? parseFloat(formData.monthlySalary as string) : undefined,
        },
        { otherStates },
      );

      if (!payload.password || !payload.email || !payload.fullName) {
        throw new Error('Full name, email, and password are required.');
      }

      const response = await fetch(apiUrl(`/teachers`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(formatApiError(data, 'Failed to add teacher'));
      }

      toast.success('Teacher added successfully');
      onSuccess();
      onClose();

      setFormData({
        fullName: '',
        email: '',
        gender: 'Male',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        qualification: '',
        specialization: '',
        experience: '',
        country: '',
        city: '',
        streetAddress: '',
        dateOfBirth: '',
        languages: [],
        internetConnectionType: '',
        qiratEducationLevel: '',
        islamicEducationLevel: '',
        teachingTimeAvailability: [],
        marketingSource: '',
        additionalComments: '',
        status: 'active',
        monthlySalary: '',
        teachingTopics: '',
        avatarUrl: '',
      });
      setOtherStates({
        languages: '',
        internetConnectionType: '',
        qiratEducationLevel: '',
        islamicEducationLevel: '',
        marketingSource: '',
      });
    } catch (error: unknown) {
      console.error('Teacher creation error:', error);
      const msg = error instanceof Error ? error.message : 'Something went wrong';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    const iso = getCountryIsoByName(formData.country);
    if (iso) {
      getUniqueCityNames(iso).then(setCityOptions);
    } else {
      setCityOptions([]);
    }
  }, [formData.country]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto dark:bg-nejah-surface dark:border-nejah-border-blue rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-nejah-sapphire text-foreground flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Add New Teacher
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 mt-4">
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
                <Label htmlFor="fullName" className="text-xs font-semibold dark:text-muted-foreground">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Amina Mansour"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="gender" className="text-xs font-semibold dark:text-muted-foreground">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="dateOfBirth" className="text-xs font-semibold dark:text-muted-foreground">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs font-semibold dark:text-muted-foreground">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@nejah-center.com"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="phoneNumber" className="text-xs font-semibold dark:text-muted-foreground">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-xs font-semibold dark:text-muted-foreground">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold dark:text-muted-foreground">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              {/* Address Information merged into Personal Details */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Country *</Label>
                <Select
                  value={getCountryIsoByName(formData.country)}
                  onValueChange={(val) => {
                    const cName = Country.getCountryByCode(val)?.name || val;
                    setFormData({ ...formData, country: cName, city: '' });
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
                <Label className="text-xs font-semibold dark:text-muted-foreground">City *</Label>
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

              {/* Professional Details merged into Personal Details */}
              <div className="grid gap-1.5">
                <Label htmlFor="status" className="text-xs font-semibold dark:text-muted-foreground">Status</Label>
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
                <Label htmlFor="specialization" className="text-xs font-semibold dark:text-muted-foreground">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Islamic Jurisprudence, Quranic Sciences"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="experience" className="text-xs font-semibold dark:text-muted-foreground">Experience (Years)</Label>
                <Input
                  id="experience"
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
              <Label htmlFor="qualification" className="text-xs font-semibold dark:text-muted-foreground">Certifications / Ijazah</Label>
              <Textarea
                id="qualification"
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
                <Label htmlFor="islamicEducationLevel" className="text-xs font-semibold dark:text-muted-foreground">Islamic Education Level</Label>
                <Select
                  value={formData.islamicEducationLevel}
                  onValueChange={(v) => setFormData({ ...formData, islamicEducationLevel: v })}
                >
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="Mukhtasar Books">Mukhtasar Books</SelectItem>
                    <SelectItem value="Mutawwal Books">Mutawwal Books</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Ijazah">Ijazah</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.islamicEducationLevel === 'Other' && (
                  <Input name="islamicEducationLevel" value={otherStates.islamicEducationLevel} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl" />
                )}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="monthlySalary" className="text-xs font-semibold dark:text-muted-foreground">Monthly Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monthlySalary"
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
              <Label htmlFor="teachingTopics" className="text-xs font-semibold dark:text-muted-foreground">Teaching Topics</Label>
              <Input
                id="teachingTopics"
                value={formData.teachingTopics}
                onChange={(e) => setFormData({ ...formData, teachingTopics: e.target.value })}
                placeholder="e.g. Quran Recitation, Tajweed, Fiqh, Hadith (comma separated)"
                className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"
              />
            </div>
          </div>



          {/* Section 4: Additional Details */}
          <div className="bg-muted/50 dark:bg-nejah-surface/30 p-4 rounded-2xl border border-border dark:border-nejah-border-blue space-y-4">
            <div className="flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-2">
              <span className="p-1.5 bg-orange-50 dark:bg-orange-950/50 rounded-lg text-orange-600">
                <FileText className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-sm text-foreground dark:text-foreground">Additional Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Languages Spoken</Label>
                <div className="flex flex-wrap gap-2">
                  {['Arabic', 'English', 'Afaan Oromo', 'Amharic', 'Somali', 'French', 'Other'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleMultiSelect('languages', lang)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${formData.languages.includes(lang) ? 'bg-primary text-white border-primary/600' : 'bg-white text-muted-foreground border-border hover:bg-muted dark:bg-nejah-surface dark:border-nejah-border-blue dark:text-muted-foreground'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                {formData.languages.includes('Other') && (
                  <Input name="languages" value={otherStates.languages} onChange={handleOtherChange} placeholder="Specify other languages" className="mt-2 h-10 dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl" />
                )}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Internet Connection Type</Label>
                <Select value={formData.internetConnectionType} onValueChange={(val) => setFormData({ ...formData, internetConnectionType: val })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wi-Fi">Wi-Fi</SelectItem>
                    <SelectItem value="Mobile Data Connection">Mobile Data Connection</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.internetConnectionType === 'Other' && (
                  <Input name="internetConnectionType" value={otherStates.internetConnectionType} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl" />
                )}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Where Did You Hear About Us?</Label>
                <Select value={formData.marketingSource} onValueChange={(val) => setFormData({ ...formData, marketingSource: val })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Telegram">Telegram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.marketingSource === 'Other' && (
                  <Input name="marketingSource" value={otherStates.marketingSource} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl" />
                )}
              </div>

              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Qirat / Quran Education Level</Label>
                <Select value={formData.qiratEducationLevel} onValueChange={(val) => setFormData({ ...formData, qiratEducationLevel: val })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fully Hafiz">Fully Hafiz</SelectItem>
                    <SelectItem value="Partial Hafiz">Partial Hafiz</SelectItem>
                    <SelectItem value="Learned Quran with Tajweed">Learned Quran with Tajweed</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formData.qiratEducationLevel === 'Other' && (
                  <Input name="qiratEducationLevel" value={otherStates.qiratEducationLevel} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl" />
                )}
              </div>

              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Available Teaching Times</Label>
                <div className="flex flex-wrap gap-2">
                  {['After Fajr Prayer until Dhuhr Prayer', 'Between Dhuhr and Asr', 'Between Asr and Maghrib', 'Between Maghrib and Isha', 'After Isha Prayer'].map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleMultiSelect('teachingTimeAvailability', slot)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${formData.teachingTimeAvailability.includes(slot) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-muted-foreground border-border hover:bg-muted dark:bg-nejah-surface dark:border-nejah-border-blue dark:text-muted-foreground'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5 col-span-2">
                <Label className="text-xs font-semibold dark:text-muted-foreground">Additional Comments</Label>
                <Textarea
                  value={formData.additionalComments}
                  onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                  placeholder="Enter any additional information you would like us to know."
                  className="min-h-[80px] dark:bg-nejah-surface dark:border-nejah-border-blue rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3">
              {submitError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-border dark:border-nejah-border-blue dark:text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || avatarUploading} className="bg-primary hover:bg-nejah-azure text-white rounded-xl px-6">
              {loading ? 'Saving Teacher...' : 'Save Teacher'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
