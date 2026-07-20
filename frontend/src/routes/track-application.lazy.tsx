/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Loader2, Search, ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Mail, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE, apiUrl } from "@/lib/api";

const trackSchema = z.object({
  email: z.string().email('Valid email is required'),
  applicationNumber: z.string().min(3, 'Application number is required'),
});

type TrackFormValues = z.infer<typeof trackSchema>;

interface TrackResult {
  status: string;
  applicationNumber: string;
  appliedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-nejah-electric', bg: 'bg-primary/10 border-nejah-electric/20', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  MORE_INFO_REQUIRED: { label: 'More Information Required', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle },
};

export const Route = createLazyFileRoute('/track-application')({
  component: TrackApplicationPage,
});

function TrackApplicationPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const form = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: { email: '', applicationNumber: '' },
  });

  async function onSubmit(values: TrackFormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({
        email: values.email,
        applicationNumber: values.applicationNumber,
      });
      const res = await fetch(apiUrl(`/teacher-applications/track?${params}`));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Application not found');
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || 'Application not found');
    } finally {
      setIsLoading(false);
    }
  }

  const statusInfo = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.PENDING_REVIEW : null;

  return (
    <div className="relative flex min-h-screen flex-col admin-shell-bg">
      <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-70" />
      <header className="glass-panel sticky top-0 z-30 border-b border-border !rounded-none dark:border-white/5">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nejah" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-medium leading-none tracking-tight text-foreground">Nejah</h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-nejah-electric">Online Quran & Islamic Center</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-nejah-electric hover:bg-primary/10"
            onClick={() => navigate({ to: '/login' })}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Login
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-nejah-electric/20 bg-primary/10">
              <Search className="h-7 w-7 text-nejah-electric" />
            </div>
            <h1 className="mb-2 text-2xl font-medium tracking-tight text-foreground">Track Your Application</h1>
            <p className="text-sm text-nejah-slate-blue">Enter your email and application number to check your application status.</p>
          </div>

          <div className="glass-panel relative overflow-hidden rounded-2xl p-6">

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="track-email" className="text-foreground font-medium">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input id="track-email" {...form.register('email')} placeholder="teacher@example.com"
                    className="pl-10 h-11 bg-muted border-border focus:bg-white"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="track-appnum" className="text-foreground font-medium">Application Number</Label>
                <div className="relative mt-1.5">
                  <Hash className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
                  <Input id="track-appnum" {...form.register('applicationNumber')} placeholder="NJH-XXXXXX-XXXXXX"
                    className="pl-10 h-11 bg-muted border-border focus:bg-white"
                  />
                </div>
                {form.formState.errors.applicationNumber && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.applicationNumber.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-primary hover:bg-nejah-azure shadow-md">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...</>
                ) : (
                  <><Search className="h-4 w-4 mr-2" /> Track Application</>
                )}
              </Button>
            </form>

            {/* Result */}
            {result && statusInfo && (
              <div className={`mt-6 p-5 rounded-xl border ${statusInfo.bg} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                  <statusInfo.icon className={`h-6 w-6 ${statusInfo.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Application Status</p>
                    <p className={`font-bold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1.5 mt-3 pt-3 border-t border-current/10">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Application #</span>
                    <span className="font-mono font-medium">{result.applicationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">{new Date(result.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Want to apply?{' '}
              <button onClick={() => navigate({ to: '/apply-as-teacher' })} className="font-bold text-primary hover:text-nejah-sapphire dark:hover:text-nejah-electric">
                Submit an Application
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-primary/100 bg-white/60 py-6">
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Nejah Online Quran & Islamic Center. All rights reserved.</p>
      </footer>
    </div>
  );
}
