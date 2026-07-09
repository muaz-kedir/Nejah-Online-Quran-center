import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Loader } from "@/components/site/Loader";
import { getPublishedPage, type SupportPage } from "@/lib/support-pages";
import { useTheme } from "@/components/site/ThemeProvider";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy - Nejah Online Quran Center" },
      { name: "description", content: "Privacy Policy for Nejah Online Quran Center" },
    ],
  }),
});

function PrivacyPolicyContent() {
  const { lang } = useTheme();
  const [page, setPage] = useState<SupportPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublishedPage("privacy-policy");
        setPage(data);
      } catch (err) {
        console.warn("Privacy policy page not published yet", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">Content not available yet.</p>
      </div>
    );
  }

  const title = page.title?.[lang] || page.title?.en || "Privacy Policy";
  const subtitle = page.subtitle?.[lang] || page.subtitle?.en || "";
  const content = page.content?.[lang] || page.content?.en || "";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="container-x py-20" dir={dir}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
        {subtitle && <p className="text-lg text-muted-foreground mb-4">{subtitle}</p>}
        {page.publishedAt && (
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {new Date(page.publishedAt).toLocaleDateString()}
          </p>
        )}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}

function PrivacyPolicyPage() {
  return (
    <ThemeProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1">
          <PrivacyPolicyContent />
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
