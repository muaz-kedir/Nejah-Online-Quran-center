import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiUrl, apiHeaders } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "blocked" | "ok">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/onboarding/status"), {
          headers: apiHeaders(),
        });
        if (cancelled) return;
        if (!res.ok) {
          // API error — block access so the user doesn't see an unprotected dashboard
          setStatus("blocked");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.onboardingCompleted) {
          setStatus("ok");
        } else {
          setStatus("blocked");
          navigate({ to: "/setup-required", replace: true });
        }
      } catch {
        if (!cancelled) {
          setStatus("blocked");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
