import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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
      // Only send email and password (remove rememberMe)
      const loginData = {
        email: values.email.trim(),
        password: values.password.trim(),
      };

      console.log("Sending Login Request:", loginData);
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Login Error Details:", data);
        const errorMessage = Array.isArray(data.message) 
          ? data.message.join(", ") 
          : data.message || "Login failed";
        throw new Error(errorMessage);
      }

      // Store authentication data
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userId", data.user.id);

      toast.success("Welcome back, " + data.user.name + "!");
      
      // Redirect based on role
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[url('/bg-pattern.png')] bg-repeat bg-fixed">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-8 pt-10 pb-12 shadow-2xl rounded-2xl border border-slate-100 relative overflow-hidden">
          {/* Top border accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-700"></div>
          
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="Nejah Logo"
              className="mx-auto h-20 w-auto mb-2"
            />
            <h2 className="text-3xl font-serif font-bold text-emerald-900">Nejah</h2>
            <p className="text-sm text-gray-500 font-medium">Online Quran & Islamic Center</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input 
                          className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                          placeholder="name@example.com" 
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
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input 
                          className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
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
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600 cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>
                  )}
                />
                <button
                  type="button"
                  onClick={() => navigate({ to: "/forgot-password" })}
                  className="text-sm font-bold text-emerald-800 hover:text-emerald-700 underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-emerald-800 hover:bg-emerald-900 shadow-md transition-all active:scale-95"
                disabled={isLoading}
              >
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

              <div className="text-center pt-4 border-t border-slate-100">
                <p className="text-sm text-gray-600">
                  New student?{" "}
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/register" })}
                    className="font-bold text-emerald-800 hover:text-emerald-700"
                  >
                    Join our Programs
                  </button>
                </p>
              </div>
            </form>
          </Form>
        </div>

        <div className="mt-8 flex justify-center space-x-8 text-xs text-gray-400 font-medium">
          <button className="hover:text-emerald-800 uppercase tracking-widest transition-colors">Privacy Policy</button>
          <button className="hover:text-emerald-800 uppercase tracking-widest transition-colors">Terms of Service</button>
          <button className="hover:text-emerald-800 uppercase tracking-widest transition-colors">Contact Support</button>
        </div>
      </div>
    </div>
  );
}
