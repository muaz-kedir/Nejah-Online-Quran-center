import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, XCircle, Loader2, Copy, ExternalLink, AlertCircle } from "lucide-react";
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

export function TelegramLink() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [linkInfo, setLinkInfo] = useState<{ code: string; botUsername: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const forceStop = setTimeout(() => { ctrl.abort(); setLoading(false); }, 3000);

    fetchApi<TelegramStatus>("/telegram/status", { signal: ctrl.signal })
      .then((res) => { setStatus(res); if (res.linked) setLinkInfo(null); })
      .catch(() => {})
      .finally(() => { clearTimeout(forceStop); setLoading(false); });

    return () => { ctrl.abort(); clearTimeout(forceStop); if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleLink = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetchApi<{ code: string; botUsername: string }>("/telegram/generate-link", { method: "POST" });
      if (!res.botUsername) {
        setError("Telegram bot is not configured. Ask the admin to set TELEGRAM_BOT_TOKEN in the backend .env file.");
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
          if (s.linked) { setStatus(s); setLinkInfo(null); clearInterval(pollRef.current!); }
        } catch {}
      }, 3000);
    } catch (err: any) {
      setError(err?.message || "Could not generate link. Make sure the backend has TELEGRAM_BOT_TOKEN configured.");
    } finally {
      setGenerating(false);
    }
  };

  const handleUnlink = async () => {
    try {
      await fetchApi("/telegram/unlink", { method: "DELETE" });
      setStatus({ linked: false });
    } catch { setError("Failed to unlink Telegram"); }
  };

  const copyCode = () => {
    if (linkInfo) { navigator.clipboard.writeText(linkInfo.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-sky-500" />
        <span className="text-sm font-medium">Telegram Notifications</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : status?.linked ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <span className="text-sm">Connected{status.username ? ` (@${status.username})` : ""}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleUnlink}>
            <XCircle className="h-3.5 w-3.5" /> Disconnect
          </Button>
        </div>
      ) : linkInfo ? (
        <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
          <p className="text-sm font-medium">Link your Telegram</p>
          <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Open Telegram via{" "}
              <a
                href={`https://t.me/${linkInfo.botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 font-medium hover:underline"
              >
                @{linkInfo.botUsername}
              </a>
            </li>
            <li>
              Send this code:
              <div className="flex items-center gap-2 mt-1">
                <code className="px-3 py-1.5 rounded bg-foreground/10 font-mono text-sm font-bold tracking-wider">{linkInfo.code}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Just paste and send — no command needed.</p>
            </li>
            <li>Wait for confirmation <span className="animate-pulse">(checking...)</span></li>
          </ol>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Get Telegram notifications when a class session starts. Works even when the app is closed.</p>
          <Button variant="outline" size="sm" className="w-fit gap-2" onClick={handleLink} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            {generating ? "Generating..." : "Link Telegram"}
          </Button>
        </div>
      )}
    </div>
  );
}
