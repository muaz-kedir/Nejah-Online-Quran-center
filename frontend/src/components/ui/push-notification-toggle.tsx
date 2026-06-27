import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  registerServiceWorker,
  getCurrentFcmToken,
} from "@/lib/push-notifications";

interface PushNotificationToggleProps {
  variant?: "card" | "row";
}

export function PushNotificationToggle({ variant = "row" }: PushNotificationToggleProps) {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled) setLoading(false); }, 5000);

    const checkStatus = async () => {
      setLoading(true);
      const supported = "serviceWorker" in navigator && "PushManager" in window;
      if (cancelled) return;
      setPushSupported(supported);

      if (!supported) {
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      try {
        await registerServiceWorker();
        const registration = await navigator.serviceWorker.ready;

        const hasFcm = !!getCurrentFcmToken();
        const hasSubscription = !!await registration.pushManager.getSubscription();

        if (!cancelled) setPushSubscribed(hasFcm || hasSubscription);
      } catch {
        if (!cancelled) setPushSubscribed(!!getCurrentFcmToken());
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    };
    checkStatus();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const handleToggle = useCallback(async () => {
    if (toggling) return;
    setToggling(true);

    try {
      if (pushSubscribed) {
        const ok = await unsubscribeFromPushNotifications();
        if (ok) {
          setPushSubscribed(false);
          toast.success("Push notifications disabled");
        } else {
          toast.error("Failed to disable push notifications");
        }
      } else {
        const ok = await subscribeToPushNotifications();
        if (ok) {
          setPushSubscribed(true);
          toast.success("Push notifications enabled! You'll now receive class updates.");
        } else {
          if ("Notification" in window && Notification.permission === "denied") {
            toast.error(
              "Notifications are blocked. Please enable them in your browser settings.",
              { duration: 6000 }
            );
          } else if ("Notification" in window && Notification.permission === "default") {
            toast.error("Notification permission was not granted. Please try again.");
          } else {
            toast.error(
              "Failed to enable push notifications. Your browser may not support this feature.",
              { duration: 5000 }
            );
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setToggling(false);
    }
  }, [pushSubscribed, toggling]);

  if (loading) {
    if (variant === "card") {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <div>
            <Label className="font-medium">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Checking status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pushSupported) {
    if (variant === "card") {
      return (
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                Not supported on this device or browser
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label className="font-medium">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Not supported on this device
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="p-5 rounded-2xl bg-card dark:bg-nejah-surface border border-border dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {pushSubscribed ? (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-nejah-electric" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <BellOff className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-foreground">
                {pushSubscribed ? "Notifications Enabled" : "Push Notifications"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pushSubscribed
                  ? "You'll receive class updates and alerts"
                  : "Get instant alerts for class sessions"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleToggle}
            disabled={toggling}
            variant={pushSubscribed ? "outline" : "default"}
            size="sm"
            className="rounded-xl gap-1.5"
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pushSubscribed ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {toggling
              ? "Processing..."
              : pushSubscribed
                ? "Disable"
                : "Enable"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        {pushSubscribed ? (
          <Bell className="h-5 w-5 text-nejah-electric" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <Label className="font-medium">Push Notifications</Label>
          <p className="text-sm text-muted-foreground">
            {pushSubscribed
              ? "Receive class alerts on this device"
              : "Get notified for class sessions"}
          </p>
        </div>
      </div>
      <Switch
        checked={pushSubscribed}
        onCheckedChange={handleToggle}
        disabled={toggling}
      />
    </div>
  );
}
