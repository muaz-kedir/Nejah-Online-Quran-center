import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

export function useRealtimeSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 60000,
    });

    socket.on("connect", () => console.log("[WS Realtime] Connected"));
    socket.on("connected", (data: any) =>
      console.log("[WS Realtime] Authenticated:", data.userId)
    );

    Object.entries(DOMAIN_EVENTS).forEach(([event, queryPrefixes]) => {
      socket.on(event, () => {
        console.log(`[WS Realtime] ${event} — invalidating:`, queryPrefixes);
        queryPrefixes.forEach((prefix) => {
          queryClient.invalidateQueries({ predicate: (q) => {
            const key = q.queryKey[0];
            return typeof key === "string" && key.startsWith(prefix);
          }});
        });
      });
    });

    socket.on("error", (err) => console.error("[WS Realtime] Error:", err.message));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef;
}
