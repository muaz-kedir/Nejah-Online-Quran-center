import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import "../styles.css";
import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AppProvider } from '@/context/AppContext';
import { setupChunkLoadRecovery } from "@/lib/chunk-reload";
import PWADownloadPrompt from "@/components/pwa/PWADownloadPrompt";
import { ThemeProvider } from '@/components/site/ThemeProvider';
import { initializePwaPush, setupForegroundListener, updateNotificationBadge } from "@/lib/push-notifications";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "@/lib/api";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://nejah-center.com";
const SITE_NAME = "Nejah Online Quran Center";
const DEFAULT_TITLE = SITE_NAME;
const DEFAULT_DESCRIPTION =
  "Learn Quran online with expert teachers. Tajweed, Hifz, Quran reading, and Islamic studies for all ages and levels.";
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

function NotFoundComponent() {
  return (
    <div className="admin-shell-bg flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="admin-shell-bg flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: DEFAULT_TITLE },
      { name: "description", content: DEFAULT_DESCRIPTION },
      { name: "keywords", content: "Quran, online learning, tajweed, hifz, islamic studies, Arabic, Nejah" },
      { name: "author", content: "Nejah Online Quran Center" },
      { name: "theme-color", content: "#0066CC" },

      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: DEFAULT_TITLE },
      { property: "og:description", content: DEFAULT_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@NejahCenter" },
      { name: "twitter:title", content: DEFAULT_TITLE },
      { name: "twitter:description", content: DEFAULT_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "canonical", href: SITE_URL },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },

    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/logo.svg`,
          description: DEFAULT_DESCRIPTION,
          sameAs: [],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setupChunkLoadRecovery();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    initializePwaPush().catch(() => {});

    updateNotificationBadge().catch(() => {});

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateNotificationBadge().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const unsubForeground = setupForegroundListener((payload) => {
      const title = payload.title || "Nejah";
      const body = payload.body || "";
      if (body) {
        toast(title, {
          description: body,
          duration: 8000,
          action: payload.clickAction
            ? { label: "View", onClick: () => { window.location.href = payload.clickAction!; } }
            : undefined,
        });
      }
    });

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => console.log("[WS Root] Connected"));
    socket.on("connected", (data) => console.log("[WS Root] Authenticated:", data.userId));

    socket.on("notification:new", (notif: any) => {
      console.log("[WS Root] Notification:", notif);
      const isSamePage = window.location.pathname.includes("/notifications");
      if (!isSamePage) {
        const handleClick = notif.data?.sessionId
          ? () => { window.location.href = `/classroom/${notif.data.sessionId}`; }
          : undefined;
        toast(notif.title, {
          description: notif.content,
          duration: 8000,
          action: handleClick ? { label: "View", onClick: handleClick } : undefined,
        });
      }
    });

    socket.on("session:status_changed", (data) => {
      console.log("[WS Root] Session status:", data);
    });

    socket.on("error", (err) => console.error("[WS Root] Error:", err.message));

    socketRef.current = socket;

    return () => {
      unsubForeground?.();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
          <PWADownloadPrompt />
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
