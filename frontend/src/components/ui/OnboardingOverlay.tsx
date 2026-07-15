import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { apiUrl, apiHeaders } from "@/lib/api";
import { Bell, Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface OnboardingStatus {
  notificationEnabled: boolean;
  telegramConnected: boolean;
  onboardingCompleted: boolean;
  requireNotifications: boolean;
  requireTelegram: boolean;
}

export function useOnboardingStatus() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/onboarding/status"), { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, refetch: fetchStatus };
}

export function OnboardingOverlay({ children }: { children: ReactNode }) {
  const { status, loading, refetch } = useOnboardingStatus();
  const navigate = useNavigate();
  const { t } = useApp();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status || status.onboardingCompleted) {
    return <>{children}</>;
  }

  const notifDone = !status.requireNotifications || status.notificationEnabled;
  const tgDone = !status.requireTelegram || status.telegramConnected;
  const allDone = notifDone && tgDone;

  if (allDone) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl border border-border/50">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-1">
            {t.setupRequired || "Setup Required"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t.setupRequiredDescription || "Complete the steps below to access your dashboard."}
          </p>
        </div>

        <div className="space-y-4">
          <StepRow
            icon={Bell}
            done={notifDone}
            label={t.enableNotifications || "Enable Browser Notifications"}
            description="Receive real-time updates about classes and announcements."
            actionLabel={notifDone ? "Done" : "Go to Setup"}
            onAction={() => navigate({ to: "/setup-required" })}
          />
          <StepRow
            icon={Send}
            done={tgDone}
            label={t.connectTelegram || "Connect Telegram"}
            description="Get instant notifications on your phone via Telegram."
            actionLabel={tgDone ? "Done" : "Go to Setup"}
            onAction={() => navigate({ to: "/setup-required" })}
          />
        </div>

        {!allDone && (
          <p className="mt-6 text-xs text-center text-muted-foreground/60">
            Both steps must be completed to access the dashboard.
          </p>
        )}
      </div>
    </div>
  );
}

function StepRow({
  icon: Icon,
  done,
  label,
  description,
  actionLabel,
  onAction,
}: {
  icon: any;
  done: boolean;
  label: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        done
          ? "border-green-500/30 bg-green-500/5"
          : "border-border/60 bg-muted/30"
      }`}
    >
      <div
        className={`shrink-0 mt-1 w-8 h-8 rounded-full flex items-center justify-center ${
          done ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary"
        }`}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={done}
        className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          done
            ? "bg-green-500/10 text-green-600 cursor-default"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
