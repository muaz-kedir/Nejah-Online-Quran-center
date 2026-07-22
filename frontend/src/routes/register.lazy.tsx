/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

import { apiUrl } from "@/lib/api";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Users, Mail, MapPin, Lock, ArrowRight, CheckCircle2, ArrowLeft, Phone, BookOpen, Info, Search, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CountryInput, CityInput } from '@/components/ui/location-input';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { Textarea } from "@/components/ui/textarea";

const registerSchema = z.object({
  student: z.object({
    fullName: z.string().min(2, "Full name is required"),
    gender: z.string().min(1, "Gender is required"),
    ageRange: z.enum(["Under 18", "18 - 25", "Above 25"], { required_error: "Age range is required" }),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    phone: z.string().min(1, "Phone is required"),
    levelOfQuran: z.string().min(1, "Quran level is required"),
    kitabRequested: z.boolean().default(false),
    kitabName: z.string().optional(),
    previousTraining: z.boolean().default(false),
    trainingDetails: z.string().optional(),
    referralSource: z.string().min(1, "Source is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Must contain uppercase, lowercase, number, and special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
  parent: z.object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    phoneNumber: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    relationshipWithStudent: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Route = createLazyFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<"student" | "parent-confirm" | "parent-search" | "parent-info">("student");
  const [isParentExisting, setIsParentExisting] = useState<boolean | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      student: {
        fullName: "",
        gender: "",
        ageRange: undefined,
        country: "",
        city: "",
        phone: "",
        levelOfQuran: "",
        kitabRequested: false,
        kitabName: "",
        previousTraining: false,
        trainingDetails: "",
        referralSource: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      parent: {
        fullName: "",
        email: "",
        phoneNumber: "",
        country: "",
        city: "",
        relationshipWithStudent: "",
        password: "",
        confirmPassword: "",
      },
    },
  });

  const watchAgeRange = form.watch("student.ageRange");
  const watchStudentCountry = form.watch("student.country");
  const watchParentCountry = form.watch("parent.country");
  const watchKitabRequested = form.watch("student.kitabRequested");
  const watchPreviousTraining = form.watch("student.previousTraining");
  const watchReferralSource = form.watch("student.referralSource");

  // Parent search state
  const [searchingParent, setSearchingParent] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [parentSearchPerformed, setParentSearchPerformed] = useState(false);
  const [parentResults, setParentResults] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [useExistingParent, setUseExistingParent] = useState(false);

  // Duplicate detection state (for the "create new parent" path)
  const [duplicateParent, setDuplicateParent] = useState<any>(null);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
  const [allowDuplicateCreate, setAllowDuplicateCreate] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const togglePassword = (field: string) => setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));

  const watchParentEmail = form.watch("parent.email");
  const watchParentPhone = form.watch("parent.phoneNumber");

  // Re-run duplicate detection if the parent's email/phone is edited
  useEffect(() => {
    setDuplicateParent(null);
    setShowDuplicateDetails(false);
    setAllowDuplicateCreate(false);
  }, [watchParentEmail, watchParentPhone]);

  // Search for existing parent (partial name, exact email/phone)
  const searchParent = async () => {
    const query = parentSearchQuery.trim();
    if (query.length < 3) {
      toast.error("Please enter at least 3 characters to search.");
      return;
    }
    setSearchingParent(true);
    try {
      const response = await fetch(apiUrl(`/auth/parent-lookup`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (response.ok) {
        const data = await response.json();
        setParentResults(Array.isArray(data) ? data : []);
      } else {
        setParentResults([]);
      }
      setParentSearchPerformed(true);
    } catch (error) {
      console.error('Failed to search parents', error);
      toast.error("Parent search failed. Please try again.");
    } finally {
      setSearchingParent(false);
    }
  };

  const handleSelectParent = (parent: any) => {
    setSelectedParent(parent);
    setUseExistingParent(true);
    setParentResults([]);
    setDuplicateParent(null);
  };

  const clearParentSelection = () => {
    setSelectedParent(null);
    setUseExistingParent(false);
    setParentResults([]);
    setParentSearchPerformed(false);
  };

  // Verify the student email isn't already taken before leaving the student step,
  // so the conflict shows on the right field instead of a 409 at the very end.
  const verifyStudentEmail = async (): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl(`/auth/check-email`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.getValues("student.email") }),
      });
      if (!response.ok) return true; // don't block; backend re-validates on submit
      const data = await response.json();
      if (!data.available) {
        const message = data.message || "This email is already registered.";
        form.setError("student.email", { message });
        toast.error(message);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Email availability check failed", error);
      return true;
    }
  };

  async function handleNext() {
    const studentFields = [
      "student.fullName", "student.gender", "student.ageRange", 
      "student.country", "student.city", "student.phone", "student.levelOfQuran",
      "student.referralSource", "student.email", "student.password", "student.confirmPassword"
    ] as const;

    const isValid = await form.trigger(studentFields);
    
    // Additional check for dependent fields
    let dependentFieldsValid = true;
    if (watchKitabRequested && !form.getValues("student.kitabName")) {
      form.setError("student.kitabName", { message: "Kitab Name is required" });
      dependentFieldsValid = false;
    }
    if (watchPreviousTraining && !form.getValues("student.trainingDetails")) {
      form.setError("student.trainingDetails", { message: "Training details are required" });
      dependentFieldsValid = false;
    }
    
    if (isValid && dependentFieldsValid) {
      setIsLoading(true);
      const emailAvailable = await verifyStudentEmail();
      setIsLoading(false);
      if (!emailAvailable) return;

      if (watchAgeRange === "Under 18") {
        setCurrentStep("parent-confirm");
      } else {
        // Adult student, submit directly
        onSubmit(form.getValues());
      }
    } else {
      toast.error("Please fill in all required student information correctly");
    }
  }

  function handleBack() {
    if (currentStep === "parent-search" || currentStep === "parent-info") {
      setCurrentStep("parent-confirm");
    } else if (currentStep === "parent-confirm") {
      setCurrentStep("student");
    }
  }

  function handleParentChoice(choice: boolean) {
    setIsParentExisting(choice);
    setDuplicateParent(null);
    setShowDuplicateDetails(false);
    setAllowDuplicateCreate(false);
    if (choice) {
      setCurrentStep("parent-search");
    } else {
      clearParentSelection();
      setCurrentStep("parent-info");
    }
  }

  const normalizedParentPhone = (phone?: string) => {
    // Phone is stored as-is, user must include country code
    return phone;
  };

  async function onSubmit(values: RegisterFormValues) {
    if (watchAgeRange !== "Under 18") {
      // Clear parent data for adults
      values.parent = undefined;
      await submitRegistration(values, null);
      return;
    }

    // Existing parent selected via search: link only, skip parent form
    if (useExistingParent && selectedParent) {
      await submitRegistration(values, selectedParent.id);
      return;
    }

    // New parent path: validate parent fields
    const p = values.parent;
    if (!p?.fullName || !p?.email || !p?.phoneNumber || !p?.country || !p?.city || !p?.relationshipWithStudent || !p?.password) {
      toast.error("Please fill in all parent information.");
      return;
    }
    if (p.password !== p.confirmPassword) {
      toast.error("Parent passwords do not match.");
      return;
    }
    if (p.email.trim().toLowerCase() === values.student.email.trim().toLowerCase()) {
      const message = "The parent email must be different from the student's email.";
      form.setError("parent.email", { message });
      toast.error(message);
      return;
    }

    // Automatic duplicate detection by email/phone
    if (!allowDuplicateCreate) {
      setIsLoading(true);
      try {
        const response = await fetch(apiUrl(`/auth/parent-duplicate-check`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: p.email,
            phoneNumber: normalizedParentPhone(p.phoneNumber),
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setDuplicateParent(data.parent);
            setShowDuplicateDetails(false);
            toast.warning("A parent account with this email address or phone number already exists.");
            return;
          }
          if (data.conflict) {
            const message = data.message || "This email cannot be used for a parent account.";
            form.setError("parent.email", { message });
            toast.error(message);
            return;
          }
        }
      } catch (error) {
        console.error("Duplicate check failed", error);
        // Don't block registration on a failed check; backend dedupes anyway.
      } finally {
        setIsLoading(false);
      }
    }

    await submitRegistration(values, null);
  }

  async function submitRegistration(values: RegisterFormValues, parentId: string | null) {
    setIsLoading(true);
    try {
      // Country is stored as plain text, no conversion needed
      const submissionValues = JSON.parse(JSON.stringify(values));

      if (parentId) {
        // Link to existing parent: no parent payload, never create a new account
        submissionValues.parentId = parentId;
        submissionValues.parent = undefined;
      } else if (watchAgeRange === "Under 18" && submissionValues.parent) {
        // Country is stored as plain text, no conversion needed
      } else {
        submissionValues.parent = undefined;
      }

      const response = await fetch(apiUrl(`/auth/register`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionValues),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(data.message || "This email is already registered.");
        } else {
          toast.error(data.message || "Registration failed. Please try again.");
        }
        return;
      }

      if (data.parentStatus && data.parentStatus.toLowerCase().includes("existing parent")) {
        toast.success(data.parentStatus);
      }

      toast.success("Account created successfully!");
      setIsSuccess(true);
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthPageLayout
      title="Join Nejah Online Quran & Islamic Center"
      subtitle="Embark on your journey of Quranic learning. Fill in your information to get started."
      maxWidth="xl"
      showBack={!isSuccess}
    >
      <div className="space-y-8">

        {/* Progress Indicator */}
        {!isSuccess && watchAgeRange === "Under 18" && (
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white">
                {currentStep !== "student" ? <CheckCircle2 className="h-5 w-5" /> : "1"}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === "student" ? "text-nejah-electric" : "text-nejah-slate-blue"
              }`}>
                Student Info
              </span>
            </div>
            <div className={`h-1 w-16 ${currentStep !== "student" ? "bg-primary" : "bg-nejah-surface/50"}`} />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep !== "student" ? "bg-blue-600 text-white" : "bg-nejah-surface/50 text-nejah-slate-blue"
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep !== "student" ? "text-blue-600" : "text-nejah-slate-blue"
              }`}>
                Parent Info
              </span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-4 py-12"
            >
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Registration Successful!</h3>
              <p className="text-nejah-slate-blue">You are being redirected to the login page...</p>
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </motion.div>
          ) : (
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); if (watchAgeRange !== "Under 18" || currentStep === "parent-info" || currentStep === "parent-search") form.handleSubmit(onSubmit)(e); else if (currentStep === "student") handleNext(); }} className="space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === "student" ? (
                    <motion.div
                      key="student"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-t-4 border-t-nejah-electric shadow-lg">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-nejah-electric" />
                            <CardTitle>Student Information</CardTitle>
                          </div>
                          <CardDescription>Details of the student enrolling in our programs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Name & Gender */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control as any}
                              name="student.fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Abdullah Ahmed" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control as any}
                              name="student.gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Age Range */}
                          <FormField
                            control={form.control as any}
                            name="student.ageRange"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age Range *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Age Range" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Under 18">Under 18</SelectItem>
                                    <SelectItem value="18 - 25">18 - 25</SelectItem>
                                    <SelectItem value="Above 25">Above 25</SelectItem>
                                  </SelectContent>
                                </Select>
                                {field.value === "Under 18" && (
                                  <p className="text-sm text-amber-600 mt-1">Parent information will be required in the next step.</p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Location */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control as any}
                              name="student.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                      <CountryInput
                                        value={field.value}
                                        onChange={(val) => { field.onChange(val); }}
                                        className="pl-9"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control as any}
                              name="student.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                      <CityInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="pl-9"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Phone */}
                          <FormField
                            control={form.control as any}
                            name="student.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <div className="relative flex items-center">
                                      <div className="absolute left-3 flex items-center gap-1 text-nejah-slate-blue text-sm">
                                        <Phone className="h-4 w-4" />
                                        +
                                      </div>
                                      <Input 
                                        className="pl-14"
                                        placeholder="123456789 (include country code)" 
                                        {...field} 
                                      />
                                    </div>
                                  </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Quran Program */}
                          <FormField
                            control={form.control as any}
                            name="student.levelOfQuran"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Level of Qira'at / Study Program *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <div className="relative">
                                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                      <SelectTrigger className="pl-9">
                                        <SelectValue placeholder="Select Program" />
                                      </SelectTrigger>
                                    </div>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Qaida Nooraniya">Qaida Nooraniya</SelectItem>
                                    <SelectItem value="Quran Reading">Quran Reading</SelectItem>
                                    <SelectItem value="Hifz Program">Hifz Program</SelectItem>
                                    <SelectItem value="Tajweed Program">Tajweed Program</SelectItem>
                                    <SelectItem value="Hifz Muraja'a">Hifz Muraja'a</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Kitab */}
                          <FormField
                            control={form.control as any}
                            name="student.kitabRequested"
                            render={({ field }) => (
                              <FormItem className="flex flex-col space-y-3 border p-4 rounded-md">
                                <FormLabel>Do you want additional Deen Knowledge (Kitab)?</FormLabel>
                                <Select onValueChange={(v) => field.onChange(v === 'true')} value={field.value ? 'true' : 'false'}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          {watchKitabRequested && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                              <FormField
                                control={form.control as any}
                                name="student.kitabName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Kitab Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Aqeedah, Fiqh, Hadith, Seerah" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}

                          {/* Previous Training */}
                          <FormField
                            control={form.control as any}
                            name="student.previousTraining"
                            render={({ field }) => (
                              <FormItem className="flex flex-col space-y-3 border p-4 rounded-md">
                                <FormLabel>Have you received Quran training before?</FormLabel>
                                <Select onValueChange={(v) => field.onChange(v === 'true')} value={field.value ? 'true' : 'false'}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          {watchPreviousTraining && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                              <FormField
                                control={form.control as any}
                                name="student.trainingDetails"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Training Details *</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="e.g. Local Madrasa, Private Teacher, Online Academy" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}

                          {/* Referral Source */}
                          <FormField
                            control={form.control as any}
                            name="student.referralSource"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>How did you hear about us? *</FormLabel>
                                <Select onValueChange={(val) => { field.onChange(val); if (val !== 'Other') form.setValue('student.referralSource', val); }} defaultValue={field.value === "Other" || !["YouTube","TikTok","Facebook","Instagram","Friend Referral","Google Search"].includes(field.value) && field.value ? "Other" : field.value}>
                                  <FormControl>
                                    <div className="relative">
                                      <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                      <SelectTrigger className="pl-9">
                                        <SelectValue placeholder="Select Source" />
                                      </SelectTrigger>
                                    </div>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="YouTube">YouTube</SelectItem>
                                    <SelectItem value="TikTok">TikTok</SelectItem>
                                    <SelectItem value="Facebook">Facebook</SelectItem>
                                    <SelectItem value="Instagram">Instagram</SelectItem>
                                    <SelectItem value="Friend Referral">Friend Referral</SelectItem>
                                    <SelectItem value="Google Search">Google Search</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {(!["YouTube","TikTok","Facebook","Instagram","Friend Referral","Google Search",""].includes(watchReferralSource) || form.getValues("student.referralSource") === "Other") && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                              <FormField
                                control={form.control as any}
                                name="student.referralSource"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Specify Source *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Please specify" value={field.value && field.value !== "Other" ? field.value : ""} onChange={(e) => field.onChange(e.target.value)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}

                          {/* Account Settings */}
                          <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-medium text-foreground mb-4">Account Credentials</h3>
                            <FormField
                              control={form.control as any}
                              name="student.email"
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Email Address *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Input className="pl-9" placeholder="student@example.com" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control as any}
                                name="student.password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9 pr-9" type={showPassword['student.password'] ? "text" : "password"} {...field} />
                                        <button type="button" onClick={() => togglePassword('student.password')} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                          {showPassword['student.password'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <p className="text-xs text-nejah-slate-blue mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control as any}
                                name="student.confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9 pr-9" type={showPassword['student.confirmPassword'] ? "text" : "password"} {...field} />
                                        <button type="button" onClick={() => togglePassword('student.confirmPassword')} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                          {showPassword['student.confirmPassword'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                        </CardContent>
                      </Card>

                      <div className="flex justify-end pt-6">
                        {watchAgeRange === "Under 18" ? (
                          <Button
                            type="button"
                            onClick={handleNext}
                            className="min-w-[200px] h-12 text-base bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-[1.02]"
                          >
                            Next: Parent Information
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="min-w-[200px] h-12 text-base bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-[1.02]"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Create Account
                                <CheckCircle2 className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ) : currentStep === "parent-confirm" ? (
                    <motion.div
                      key="parent-confirm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-t-4 border-t-blue-600 shadow-lg">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <CardTitle>Parent Information</CardTitle>
                          </div>
                          <CardDescription>
                            Students under 18 must be linked to a parent or guardian account.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 py-8">
                          <p className="text-lg font-medium text-foreground text-center">
                            Has this student's parent already been registered in the system?
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                            <button
                              type="button"
                              onClick={() => handleParentChoice(true)}
                              className={`flex flex-col items-center gap-2 border-2 rounded-xl p-6 text-center transition-all hover:border-nejah-electric hover:bg-primary/10 ${
                                isParentExisting === true ? "border-nejah-electric bg-primary/10" : "border-white/10 bg-background/30"
                              }`}
                            >
                              <Search className="h-8 w-8 text-nejah-electric" />
                              <span className="font-semibold text-foreground">Yes</span>
                              <span className="text-sm text-nejah-slate-blue">
                                Search for the existing parent account and link this student to it.
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleParentChoice(false)}
                              className={`flex flex-col items-center gap-2 border-2 rounded-xl p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50 ${
                                isParentExisting === false ? "border-nejah-electric bg-primary/10" : "border-white/10 bg-background/30"
                              }`}
                            >
                              <Users className="h-8 w-8 text-blue-600" />
                              <span className="font-semibold text-foreground">No</span>
                              <span className="text-sm text-nejah-slate-blue">
                                Register the parent's information and create a new parent account.
                              </span>
                            </button>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="flex justify-start pt-6">
                        <Button
                          type="button"
                          onClick={handleBack}
                          variant="outline"
                          className="min-w-[150px] h-12 text-base"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          Back
                        </Button>
                      </div>
                    </motion.div>
                  ) : currentStep === "parent-search" ? (
                    <motion.div
                      key="parent-search"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-t-4 border-t-nejah-electric shadow-lg">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-nejah-electric" />
                            <CardTitle>Find Existing Parent</CardTitle>
                          </div>
                          <CardDescription>
                            Search by parent name (partial), exact email address, or exact phone number. The student will be linked to the selected parent account.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search by parent name, email, or phone..."
                              value={parentSearchQuery}
                              onChange={(e) => setParentSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  searchParent();
                                }
                              }}
                              className="flex-1"
                              disabled={searchingParent}
                            />
                            <Button
                              type="button"
                              onClick={searchParent}
                              disabled={searchingParent}
                              className="bg-primary hover:bg-primary/90 text-white"
                            >
                              {searchingParent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                              <span className="ml-2">Search</span>
                            </Button>
                          </div>

                          {parentResults.length > 0 && (
                            <div className="border border-border rounded-lg max-h-72 overflow-y-auto bg-white shadow-sm">
                              <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-nejah-slate-blue">Parent Name</th>
                                    <th className="px-3 py-2 text-left font-medium text-nejah-slate-blue">Email</th>
                                    <th className="px-3 py-2 text-left font-medium text-nejah-slate-blue">Phone</th>
                                    <th className="px-3 py-2 text-left font-medium text-nejah-slate-blue">Children</th>
                                    <th className="px-3 py-2 text-right font-medium text-nejah-slate-blue">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {parentResults.map((parent) => (
                                    <tr key={parent.id} className="hover:bg-muted">
                                      <td className="px-3 py-2 font-medium text-foreground">{parent.fullName}</td>
                                      <td className="px-3 py-2 text-nejah-slate-blue">{parent.email}</td>
                                      <td className="px-3 py-2 text-nejah-slate-blue">{parent.phoneNumber || '—'}</td>
                                      <td className="px-3 py-2 text-nejah-slate-blue">
                                        {parent.childrenCount > 0 ? (
                                          <span className="inline-flex items-center gap-1 bg-primary/10 text-nejah-electric px-2 py-0.5 rounded-full text-xs">
                                            <Users className="w-3 h-3" />
                                            {parent.childrenCount} Registered
                                          </span>
                                        ) : (
                                          'No children'
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleSelectParent(parent)}
                                          className="text-nejah-electric border-nejah-electric/30 hover:bg-primary/10"
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-1" />
                                          Select Parent
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {parentSearchPerformed && !searchingParent && parentResults.length === 0 && !selectedParent && (
                            <div className="text-center border border-dashed border-border rounded-lg p-6 space-y-2">
                              <p className="text-sm text-nejah-slate-blue">No matching parent account found.</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleParentChoice(false)}
                              >
                                Register Parent Information Instead
                              </Button>
                            </div>
                          )}

                          {selectedParent && (
                            <div className="flex items-center justify-between bg-primary/10 border border-nejah-electric/20 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-nejah-electric" />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    Selected: {selectedParent.fullName}
                                  </p>
                                  <p className="text-xs text-nejah-electric">
                                    {selectedParent.email}{selectedParent.phoneNumber ? ` • ${selectedParent.phoneNumber}` : ''} • {selectedParent.childrenCount || 0} child(ren) registered
                                  </p>
                                  <p className="text-xs text-nejah-electric mt-1">
                                    The student will be linked to this parent account. No new parent account will be created.
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearParentSelection}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          onClick={handleBack}
                          variant="outline"
                          className="min-w-[150px] h-12 text-base"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="min-w-[200px] h-12 text-base bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-[1.02]"
                          disabled={isLoading || !selectedParent}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="parent-info"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-t-4 border-t-blue-600 shadow-lg">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <CardTitle>Parent Information</CardTitle>
                          </div>
                          <CardDescription>Guardian details for communication. If account exists with this Email/Phone, it will be linked automatically.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <FormField
                            control={form.control as any}
                            name="parent.fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parent Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Omar Ahmed" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control as any}
                            name="parent.relationshipWithStudent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship With Student *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Relationship" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Father">Father</SelectItem>
                                    <SelectItem value="Mother">Mother</SelectItem>
                                    <SelectItem value="Brother">Brother</SelectItem>
                                    <SelectItem value="Sister">Sister</SelectItem>
                                    <SelectItem value="Guardian">Guardian</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control as any}
                              name="parent.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                      <CountryInput
                                        value={field.value}
                                        onChange={(val) => { field.onChange(val); }}
                                        className="pl-9"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control as any}
                              name="parent.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                      <CityInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="pl-9"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control as any}
                            name="parent.phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Phone Number *</FormLabel>
                                  <FormControl>
                                    <div className="relative flex items-center">
                                      <div className="absolute left-3 flex items-center gap-1 text-nejah-slate-blue text-sm">
                                        <Phone className="h-4 w-4" />
                                        +
                                      </div>
                                      <Input 
                                        className="pl-14"
                                        placeholder="123456789 (include country code)" 
                                        {...field} 
                                      />
                                    </div>
                                  </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-medium text-foreground mb-4">Parent Account Credentials</h3>
                            <FormField
                              control={form.control as any}
                              name="parent.email"
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Parent Email *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Input className="pl-9" placeholder="parent@example.com" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control as any}
                                name="parent.password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9 pr-9" type={showPassword['parent.password'] ? "text" : "password"} {...field} />
                                        <button type="button" onClick={() => togglePassword('parent.password')} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                          {showPassword['parent.password'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control as any}
                                name="parent.confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-9 pr-9" type={showPassword['parent.confirmPassword'] ? "text" : "password"} {...field} />
                                        <button type="button" onClick={() => togglePassword('parent.confirmPassword')} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors">
                                          {showPassword['parent.confirmPassword'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </CardContent>

                        {/* Duplicate Detection Warning */}
                        {duplicateParent && (
                          <div className="border-t border-border px-6 py-6">
                            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-2">
                                <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-amber-900">
                                    A parent account with this email address or phone number already exists.
                                  </p>
                                  <p className="text-xs text-amber-700 mt-1">
                                    To avoid duplicate records, we recommend linking this student to the existing parent account.
                                  </p>
                                </div>
                              </div>

                              {showDuplicateDetails && (
                                <div className="bg-white border border-amber-200 rounded-md p-3 text-sm space-y-1">
                                  <p><span className="font-medium text-foreground">Name:</span> {duplicateParent.fullName}</p>
                                  <p><span className="font-medium text-foreground">Email:</span> {duplicateParent.email}</p>
                                  <p><span className="font-medium text-foreground">Phone:</span> {duplicateParent.phoneNumber || '—'}</p>
                                  <p><span className="font-medium text-foreground">Children Registered:</span> {duplicateParent.childrenCount || 0}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowDuplicateDetails((v) => !v)}
                                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                                >
                                  {showDuplicateDetails ? 'Hide Existing Parent' : 'View Existing Parent'}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() => {
                                    handleSelectParent(duplicateParent);
                                    submitRegistration(form.getValues(), duplicateParent.id);
                                  }}
                                  className="bg-primary hover:bg-primary/90 text-white"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Link to Existing Parent
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() => {
                                    setAllowDuplicateCreate(true);
                                    toast.info("Proceeding with new parent details. Matching accounts may still be linked automatically by the administration.");
                                  }}
                                  className="border-border text-foreground hover:bg-muted"
                                >
                                  Create New Parent (Admin Permission Required)
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>

                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          onClick={handleBack}
                          variant="outline"
                          className="min-w-[150px] h-12 text-base"
                        >
                          <ArrowLeft className="mr-2 h-5 w-5" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="min-w-[200px] h-12 text-base bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-[1.02]"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <p className="text-center text-sm text-nejah-slate-blue pt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/login" })}
                    className="font-medium text-nejah-electric hover:text-nejah-electric/80"
                  >
                    Log in here
                  </button>
                </p>
              </form>
            </Form>
          )}
        </AnimatePresence>
      </div>
    </AuthPageLayout>
  );
}
