import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiUrl, apiHeaders } from "@/lib/api";

export function useOnboardingGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/onboarding/status"), {
          headers: apiHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.onboardingCompleted && !cancelled) {
          navigate({ to: "/setup-required", replace: true });
        }
      } catch {
        // network error — let them stay and retry
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);
}
