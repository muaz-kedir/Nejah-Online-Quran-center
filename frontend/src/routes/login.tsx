import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, Mail, Lock, Eye, EyeOff, LogIn, Bell,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const dialogCloseIntentional = useRef(false);

  const redirectToDashboard = useCallback((role: string) => {
    const map: Record<string, string> = {
      student: "/student_dashboard",
      teacher: "/teacher_dashboard",
      parent: "/parent_dashboard",
      finance_manager: "/finance_dashboard",
      qirat_manager: "/qirat_dashboard",
    };
    window.location.href = map[role] || "/dashboard";
  }, []);

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
      const hasPush = "PushManager" in window && "serviceWorker" in navigator;
      const notificationGranted = "Notification" in window && Notification.permission === "granted";

      if (hasPush && !notificationGranted) {
        setPendingRole(role);
        setShowNotificationPrompt(true);
        setIsLoading(false);
        return;
      }

      if (hasPush && notificationGranted) {
        await import("@/lib/push-notifications").then((m) =>
          m.subscribeToPushNotifications().catch(() => {}),
        );
      }

      redirectToDashboard(role);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
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

                  <SilverDivider />
                </form>
              </Form>
            </AuthPageLayout>

      {/* Notification Permission Prompt Dialog */}
      <Dialog open={showNotificationPrompt} onOpenChange={(open) => {
        if (!open && pendingRole && !dialogCloseIntentional.current) {
          setShowNotificationPrompt(false);
          redirectToDashboard(pendingRole);
        }
        dialogCloseIntentional.current = false;
      }}>
        <DialogContent className="rounded-3xl max-w-sm" aria-describedby="notification-description">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <Bell className="h-7 w-7 text-nejah-electric" />
            </div>
            <DialogTitle className="text-center text-xl font-serif font-bold">
              Stay Updated
            </DialogTitle>
            <DialogDescription id="notification-description" className="text-center">
              Get instant push notifications for class sessions, homework, and important updates.
              Would you like to enable notifications?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full gap-2 h-12 rounded-xl font-bold"
              onClick={async () => {
                dialogCloseIntentional.current = true;
                setShowNotificationPrompt(false);
                const { subscribeToPushNotifications } = await import("@/lib/push-notifications");
                const ok = await subscribeToPushNotifications();
                if (pendingRole) redirectToDashboard(pendingRole);
              }}
            >
              <Bell className="h-5 w-5" />
              Yes, Enable Notifications
            </Button>
            <Button
              variant="ghost"
              className="w-full h-11 rounded-xl text-muted-foreground"
              onClick={() => {
                dialogCloseIntentional.current = true;
                setShowNotificationPrompt(false);
                if (pendingRole) redirectToDashboard(pendingRole);
              }}
            >
              Not now
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-1">
            You can always change this later in your profile settings.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
