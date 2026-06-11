import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";
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
import { SilverDivider } from "@/components/dashboard/design-system";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/teacher-applications/settings`)
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
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthPageLayout
      title="Welcome Back"
      subtitle="Online Quran & Islamic Center — Sign in to your account"
      footer={
        <div className="flex justify-center gap-6 text-xs font-medium uppercase tracking-widest text-brand-platinum">
          <button className="transition-colors hover:text-brand-electric">Privacy Policy</button>
          <button className="transition-colors hover:text-brand-electric">Terms of Service</button>
          <button className="transition-colors hover:text-brand-electric">Contact Support</button>
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
                <FormLabel className="text-brand-silver">Email or Phone</FormLabel>
                <FormControl>
                  <div className="group relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-platinum transition-colors group-focus-within:text-brand-electric" />
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
                <FormLabel className="text-brand-silver">Password</FormLabel>
                <FormControl>
                  <div className="group relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-platinum transition-colors group-focus-within:text-brand-electric" />
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
                  <Checkbox id="remember" checked={field.value} onCheckedChange={field.onChange} />
                  <label htmlFor="remember" className="cursor-pointer text-sm font-medium text-brand-platinum">
                    Remember me
                  </label>
                </div>
              )}
            />
            <button
              type="button"
              onClick={() => navigate({ to: "/forgot-password" })}
              className="text-sm font-medium text-brand-electric underline-offset-4 hover:underline"
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
            <p className="text-sm text-brand-platinum">
              New student?{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/register" })}
                className="font-semibold text-brand-electric hover:underline"
              >
                Join our Programs
              </button>
            </p>
            {isApplicationsOpen && (
              <p className="text-sm text-brand-platinum">
                Are you a teacher?{" "}
                <button
                  type="button"
                  onClick={() => navigate({ to: "/apply-as-teacher" })}
                  className="font-semibold text-brand-electric hover:underline"
                >
                  Apply as Teacher
                </button>
              </p>
            )}
          </div>
        </form>
      </Form>
    </AuthPageLayout>
  );
}
