import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Loader } from "@/components/site/Loader";
import { getVisibleSitemap, type SitemapItem } from "@/lib/support-pages";
import { useTheme } from "@/components/site/ThemeProvider";
import { Loader2, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/sitemap")({
  component: SitemapPage,
  head: () => ({
    meta: [
      { title: "Sitemap - Nejah Online Quran Center" },
      { name: "description", content: "Site map for Nejah Online Quran Center" },
    ],
  }),
});

function buildTree(items: SitemapItem[]): (SitemapItem & { children: SitemapItem[] })[] {
  const map = new Map<string, SitemapItem & { children: SitemapItem[] }>();
  const roots: (SitemapItem & { children: SitemapItem[] })[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function SitemapTree({
  items,
  depth = 0,
}: {
  items: (SitemapItem & { children: SitemapItem[] })[];
  depth?: number;
}) {
  return (
    <ul className={`space-y-2 ${depth > 0 ? "ml-6 mt-2 border-l border-border/50 pl-4" : ""}`}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={item.url}
            className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors py-1"
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className={depth === 0 ? "font-semibold" : ""}>{item.title}</span>
          </Link>
          {item.children.length > 0 && <SitemapTree items={item.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

function SitemapPageContent() {
  const { lang } = useTheme();
  const [items, setItems] = useState<SitemapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getVisibleSitemap();
        setItems(data || []);
      } catch (err) {
        console.error("Failed to load sitemap", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tree = buildTree(items);

  return (
    <div className="container-x py-20" dir={dir}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Sitemap</h1>
        <p className="text-muted-foreground mb-8">Browse all pages on Nejah Online Quran Center.</p>
        {tree.length === 0 ? (
          <p className="text-muted-foreground">No sitemap items available.</p>
        ) : (
          <SitemapTree items={tree} />
        )}
      </div>
    </div>
  );
}

function SitemapPage() {
  return (
    <ThemeProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1">
          <SitemapPageContent />
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
