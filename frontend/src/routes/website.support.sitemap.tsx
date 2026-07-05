import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { requireAuth } from "@/lib/auth";
import {
  getSitemap, createSitemapItem, updateSitemapItem, deleteSitemapItem, reorderSitemap,
  type SitemapItem,
} from "@/lib/support-pages";
import { Loader2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/website/support/sitemap")({
  component: SitemapCmsPage,
  beforeLoad: () => requireAuth(["super_admin"]),
});

function SortableItem({ item, onEdit, onDelete }: { item: SitemapItem; onEdit: (i: SitemapItem) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-xl border border-border p-3 bg-background/50 hover:bg-muted/30">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:text-primary">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground font-mono">{item.url}</p>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-xs ${item.isVisible ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}`}>
        {item.isVisible ? "Visible" : "Hidden"}
      </span>
      <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDelete(item.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SitemapCmsPage() {
  const [items, setItems] = useState<SitemapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SitemapItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    url: "",
    parentId: "",
    isVisible: true,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getSitemap();
      setItems(data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load sitemap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const openNew = () => {
    setEditingItem(null);
    setShowForm(true);
    setForm({ title: "", url: "/", parentId: "", isVisible: true });
  };

  const openEdit = (item: SitemapItem) => {
    setEditingItem(item);
    setShowForm(true);
    setForm({ title: item.title, url: item.url, parentId: item.parentId || "", isVisible: item.isVisible });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    setSaving(true);
    try {
      const dto = { ...form, parentId: form.parentId || undefined };
      if (editingItem) {
        await updateSitemapItem(editingItem.id, dto);
        toast.success("Item updated");
      } else {
        await createSitemapItem(dto);
        toast.success("Item created");
      }
      setShowForm(false);
      setEditingItem(null);
      await loadItems();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sitemap item?")) return;
    try {
      await deleteSitemapItem(id);
      toast.success("Item deleted");
      await loadItems();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setItems(reordered);
    try {
      await reorderSitemap(reordered.map((i) => i.id));
      toast.success("Order updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to reorder");
      await loadItems();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  const sortedItems = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website CMS"
          title="Sitemap Manager"
          description="Drag and drop to reorder. Manage which pages appear in the sitemap."
          actions={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>}
        />

        <GlassPanel className="p-6">
          {sortedItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sitemap items yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedItems.map((item) => (
                    <SortableItem key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </GlassPanel>

        <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingItem(null); } }}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingItem ? "Edit Sitemap Item" : "Add Sitemap Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Home" />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="e.g. /" />
              </div>
              <div className="space-y-2">
                <Label>Parent Page (optional)</Label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">No parent (top-level)</option>
                  {sortedItems.filter((i) => i.id !== editingItem?.id).map((i) => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
                <span className="text-sm">Visible on sitemap</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingItem ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingItem(null); }}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
