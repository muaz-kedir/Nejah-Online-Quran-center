import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, Mail, Lock, ArrowLeft, ChevronDown, Eye, EyeOff,
  Shield, ShieldAlert, GraduationCap, User, Users, Zap,
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
import { API_BASE } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
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
    fetch(`${API_BASE}/teacher-applications/settings`)
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
        response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData),
        });
      } catch {
        throw new Error(
          "Cannot reach the API server. Start the backend with: npm run dev:backend (from project root).",
        );
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Login failed";
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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)', animation: 'orbFloat 25s ease-in-out infinite' }} />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)', animation: 'orbFloat 30s ease-in-out infinite reverse', animationDelay: '-7s' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)', animation: 'orbFloat 20s ease-in-out infinite', animationDelay: '-14s' }} />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-[350px] h-[350px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', animation: 'orbFloat 35s ease-in-out infinite reverse', animationDelay: '-21s' }} />
        </div>

        {/* Subtle Grid Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-slide-up">
          {/* Glassmorphism Card */}
          <div className="bg-white/80 backdrop-blur-xl px-8 pt-10 pb-12 shadow-2xl shadow-emerald-900/20 rounded-2xl border border-white/20 relative overflow-hidden">
            {/* Animated Glowing Top Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400"
                 style={{ animation: 'glowPulse 3s ease-in-out infinite' }} />

            {/* Back to home */}
            <button
              onClick={() => navigate({ to: "/" })}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/40 hover:bg-white/60 backdrop-blur-sm transition-all text-gray-400 hover:text-emerald-700 border border-white/30"
              title="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <div className="animate-logo-glow inline-block">
                <img
                  src="/logo.png"
                  alt="Nejah Logo"
                  className="mx-auto h-16 w-auto mb-2"
                />
              </div>
              <h2 className="text-3xl font-serif font-bold bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Nejah
              </h2>
              <p className="text-sm text-gray-400 font-medium tracking-wide">Online Quran & Islamic Center</p>
            </div>

            {/* Quick Login - One-Click Role Access */}
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2.5 font-semibold">Quick Access</p>
              <div className="flex flex-wrap gap-1.5">
                {demoAccounts.map(acc => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickLogin(acc.email, acc.password, acc.role)}
                      disabled={isLoading}
                      className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white transition-all duration-300 bg-gradient-to-r ${acc.gradient} hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                        quickLoginRole === acc.role ? 'ring-2 ring-white/60 scale-105' : ''
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{acc.role}</span>
                      {quickLoginRole === acc.role && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

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
                      className="h-12 pl-10"
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
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
                  <Checkbox id="remember" checked={field.value} onCheckedChange={field.onChange}
                    className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none text-gray-500 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
              )}
            />
            <button
              type="button"
              onClick={() => navigate({ to: "/forgot-password" })}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-600 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="relative w-full h-12 text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/40 transition-all duration-300 active:scale-[0.98] border-0 overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]" />
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Login
              </>
            )}
          </Button>

          <div className="text-center pt-3 space-y-2">
            <p className="text-sm text-gray-500">
              New student?{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/register" })}
                className="font-bold text-emerald-700 hover:text-emerald-600 transition-colors"
              >
                Join our Programs
              </button>
            </p>
            {isApplicationsOpen && (
              <p className="text-sm text-gray-500">
                Are you a teacher?{" "}
                <button
                  type="button"
                  onClick={() => navigate({ to: "/apply-as-teacher" })}
                  className="font-bold text-emerald-700 hover:text-emerald-600 transition-colors"
                >
                  Apply as Teacher
                </button>
              </p>
            )}
          </div>

          {/* Demo Accounts */}
          <div className="pt-4 border-t border-slate-200/60">
            <details className="group">
              <summary className="text-xs font-semibold text-gray-400 hover:text-emerald-700 cursor-pointer list-none flex items-center gap-1 select-none transition-colors">
                <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                Demo Accounts
              </summary>
              <div className="mt-3 text-xs text-gray-500">
                <div className="grid grid-cols-3 gap-2 font-semibold text-gray-600 pb-1.5 border-b border-slate-200/60 mb-1">
                  <span>Role</span>
                  <span>Email</span>
                  <span>Password</span>
                </div>
                {demoAccounts.map(({ role, email, password }) => (
                  <div className="grid grid-cols-3 gap-2 py-0.5 hover:bg-white/40 rounded px-1 -mx-1 transition-colors" key={role}>
                    <span>{role}</span>
                    <span className="font-mono text-emerald-700">{email}</span>
                    <span className="font-mono text-amber-700">{password}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
              </form>
            </Form>
    </AuthPageLayout>
      </div>
    </>
  );
}
