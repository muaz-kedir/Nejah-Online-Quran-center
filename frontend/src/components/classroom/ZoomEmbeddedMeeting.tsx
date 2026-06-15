import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export type ClassroomJoinConfig = {
  sdkSignature: string;
  meetingNumber: string;
  password: string;
  userName: string;
  userEmail: string;
  role: 0 | 1;
  zak?: string | null;
};

type ZoomEmbeddedMeetingProps = {
  config: ClassroomJoinConfig;
  onJoined?: () => void;
  onLeft?: () => void;
  onError?: (message: string) => void;
};

export function ZoomEmbeddedMeeting({
  config,
  onJoined,
  onLeft,
  onError,
}: ZoomEmbeddedMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const [status, setStatus] = useState<"initializing" | "joined" | "error">("initializing");

  const notifyError = useCallback(
    (message: string) => {
      setStatus("error");
      onError?.(message);
      toast.error(message);
    },
    [onError],
  );

  useEffect(() => {
    let cancelled = false;
    let client: any = null;

    const start = async () => {
      if (!containerRef.current) return;

      try {
        const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded")).default;
        if (cancelled) return;

        client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        await client.init({
          zoomAppRoot: containerRef.current,
          language: "en-US",
          patchJsMedia: true,
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: {
                  width: containerRef.current.clientWidth || window.innerWidth,
                  height: containerRef.current.clientHeight || window.innerHeight - 72,
                },
              },
            },
          },
        });

        if (cancelled) return;

        client.on("connection-change", (payload: { state?: string }) => {
          if (payload?.state === "Closed") {
            onLeft?.();
          }
        });

        const joinPayload: Record<string, string> = {
          signature: config.sdkSignature,
          meetingNumber: config.meetingNumber,
          password: config.password || "",
          userName: config.userName,
          userEmail: config.userEmail || "",
        };

        if (config.role === 1 && config.zak) {
          joinPayload.zak = config.zak;
        }

        await client.join(joinPayload);

        if (cancelled) return;
        setStatus("joined");
        onJoined?.();
      } catch (error: any) {
        if (cancelled) return;
        const message =
          error?.reason || error?.message || "Failed to join embedded Zoom meeting";
        notifyError(message);
      }
    };

    start();

    return () => {
      cancelled = true;
      const activeClient = clientRef.current;
      if (activeClient) {
        activeClient.leaveMeeting?.().catch(() => {});
      }
      clientRef.current = null;
      import("@zoom/meetingsdk/embedded")
        .then((mod) => mod.default.destroyClient?.())
        .catch(() => {});
    };
  }, [
    config.sdkSignature,
    config.meetingNumber,
    config.password,
    config.userName,
    config.userEmail,
    config.zak,
    config.role,
    notifyError,
    onJoined,
    onLeft,
  ]);

  return (
    <div className="relative flex-1 min-h-0 w-full bg-black">
      {status === "initializing" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/90 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-white/70">Connecting to your classroom...</p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full min-h-[calc(100vh-72px)]" />
    </div>
  );
}
