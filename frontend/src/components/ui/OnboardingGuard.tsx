import { ReactNode, useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiUrl, apiHeaders } from "@/lib/api";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "blocked" | "ok" | "error">("loading");
  const [retryCount, setRetryCount] = useState(0);

  const checkStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(apiUrl("/onboarding/status"), {
        headers: apiHeaders(),
      });
      if (!res.ok) {
        if (retryCount < 2) {
          setTimeout(() => setRetryCount((c) => c + 1), 3000);
        } else {
          setStatus("error");
        }
        return;
      }
      const data = await res.json();
      if (data.onboardingCompleted) {
        setStatus("ok");
      } else {
        setStatus("blocked");
        navigate({ to: "/setup-required", replace: true });
      }
    } catch {
      if (retryCount < 2) {
        setTimeout(() => setRetryCount((c) => c + 1), 3000);
      } else {
        setStatus("error");
      }
    }
  }, [navigate, retryCount]);

  useEffect(() => {
    let cancelled = false;
    if (status !== "loading") return;
    const timer = setTimeout(() => {
      if (!cancelled) checkStatus();
    }, retryCount === 0 ? 0 : 3000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [checkStatus, status, retryCount]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Unable to connect</h2>
          <p className="text-sm text-muted-foreground">
            Could not verify your account setup. The server may be temporarily unavailable.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setRetryCount(0); setStatus("loading"); }} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/login", replace: true })}>
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Checking account setup...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
