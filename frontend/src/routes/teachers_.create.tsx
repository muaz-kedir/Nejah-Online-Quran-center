import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
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

// List of all world countries (ISO 3166‑1 English short names)
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo‑Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea‑Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor‑Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States of America",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];
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
} from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers_/create')({
  component: AddTeacherPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function AddTeacherPage() {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
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
    currentResidency: '',
    weeklySchedule: '',
    hourlyRate: 20,
    notes: '',
    avatarUrl: '',
    status: 'active',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience' || name === 'hourlyRate' ? Number(value) : value,
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

    if (!formData.password || formData.password.length < 6) {
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
      
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...teacherData } = formData;
      
      const response = await fetch('http://localhost:3000/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(teacherData),
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
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-emerald-800 uppercase tracking-widest transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Faculty
          </button>
          <h1 className="text-3xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">Add New Teacher</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-1">
            Register a new scholar and define their curriculum schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Personal Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <User className="h-5 w-5 text-emerald-800" />
                Personal Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Sheikh Omar Al-Faruq"
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => handleSelectChange('gender', val)}
                  >
                    <SelectTrigger className="w-full h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl">
                      <SelectValue placeholder="Select gender..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. scholar@nejah.com"
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +20 102 345 6789"
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min. 6 characters)"
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Academic & Specialties */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <GraduationCap className="h-5 w-5 text-emerald-800" />
                Academic Qualifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Specialization / Primary Area
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      placeholder="e.g. Tajweed, Quran Memorization, Tafseer"
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Experience (Years)
                  </label>
                  <Input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 5"
                    className="h-11 bg-gray-50 dark:bg-gray-900 border-none rounded-xl"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Certifications, Degrees & Ijazahs
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-4 h-4 w-4 text-gray-400" />
                    <Textarea
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      placeholder="List primary Ijazahs or academic degrees (e.g., Al-Azhar BA in Islamic Studies, Ten Qira'at Ijazah from Sheikh...)"
                      className="pl-10 min-h-[90px] bg-gray-50 dark:bg-gray-900 border-none rounded-xl pt-3.5 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Cards: Photo upload, Availability, internal notes */}
          <div className="space-y-6">
            {/* Profile Photo camera upload card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest self-start">Profile Photo</h3>

              <div
                onClick={handlePhotoClick}
                className="relative group cursor-pointer w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center border-4 border-dashed border-emerald-900/20 hover:border-emerald-800 transition-all shadow-inner"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-emerald-800 dark:text-emerald-300">
                    <Camera className="h-7 w-7 opacity-70 group-hover:scale-110 transition-transform" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold uppercase tracking-widest">
                  Upload
                </div>
              </div>
              <p className="text-[10px] font-semibold text-gray-400 leading-relaxed max-w-[190px]">
                Click circle to upload high resolution scholar portrait.
              </p>
            </div>

            {/* Availability Green Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-3xl shadow-lg shadow-emerald-950/20 space-y-5">
              <h3 className="text-xs font-bold tracking-widest uppercase text-emerald-300 flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5" /> Availability & Rates
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                    Weekly Schedule Summary
                  </label>
                  <Input
                    name="weeklySchedule"
                    value={formData.weeklySchedule}
                    onChange={handleInputChange}
                    placeholder="e.g. Mon-Fri (9AM-5PM)"
                    className="bg-emerald-850/40 border-none text-white placeholder-emerald-400/60 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                    Hourly Billing Rate ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300" />
                    <Input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="20"
                      className="pl-9 bg-emerald-850/40 border-none text-white placeholder-emerald-400/60 rounded-xl h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                    Current Residence (City / Country)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300" />
                    <Input
                      name="currentResidency"
                      value={formData.currentResidency}
                      onChange={handleInputChange}
                      placeholder="e.g. Cairo, Egypt"
                      className="pl-9 bg-emerald-850/40 border-none text-white placeholder-emerald-400/60 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Internal Admin notes */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5" /> Confidential Admin Notes
              </label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Internal HR or pedagogy credentials notes..."
                className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl min-h-[90px] resize-none text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = '/teachers'}
                className="h-12 rounded-2xl dark:border-gray-700 font-bold uppercase text-xs tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 bg-emerald-900 hover:bg-emerald-800 text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-emerald-900/20"
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
