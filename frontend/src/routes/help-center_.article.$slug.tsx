import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Loader } from "@/components/site/Loader";
import { useTheme } from "@/components/site/ThemeProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getArticleBySlug,
  getRelatedArticles,
  submitFeedback,
  type HelpArticle,
} from "@/lib/support-pages";
import { Loader2, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";

export const Route = createFileRoute("/help-center_/article/$slug")({
  component: ArticleDetailPage,
  head: ({ params }) => ({
    meta: [{ title: `Help Article - ${params.slug} - Nejah` }],
  }),
});

function ArticleDetailPage() {
  const { slug } = Route.useParams();
  const { lang } = useTheme();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [related, setRelated] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getArticleBySlug(slug);
        setArticle(data);
        const rel = await getRelatedArticles(slug);
        setRelated(rel || []);
      } catch {
        toast.error("Article not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleFeedback = async (isHelpful: boolean) => {
    if (!article || feedbackGiven) return;
    try {
      await submitFeedback(article.id, isHelpful);
      setFeedbackGiven(true);
      toast.success("Thank you for your feedback!");
      if (isHelpful) {
        setArticle({ ...article, helpfulCount: article.helpfulCount + 1 });
      } else {
        setArticle({ ...article, notHelpfulCount: article.notHelpfulCount + 1 });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to submit feedback");
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <Loader />
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    );
  }

  if (!article) {
    return (
      <ThemeProvider>
        <Loader />
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 container-x py-20 text-center">
            <h1 className="text-2xl font-bold">Article Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/help-center" className="text-primary hover:underline mt-4 inline-block">
              Back to Help Center
            </Link>
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    );
  }

  const title = article.title?.[lang] || article.title?.en || "Untitled";
  const content = article.content?.[lang] || article.content?.en || "";
  const shortDesc = article.shortDescription?.[lang] || article.shortDescription?.en || "";

  return (
    <ThemeProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1" dir={dir}>
          <article className="container-x py-16">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
                <Link to="/help-center" className="hover:text-primary">
                  Help Center
                </Link>
                <ChevronRight className="h-3 w-3" />
                {article.category && (
                  <>
                    <Link
                      to={`/help-center/category/${article.category.slug}`}
                      className="hover:text-primary"
                    >
                      {article.category.name?.[lang] || article.category.name?.en}
                    </Link>
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
                <span className="text-foreground font-medium truncate">{title}</span>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                {article.author && <span>By {article.author}</span>}
                {article.publishedAt && (
                  <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                )}
                <span>{article.viewCount} views</span>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {article.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
              {shortDesc && <p className="text-lg text-muted-foreground mb-8">{shortDesc}</p>}

              {/* Content */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none mb-12"
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {/* Feedback */}
              <div className="rounded-xl border border-border p-6 bg-background/50 mb-8 text-center">
                <h3 className="font-bold text-lg mb-3">Was this article helpful?</h3>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={feedbackGiven ? "outline" : "default"}
                    onClick={() => handleFeedback(true)}
                    disabled={feedbackGiven}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" /> Yes ({article.helpfulCount})
                  </Button>
                  <Button
                    variant={feedbackGiven ? "outline" : "default"}
                    onClick={() => handleFeedback(false)}
                    disabled={feedbackGiven}
                    className="gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" /> No ({article.notHelpfulCount})
                  </Button>
                </div>
                {feedbackGiven && (
                  <p className="text-sm text-muted-foreground mt-2">Thank you for your feedback!</p>
                )}
              </div>

              {/* Related Articles */}
              {related.length > 0 && (
                <div className="rounded-xl border border-border p-6 bg-background/50">
                  <h3 className="font-bold text-lg mb-4">Related Articles</h3>
                  <div className="space-y-3">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        to={`/help-center/article/${r.slug}`}
                        className="block rounded-lg border border-border p-3 bg-background/50 hover:bg-muted/30 transition-colors"
                      >
                        <p className="font-medium">{r.title?.[lang] || r.title?.en}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
