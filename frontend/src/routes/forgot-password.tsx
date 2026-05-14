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

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      toast.success("Instructions sent! Please check your email.");
      setIsSent(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-8">
          <img
            src="/logo.png"
            alt="Nejah Logo"
            className="h-12 w-auto"
          />
          <span className="ml-2 text-2xl font-bold text-emerald-900 align-middle">Nejah</span>
        </div>

        <div className="bg-white p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)] rounded-2xl border border-slate-50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-emerald-900 mb-2">Forgot your password?</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Enter your email address below and we'll send you a link to reset it.
            </p>
          </div>

          {isSent ? (
            <div className="text-center py-6 space-y-4">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-100">
                Check your inbox at <strong>{form.getValues("email")}</strong> for recovery instructions.
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate({ to: "/login" })}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                          <Input 
                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl" 
                            placeholder="your@email.com" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 text-lg bg-emerald-800 hover:bg-emerald-900 shadow-lg rounded-xl transition-all active:scale-95"
                  disabled={isLoading}
                >
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

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/login" })}
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-emerald-800 transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </button>
                </div>
              </form>
            </Form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="italic text-gray-400 text-xs serif">"And seek help through patience and prayer..."</p>
        </div>
      </div>

      <div className="mt-auto sm:mx-auto sm:w-full sm:max-w-4xl pt-12 pb-8 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <div>
            <span className="font-bold text-emerald-900 text-sm block md:inline mb-2 md:mb-0 md:mr-4">Nejah</span>
            © 2024 Nejah Online Quran & Islamic Center. All rights reserved.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button className="hover:text-emerald-800 transition-colors">Privacy Policy</button>
            <button className="hover:text-emerald-800 transition-colors">Terms of Service</button>
            <button className="hover:text-emerald-800 transition-colors">Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}
