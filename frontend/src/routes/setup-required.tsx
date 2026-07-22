import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Circle, Bell, Send, Loader2, ExternalLink, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface OnboardingStatus {
  notificationEnabled: boolean;
  telegramConnected: boolean;
  onboardingCompleted: boolean;
  requireNotifications: boolean;
  requireTelegram: boolean;
}

export const Route = createFileRoute('/setup-required')({
  component: SetupRequiredPage,
});

function SetupRequiredPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enablingNotif, setEnablingNotif] = useState(false);
  const [linkInfo, setLinkInfo] = useState<{ code: string; botUsername: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await api<OnboardingStatus>('/onboarding/status');
      setStatus(data);
      if (data.onboardingCompleted) {
        const role = localStorage.getItem('userRole');
        const dashboards: Record<string, string> = {
          student: '/student_dashboard',
          parent: '/parent_dashboard',
          teacher: '/teacher_dashboard',
          super_admin: '/dashboard',
          finance_manager: '/finance_dashboard',
          qirat_manager: '/qirat_dashboard',
        };
        setTimeout(() => navigate({ to: dashboards[role || ''] || '/login' }), 1500);
      }
    } catch {
      toast.error('Failed to load setup status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate({ to: '/login' });
      return;
    }
    fetchStatus();
  }, []);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    setEnablingNotif(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const result = await api<OnboardingStatus>('/onboarding/notifications/enable', { method: 'POST' });
        setStatus(result);
        toast.success('Notifications enabled!');
      } else {
        toast.error('Please allow notifications to continue');
      }
    } catch {
      toast.error('Failed to enable notifications');
    } finally {
      setEnablingNotif(false);
    }
  };

  const handleLinkTelegram = async () => {
    setGenerating(true);
    setTgError(null);
    try {
      const res = await api<{ code: string; botUsername: string }>('/telegram/generate-link', { method: 'POST' });
      if (!res.botUsername) {
        setTgError('Telegram bot is not configured. Ask the admin to set TELEGRAM_BOT_TOKEN.');
        return;
      }
      setLinkInfo(res);
      pollTelegramStatus();
    } catch (err: any) {
      setTgError(err?.message || 'Could not generate link');
    } finally {
      setGenerating(false);
    }
  };

  const pollTelegramStatus = () => {
    let pollCount = 0;
    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > 100) {
        clearInterval(interval);
        setLinkInfo(null);
        setTgError('Link confirmation timed out. Please try again.');
        return;
      }
      try {
        const result = await api<OnboardingStatus>('/onboarding/status');
        setStatus(result);
        if (result.telegramConnected) {
          clearInterval(interval);
          setLinkInfo(null);
          toast.success('Telegram connected!');
          if (result.onboardingCompleted) {
            navigateToDashboard();
          }
        }
      } catch {}
    }, 3000);
  };

  const navigateToDashboard = () => {
    const role = localStorage.getItem('userRole');
    const dashboards: Record<string, string> = {
      student: '/student_dashboard',
      parent: '/parent_dashboard',
      teacher: '/teacher_dashboard',
      super_admin: '/dashboard',
      finance_manager: '/finance_dashboard',
      qirat_manager: '/qirat_dashboard',
    };
    setTimeout(() => navigate({ to: dashboards[role || ''] || '/login' }), 1500);
  };

  const copyCode = () => {
    if (linkInfo) {
      navigator.clipboard.writeText(linkInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nejah-surface to-nejah-azure/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status?.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nejah-surface to-nejah-azure/5">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Setup Complete!</h1>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const notifDone = status ? (status.notificationEnabled || !status.requireNotifications) : false;
  const tgDone = status ? (status.telegramConnected || !status.requireTelegram) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-nejah-surface to-nejah-azure/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Account Setup</h1>
          <p className="text-muted-foreground">
            Before accessing your dashboard, please complete the following required steps.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            {notifDone ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
            )}
            <span className={`font-medium ${notifDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
              Enable Notifications
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            {tgDone ? (
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
            )}
            <span className={`font-medium ${tgDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
              Connect Telegram
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          {!notifDone ? (
            <>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Enable Notifications</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow notifications to receive class reminders, homework alerts, attendance updates,
                teacher messages, payment notifications, and important announcements.
              </p>
              <Button onClick={handleEnableNotifications} disabled={enablingNotif} className="w-full">
                {enablingNotif ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {enablingNotif ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            </>
          ) : !tgDone ? (
            <>
              <div className="flex items-center gap-3">
                <Send className="h-6 w-6 text-sky-500" />
                <h2 className="text-lg font-bold text-foreground">Connect Telegram</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your Telegram account to receive class links, reminders, homework notifications,
                attendance alerts, announcements, and teacher messages.
              </p>

              {tgError && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-sm text-amber-800 dark:text-amber-300">{tgError}</p>
                </div>
              )}

              {linkInfo ? (
                <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                  <p className="text-sm font-medium">Link your Telegram</p>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>
                      Open Telegram and search for{' '}
                      <strong className="text-foreground">@{linkInfo.botUsername}</strong>
                    </li>
                    <li>
                      Send this code:
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-3 py-1.5 rounded bg-foreground/10 font-mono text-sm font-bold tracking-wider">
                          {linkInfo.code}
                        </code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
                          {copied ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </li>
                    <li>Wait for confirmation <span className="animate-pulse">(checking...)</span></li>
                  </ol>
                </div>
              ) : (
                <Button onClick={handleLinkTelegram} disabled={generating} variant="outline" className="w-full gap-2">
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {generating ? 'Generating...' : 'Connect Telegram'}
                </Button>
              )}
            </>
          ) : null}
        </div>

        {notifDone && tgDone && !status?.onboardingCompleted && (
          <div className="text-center">
            <Button onClick={fetchStatus} className="gap-2">
              Complete Setup <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
