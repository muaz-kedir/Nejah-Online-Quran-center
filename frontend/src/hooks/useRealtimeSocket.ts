import { useContext, useEffect, useRef } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { WS_URL } from "@/lib/api";
import { io, Socket } from "socket.io-client";

const DOMAIN_EVENTS: Record<string, string[]> = {
  "student:created": ["students", "dashboard"],
  "student:updated": ["students", "dashboard"],
  "student:deleted": ["students", "dashboard"],
  "teacher:created": ["teachers", "dashboard"],
  "teacher:updated": ["teachers", "dashboard"],
  "teacher:deleted": ["teachers", "dashboard"],
  "teacher:status_changed": ["teachers", "dashboard"],
  "session:created": ["sessions", "dashboard", "today-classes"],
  "session:updated": ["sessions", "dashboard", "today-classes"],
  "session:status_changed": ["sessions", "dashboard", "today-classes"],
  "classroom:started": ["sessions", "dashboard"],
  "classroom:ended": ["sessions", "dashboard"],
  "finance:payment_recorded": ["finance", "dashboard"],
  "notification:new": ["notifications"],
  "parent:created": ["parents", "dashboard"],
  "parent:updated": ["parents", "dashboard"],
  "attendance:recorded": ["attendance", "dashboard"],
  "homework:created": ["homework"],
  "homework:updated": ["homework"],
  "application:submitted": ["teacher-applications"],
  "application:status_changed": ["teacher-applications"],
};

let globalSocket: Socket | null = null;
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
  }
  return globalSocket;
}

export function useRealtimeSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useContext(QueryClientContext);

  useEffect(() => {
    if (!queryClient) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getGlobalSocket(token);
    globalRefCount++;
    socketRef.current = socket;

    const onConnect = () => console.log("[WS Realtime] Connected");
    const onConnected = (data: any) =>
      console.log("[WS Realtime] Authenticated:", data.userId);

    socket.on("connect", onConnect);
    socket.on("connected", onConnected);

    const domainHandlers = Object.entries(DOMAIN_EVENTS).map(([event, queryPrefixes]) => {
      const handler = () => {
        console.log(`[WS Realtime] ${event} — invalidating:`, queryPrefixes);
        queryPrefixes.forEach((prefix) => {
          queryClient.invalidateQueries({ predicate: (q) => {
            const key = q.queryKey[0];
            return typeof key === "string" && key.startsWith(prefix);
          }});
        });
      };
      socket.on(event, handler);
      return [event, handler] as const;
    });

    const onError = (err: Error) => console.error("[WS Realtime] Error:", err.message);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("connected", onConnected);
      domainHandlers.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.off("error", onError);

      globalRefCount--;
      if (globalRefCount <= 0 && globalSocket) {
        globalSocket.removeAllListeners();
        globalSocket.disconnect();
        globalSocket = null;
      }
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef;
}
