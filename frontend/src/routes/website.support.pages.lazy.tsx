/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from "react";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getPages,
  getPage,
  createPage,
  updatePage,
  updatePageStatus,
  type SupportPage,
  type LocalizedText,
  EMPTY_LOCALIZED,
  PageStatus,
} from "@/lib/support-pages";
import { Loader2, Plus, Pencil, Trash2, Save, Eye, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createLazyFileRoute('/website/support/pages')({
  component: SupportPagesCmsPage,
});

function SupportPagesCmsPage() {
  const [pages, setPages] = useState<SupportPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<SupportPage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: EMPTY_LOCALIZED,
    subtitle: EMPTY_LOCALIZED,
    content: { en: "", ar: "", am: "" },
    metaTitle: EMPTY_LOCALIZED,
    metaDescription: EMPTY_LOCALIZED,
    metaKeywords: EMPTY_LOCALIZED,
    ogImage: null as string | null,
    status: PageStatus.DRAFT,
  });

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await getPages();
      setPages(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const openNew = () => {
    setEditingPage(null);
    setShowForm(true);
    setForm({
      slug: "",
      title: EMPTY_LOCALIZED,
      subtitle: EMPTY_LOCALIZED,
      content: { en: "", ar: "", am: "" },
      metaTitle: EMPTY_LOCALIZED,
      metaDescription: EMPTY_LOCALIZED,
      metaKeywords: EMPTY_LOCALIZED,
      ogImage: null,
      status: PageStatus.DRAFT,
    });
  };

  const openEdit = async (page: SupportPage) => {
    try {
      const full = await getPage(page.slug);
      setEditingPage(full);
      setShowForm(true);
      setForm({
        slug: full.slug,
        title: { ...EMPTY_LOCALIZED, ...full.title },
        subtitle: { ...EMPTY_LOCALIZED, ...full.subtitle },
        content: {
          ...EMPTY_LOCALIZED,
          ...full.content,
          en: full.content?.en || "",
          ar: full.content?.ar || "",
          am: full.content?.am || "",
        },
        metaTitle: { ...EMPTY_LOCALIZED, ...full.metaTitle },
        metaDescription: { ...EMPTY_LOCALIZED, ...full.metaDescription },
        metaKeywords: { ...EMPTY_LOCALIZED, ...full.metaKeywords },
        ogImage: full.ogImage || null,
        status: full.status,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to load page");
    }
  };

  const handleSave = async (status?: PageStatus) => {
    const finalStatus = status || form.status;
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    try {
      if (editingPage) {
        await updatePage(editingPage.id, { ...form, status: finalStatus });
        toast.success("Page updated");
      } else {
        await createPage({ ...form, status: finalStatus });
        toast.success("Page created");
      }
      setShowForm(false);
      setEditingPage(null);
      await loadPages();
    } catch (e: any) {
      toast.error(e.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: SupportPage) => {
    if (!confirm(`Delete "${page.title?.en || page.slug}"? This cannot be undone.`)) return;
    try {
      await updatePage(page.id, { status: PageStatus.ARCHIVED });
      toast.success("Page archived");
      await loadPages();
    } catch (e: any) {
      toast.error(e.message || "Failed to archive page");
    }
  };

  const handleStatusChange = async (id: string, status: PageStatus) => {
    try {
      await updatePageStatus(id, status);
      toast.success(`Status changed to ${status}`);
      await loadPages();
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const getStatusBadge = (status: PageStatus) => {
    const colors: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      archived: "bg-muted text-foreground dark:bg-gray-900/30 dark:text-muted-foreground",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || ""}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website CMS"
          title="Support Pages"
          description="Manage Privacy Policy, Terms of Service, and other support pages"
          actions={
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> New Page
            </Button>
          }
        />

        <GlassPanel className="p-6">
          {pages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No support pages yet. Create one to get started.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Languages</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pages.map((page) => {
                    const hasEn = !!page.title?.en?.trim();
                    const hasAr = !!page.title?.ar?.trim();
                    const hasAm = !!page.title?.am?.trim();
                    return (
                      <tr key={page.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{page.title?.en || page.slug}</td>
                        <td className="py-3 px-4 font-mono text-xs">/{page.slug}</td>
                        <td className="py-3 px-4">{getStatusBadge(page.status)}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5 text-[10px] font-mono">
                            <span
                              className={
                                hasEn ? "text-green-600 font-bold" : "text-muted-foreground/40"
                              }
                            >
                              EN
                            </span>
                            <span
                              className={
                                hasAr ? "text-green-600 font-bold" : "text-muted-foreground/40"
                              }
                            >
                              AR
                            </span>
                            <span
                              className={
                                hasAm ? "text-green-600 font-bold" : "text-muted-foreground/40"
                              }
                            >
                              AM
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(page.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {page.status === PageStatus.PUBLISHED && (
                              <Link
                                to={`/${page.slug}`}
                                target="_blank"
                                className="p-2 hover:text-primary"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openEdit(page)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleDelete(page)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>

        <Dialog
          open={showForm}
          onOpenChange={(open) => {
            if (!open) {
              setShowForm(false);
              setEditingPage(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingPage ? "Edit Support Page" : "Create Support Page"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="e.g. privacy-policy"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v: PageStatus) => setForm({ ...form, status: v })}
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
                label="Page Title"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
              />
              <LocalizedFields
                label="Subtitle"
                value={form.subtitle}
                onChange={(v) => setForm({ ...form, subtitle: v })}
                multiline
              />
              <LocalizedRichTextField
                label="Rich Content"
                value={form.content}
                onChange={(v) => setForm({ ...form, content: v })}
              />

              <GlassPanel className="p-4 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4" /> SEO Settings
                </h3>
                <LocalizedFields
                  label="Meta Title"
                  value={form.metaTitle}
                  onChange={(v) => setForm({ ...form, metaTitle: v })}
                />
                <LocalizedFields
                  label="Meta Description"
                  value={form.metaDescription}
                  onChange={(v) => setForm({ ...form, metaDescription: v })}
                  multiline
                />
                <LocalizedFields
                  label="Meta Keywords"
                  value={form.metaKeywords}
                  onChange={(v) => setForm({ ...form, metaKeywords: v })}
                  multiline
                />
                <ImageUploadField
                  label="Open Graph Image"
                  imageUrl={form.ogImage}
                  onChange={(url) => setForm({ ...form, ogImage: url })}
                  onUpload={uploadCmsImage}
                />
              </GlassPanel>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleSave(PageStatus.DRAFT)}
                  disabled={saving}
                  variant="outline"
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave(PageStatus.PUBLISHED)}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Publish
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
