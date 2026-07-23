import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Send, CheckCircle2, Loader2, AlertCircle, LogOut } from "lucide-react";
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
        Open Telegram and tap the link below (or search for{" "}
        <strong className="text-foreground">@{botUsername}</strong>):
        <div className="mt-2">
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium hover:bg-sky-500/20 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            Open @{botUsername} in Telegram
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </li>
      <li>
        Send this code in the chat:
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
        <p className="text-xs text-muted-foreground mt-1.5">Just paste and send — no need to type any command.</p>
      </li>
      <li>
        Wait for confirmation{" "}
        <span className="animate-pulse text-nejah-electric font-medium">(checking...)</span>
      </li>
    </ol>
  );
}

export function TelegramOnboardingOverlay() {
  const navigate = useNavigate();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [linkedUsername, setLinkedUsername] = useState<string | undefined>(undefined);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [linkInfo, setLinkInfo] = useState<{ code: string; botUsername: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const overlayPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const handleLogout = () => {
    navigate({ to: "/login", replace: true });
    setTimeout(() => {
      localStorage.clear();
      window.dispatchEvent(new Event("auth-changed"));
    }, 0);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLinked(false);
      setConfigured(false);
      return;
    }

    const ctrl = new AbortController();
    const ctrl2 = new AbortController();

    fetchApi<{ configured: boolean }>("/telegram/config", { signal: ctrl2.signal })
      .then((res) => setConfigured(res.configured))
      .catch(() => setConfigured(false));
    fetchApi<TelegramStatus>("/telegram/status", { signal: ctrl.signal })
      .then((res) => setLinked(res.linked))
      .catch(() => setLinked(false));

    return () => {
      ctrl.abort();
      ctrl2.abort();
    };
  }, []);

  useEffect(() => {
    if (linked !== false) return;

    overlayPollRef.current = setInterval(async () => {
      try {
        const s = await fetchApi<TelegramStatus>("/telegram/status");
        if (s.linked) {
          setLinked(true);
          setLinkedUsername(s.username);
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
            clearInterval(pollRef.current!);
            if (overlayPollRef.current) clearInterval(overlayPollRef.current);
            setLinkInfo(null);
            setLinked(true);
            setLinkedUsername(s.username);
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

  if (linked === null || configured === null) {
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

  if (linked && showSuccess) return null;

  if (linked && !showSuccess) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Telegram connected successfully"
      >
        <div className="w-full max-w-md mx-4 bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl border border-border dark:border-nejah-border-blue/30 overflow-hidden animate-fade-in-up">
          <div className="p-8 sm:p-10 space-y-6 text-center">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold font-serif text-foreground">
                Telegram Connected!
              </h2>
              {linkedUsername && (
                <p className="text-sm text-muted-foreground">
                  Linked as <strong className="text-foreground">@{linkedUsername}</strong>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                You will now receive class notifications, meeting links, and important announcements on Telegram.
              </p>
            </div>

            <ul className="text-sm text-foreground space-y-1.5 text-left max-w-xs mx-auto">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Live class notifications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Meeting links
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Class reminders
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                Important announcements
              </li>
            </ul>

            <Button
              onClick={() => setShowSuccess(true)}
              className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-white gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Continue to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (!configured) return null;

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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-11 rounded-xl border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
