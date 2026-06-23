import { useState, useEffect, useCallback } from "react";
import {
  initializePwaPush,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/push-notifications";

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setPushSupported("serviceWorker" in navigator && "PushManager" in window);

    initializePwaPush()
      .then((ok) => setPushSubscribed(ok))
      .catch(() => setPushSubscribed(false));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    return outcome === "accepted";
  }, [deferredPrompt]);

  const subscribeToPush = useCallback(async () => {
    if (!pushSupported) return false;
    const ok = await subscribeToPushNotifications();
    setPushSubscribed(ok);
    return ok;
  }, [pushSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    const ok = await unsubscribeFromPushNotifications();
    if (ok) setPushSubscribed(false);
    return ok;
  }, []);

  return {
    canInstall,
    isInstalled,
    install,
    pushSupported,
    pushSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    deferredPrompt,
  };
}
