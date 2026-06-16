import { API_BASE, apiUrl } from "@/lib/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Send, ArrowLeft } from "lucide-react";
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
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl(`/auth/forgot-password`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      toast.success("Instructions sent! Please check your email.");
      setIsSent(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthPageLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a link to reset it."
    >
      {isSent ? (
        <div className="space-y-4 py-4 text-center">
          <div className="rounded-xl border border-nejah-electric/20 bg-primary/10 p-4 text-sm text-foreground">
            Check your inbox at <strong>{form.getValues("email")}</strong> for recovery instructions.
          </div>
          <Button variant="outline" onClick={() => navigate({ to: "/login" })} className="w-full">
            Back to Login
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-[10px] uppercase tracking-widest text-nejah-slate-blue">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="group relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-nejah-slate-blue transition-colors group-focus-within:text-nejah-electric" />
                      <Input className="h-12 pl-10" placeholder="your@email.com" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="h-12 w-full text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="inline-flex items-center text-sm font-medium text-nejah-slate-blue transition-colors hover:text-nejah-electric"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </button>
            </div>
          </form>
        </Form>
      )}
    </AuthPageLayout>
  );
}
