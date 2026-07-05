import { WS_URL } from "@/lib/api";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type NotificationData = {
  id: string;
  channel: string;
  title: string;
  content: string;
  data?: {
    sessionId?: string;
    meetingLink?: string;
    classTitle?: string;
    status?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  sentAt: string;
  createdAt: string;
};

type SocketCallbacks = {
  onNotification?: (notif: NotificationData) => void;
  onSessionStatus?: (data: { sessionId: string; status: string; [key: string]: unknown }) => void;
};

export function useSocket(callbacks?: SocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connected", (data) => console.log("[WS] Connected:", data.userId));

    socket.on("notification:new", (notif: NotificationData) => {
      console.log("[WS] Notification:", notif);
      callbacks?.onNotification?.(notif);
    });

    socket.on("session:status_changed", (data) => {
      console.log("[WS] Session status:", data);
      callbacks?.onSessionStatus?.(data);
    });

    socket.on("error", (err) => console.error("[WS] Error:", err.message));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef, connected, emit };
}
