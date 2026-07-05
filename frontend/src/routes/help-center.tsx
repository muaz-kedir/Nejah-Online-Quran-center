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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getCategoriesWithCounts,
  getPopularArticles,
  getPublishedArticles,
  createTicket,
  type HelpCategory,
  type HelpArticle,
} from "@/lib/support-pages";
import { Loader2, Search, ThumbsUp, MessageSquare, ChevronRight, BookOpen } from "lucide-react";

export const Route = createFileRoute("/help-center")({
  component: HelpCenterPage,
  head: () => ({
    meta: [
      { title: "Help Center - Nejah Online Quran Center" },
      {
        name: "description",
        content: "Help Center and knowledge base for Nejah Online Quran Center",
      },
    ],
  }),
});

const CATEGORY_ICONS: Record<string, string> = {
  student: "📚",
  parent: "👨‍👩‍👧‍👦",
  teacher: "👨‍🏫",
  finance: "💰",
  zoom: "🎥",
  registration: "📝",
  attendance: "✅",
  payments: "💳",
  schedules: "📅",
  certificates: "🎓",
  technical: "🔧",
};

function getIcon(cat: HelpCategory): string {
  if (cat.icon) return cat.icon;
  return CATEGORY_ICONS[cat.slug] || "📄";
}

function HelpCenterPage() {
  const { lang, t } = useTheme();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [popular, setPopular] = useState<HelpArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HelpArticle[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    userRole: "student",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cats, pops] = await Promise.all([getCategoriesWithCounts(), getPopularArticles()]);
        setCategories(cats || []);
        setPopular(pops || []);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const result = await getPublishedArticles({ search: searchQuery, limit: 20 });
      setSearchResults(result.data);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await createTicket(form);
      toast.success("Support request submitted! We'll get back to you soon.");
      setForm({ name: "", email: "", userRole: "student", subject: "", message: "" });
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
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

  return (
    <ThemeProvider>
      <Loader />
      <div className="relative flex min-h-screen flex-col admin-shell-bg">
        <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <Navbar />
        <main className="relative z-10 flex-1" dir={dir}>
          <div className="container-x py-16">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{t.footer.help}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Find answers to your questions and learn how to make the most of your learning
                experience.
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search for help articles..."
                  className="text-base"
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults !== null && (
              <div className="mb-12 max-w-3xl mx-auto">
                <h2 className="text-xl font-bold mb-4">Search Results ({searchResults.length})</h2>
                {searchResults.length === 0 ? (
                  <p className="text-muted-foreground">No results found. Try different keywords.</p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((article) => (
                      <Link
                        key={article.id}
                        to={`/help-center/article/${article.slug}`}
                        className="block rounded-xl border border-border p-4 bg-background/50 hover:bg-muted/30 transition-colors"
                      >
                        <h3 className="font-semibold">
                          {article.title?.[lang] || article.title?.en}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {article.shortDescription?.[lang] || article.shortDescription?.en}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Categories */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold">Browse by Category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/help-center/category/${cat.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-border p-4 bg-background/50 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-2xl">{getIcon(cat)}</span>
                      <div>
                        <h3 className="font-semibold">{cat.name?.[lang] || cat.name?.en}</h3>
                        <p className="text-xs text-muted-foreground">
                          {cat.articleCount || 0} articles
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {popular.length > 0 && (
                  <div className="rounded-xl border border-border p-4 bg-background/50">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-primary" /> Most Viewed
                    </h3>
                    <div className="space-y-2">
                      {popular.slice(0, 5).map((a) => (
                        <Link
                          key={a.id}
                          to={`/help-center/article/${a.slug}`}
                          className="block text-sm text-foreground/80 hover:text-primary transition-colors"
                        >
                          {a.title?.[lang] || a.title?.en}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border p-4 bg-background/50">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" /> Still need help?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Can't find what you're looking for? Submit a support request.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="w-full">
                    Submit Support Request
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Request Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-6 shadow-xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Submit Support Request</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted-foreground hover:text-foreground text-xl"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      type="email"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>User Role</Label>
                    <select
                      value={form.userRole}
                      onChange={(e) => setForm({ ...form, userRole: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Brief summary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message *</Label>
                    <Textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your issue..."
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit Request
                  </Button>
                </form>
              </div>
            </div>
          )}
        </main>
        <Footer />
        <FloatingActions />
      </div>
    </ThemeProvider>
  );
}
