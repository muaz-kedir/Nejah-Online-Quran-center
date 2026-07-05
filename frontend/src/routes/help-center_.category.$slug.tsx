import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Loader } from "@/components/site/Loader";
import { useTheme } from "@/components/site/ThemeProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getCategoriesWithCounts, getPublishedArticles,
  type HelpCategory, type HelpArticle,
} from "@/lib/support-pages";
import { Loader2, Search, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/help-center_/category/$slug")({
  component: CategoryArticlesPage,
  head: ({ params }) => ({
    meta: [
      { title: `Help Center - ${params.slug} - Nejah` },
    ],
  }),
});

function CategoryArticlesPage() {
  const { slug } = Route.useParams();
  const { lang } = useTheme();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategoriesWithCounts();
        const found = cats.find((c) => c.slug === slug);
        setCategory(found || null);
        const result = await getPublishedArticles({ categoryId: found?.id, limit: 50 });
        setArticles(result.data || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [slug]);

  const filtered = search
    ? articles.filter((a) => {
        const title = (a.title?.[lang] || a.title?.en || "").toLowerCase();
        return title.includes(search.toLowerCase());
      })
    : articles;

  if (loading) {
    return (
      <ThemeProvider>
        <Loader />
        <div className="relative flex min-h-screen flex-col"><Navbar /><main className="flex-1 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></main><Footer /></div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1" dir={dir}>
          <div className="container-x py-16">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/help-center" className="hover:text-primary">Help Center</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{category?.name?.[lang] || category?.name?.en || slug}</span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {category?.name?.[lang] || category?.name?.en || slug}
              </h1>
              {category?.description?.[lang] && (
                <p className="text-lg text-muted-foreground mb-6">{category.description[lang]}</p>
              )}

              <div className="flex gap-2 mb-8">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter articles..."
                  className="max-w-xs"
                />
              </div>

              {filtered.length === 0 ? (
                <p className="text-muted-foreground">No articles found in this category.</p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((article) => (
                    <Link
                      key={article.id}
                      to={`/help-center/article/${article.slug}`}
                      className="block rounded-xl border border-border p-4 bg-background/50 hover:bg-muted/30 transition-colors"
                    >
                      <h3 className="font-semibold text-lg">{article.title?.[lang] || article.title?.en}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {article.shortDescription?.[lang] || article.shortDescription?.en}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {article.viewCount > 0 && <span>{article.viewCount} views</span>}
                        {article.author && <span>By {article.author}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
