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

let globalSocket: Socket | null = null;
let globalSocketToken: string | null = null;
let globalRefCount = 0;

function getGlobalSocket(token: string): Socket {
  if (!globalSocket) {
    globalSocket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 60000,
    });
    globalSocketToken = token;
  } else if (token !== globalSocketToken) {
    globalSocket.auth = { token };
    globalSocket.disconnect().connect();
    globalSocketToken = token;
  }
  return globalSocket;
}

export function useSocket(callbacks?: SocketCallbacks) {
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getGlobalSocket(token);
    globalRefCount++;

    if (socket.connected) {
      setConnected(true);
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnected = (data: any) => {};
    const onNotification = (notif: NotificationData) => {
      callbacksRef.current?.onNotification?.(notif);
    };
    const onSessionStatus = (data: any) => {
      callbacksRef.current?.onSessionStatus?.(data);
    };
    const onError = (err: Error) => {};

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connected", onConnected);
    socket.on("notification:new", onNotification);
    socket.on("session:status_changed", onSessionStatus);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connected", onConnected);
      socket.off("notification:new", onNotification);
      socket.off("session:status_changed", onSessionStatus);
      socket.off("error", onError);

      globalRefCount--;
      if (globalRefCount <= 0 && globalSocket) {
        globalSocket.removeAllListeners();
      }
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    globalSocket?.emit(event, data);
  }, []);

  return { connected, emit };
}
