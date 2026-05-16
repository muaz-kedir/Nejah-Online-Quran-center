import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Users, Mail, MapPin, GraduationCap, Lock, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

const registerSchema = z.object({
  student: z.object({
    fullName: z.string().min(2, "Full name is required"),
    gender: z.string().min(1, "Gender is required"),
    age: z.coerce.number().min(3, "Minimum age is 3").max(100, "Maximum age is 100"),
    residency: z.string().min(2, "Residency is required"),
    levelOfQuran: z.string().min(1, "Quran level is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
  parent: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    residency: z.string().min(2, "Residency is required"),
    relationshipWithStudent: z.string().min(1, "Relationship is required"),
  }),
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      student: {
        fullName: "",
        gender: "",
        age: 0,
        residency: "",
        levelOfQuran: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      parent: {
        fullName: "",
        email: "",
        residency: "",
        relationshipWithStudent: "",
      },
    },
  });

  async function handleNext() {
    // Validate student fields before moving to parent step
    const studentFields = [
      "student.fullName",
      "student.gender",
      "student.age",
      "student.residency",
      "student.levelOfQuran",
      "student.email",
      "student.password",
      "student.confirmPassword",
    ] as const;

    const isValid = await form.trigger(studentFields);
    
    if (isValid) {
      setCurrentStep("parent");
    } else {
      toast.error("Please fill in all student information correctly");
    }
  }

  function handleBack() {
    setCurrentStep("student");
  }

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (data.parentStatus.includes("Existing parent found")) {
        toast.success(data.parentStatus);
      }

      toast.success("Account created successfully!");
      setIsSuccess(true);
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Nejah Logo"
            className="mx-auto h-20 w-auto mb-4"
          />
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Join Nejah Online Quran & Islamic Center
          </h2>
          <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            Embark on your journey of Quranic learning. Please fill in both student and parent information to create your account.
          </p>
        </div>

        {/* Progress Indicator */}
        {!isSuccess && (
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="student.fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Abdullah Ahmed" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="student.gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="student.age"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="10" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="student.residency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Residency</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input className="pl-9" placeholder="City, Country" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="student.levelOfQuran"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Level of Quran / Education</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="hifz">Hifz</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="student.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Student Email</FormLabel>
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
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="student.password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
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
                              name="student.confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm Password</FormLabel>
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
                        </CardContent>
                      </Card>

                      <div className="flex justify-end pt-6">
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="min-w-[200px] h-12 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all hover:scale-[1.02]"
                        >
                          Next: Parent Information
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
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
                          <CardDescription>Guardian details for communication and progress tracking.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="parent.fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parent Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Omar Ahmed" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="parent.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parent Email</FormLabel>
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
                          <FormField
                            control={form.control}
                            name="parent.residency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parent Residency</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input className="pl-9" placeholder="City, Country" {...field} />
                                  </div>
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
                                <FormLabel>Relationship With Student</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Relationship" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="father">Father</SelectItem>
                                    <SelectItem value="mother">Mother</SelectItem>
                                    <SelectItem value="brother">Brother</SelectItem>
                                    <SelectItem value="sister">Sister</SelectItem>
                                    <SelectItem value="uncle">Uncle</SelectItem>
                                    <SelectItem value="aunt">Aunt</SelectItem>
                                    <SelectItem value="guardian">Guardian</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="pt-4 bg-slate-50 p-4 rounded-lg text-xs text-gray-500 border border-slate-200">
                            <p className="font-semibold mb-1">Parent Login Information:</p>
                            <p>Parents can log in with their email. A temporary password will be assigned, which can be reset later.</p>
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
