import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl, apiHeaders } from "@/lib/api";

interface TelegramStatus {
  linked: boolean;
  username?: string;
}

function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  return fetch(apiUrl(path), {
    ...options,
    headers: { ...apiHeaders(), ...options?.headers },
  }).then((r) => {
    if (!r.ok) throw new Error("API error: " + r.status);
    return r.json();
  });
}

function LinkingSteps({ botUsername, code }: { botUsername: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
      <li>
        Open Telegram and search for{" "}
        <strong className="text-foreground">@{botUsername}</strong>
      </li>
      <li>
        Send this code:
        <div className="flex items-center gap-2 mt-2">
          <code className="px-4 py-2 rounded-lg bg-foreground/10 font-mono text-base font-bold tracking-wider text-foreground">
            {code}
          </code>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode}>
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </Button>
        </div>
      </li>
      <li>
        Wait for confirmation{" "}
        <span className="animate-pulse text-nejah-electric font-medium">(checking...)</span>
      </li>
    </ol>
  );
}

export function TelegramOnboardingOverlay() {
  const [linked, setLinked] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [linkInfo, setLinkInfo] = useState<{ code: string; botUsername: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const overlayPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLinked(false);
      return;
    }

    const ctrl = new AbortController();
    fetchApi<TelegramStatus>("/telegram/status", { signal: ctrl.signal })
      .then((res) => setLinked(res.linked))
      .catch(() => setLinked(false));

    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (linked !== false) return;

    overlayPollRef.current = setInterval(async () => {
      try {
        const s = await fetchApi<TelegramStatus>("/telegram/status");
        if (s.linked) {
          setLinked(true);
          if (overlayPollRef.current) clearInterval(overlayPollRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* ignore */
      }
    }, 5000);

    return () => {
      if (overlayPollRef.current) clearInterval(overlayPollRef.current);
    };
  }, [linked]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (overlayPollRef.current) clearInterval(overlayPollRef.current);
    };
  }, []);

  const handleLink = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetchApi<{ code: string; botUsername: string }>("/telegram/generate-link", {
        method: "POST",
      });
      if (!res.botUsername) {
        setError(
          "Telegram bot is not configured. Please contact the administrator.",
        );
        return;
      }
      setLinkInfo(res);

      let pollCount = 0;
      pollRef.current = setInterval(async () => {
        pollCount++;
        if (pollCount > 100) {
          clearInterval(pollRef.current!);
          setLinkInfo(null);
          setError("Link confirmation timed out. Please try again.");
          return;
        }
        try {
          const s = await fetchApi<TelegramStatus>("/telegram/status");
          if (s.linked) {
            setLinked(true);
            setLinkInfo(null);
            clearInterval(pollRef.current!);
          }
        } catch {
          /* ignore */
        }
      }, 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate link. Please try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  if (linked === null) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label="Checking Telegram status"
      >
        <Loader2 className="h-8 w-8 animate-spin text-nejah-electric" />
      </div>
    );
  }

  if (linked) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Telegram account setup required"
      onKeyDown={(e) => {
        if (e.key === "Escape") e.preventDefault();
      }}
    >
      <div className="w-full max-w-md mx-4 bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl border border-border dark:border-nejah-border-blue/30 overflow-hidden animate-fade-in-up">
        <div className="p-8 sm:p-10 space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500/20 to-primary/30 flex items-center justify-center">
              <Send className="h-8 w-8 text-sky-500" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold font-serif text-foreground">
              Welcome to Nejah Online School
            </h2>
            <p className="text-sm text-muted-foreground">
              To continue using your student dashboard, you must connect your
              Telegram account.
            </p>
          </div>

          <div className="rounded-2xl bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Telegram will be used for
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                Live class notifications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                Meeting links
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                Class reminders
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                Important announcements
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-500 shrink-0" />
                Future academic notifications
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your Telegram account only needs to be connected once.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {linkInfo ? (
            <LinkingSteps botUsername={linkInfo.botUsername} code={linkInfo.code} />
          ) : (
            <Button
              onClick={handleLink}
              disabled={generating}
              className="w-full h-12 rounded-xl bg-nejah-sapphire hover:bg-nejah-surface font-bold text-white gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {generating ? "Generating..." : "Connect Telegram"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
