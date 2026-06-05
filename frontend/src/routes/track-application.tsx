import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
import { API_BASE } from '@/lib/api';

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
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  MORE_INFO_REQUIRED: { label: 'More Information Required', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle },
};

export const Route = createFileRoute('/track-application')({
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
      const res = await fetch(`${API_BASE}/teacher-applications/track?${params}`);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nejah" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-emerald-900 font-serif leading-none">Nejah</h1>
              <p className="text-[10px] text-emerald-600 uppercase tracking-widest">Online Quran & Islamic Center</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
            onClick={() => navigate({ to: '/login' })}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Login
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 font-serif mb-2">Track Your Application</h1>
            <p className="text-gray-500 text-sm">Enter your email and application number to check your application status.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="track-email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input id="track-email" {...form.register('email')} placeholder="teacher@example.com"
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="track-appnum" className="text-gray-700 font-medium">Application Number</Label>
                <div className="relative mt-1.5">
                  <Hash className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input id="track-appnum" {...form.register('applicationNumber')} placeholder="NJH-XXXXXX-XXXXXX"
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                {form.formState.errors.applicationNumber && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.applicationNumber.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 shadow-md">
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
                    <p className="text-xs text-gray-500">Application Status</p>
                    <p className={`font-bold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
                  </div>
                </div>
                <div className="text-sm space-y-1.5 mt-3 pt-3 border-t border-current/10">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Application #</span>
                    <span className="font-mono font-medium">{result.applicationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted</span>
                    <span className="font-medium">{new Date(result.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Want to apply?{' '}
              <button onClick={() => navigate({ to: '/apply-as-teacher' })} className="font-bold text-emerald-700 hover:text-emerald-800">
                Submit an Application
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-emerald-100 bg-white/60 py-6">
        <p className="text-center text-xs text-gray-400">© {new Date().getFullYear()} Nejah Online Quran & Islamic Center. All rights reserved.</p>
      </footer>
    </div>
  );
}
