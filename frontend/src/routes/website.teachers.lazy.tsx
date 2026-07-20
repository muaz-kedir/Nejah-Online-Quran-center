/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from "react";
import { createLazyFileRoute} from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  uploadCmsImage,
  resolveCmsImageUrl,
  type HomeTeacher,
} from "@/lib/home-cms";
import { ImageUploadField } from "@/components/website-cms/CmsFormFields";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createLazyFileRoute('/website/teachers')({
  component: WebsiteTeachersCmsPage,
});

function WebsiteTeachersCmsPage() {
  const [teachers, setTeachers] = useState<HomeTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<HomeTeacher | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    userId: null as string | null,
    fullName: "",
    specialization: "",
    experience: "",
    imageUrl: null as string | null,
    isActive: true,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<HomeTeacher[]>("/website/admin/home/teachers");
      setTeachers(data || []);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api<UserSearchResult[]>(
        `/website/admin/home/teachers/search-users?q=${encodeURIComponent(q)}`,
      );
      setSearchResults(data || []);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user: UserSearchResult) => {
    setForm({
      ...form,
      userId: user.id,
      fullName: user.name,
    });
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const openNew = () => {
    setEditingTeacher(null);
    setShowForm(true);
    setForm({
      userId: null,
      fullName: "",
      specialization: "",
      experience: "",
      imageUrl: null,
      isActive: true,
    });
  };

  const openEdit = (t: HomeTeacher) => {
    setEditingTeacher(t);
    setShowForm(true);
    setForm({
      userId: t.userId,
      fullName: t.fullName,
      specialization: t.specialization,
      experience: t.experience || "",
      imageUrl: t.imageUrl,
      isActive: t.isActive,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.specialization) {
      toast.error("Full Name and Specialization are required");
      return;
    }
    setSaving(true);
    try {
      if (editingTeacher) {
        await api(`/website/admin/home/teachers/${editingTeacher.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Teacher updated");
      } else {
        await api("/website/admin/home/teachers", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Teacher created");
      }
      setShowForm(false);
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await api(`/website/admin/home/teachers/${id}`, { method: "DELETE" });
      toast.success("Teacher deleted");
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete teacher");
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    const sorted = [...teachers].sort((a, b) => a.displayOrder - b.displayOrder);
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const ids = sorted.map((t) => t.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(newIndex, 0, removed);
    try {
      const reordered = await api<HomeTeacher[]>("/website/admin/home/teachers/reorder", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setTeachers(reordered);
      toast.success("Display order updated");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to reorder");
    }
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

  const sortedTeachers = [...teachers].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website Management"
          title="Teachers CMS"
          description="Manage teachers displayed on the website landing page"
        />

        <GlassPanel className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Teachers</h3>
              <p className="text-sm text-muted-foreground">
                Add, edit, and reorder teachers shown on the public home page.
              </p>
            </div>
            <Button onClick={openNew} className="gap-1">
              <Plus className="h-4 w-4" /> Add Teacher
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No teachers found. Add a teacher to get started.
                    </td>
                  </tr>
                ) : (
                  sortedTeachers.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4">
                        {t.imageUrl ? (
                          <img
                            src={resolveCmsImageUrl(t.imageUrl)}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {t.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">{t.fullName}</td>
                      <td className="py-3 px-4">{t.specialization}</td>
                      <td className="py-3 px-4">{t.experience || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            t.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{t.displayOrder}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            title="Move Up"
                            type="button"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={idx === sortedTeachers.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            title="Move Down"
                            type="button"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(t)}
                            title="Edit"
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(t.id)}
                            title="Delete"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        {showForm && (
          <GlassPanel className="p-6 border border-primary/20 space-y-6">
            <h3 className="font-bold text-lg border-b pb-2">
              {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <Label>Link to Registered User</Label>
                <div className="flex items-center gap-2">
                  {form.userId ? (
                    <div className="flex items-center gap-2 flex-1 rounded-xl border border-border p-2 bg-background/50">
                      <span className="text-sm font-medium flex-1">
                        User selected (ID: {form.userId.slice(0, 8)}...)
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({ ...form, userId: null })
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowSearch(true)}
                    >
                      <Search className="h-4 w-4" /> Search Users
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Sheikh Ahmad Al-Farsi"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="e.g. Tajweed & Hifz"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  placeholder="e.g. 12+ years experience"
                />
              </div>

              <ImageUploadField
                label="Profile Image"
                imageUrl={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                onUpload={uploadCmsImage}
              />

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <span className="text-sm font-semibold">Active (visible on website)</span>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTeacher ? "Update Teacher" : "Create Teacher"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTeacher(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </GlassPanel>
        )}

        <Dialog open={showSearch} onOpenChange={(open) => { if (!open) { setShowSearch(false); setSearchQuery(""); setSearchResults([]); } }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Search Registered Users</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => doSearch(e.target.value)}
                autoFocus
              />
              {searching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              )}
              {searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors border border-border"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 && !searching ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found matching "{searchQuery}"
                </p>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
