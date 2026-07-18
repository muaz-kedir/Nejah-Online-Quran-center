/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
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
import { apiUrl, api } from "@/lib/api";
import { ROLE_DASHBOARDS } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { SilverDivider } from "@/components/dashboard/design-system";

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "session_expired") {
      toast.info("Your session expired. Please sign in again.");
    }
    api<{ isApplicationsOpen: boolean }>("/teacher-applications/settings")
      .then((data) => setIsApplicationsOpen(data.isApplicationsOpen))
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
      let response: Response;
      try {
        response = await fetch(apiUrl("/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email.trim(),
            password: values.password.trim(),
          }),
        });
      } catch {
        throw new Error(
          "Cannot reach the API server. Start the backend with: npm run dev:backend (from project root).",
        );
      }

      const data: LoginResponse = await response.json().catch(() => ({}) as LoginResponse);

      if (!response.ok) {
        const d = data as Record<string, unknown>;
        const errorMessage = Array.isArray(d.message)
          ? (d.message as string[]).join(", ")
          : (d.message as string) ||
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
      window.dispatchEvent(new Event("auth-changed"));
      if (data.user.studentId) {
        localStorage.setItem("studentId", data.user.studentId);
      } else {
        localStorage.removeItem("studentId");
      }

      const role = data.user.role;
      setIsLoading(false);
      redirectToDashboard(role);

      // Push notification setup — non-blocking, runs after navigation
      if ("PushManager" in window && "serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
        import("@/lib/push-notifications").then((m) =>
          m.subscribeToPushNotifications().catch(() => {}),
        );
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Invalid credentials. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function redirectToDashboard(role: string) {
    const target = ROLE_DASHBOARDS[role] || "/dashboard";
    navigate({ to: target, replace: true });
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
            <button className="transition-colors hover:text-nejah-electric cursor-pointer">Privacy Policy</button>
            <button className="transition-colors hover:text-nejah-electric cursor-pointer">
              Terms of Service
            </button>
            <button className="transition-colors hover:text-nejah-electric cursor-pointer">Contact Support</button>
          </div>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }
