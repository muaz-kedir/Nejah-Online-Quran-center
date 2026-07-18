/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2, Upload, X,
  User, BookOpen, Clock, FileText, Send, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE, apiUrl } from "@/lib/api";

export const Route = createLazyFileRoute('/apply-as-teacher')({
  component: ApplyAsTeacherPage,
});

function ApplyAsTeacherPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [documents, setDocuments] = useState<Record<string, UploadedDoc>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/teacher-applications/settings`))
      .then(res => res.json())
      .then(data => setIsApplicationsOpen(data.isApplicationsOpen))
      .catch(() => setIsApplicationsOpen(true)); // Default to open if error
  }, []);

  const form = useForm<ApplicationFormValues>({
    mode: 'onChange',
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: '', gender: '', dateOfBirth: '', phoneNumber: '',
      email: '', password: '', confirmPassword: '', country: '', city: '', streetAddress: '',
      languages: [], languageOther: '',
      internetConnectionType: '', internetOther: '',
      qiratEducationLevel: '', qiratOther: '',
      islamicEducationLevel: '', islamicOther: '',
      teachingTimeAvailability: [], marketingSource: '', marketingOther: '',
      additionalComments: '',
    },
  });

  const { watch, setValue, register, formState: { errors } } = form;
  const watchAll = watch();

  // ── File upload ────────────────────────────────────────────────
  const handleUpload = useCallback(async (key: string, label: string, file: File) => {
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(apiUrl(`/teacher-applications/upload`), {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }
      const { url } = await res.json();
      setDocuments(prev => ({ ...prev, [key]: { label, key, url, fileName: file.name } }));
      toast.success(`${label} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  }, []);

  const removeDoc = (key: string) => {
    setDocuments(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ── Step validation ────────────────────────────────────────────
  const validateStep = async (): Promise<boolean> => {
    let fields: (keyof ApplicationFormValues)[] = [];
    if (step === 0) fields = ['fullName', 'gender', 'phoneNumber', 'email', 'password', 'confirmPassword', 'country'];
    if (step === 1) fields = ['languages', 'teachingTimeAvailability'];
    const result = await form.trigger(fields);
    return result;
  };

  const nextStep = async () => {
    const valid = await validateStep();
    if (!valid) return;
    setStep(s => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // ── Submit ─────────────────────────────────────────────────────
  const onSubmit = async (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    try {
      // Resolve "Other" fields
      let languages = [...values.languages];
      if (languages.includes('Other') && values.languageOther) {
        languages = languages.filter(l => l !== 'Other');
        languages.push(values.languageOther);
      }

      let internetConnectionType = values.internetConnectionType || '';
      if (internetConnectionType === 'Other' && values.internetOther) {
        internetConnectionType = values.internetOther;
      }

      let qiratEducationLevel = values.qiratEducationLevel || '';
      if (qiratEducationLevel === 'Other' && values.qiratOther) {
        qiratEducationLevel = values.qiratOther;
      }

      let islamicEducationLevel = values.islamicEducationLevel || '';
      if (islamicEducationLevel === 'Other' && values.islamicOther) {
        islamicEducationLevel = values.islamicOther;
      }

      let marketingSource = values.marketingSource || '';
      if (marketingSource === 'Other' && values.marketingOther) {
        marketingSource = values.marketingOther;
      }

      const payload = {
        fullName: values.fullName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth || undefined,
        phoneNumber: values.phoneNumber,
        email: values.email,
        password: values.password,
        country: values.country,
        city: values.city || undefined,
        streetAddress: values.streetAddress || undefined,
        languages,
        internetConnectionType: internetConnectionType || undefined,
        qiratEducationLevel: qiratEducationLevel || undefined,
        islamicEducationLevel: islamicEducationLevel || undefined,
        teachingTimeAvailability: values.teachingTimeAvailability,
        marketingSource: marketingSource || undefined,
        additionalComments: values.additionalComments || undefined,
        nationalIdUrl: documents.nationalId?.url,
        quranCertificateUrl: documents.quranCert?.url,
        islamicCertificateUrl: documents.islamicCert?.url,
        teachingExperienceUrl: documents.teachingExp?.url,
        cvResumeUrl: documents.cvResume?.url,
      };

      const res = await fetch(apiUrl(`/teacher-applications`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        throw new Error(msg || 'Submission failed');
      }

      const data = await res.json();
      setApplicationNumber(data.applicationNumber);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (isApplicationsOpen === false) {
    return (
      <div className="relative flex min-h-screen items-center justify-center admin-shell-bg p-4">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-70" />
        <div className="glass-panel relative max-w-lg w-full overflow-hidden rounded-3xl p-10 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3 font-serif">Applications Closed</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We are not currently accepting new teacher applications. Please check back later.
          </p>
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => navigate({ to: '/login' })}
          >
            Go back to Login
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center admin-shell-bg p-4">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-70" />
        <div className="glass-panel relative max-w-lg w-full overflow-hidden rounded-3xl p-10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-nejah-electric" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 font-serif">Application Submitted!</h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Your application has been submitted successfully. Our team will review
            your application and contact you after the review process.
          </p>
          <div className="bg-primary/10 border border-nejah-electric/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-nejah-electric font-medium mb-1">Your Application Number</p>
            <p className="text-2xl font-bold text-foreground font-mono tracking-wider">{applicationNumber}</p>
            <p className="text-xs text-nejah-electric mt-2">Please save this number to track your application status.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 border-nejah-electric/30 text-nejah-electric hover:bg-primary/10"
              onClick={() => navigate({ to: '/track-application' })}
            >
              Track Application
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => navigate({ to: '/login' })}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen admin-shell-bg">
      <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-70" />
      <header className="glass-panel sticky top-0 z-30 border-b border-border !rounded-none dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nejah" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-foreground font-serif leading-none">Nejah</h1>
              <p className="text-[10px] text-nejah-electric uppercase tracking-widest">Online Quran & Islamic Center</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-nejah-electric hover:bg-primary/10 hover:text-foreground"
            onClick={() => navigate({ to: '/login' })}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 pb-20">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-nejah-electric text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <GraduationCap className="h-3.5 w-3.5" />
            Teacher Application
          </div>
          <h1 className="mb-3 text-3xl font-medium tracking-tight text-foreground md:text-4xl">Apply as a Teacher</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join our team of qualified Quran and Islamic studies teachers. Fill out the form below and our team will review your application.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-10 px-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDone ? 'bg-primary text-white shadow-lg shadow-nejah-electric/30' :
                    isActive ? 'bg-primary text-white shadow-lg ring-4 ring-nejah-electric/20' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium transition-colors ${
                    isActive || isDone ? 'text-nejah-electric' : 'text-muted-foreground'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-5 transition-colors duration-300 ${
                    i < step ? 'bg-primary' : 'bg-nejah-surface/50'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="glass-panel relative overflow-hidden rounded-2xl">
          <div className="p-6 md:p-8">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* ─── STEP 0: Personal Details ─── */}
              {step === 0 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-serif">
                    <User className="h-5 w-5 text-nejah-electric" /> Personal Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <Label htmlFor="fullName" className="text-foreground font-medium">Full Name *</Label>
                      <Input id="fullName" {...register('fullName')} placeholder="Enter your full name" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Gender *</Label>
                      <Select value={watchAll.gender} onValueChange={v => setValue('gender', v)}>
                        <SelectTrigger className="mt-1.5 h-11 bg-muted border-border"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-foreground font-medium">Date of Birth</Label>
                      <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber" className="text-foreground font-medium">Phone Number *</Label>
                      <Input id="phoneNumber" {...register('phoneNumber')} placeholder="+251 9XX XXX XXXX" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                      {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium">Email Address *</Label>
                      <Input id="email" type="email" {...register('email')} placeholder="teacher@example.com" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-foreground font-medium">Password *</Label>
                      <Input id="password" type="password" {...register('password')} placeholder="Create a password" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password *</Label>
                      <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="Confirm your password" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="country" className="text-foreground font-medium">Country *</Label>
                      <Input id="country" {...register('country')} placeholder="e.g. Ethiopia" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                      {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-foreground font-medium">City</Label>
                      <Input id="city" {...register('city')} placeholder="e.g. Addis Ababa" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="streetAddress" className="text-foreground font-medium">Street Address</Label>
                      <Input id="streetAddress" {...register('streetAddress')} placeholder="Your street address" className="mt-1.5 h-11 bg-muted border-border focus:bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── STEP 1: Qualifications ─── */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-serif">
                    <BookOpen className="h-5 w-5 text-nejah-electric" /> Qualifications & Availability
                  </h2>

                  {/* Languages */}
                  <div>
                    <Label className="text-foreground font-medium mb-3 block">Languages Spoken *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[...LANGUAGES, 'Other'].map(lang => (
                        <label key={lang} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          watchAll.languages?.includes(lang) ? 'border-primary/500 bg-primary/10 shadow-sm' : 'border-border hover:border-primary/300 hover:bg-muted'
                        }`}>
                          <Checkbox
                            checked={watchAll.languages?.includes(lang)}
                            onCheckedChange={checked => {
                              const current = watchAll.languages || [];
                              setValue('languages', checked ? [...current, lang] : current.filter(l => l !== lang), { shouldValidate: true });
                            }}
                          />
                          <span className="text-sm font-medium text-foreground">{lang}</span>
                        </label>
                      ))}
                    </div>
                    {watchAll.languages?.includes('Other') && (
                      <Input {...register('languageOther')} placeholder="Specify other language" className="mt-3 h-11 bg-muted border-border" />
                    )}
                    {errors.languages && <p className="text-red-500 text-xs mt-1">{errors.languages.message}</p>}
                  </div>

                  {/* Internet Connection */}
                  <div>
                    <Label className="text-foreground font-medium">Internet Connection Type</Label>
                    <Select value={watchAll.internetConnectionType} onValueChange={v => setValue('internetConnectionType', v)}>
                      <SelectTrigger className="mt-1.5 h-11 bg-muted border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {[...INTERNET_TYPES, 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {watchAll.internetConnectionType === 'Other' && (
                      <Input {...register('internetOther')} placeholder="Specify other" className="mt-3 h-11 bg-muted border-border" />
                    )}
                  </div>

                  {/* Qirat Level */}
                  <div>
                    <Label className="text-foreground font-medium">Qirat / Quran Education Level</Label>
                    <Select value={watchAll.qiratEducationLevel} onValueChange={v => setValue('qiratEducationLevel', v)}>
                      <SelectTrigger className="mt-1.5 h-11 bg-muted border-border"><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {[...QIRAT_LEVELS, 'Other'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {watchAll.qiratEducationLevel === 'Other' && (
                      <Input {...register('qiratOther')} placeholder="Specify other" className="mt-3 h-11 bg-muted border-border" />
                    )}
                  </div>

                  {/* Islamic Education */}
                  <div>
                    <Label className="text-foreground font-medium">Additional Islamic Education</Label>
                    <Select value={watchAll.islamicEducationLevel} onValueChange={v => setValue('islamicEducationLevel', v)}>
                      <SelectTrigger className="mt-1.5 h-11 bg-muted border-border"><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {[...ISLAMIC_LEVELS, 'Other'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {watchAll.islamicEducationLevel === 'Other' && (
                      <Input {...register('islamicOther')} placeholder="Specify other" className="mt-3 h-11 bg-muted border-border" />
                    )}
                  </div>

                  {/* Teaching Availability */}
                  <div>
                    <Label className="text-foreground font-medium mb-3 block">Teaching Availability *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AVAILABILITY.map(time => (
                        <label key={time} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          watchAll.teachingTimeAvailability?.includes(time) ? 'border-primary/500 bg-primary/10 shadow-sm' : 'border-border hover:border-primary/300 hover:bg-muted'
                        }`}>
                          <Checkbox
                            checked={watchAll.teachingTimeAvailability?.includes(time)}
                            onCheckedChange={checked => {
                              const current = watchAll.teachingTimeAvailability || [];
                              setValue('teachingTimeAvailability', checked ? [...current, time] : current.filter(t => t !== time), { shouldValidate: true });
                            }}
                          />
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground">{time}</span>
                        </label>
                      ))}
                    </div>
                    {errors.teachingTimeAvailability && <p className="text-red-500 text-xs mt-1">{errors.teachingTimeAvailability.message}</p>}
                  </div>

                  {/* Marketing Source */}
                  <div>
                    <Label className="text-foreground font-medium">Where did you hear about us?</Label>
                    <Select value={watchAll.marketingSource} onValueChange={v => setValue('marketingSource', v)}>
                      <SelectTrigger className="mt-1.5 h-11 bg-muted border-border"><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>
                        {[...MARKETING_SOURCES, 'Other'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {watchAll.marketingSource === 'Other' && (
                      <Input {...register('marketingOther')} placeholder="Specify other" className="mt-3 h-11 bg-muted border-border" />
                    )}
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Documents ─── */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-serif">
                    <FileText className="h-5 w-5 text-nejah-electric" /> Document Uploads
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Upload your documents in PDF, JPG, or PNG format (max 10MB each).
                  </p>

                  {[
                    { key: 'nationalId', label: 'National ID / Passport', required: false },
                    { key: 'quranCert', label: 'Quran Certificate', required: false },
                    { key: 'islamicCert', label: 'Islamic Education Certificate', required: false },
                    { key: 'teachingExp', label: 'Teaching Experience Documents (Optional)', required: false },
                    { key: 'cvResume', label: 'CV / Resume (Optional)', required: false },
                  ].map(doc => (
                    <div key={doc.key} className="border border-border rounded-xl p-4 hover:border-primary/300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-foreground font-medium text-sm">{doc.label}</Label>
                        {documents[doc.key] && (
                          <button type="button" onClick={() => removeDoc(doc.key)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {documents[doc.key] ? (
                        <div className="flex items-center gap-2 p-2.5 bg-primary/10 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-nejah-electric flex-shrink-0" />
                          <span className="text-sm text-nejah-sapphire text-foreground truncate">{documents[doc.key].fileName}</span>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/400 hover:bg-primary/10 transition-all">
                          {uploadingKey === doc.key ? (
                            <Loader2 className="h-5 w-5 text-nejah-electric animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {uploadingKey === doc.key ? 'Uploading...' : 'Click to upload'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(doc.key, doc.label, f);
                              e.target.value = '';
                            }}
                            disabled={uploadingKey !== null}
                          />
                        </label>
                      )}
                    </div>
                  ))}

                  {/* Additional Comments */}
                  <div>
                    <Label htmlFor="additionalComments" className="text-foreground font-medium">Additional Comments (Optional)</Label>
                    <Textarea
                      id="additionalComments"
                      {...register('additionalComments')}
                      placeholder="Any additional information you'd like to share..."
                      className="mt-1.5 bg-muted border-border focus:bg-white min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Review ─── */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-serif">
                    <CheckCircle2 className="h-5 w-5 text-nejah-electric" /> Review Your Application
                  </h2>
                  <p className="text-sm text-muted-foreground">Please review your information before submitting.</p>

                  {/* Personal */}
                  <div className="bg-muted rounded-xl p-5 space-y-2">
                    <h3 className="font-semibold text-nejah-sapphire text-foreground text-sm uppercase tracking-wider mb-3">Personal Details</h3>
                    <ReviewRow label="Full Name" value={watchAll.fullName} />
                    <ReviewRow label="Gender" value={watchAll.gender} />
                    <ReviewRow label="Date of Birth" value={watchAll.dateOfBirth} />
                    <ReviewRow label="Phone" value={watchAll.phoneNumber} />
                    <ReviewRow label="Email" value={watchAll.email} />
                    <ReviewRow label="Country" value={watchAll.country} />
                    <ReviewRow label="City" value={watchAll.city} />
                    <ReviewRow label="Address" value={watchAll.streetAddress} />
                  </div>

                  {/* Qualifications */}
                  <div className="bg-muted rounded-xl p-5 space-y-2">
                    <h3 className="font-semibold text-nejah-sapphire text-foreground text-sm uppercase tracking-wider mb-3">Qualifications</h3>
                    <ReviewRow label="Languages" value={watchAll.languages?.join(', ')} />
                    <ReviewRow label="Internet" value={watchAll.internetConnectionType === 'Other' ? watchAll.internetOther : watchAll.internetConnectionType} />
                    <ReviewRow label="Qirat Level" value={watchAll.qiratEducationLevel === 'Other' ? watchAll.qiratOther : watchAll.qiratEducationLevel} />
                    <ReviewRow label="Islamic Education" value={watchAll.islamicEducationLevel === 'Other' ? watchAll.islamicOther : watchAll.islamicEducationLevel} />
                    <ReviewRow label="Availability" value={watchAll.teachingTimeAvailability?.join(', ')} />
                    <ReviewRow label="Marketing Source" value={watchAll.marketingSource === 'Other' ? watchAll.marketingOther : watchAll.marketingSource} />
                  </div>

                  {/* Documents */}
                  <div className="bg-muted rounded-xl p-5 space-y-2">
                    <h3 className="font-semibold text-nejah-sapphire text-foreground text-sm uppercase tracking-wider mb-3">Uploaded Documents</h3>
                    {Object.values(documents).length > 0 ? (
                      Object.values(documents).map(d => (
                        <div key={d.key} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{d.label}:</span>
                          <span className="text-foreground font-medium">{d.fileName}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
                    )}
                  </div>

                  {watchAll.additionalComments && (
                    <div className="bg-muted rounded-xl p-5">
                      <h3 className="font-semibold text-nejah-sapphire text-foreground text-sm uppercase tracking-wider mb-3">Additional Comments</h3>
                      <p className="text-sm text-foreground">{watchAll.additionalComments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Navigation Buttons ─── */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                {step > 0 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="border-primary/200 text-nejah-electric hover:bg-primary/10">
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                  </Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="bg-primary hover:bg-primary/90 shadow-md">
                    Next <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 shadow-lg min-w-[160px]">
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Submit Application</>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/100 bg-white/60 py-6 mt-10">
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Nejah Online Quran & Islamic Center. All rights reserved.</p>
      </footer>
    </div>
  );
}
