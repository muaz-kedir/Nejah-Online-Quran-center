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
import { useEffect, useRef, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AppProvider } from '@/context/AppContext';
import { setupChunkLoadRecovery } from "@/lib/chunk-reload";
import { ThemeProvider } from '@/components/site/ThemeProvider';
import { WS_URL } from "@/lib/api";
import { useRealtimeSocket } from "@/hooks/useRealtimeSocket";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://nejah-center.com";
const SITE_NAME = "Nejah Online Quran Center";
const SITE_KEYWORDS =
  "Quran, online learning, tajweed, hifz, islamic studies, Arabic, Nejah, online madrasa, learn Quran online, Quran teacher, Islamic school, Quran memorization, online Quran classes, Quran for kids, Quran for adults";
const DEFAULT_TITLE = SITE_NAME;
const DEFAULT_DESCRIPTION =
  "Learn Quran online with expert teachers. Tajweed, Hifz, Quran reading, and Islamic studies for all ages and levels. Join the best online madrasa for personalized Quran education.";
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
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
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
      { name: "keywords", content: SITE_KEYWORDS },
      { name: "author", content: SITE_NAME },
      { name: "theme-color", content: "#0F62AC" },
      { name: "msapplication-TileColor", content: "#0F62AC" },
      { name: "application-name", content: SITE_NAME },

      // Search engine behavior
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "revisit-after", content: "7 days" },

      // AI / chatbot indexing
      { name: "chatgpt:index", content: "true" },

      // Open Graph
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: DEFAULT_TITLE },
      { property: "og:description", content: DEFAULT_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_SA" },
      { property: "og:locale:alternate", content: "am_ET" },

      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@NejahCenter" },
      { name: "twitter:title", content: DEFAULT_TITLE },
      { name: "twitter:description", content: DEFAULT_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/logo.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/logo.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "canonical", href: SITE_URL },
      { rel: "sitemap", type: "application/xml", href: `${SITE_URL}/sitemap.xml` },
      { rel: "alternate", hrefLang: "en", href: SITE_URL },
      { rel: "alternate", hrefLang: "ar", href: `${SITE_URL}/ar` },
      { rel: "alternate", hrefLang: "am", href: `${SITE_URL}/am` },
      { rel: "alternate", hrefLang: "x-default", href: SITE_URL },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: SITE_URL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "@id": `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/logo.svg`,
          description: DEFAULT_DESCRIPTION,
          foundingDate: "2020",
          isicV4: "8542",
          sameAs: [
            "https://facebook.com/NejahCenter",
            "https://twitter.com/NejahCenter",
            "https://instagram.com/NejahCenter",
            "https://youtube.com/@NejahCenter",
          ],
          offers: {
            "@type": "AggregateOffer",
            name: "Quran & Islamic Studies Courses",
            description: "Personalized one-on-one Quran, Tajweed, Hifz and Islamic Studies for all ages.",
            availability: "https://schema.org/OnlineOnly",
            offers: [
              { "@type": "Offer", name: "Quran Reading" },
              { "@type": "Offer", name: "Tajweed Rules" },
              { "@type": "Offer", name: "Quran Memorization (Hifz)" },
              { "@type": "Offer", name: "Islamic Studies" },
              { "@type": "Offer", name: "Arabic Language" },
            ],
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: SITE_URL,
          description: DEFAULT_DESCRIPTION,
          inLanguage: ["en", "ar", "am"],
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${SITE_URL}/#faq`,
          mainEntity: [
            {
              "@type": "Question",
              name: "What is Nejah Online Quran Center?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Nejah is an online madrasa offering personalized Quran, Tajweed, Hifz, and Islamic studies with qualified teachers for students of all ages worldwide.",
              },
            },
            {
              "@type": "Question",
              name: "How do I start learning Quran online?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Simply register on our website for a free trial, and we'll match you with a qualified Quran teacher based on your level and goals.",
              },
            },
            {
              "@type": "Question",
              name: "Are the teachers qualified?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, all our teachers hold Ijazah in Quran recitation and have years of experience teaching Quran and Islamic studies online.",
              },
            },
          ],
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

function ClientOnlyPWAPrompt() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    import("@/components/pwa/PWADownloadPrompt").then((m) => setComp(() => m.default));
  }, []);
  if (!Comp) return null;
  return (
    <Suspense fallback={null}>
      <Comp />
    </Suspense>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const socketRef = useRef<any>(null);

  useRealtimeSocket();

  useEffect(() => {
    setupChunkLoadRecovery();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const interval = setInterval(() => {
      fetch(`${WS_URL}/health`, { mode: 'cors' }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1));

    idle(() => {
      import("@/lib/push-notifications").then(({ initializePwaPush, setupForegroundListener, updateNotificationBadge }) => {
        initializePwaPush().catch(() => {});
        updateNotificationBadge().catch(() => {});

        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            updateNotificationBadge().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        setupForegroundListener((payload: any) => {
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
      });
    });

    idle(() => {
      import("socket.io-client").then(({ io }) => {
        const socket = io(`${WS_URL}/ws`, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 60000,
        });

        socket.on("connect", () => console.log("[WS Root] Connected"));
        socket.on("connected", (data: any) => console.log("[WS Root] Authenticated:", data.userId));

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

        socket.on("session:status_changed", (data: any) => {
          console.log("[WS Root] Session status:", data);
        });

        socket.on("error", (err: any) => console.error("[WS Root] Error:", err.message));

        socketRef.current = socket;
      });
    });

    return () => {
      const s = socketRef.current;
      if (s?.connected) s.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
          <ClientOnlyPWAPrompt />
        </ThemeProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
