import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { requireAuth } from "@/lib/auth";
import { LocalizedFields, ImageUploadField } from "@/components/website-cms/CmsFormFields";
import { LocalizedRichTextField } from "@/components/website-cms/LocalizedRichTextField";
import { uploadCmsImage } from "@/lib/home-cms";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleVersions,
  restoreArticleVersion,
  type HelpCategory,
  type HelpArticle,
  type ArticleVersion,
  type LocalizedText,
  EMPTY_LOCALIZED,
  ArticleStatus,
} from "@/lib/support-pages";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  History,
  RotateCcw,
  Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/website/support/help-center")({
  component: HelpCenterCmsPage,
  beforeLoad: () => requireAuth(["super_admin"]),
});

function HelpCenterCmsPage() {
  const [tab, setTab] = useState("categories");

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website CMS"
          title="Help Center"
          description="Manage categories, articles, and version history"
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="versions">Article Versions</TabsTrigger>
          </TabsList>
          <TabsContent value="categories" className="mt-6">
            <CategoriesEditor />
          </TabsContent>
          <TabsContent value="articles" className="mt-6">
            <ArticlesEditor />
          </TabsContent>
          <TabsContent value="versions" className="mt-6">
            <VersionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function CategoriesEditor() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<HelpCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: EMPTY_LOCALIZED,
    slug: "",
    icon: "",
    description: EMPTY_LOCALIZED,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingCat(null);
    setShowForm(true);
    setForm({ name: EMPTY_LOCALIZED, slug: "", icon: "", description: EMPTY_LOCALIZED });
  };

  const openEdit = (cat: HelpCategory) => {
    setEditingCat(cat);
    setShowForm(true);
    setForm({
      name: { ...EMPTY_LOCALIZED, ...cat.name },
      slug: cat.slug,
      icon: cat.icon || "",
      description: { ...EMPTY_LOCALIZED, ...cat.description },
    });
  };

  const handleSave = async () => {
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, form);
        toast.success("Category updated");
      } else {
        await createCategory(form);
        toast.success("Category created");
      }
      setShowForm(false);
      setEditingCat(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const ids = sorted.map((c) => c.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(newIndex, 0, removed);
    try {
      const reordered = await reorderCategories(ids);
      setCategories(reordered);
      toast.success("Order updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to reorder");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Help Categories</h3>
          <Button size="sm" variant="outline" onClick={openNew} className="gap-1">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        <div className="space-y-2">
          {sortedCategories.map((cat, index) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3 bg-background/50"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === sortedCategories.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{cat.name?.en || cat.slug}</p>
                <p className="text-xs text-muted-foreground">/{cat.slug}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => handleDelete(cat.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </GlassPanel>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingCat(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCat ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <LocalizedFields
              label="Category Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. student"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji or icon name)</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. BookOpen"
              />
            </div>
            <LocalizedFields
              label="Description"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              multiline
            />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCat ? "Update" : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingCat(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArticlesEditor() {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pag, setPag] = useState({ page: 1, totalPages: 1 });
  const [form, setForm] = useState({
    title: EMPTY_LOCALIZED,
    slug: "",
    categoryId: "",
    shortDescription: EMPTY_LOCALIZED,
    content: { en: "", ar: "", am: "" },
    tags: "",
    author: "",
    status: ArticleStatus.DRAFT,
  });

  const load = async () => {
    setLoading(true);
    try {
      const q: any = { page: pag.page, limit: 20 };
      if (search) q.search = search;
      if (filterCategory) q.categoryId = filterCategory;
      if (filterStatus) q.status = filterStatus;
      const result = await getArticles(q);
      setArticles(result.data);
      setPag((p) => ({ ...p, totalPages: result.meta.totalPages }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    loadCategories();
  }, [pag.page, search, filterCategory, filterStatus]);
  useEffect(() => {
    loadCategories();
  }, []);

  const openNew = () => {
    setEditingArticle(null);
    setShowForm(true);
    setForm({
      title: EMPTY_LOCALIZED,
      slug: "",
      categoryId: categories[0]?.id || "",
      shortDescription: EMPTY_LOCALIZED,
      content: { en: "", ar: "", am: "" },
      tags: "",
      author: "",
      status: ArticleStatus.DRAFT,
    });
  };

  const openEdit = async (article: HelpArticle) => {
    try {
      const full = await getArticle(article.slug);
      setEditingArticle(full);
      setShowForm(true);
      setForm({
        title: { ...EMPTY_LOCALIZED, ...full.title },
        slug: full.slug,
        categoryId: full.categoryId,
        shortDescription: { ...EMPTY_LOCALIZED, ...full.shortDescription },
        content: {
          ...EMPTY_LOCALIZED,
          ...full.content,
          en: full.content?.en || "",
          ar: full.content?.ar || "",
          am: full.content?.am || "",
        },
        tags: full.tags?.join(", ") || "",
        author: full.author || "",
        status: full.status,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to load article");
    }
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.categoryId) {
      toast.error("Slug and category are required");
      return;
    }
    setSaving(true);
    try {
      const dto = { ...form, tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [] };
      if (editingArticle) {
        await updateArticle(editingArticle.id, dto);
        toast.success("Article updated");
      } else {
        await createArticle(dto);
        toast.success("Article created");
      }
      setShowForm(false);
      setEditingArticle(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    try {
      await deleteArticle(id);
      toast.success("Article deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const handleSearch = () => {
    setPag((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: ArticleStatus) => {
    const colors: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || ""}`}>
        {status}
      </span>
    );
  };

  if (loading && articles.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Help Articles</h3>
          <Button size="sm" variant="outline" onClick={openNew} className="gap-1">
            <Plus className="h-4 w-4" /> Add Article
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-xs"
          />
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPag({ ...pag, page: 1 });
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm max-w-[200px]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name?.en || c.slug}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPag({ ...pag, page: 1 });
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm max-w-[150px]"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {articles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No articles found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Helpful</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{a.title?.en || a.slug}</td>
                    <td className="py-3 px-4">{a.category?.name?.en || "—"}</td>
                    <td className="py-3 px-4">{getStatusBadge(a.status)}</td>
                    <td className="py-3 px-4">{a.viewCount}</td>
                    <td className="py-3 px-4">
                      {a.helpfulCount + a.notHelpfulCount > 0
                        ? `${Math.round((a.helpfulCount / (a.helpfulCount + a.notHelpfulCount)) * 100)}%`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pag.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            {Array.from({ length: pag.totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={pag.page === p ? "default" : "outline"}
                onClick={() => setPag({ ...pag, page: p })}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </GlassPanel>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingArticle(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingArticle ? "Edit Article" : "New Article"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. how-to-join-zoom"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name?.en || c.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: ArticleStatus) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <LocalizedFields
              label="Title"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
            />
            <LocalizedFields
              label="Short Description"
              value={form.shortDescription}
              onChange={(v) => setForm({ ...form, shortDescription: v })}
              multiline
            />
            <LocalizedRichTextField
              label="Article Content"
              value={form.content}
              onChange={(v) => setForm({ ...form, content: v })}
            />

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="zoom, attendance, setup"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingArticle ? "Update" : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingArticle(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VersionsPanel() {
  const [articleSlug, setArticleSlug] = useState("");
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadVersions = async () => {
    if (!articleSlug.trim()) return;
    setLoading(true);
    try {
      const article = await getArticle(articleSlug);
      const data = await getArticleVersions(article.id);
      setVersions(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("Restore this version? Current content will be overwritten.")) return;
    setRestoring(true);
    try {
      const article = await getArticle(articleSlug);
      await restoreArticleVersion(article.id, versionId);
      toast.success("Version restored");
      await loadVersions();
    } catch (e: any) {
      toast.error(e.message || "Failed to restore");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <GlassPanel className="p-6 space-y-4">
      <h3 className="font-bold text-lg">Article Version History</h3>
      <div className="flex gap-3">
        <Input
          value={articleSlug}
          onChange={(e) => setArticleSlug(e.target.value)}
          placeholder="Enter article slug..."
          onKeyDown={(e) => e.key === "Enter" && loadVersions()}
          className="max-w-xs"
        />
        <Button onClick={loadVersions} disabled={loading}>
          Load Versions
        </Button>
      </div>

      {versions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Enter an article slug and click Load Versions.
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-xl border border-border p-3 bg-background/50"
            >
              <div>
                <p className="text-sm font-medium">
                  Edited by {v.editor || "Unknown"} · {new Date(v.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {v.changes?.status || "—"} · Title: {v.changes?.title?.en || "—"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(v.id)}
                disabled={restoring}
                className="gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
