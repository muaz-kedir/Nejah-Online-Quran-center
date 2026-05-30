import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Users, Mail, MapPin, Lock, ArrowRight, CheckCircle2, ArrowLeft, Phone, BookOpen, Info } from "lucide-react";
import { toast } from "sonner";
import { Country, City } from "country-state-city";

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

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<"student" | "parent">("student");

  const countries = useMemo(() => Country.getAllCountries(), []);

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

  const studentCities = useMemo(() => {
    if (!watchStudentCountry) return [];
    const cities = City.getCitiesOfCountry(watchStudentCountry) || [];
    return Array.from(new Set(cities.map(c => c.name))).map(name => ({ name }));
  }, [watchStudentCountry]);

  const parentCities = useMemo(() => {
    if (!watchParentCountry) return [];
    const cities = City.getCitiesOfCountry(watchParentCountry) || [];
    return Array.from(new Set(cities.map(c => c.name))).map(name => ({ name }));
  }, [watchParentCountry]);

  const studentCountryData = useMemo(() => countries.find(c => c.isoCode === watchStudentCountry), [countries, watchStudentCountry]);
  const parentCountryData = useMemo(() => countries.find(c => c.isoCode === watchParentCountry), [countries, watchParentCountry]);

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
      if (watchAgeRange === "Under 18") {
        setCurrentStep("parent");
      } else {
        // Adult student, submit directly
        onSubmit(form.getValues());
      }
    } else {
      toast.error("Please fill in all required student information correctly");
    }
  }

  function handleBack() {
    setCurrentStep("student");
  }

  async function onSubmit(values: RegisterFormValues) {
    if (watchAgeRange === "Under 18" && currentStep === "student") {
      // Should not happen naturally due to UI buttons, but to be safe
      setCurrentStep("parent");
      return;
    }

    if (watchAgeRange === "Under 18") {
      // Validate parent fields
      const p = values.parent;
      if (!p?.fullName || !p?.email || !p?.phoneNumber || !p?.country || !p?.city || !p?.relationshipWithStudent || !p?.password) {
        toast.error("Please fill in all parent information.");
        return;
      }
      if (p.password !== p.confirmPassword) {
        toast.error("Parent passwords do not match.");
        return;
      }
    } else {
      // Clear parent data for adults
      values.parent = undefined;
    }

    setIsLoading(true);
    try {
      // Append country code to phone before sending if not already added
      const submissionValues = JSON.parse(JSON.stringify(values));
      
      if (studentCountryData && submissionValues.student.phone && !submissionValues.student.phone.startsWith("+")) {
         submissionValues.student.phone = `+${studentCountryData.phonecode}${submissionValues.student.phone}`;
      }
      if (watchAgeRange === "Under 18" && parentCountryData && submissionValues.parent?.phoneNumber && !submissionValues.parent.phoneNumber.startsWith("+")) {
         submissionValues.parent.phoneNumber = `+${parentCountryData.phonecode}${submissionValues.parent.phoneNumber}`;
      }

      // Convert full country names back from isoCode for DB
      if (studentCountryData) submissionValues.student.country = studentCountryData.name;
      if (submissionValues.parent && parentCountryData) submissionValues.parent.country = parentCountryData.name;

      const response = await fetch("http://localhost:3000/api/auth/register", {
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

      if (data.parentStatus && data.parentStatus.includes("Existing parent found")) {
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-auto mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="Nejah Logo" className="object-contain h-full w-full max-w-[120px]" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Join Nejah Online Quran & Islamic Center
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            Embark on your journey of Quranic learning. Fill in your information to get started.
          </p>
        </div>

        {/* Progress Indicator */}
        {!isSuccess && watchAgeRange === "Under 18" && (
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === "student" ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white"
              }`}>
                {currentStep === "parent" ? <CheckCircle2 className="h-5 w-5" /> : "1"}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === "student" ? "text-emerald-600" : "text-gray-500"
              }`}>
                Student Info
              </span>
            </div>
            <div className={`h-1 w-16 ${currentStep === "parent" ? "bg-emerald-600" : "bg-gray-300"}`} />
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === "parent" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === "parent" ? "text-blue-600" : "text-gray-500"
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
              <h3 className="text-2xl font-bold text-gray-900">Registration Successful!</h3>
              <p className="text-gray-600">You are being redirected to the login page...</p>
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </motion.div>
          ) : (
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); if(watchAgeRange !== "Under 18" || currentStep === "parent") form.handleSubmit(onSubmit)(e); else handleNext(); }} className="space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === "student" ? (
                    <motion.div
                      key="student"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-t-4 border-t-emerald-600 shadow-lg">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-emerald-600" />
                            <CardTitle>Student Information</CardTitle>
                          </div>
                          <CardDescription>Details of the student enrolling in our programs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Name & Gender */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
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
                              control={form.control}
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
                            control={form.control}
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
                              control={form.control}
                              name="student.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country *</FormLabel>
                                  <Select onValueChange={(val) => { field.onChange(val); form.setValue("student.city", ""); }} defaultValue={field.value}>
                                    <FormControl>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                        <SelectTrigger className="pl-9">
                                          <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                      </div>
                                    </FormControl>
                                    <SelectContent>
                                      {countries.map((c) => (
                                        <SelectItem key={c.isoCode} value={c.isoCode}>
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="student.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchStudentCountry}>
                                    <FormControl>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                        <SelectTrigger className="pl-9">
                                          <SelectValue placeholder={watchStudentCountry ? "Select City" : "Select Country First"} />
                                        </SelectTrigger>
                                      </div>
                                    </FormControl>
                                    <SelectContent>
                                      {studentCities.map((city, idx) => (
                                        <SelectItem key={`${city.name}-${idx}`} value={city.name}>
                                          {city.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Phone */}
                          <FormField
                            control={form.control}
                            name="student.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <div className="relative flex items-center">
                                    <div className="absolute left-3 flex items-center gap-1 text-gray-500 text-sm">
                                      <Phone className="h-4 w-4" />
                                      {studentCountryData ? `+${studentCountryData.phonecode}` : ""}
                                    </div>
                                    <Input 
                                      className="pl-20"
                                      placeholder="123456789" 
                                      {...field} 
                                      disabled={!watchStudentCountry}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Quran Program */}
                          <FormField
                            control={form.control}
                            name="student.levelOfQuran"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Level of Qira'at / Study Program *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <div className="relative">
                                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
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
                            control={form.control}
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
                                control={form.control}
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
                            control={form.control}
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
                                control={form.control}
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
                            control={form.control}
                            name="student.referralSource"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>How did you hear about us? *</FormLabel>
                                <Select onValueChange={(val) => { field.onChange(val); if (val !== 'Other') form.setValue('student.referralSource', val); }} defaultValue={field.value === "Other" || !["YouTube","TikTok","Facebook","Instagram","Friend Referral","Google Search"].includes(field.value) && field.value ? "Other" : field.value}>
                                  <FormControl>
                                    <div className="relative">
                                      <Info className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
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
                                control={form.control}
                                name="student.referralSource"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Specify Source *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Please specify" value={field.value !== "Other" ? field.value : ""} onChange={(e) => field.onChange(e.target.value || "Other")} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}

                          {/* Account Settings */}
                          <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Credentials</h3>
                            <FormField
                              control={form.control}
                              name="student.email"
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Email Address *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                      <Input className="pl-9" placeholder="student@example.com" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="student.password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input className="pl-9" type="password" {...field} />
                                      </div>
                                    </FormControl>
                                    <p className="text-xs text-gray-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="student.confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input className="pl-9" type="password" {...field} />
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
                            className="min-w-[200px] h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all hover:scale-[1.02]"
                          >
                            Next: Parent Information
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="min-w-[200px] h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all hover:scale-[1.02]"
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
                  ) : (
                    <motion.div
                      key="parent"
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
                            control={form.control}
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
                            control={form.control}
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
                              control={form.control}
                              name="parent.country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country *</FormLabel>
                                  <Select onValueChange={(val) => { field.onChange(val); form.setValue("parent.city", ""); }} defaultValue={field.value}>
                                    <FormControl>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                        <SelectTrigger className="pl-9">
                                          <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                      </div>
                                    </FormControl>
                                    <SelectContent>
                                      {countries.map((c) => (
                                        <SelectItem key={c.isoCode} value={c.isoCode}>
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="parent.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchParentCountry}>
                                    <FormControl>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                                        <SelectTrigger className="pl-9">
                                          <SelectValue placeholder={watchParentCountry ? "Select City" : "Select Country First"} />
                                        </SelectTrigger>
                                      </div>
                                    </FormControl>
                                    <SelectContent>
                                      {parentCities.map((city, idx) => (
                                        <SelectItem key={`${city.name}-${idx}`} value={city.name}>
                                          {city.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="parent.phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Phone Number *</FormLabel>
                                <FormControl>
                                  <div className="relative flex items-center">
                                    <div className="absolute left-3 flex items-center gap-1 text-gray-500 text-sm">
                                      <Phone className="h-4 w-4" />
                                      {parentCountryData ? `+${parentCountryData.phonecode}` : ""}
                                    </div>
                                    <Input 
                                      className="pl-20"
                                      placeholder="123456789" 
                                      {...field} 
                                      disabled={!watchParentCountry}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Parent Account Credentials</h3>
                            <FormField
                              control={form.control}
                              name="parent.email"
                              render={({ field }) => (
                                <FormItem className="mb-4">
                                  <FormLabel>Parent Email *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                      <Input className="pl-9" placeholder="parent@example.com" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="parent.password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input className="pl-9" type="password" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="parent.confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input className="pl-9" type="password" {...field} />
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
                          className="min-w-[200px] h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all hover:scale-[1.02]"
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
                
                <p className="text-center text-sm text-gray-600 pt-4">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/login" })}
                    className="font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Log in here
                  </button>
                </p>
              </form>
            </Form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
