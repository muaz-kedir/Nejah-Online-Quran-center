import { useState, useEffect, useCallback } from "react";
import { Download, X, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "sonner";

export default function PWADownloadPrompt() {
  const {
    canInstall,
    isInstalled,
    install,
    pushSupported,
    pushSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pwaPromptDismissed") === "true";
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
  }, []);

  const doDismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem("pwaPromptDismissed", "true"); } catch {}
  }, []);

  const handleInstall = useCallback(async () => {
    const success = await install();
    if (success) {
      toast.success("App installed successfully!");
      if (pushSupported) {
        const subbed = await subscribeToPush();
        if (subbed) {
          toast.success("Push notifications enabled!");
        }
      }
    }
    doDismiss();
  }, [install, pushSupported, subscribeToPush, doDismiss]);

  const handleTogglePush = useCallback(async () => {
    if (pushSubscribed) {
      await unsubscribeFromPush();
      toast.success("Push notifications disabled");
      doDismiss();
    } else {
      const success = await subscribeToPush();
      if (success) {
        toast.success("Push notifications enabled!");
        doDismiss();
      } else {
        toast.error("Failed to enable push notifications. Check permissions.");
      }
    }
  }, [pushSubscribed, subscribeToPush, unsubscribeFromPush, doDismiss]);

  if (dismissed) return null;
  if (!isMobile && !canInstall && isInstalled) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-xs">
      {canInstall && (
        <div className="bg-card dark:bg-nejah-surface border border-border dark:border-white/5 rounded-2xl shadow-2xl p-4 backdrop-blur-md">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-nejah-electric" />
              <span className="text-sm font-bold font-serif text-foreground">Install App</span>
            </div>
            <button onClick={doDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Install Nejah Online Quran Center for a better experience with offline access and push notifications.
          </p>
          <Button
            onClick={handleInstall}
            size="sm"
            className="w-full bg-nejah-sapphire hover:bg-background text-white rounded-xl gap-2"
          >
            <Download className="h-4 w-4" /> Install
          </Button>
        </div>
      )}

      {isInstalled && pushSupported && (
        <div className="bg-card dark:bg-nejah-surface border border-border dark:border-white/5 rounded-2xl shadow-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {pushSubscribed ? (
                <Bell className="h-5 w-5 text-nejah-electric" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm font-bold font-serif text-foreground">
                {pushSubscribed ? "Notifications On" : "Notifications"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {pushSubscribed
              ? "You'll receive class updates and alerts via push notifications."
              : "Enable push notifications to get instant class alerts."}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleTogglePush}
              size="sm"
              variant={pushSubscribed ? "outline" : "default"}
              className="flex-1 rounded-xl gap-1"
            >
              {pushSubscribed ? (
                <><BellOff className="h-3 w-3" /> Disable</>
              ) : (
                <><Bell className="h-3 w-3" /> Enable</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
