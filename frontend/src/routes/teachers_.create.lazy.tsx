/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Country } from 'country-state-city';
import { getCountryIsoByName } from '@/lib/geo-data';
import { buildCreateTeacherPayload } from '@/lib/teacher-payload';
import {
  ChevronLeft,
  GraduationCap,
  Calendar,
  DollarSign,
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Award,
  FileText,
  Camera,
  Lock,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createLazyFileRoute('/teachers_/create')({
  component: AddTeacherPage,
});

function AddTeacherPage() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    import('country-state-city').then(({ City: C }) => {
      const iso = getCountryIsoByName(formData.country);
      if (!iso) { setCityOptions([]); return; }
      const cities = C.getCitiesOfCountry(iso) ?? [];
      setCityOptions([...new Set(cities.map((c) => c.name))]);
    });
  }, [formData.country]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    qualification: '',
    specialization: '',
    experience: 0,
    country: '',
    city: '',
    streetAddress: '',
    languages: [] as string[],
    internetConnectionType: '',
    qiratEducationLevel: '',
    islamicEducationLevel: '',
    teachingTimeAvailability: [] as string[],
    marketingSource: '',
    additionalComments: '',
    weeklySchedule: '',
    hourlyRate: 20,
    monthlySalary: '',
    notes: '',
    avatarUrl: '',
    status: 'active',
  });

  const [otherStates, setOtherStates] = useState({
    languages: '',
    internetConnectionType: '',
    qiratEducationLevel: '',
    islamicEducationLevel: '',
    marketingSource: '',
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience' || name === 'hourlyRate' || name === 'monthlySalary' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Profile photo placeholder camera trigger
  const handlePhotoClick = () => {
    const fakeUrls = [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    ];
    const randomUrl = fakeUrls[Math.floor(Math.random() * fakeUrls.length)];
    setImagePreview(randomUrl);
    setFormData((prev) => ({ ...prev, avatarUrl: randomUrl }));
    toast.success('Profile photo uploaded successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.gender) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    if (!formData.phoneNumber) {
      toast.error('Phone Number is required');
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

    if (!formData.streetAddress) {
      toast.error('Street Address is required');
      return;
    }

    if (!formData.specialization) {
      toast.error('Specialization is required');
      return;
    }

    if (formData.experience === 0) {
      toast.error('Experience is required');
      return;
    }

    if (!formData.qualification) {
      toast.error('Certifications / Ijazah is required');
      return;
    }

    if (!formData.islamicEducationLevel) {
      toast.error('Islamic Education Level is required');
      return;
    }

    if (formData.languages.length === 0) {
      toast.error('Select at least one language');
      return;
    }

    if (!formData.internetConnectionType) {
      toast.error('Internet Connection Type is required');
      return;
    }

    if (!formData.marketingSource) {
      toast.error('Please specify where you heard about us');
      return;
    }

    if (!formData.qiratEducationLevel) {
      toast.error('Qirat / Quran Education Level is required');
      return;
    }

    if (formData.teachingTimeAvailability.length === 0) {
      toast.error('Select at least one available teaching time');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = buildCreateTeacherPayload(formData, { otherStates });

      const response = await fetch(apiUrl(`/teachers`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create teacher profile');
      }

      toast.success('Faculty profile added successfully!');
      window.location.href = '/teachers';
    } catch (error: any) {
      console.error('Teacher creation error:', error);
      toast.error(error.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Back navigation */}
        <div>
          <button
            onClick={() => window.location.href = '/teachers'}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-nejah-sapphire dark:hover:text-nejah-electric uppercase tracking-widest transition-colors mb-2 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Faculty
          </button>
          <h1 className="text-3xl font-extrabold text-nejah-sapphire text-foreground font-serif">Add New Teacher</h1>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground font-semibold mt-1">
            Register a new scholar and define their curriculum schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Personal Details */}
            <div className="bg-card dark:bg-nejah-surface p-6 rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-nejah-sapphire text-foreground font-serif flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-3">
                <User className="h-5 w-5 text-nejah-sapphire dark:text-nejah-electric" />
                Personal Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Sheikh Omar Al-Faruq"
                      className="pl-10 h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => handleSelectChange('gender', val)}
                  >
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl">
                      <SelectValue placeholder="Select gender..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. scholar@nejah.com"
                      className="pl-10 h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +20 102 345 6789"
                      className="pl-10 h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min. 6 characters)"
                      className="pl-10 h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="pl-10 h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Address Information Merged */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={getCountryIsoByName(formData.country)}
                    onValueChange={(val) => {
                      const cName = Country.getCountryByCode(val)?.name || val;
                      handleSelectChange('country', cName);
                      handleSelectChange('city', '');
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue max-h-60">
                      {Country.getAllCountries().map((c) => (
                        <SelectItem key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.city}
                    onValueChange={(val) => handleSelectChange('city', val)}
                  >
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue max-h-60">
                      {cityOptions.map((cityName) => (
                          <SelectItem key={cityName} value={cityName}>
                            {cityName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    className="h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                  />
                </div>

              </div>
            </div>


            {/* Card 2: Academic & Specialties */}
            <div className="bg-card dark:bg-nejah-surface p-6 rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-nejah-sapphire text-foreground font-serif flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-3">
                <GraduationCap className="h-5 w-5 text-nejah-sapphire dark:text-nejah-electric" />
                Academic Qualifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Specialization / Primary Area <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      placeholder="e.g. Tajweed, Quran Memorization, Tafseer"
                      className="pl-10 h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Experience (Years) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    className="h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                    Certifications, Degrees & Ijazahs <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      placeholder="List primary Ijazahs or academic degrees (e.g., Al-Azhar BA in Islamic Studies, Ten Qira'at Ijazah from Sheikh...)"
                      className="pl-10 min-h-[90px] bg-muted dark:bg-nejah-surface border-none rounded-xl pt-3.5 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2B: Teacher Specifics */}
            <div className="bg-card dark:bg-nejah-surface p-6 rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-nejah-sapphire text-foreground font-serif flex items-center gap-2 border-b border-border dark:border-nejah-border-blue pb-3">
                <FileText className="h-5 w-5 text-nejah-sapphire dark:text-nejah-electric" />
                Additional Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Languages */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Languages Spoken <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {['Arabic', 'English', 'Afaan Oromo', 'Amharic', 'Somali', 'French', 'Other'].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleMultiSelect('languages', lang)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${formData.languages.includes(lang) ? 'bg-primary text-white border-primary/600' : 'bg-muted text-muted-foreground border-border hover:bg-muted dark:bg-nejah-surface dark:border-nejah-border-blue dark:text-muted-foreground'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  {formData.languages.includes('Other') && (
                    <Input name="languages" value={otherStates.languages} onChange={handleOtherChange} placeholder="Specify other languages" className="mt-2 h-10 bg-muted dark:bg-nejah-surface border-none rounded-xl" />
                  )}
                </div>

                {/* Internet Connection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Internet Connection Type <span className="text-red-500">*</span></label>
                  <Select value={formData.internetConnectionType} onValueChange={(val) => handleSelectChange('internetConnectionType', val)}>
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wi-Fi">Wi-Fi</SelectItem>
                      <SelectItem value="Mobile Data Connection">Mobile Data Connection</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.internetConnectionType === 'Other' && (
                    <Input name="internetConnectionType" value={otherStates.internetConnectionType} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 bg-muted dark:bg-nejah-surface border-none rounded-xl" />
                  )}
                </div>

                {/* Marketing Source */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Where Did You Hear About Us? <span className="text-red-500">*</span></label>
                  <Select value={formData.marketingSource} onValueChange={(val) => handleSelectChange('marketingSource', val)}>
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
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
                    <Input name="marketingSource" value={otherStates.marketingSource} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 bg-muted dark:bg-nejah-surface border-none rounded-xl" />
                  )}
                </div>

                {/* Qirat Level */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Qirat / Quran Education Level <span className="text-red-500">*</span></label>
                  <Select value={formData.qiratEducationLevel} onValueChange={(val) => handleSelectChange('qiratEducationLevel', val)}>
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fully Hafiz">Fully Hafiz</SelectItem>
                      <SelectItem value="Partial Hafiz">Partial Hafiz</SelectItem>
                      <SelectItem value="Learned Quran with Tajweed">Learned Quran with Tajweed</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.qiratEducationLevel === 'Other' && (
                    <Input name="qiratEducationLevel" value={otherStates.qiratEducationLevel} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 bg-muted dark:bg-nejah-surface border-none rounded-xl" />
                  )}
                </div>

                {/* Extra Islamic Level */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Additional Islamic Education Level <span className="text-red-500">*</span></label>
                  <Select value={formData.islamicEducationLevel} onValueChange={(val) => handleSelectChange('islamicEducationLevel', val)}>
                    <SelectTrigger className="w-full h-11 bg-muted dark:bg-nejah-surface border-none rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
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
                    <Input name="islamicEducationLevel" value={otherStates.islamicEducationLevel} onChange={handleOtherChange} placeholder="Specify" className="mt-2 h-10 bg-muted dark:bg-nejah-surface border-none rounded-xl" />
                  )}
                </div>

                {/* Availability */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Available Teaching Times <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {['After Fajr Prayer until Dhuhr Prayer', 'Between Dhuhr and Asr', 'Between Asr and Maghrib', 'Between Maghrib and Isha', 'After Isha Prayer'].map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleMultiSelect('teachingTimeAvailability', slot)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${formData.teachingTimeAvailability.includes(slot) ? 'bg-blue-600 text-white border-blue-600' : 'bg-muted text-muted-foreground border-border hover:bg-muted dark:bg-nejah-surface dark:border-nejah-border-blue dark:text-muted-foreground'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Additional Comments</label>
                  <Textarea
                    name="additionalComments"
                    value={formData.additionalComments}
                    onChange={handleInputChange}
                    placeholder="Enter any additional information you would like us to know."
                    className="min-h-[80px] bg-muted dark:bg-nejah-surface border-none rounded-xl resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Cards: Photo upload, Availability, internal notes */}
          <div className="space-y-6">
            {/* Profile Photo camera upload card */}
            <div className="bg-card dark:bg-nejah-surface p-6 rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest self-start">Profile Photo</h3>

              <div
                onClick={handlePhotoClick}
                className="relative group cursor-pointer w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface dark:to-nejah-surface flex items-center justify-center border-4 border-dashed border-nejah-border-blue/20 hover:border-primary/50 transition-all shadow-inner"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-nejah-sapphire text-nejah-electric">
                    <Camera className="h-7 w-7 opacity-70 group-hover:scale-110 transition-transform" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold uppercase tracking-widest">
                  Upload
                </div>
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed max-w-[190px]">
                Click circle to upload high resolution scholar portrait.
              </p>
            </div>

            {/* Availability Green Card */}
            <div className="bg-gradient-to-br from-nejah-sapphire to-nejah-midnight text-white p-6 rounded-3xl shadow-lg shadow-nejah-glow space-y-5">
              <h3 className="text-xs font-bold tracking-widest uppercase text-nejah-electric flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5" /> Availability & Rates
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-nejah-electric uppercase tracking-wider">
                    Weekly Schedule Summary
                  </label>
                  <Input
                    name="weeklySchedule"
                    value={formData.weeklySchedule}
                    onChange={handleInputChange}
                    placeholder="e.g. Mon-Fri (9AM-5PM)"
                    className="bg-nejah-sapphire/40 border-none text-white placeholder-nejah-slate-blue/60 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-nejah-electric uppercase tracking-wider">
                    Hourly Billing Rate ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nejah-electric" />
                    <Input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="20"
                      className="pl-9 bg-nejah-sapphire/40 border-none text-white placeholder-nejah-slate-blue/60 rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-nejah-electric uppercase tracking-wider">
                    Monthly Salary (ETB)
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nejah-electric" />
                    <Input
                      type="number"
                      name="monthlySalary"
                      value={formData.monthlySalary}
                      onChange={handleInputChange}
                      placeholder="e.g. 5000"
                      className="pl-9 bg-nejah-sapphire/40 border-none text-white placeholder-nejah-slate-blue/60 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Internal Admin notes */}
            <div className="bg-card dark:bg-nejah-surface p-6 rounded-3xl border border-border dark:border-nejah-border-blue shadow-sm space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5" /> Confidential Admin Notes
              </label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Internal HR or pedagogy credentials notes..."
                className="bg-muted dark:bg-nejah-surface border-none rounded-xl min-h-[90px] resize-none text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/teachers'}
                className="h-12 rounded-2xl dark:border-nejah-border-blue font-bold uppercase text-xs tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 bg-primary hover:bg-nejah-azure text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-nejah-glow"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
