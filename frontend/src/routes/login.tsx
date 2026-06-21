import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, Mail, Lock, ArrowLeft, ChevronDown, Eye, EyeOff,
  Shield, ShieldAlert, GraduationCap, User, Users, Zap, LogIn,
} from "lucide-react";
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
import { API_BASE, apiUrl } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { SilverDivider } from "@/components/dashboard/design-system";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

const demoAccounts = [
  { role: 'Super Admin', email: 'nejahsuperadmin@gmail.com', password: 'SuperAdmin123', icon: ShieldAlert, gradient: 'from-purple-600 to-purple-800' },
  { role: 'Admin', email: 'admin@nejah.com', password: 'Admin123', icon: Shield, gradient: 'from-blue-600 to-blue-800' },
  { role: 'Teacher', email: 'teacher@nejah.com', password: 'Teacher123', icon: GraduationCap, gradient: 'from-emerald-600 to-emerald-800' },
  { role: 'Student', email: 'student@nejah.com', password: 'Student123', icon: User, gradient: 'from-amber-600 to-amber-800' },
  { role: 'Parent', email: 'parent@nejah.com', password: 'Parent123', icon: Users, gradient: 'from-rose-600 to-rose-800' },
];

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session_expired') {
      toast.info('Your session expired. Please sign in again.');
    }
    fetch(apiUrl(`/teacher-applications/settings`))
      .then(res => res.json())
      .then(data => setIsApplicationsOpen(data.isApplicationsOpen))
      .catch(() => {});
  }, []);

  const handleQuickLogin = (email: string, password: string, role: string) => {
    setQuickLoginRole(role);
    form.setValue('email', email);
    form.setValue('password', password);
    setTimeout(() => form.handleSubmit(onSubmit)(), 400);
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const loginData = {
        email: values.email.trim(),
        password: values.password.trim(),
      };

      let response: Response;
      try {
        response = await fetch(apiUrl(`/auth/login`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });
      } catch {
        throw new Error(
          "Cannot reach the API server. Start the backend with: npm run dev:backend (from project root).",
        );
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message ||
            (response.status >= 500
              ? "Server error — the API may still be starting or the database is not ready. Wait a minute and try again."
              : "Login failed");
        throw new Error(errorMessage);
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userId", data.user.id);
      if (data.user.studentId) {
        localStorage.setItem("studentId", data.user.studentId);
      } else {
        localStorage.removeItem("studentId");
      }

      toast.success("Welcome back, " + data.user.name + "!");

      const role = data.user.role;
      if (role === "student") {
        window.location.href = "/student_dashboard";
      } else if (role === "teacher") {
        window.location.href = "/teacher_dashboard";
      } else if (role === "parent") {
        window.location.href = "/parent_dashboard";
      } else if (role === "finance_manager") {
        window.location.href = "/finance_dashboard";
      } else if (role === "qirat_manager") {
        window.location.href = "/qirat_dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
      setQuickLoginRole(null);
    }
  }

  return (
    <>
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(60px, -80px) scale(1.1); opacity: 0.5; }
          50% { transform: translate(-40px, 40px) scale(0.9); opacity: 0.2; }
          75% { transform: translate(80px, 60px) scale(1.05); opacity: 0.4; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.3); }
          50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.6); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(52, 211, 153, 0.6)); }
        }
        .animate-fade-slide-up { animation: fadeSlideUp 0.6s ease-out both; }
        .animate-logo-glow { animation: logoGlow 3s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      <AuthPageLayout
              title="Welcome Back"
              subtitle="Online Quran & Islamic Center — Sign in to your account"
              footer={
                <div className="flex justify-center gap-6 text-xs font-medium uppercase tracking-widest text-nejah-slate-blue">
                  <button className="transition-colors hover:text-nejah-electric">Privacy Policy</button>
                  <button className="transition-colors hover:text-nejah-electric">Terms of Service</button>
                  <button className="transition-colors hover:text-nejah-electric">Contact Support</button>
                </div>
              }
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email or Phone</FormLabel>
                        <FormControl>
                          <div className="group relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-nejah-slate-blue transition-colors group-focus-within:text-nejah-electric" />
                            <Input
                              className="h-12 pl-10"
                              placeholder="email@example.com or phone"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Password</FormLabel>
                        <FormControl>
                          <div className="group relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-nejah-slate-blue transition-colors group-focus-within:text-nejah-electric" />
                            <Input
                              className="h-12 pl-10 pr-10"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember" checked={field.value} onCheckedChange={field.onChange} />
                          <label htmlFor="remember" className="cursor-pointer text-sm font-medium text-nejah-slate-blue">
                            Remember me
                          </label>
                        </div>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/forgot-password" })}
                      className="text-sm font-medium text-nejah-electric underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Login
                        <LogIn className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <SilverDivider />

                  <div className="space-y-2 pt-2 text-center">
                    <p className="text-sm text-nejah-slate-blue">
                      New student?{" "}
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/register" })}
                        className="font-semibold text-nejah-electric hover:underline"
                      >
                        Join our Programs
                      </button>
                    </p>
                    {isApplicationsOpen && (
                      <p className="text-sm text-nejah-slate-blue">
                        Are you a teacher?{" "}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/apply-as-teacher" })}
                          className="font-semibold text-nejah-electric hover:underline"
                        >
                          Apply as Teacher
                        </button>
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-nejah-border-blue/30">
                    <details className="group">
                      <summary className="text-xs font-semibold text-nejah-slate-blue hover:text-nejah-electric cursor-pointer list-none flex items-center gap-1 select-none transition-colors">
                        <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                        Demo Accounts
                      </summary>
                      <div className="mt-3 text-xs text-nejah-slate-blue">
                        <div className="grid grid-cols-3 gap-2 font-semibold text-foreground pb-1.5 border-b border-nejah-border-blue/30 mb-1">
                          <span>Role</span>
                          <span>Email</span>
                          <span>Password</span>
                        </div>
                        {demoAccounts.map(({ role, email, password }) => (
                          <div className="grid grid-cols-3 gap-2 py-0.5 hover:bg-nejah-surface/40 rounded px-1 -mx-1 transition-colors" key={role}>
                            <span>{role}</span>
                            <span className="font-mono text-nejah-electric">{email}</span>
                            <span className="font-mono text-amber-600">{password}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </form>
              </Form>
            </AuthPageLayout>
    </>
  );
}
