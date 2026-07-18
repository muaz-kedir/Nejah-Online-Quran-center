/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from "react";
import { createLazyFileRoute} from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  uploadCmsImage,
  resolveCmsImageUrl,
  type HomeMissionCard,
  type HomeMissionSection,
  type HomeProgram,
  type HomeProgramsSection,
  type LocalizedText,
  EMPTY_LOCALIZED,
  type Testimonial,
} from "@/lib/home-cms";
import { LocalizedFields, ImageUploadField } from "@/components/website-cms/CmsFormFields";
import { LocalizedRichTextField } from "@/components/website-cms/LocalizedRichTextField";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Star,
  Quote,
  Eye,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createLazyFileRoute('/website/home')({
  component: WebsiteHomeCmsPage,
});

function MissionSectionEditor() {
  const [section, setSection] = useState<HomeMissionSection | null>(null);
  const [cards, setCards] = useState<HomeMissionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCard, setEditingCard] = useState<HomeMissionCard | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({
    title: EMPTY_LOCALIZED,
    description: EMPTY_LOCALIZED,
    iconUrl: null as string | null,
    isActive: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ section: HomeMissionSection; cards: HomeMissionCard[] }>(
        "/website/admin/home/mission",
      );
      setSection(data.section);
      setCards(data.cards);
    } catch (e) {
      const err = e as Error;
      const msg =
        err.message?.includes("404") || err.message?.includes("Request failed: 404")
          ? "Website CMS API not found on the server. Redeploy the backend (Render) with the latest code, then refresh."
          : err.message || "Failed to load mission content";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSection = async () => {
    if (!section) return;
    setSaving(true);
    try {
      const updated = await api<HomeMissionSection>("/website/admin/home/mission", {
        method: "PUT",
        body: JSON.stringify({
          aboutHeader: section.aboutHeader,
          aboutDescription: section.aboutDescription,
          missionTitle: section.missionTitle,
          missionHeading: section.missionHeading,
          missionDescription: section.missionDescription,
          missionImageUrl: section.missionImageUrl,
        }),
      });
      setSection(updated);
      toast.success("Mission section saved");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openNewCard = () => {
    setEditingCard(null);
    setShowCardForm(true);
    setCardForm({
      title: EMPTY_LOCALIZED,
      description: EMPTY_LOCALIZED,
      iconUrl: null,
      isActive: true,
    });
  };

  const openEditCard = (card: HomeMissionCard) => {
    setEditingCard(card);
    setShowCardForm(true);
    setCardForm({
      title: { ...EMPTY_LOCALIZED, ...card.title },
      description: { ...EMPTY_LOCALIZED, ...card.description },
      iconUrl: card.iconUrl,
      isActive: card.isActive,
    });
  };

  const saveCard = async () => {
    try {
      if (editingCard) {
        await api(`/website/admin/home/mission/cards/${editingCard.id}`, {
          method: "PATCH",
          body: JSON.stringify(cardForm),
        });
        toast.success("Card updated");
      } else {
        await api("/website/admin/home/mission/cards", {
          method: "POST",
          body: JSON.stringify(cardForm),
        });
        toast.success("Card created");
      }
      setEditingCard(null);
      setShowCardForm(false);
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save card");
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    try {
      await api(`/website/admin/home/mission/cards/${id}`, { method: "DELETE" });
      toast.success("Card deleted");
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete");
    }
  };

  const moveCard = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= cards.length) return;
    const ids = [...cards].sort((a, b) => a.displayOrder - b.displayOrder).map((c) => c.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(newIndex, 0, removed);
    try {
      const reordered = await api<HomeMissionCard[]>("/website/admin/home/mission/cards/reorder", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setCards(reordered);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to reorder");
    }
  };

  if (loading || !section) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedCards = [...cards].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-bold text-lg">About & Mission Content</h3>
        <LocalizedFields
          label="Main Header"
          value={section.aboutHeader}
          onChange={(v) => setSection({ ...section, aboutHeader: v })}
        />
        <LocalizedFields
          label="Description"
          value={section.aboutDescription}
          onChange={(v) => setSection({ ...section, aboutDescription: v })}
          multiline
        />
        <LocalizedFields
          label="Mission Title"
          value={section.missionTitle}
          onChange={(v) => setSection({ ...section, missionTitle: v })}
        />
        <LocalizedFields
          label="Mission Heading"
          value={section.missionHeading}
          onChange={(v) => setSection({ ...section, missionHeading: v })}
        />
        <LocalizedFields
          label="Mission Description"
          value={section.missionDescription}
          onChange={(v) => setSection({ ...section, missionDescription: v })}
          multiline
        />
        <ImageUploadField
          label="Mission Image"
          imageUrl={section.missionImageUrl}
          onChange={(url) => setSection({ ...section, missionImageUrl: url })}
          onUpload={uploadCmsImage}
        />
        <Button onClick={saveSection} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Section
        </Button>
      </GlassPanel>

      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Feature Cards</h3>
          <Button size="sm" variant="outline" onClick={openNewCard} className="gap-1">
            <Plus className="h-4 w-4" /> Add Card
          </Button>
        </div>

        <div className="space-y-2">
          {sortedCards.map((card, index) => (
            <div
              key={card.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3 bg-background/50"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveCard(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === sortedCards.length - 1}
                  onClick={() => moveCard(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{card.title?.en || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">
                  {card.isActive ? "Visible" : "Hidden"} · Order {card.displayOrder}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEditCard(card)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => deleteCard(card.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {showCardForm && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <h4 className="font-semibold">{editingCard ? "Edit Card" : "New Card"}</h4>
            <LocalizedFields
              label="Title"
              value={cardForm.title}
              onChange={(v) => setCardForm({ ...cardForm, title: v })}
            />
            <LocalizedFields
              label="Description"
              value={cardForm.description}
              onChange={(v) => setCardForm({ ...cardForm, description: v })}
              multiline
            />
            <ImageUploadField
              label="Card Icon / Image"
              imageUrl={cardForm.iconUrl}
              onChange={(url) => setCardForm({ ...cardForm, iconUrl: url })}
              onUpload={uploadCmsImage}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={cardForm.isActive}
                onCheckedChange={(v) => setCardForm({ ...cardForm, isActive: v })}
              />
              <span className="text-sm">Visible on home page</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveCard}>Save Card</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCard(null);
                  setShowCardForm(false);
                  setCardForm({
                    title: EMPTY_LOCALIZED,
                    description: EMPTY_LOCALIZED,
                    iconUrl: null,
                    isActive: true,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function ProgramsSectionEditor() {
  const [section, setSection] = useState<HomeProgramsSection | null>(null);
  const [programs, setPrograms] = useState<HomeProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProgram, setEditingProgram] = useState<HomeProgram | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programForm, setProgramForm] = useState({
    level: EMPTY_LOCALIZED,
    title: EMPTY_LOCALIZED,
    description: EMPTY_LOCALIZED,
    detailedContent: EMPTY_LOCALIZED,
    imageUrl: null as string | null,
    isActive: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ section: HomeProgramsSection; programs: HomeProgram[] }>(
        "/website/admin/home/programs",
      );
      setSection(data.section);
      setPrograms(data.programs);
    } catch (e) {
      const err = e as Error;
      const msg =
        err.message?.includes("404") || err.message?.includes("Request failed: 404")
          ? "Website CMS API not found on the server. Redeploy the backend (Render) with the latest code, then refresh."
          : err.message || "Failed to load programs";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSection = async () => {
    if (!section) return;
    setSaving(true);
    try {
      const updated = await api<HomeProgramsSection>("/website/admin/home/programs", {
        method: "PUT",
        body: JSON.stringify({
          sectionHeader: section.sectionHeader,
          mainTitle: section.mainTitle,
          description: section.description,
        }),
      });
      setSection(updated);
      toast.success("Programs section saved");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openNewProgram = () => {
    setEditingProgram(null);
    setShowProgramForm(true);
    setProgramForm({
      level: EMPTY_LOCALIZED,
      title: EMPTY_LOCALIZED,
      description: EMPTY_LOCALIZED,
      detailedContent: EMPTY_LOCALIZED,
      imageUrl: null,
      isActive: true,
    });
  };

  const openEditProgram = (program: HomeProgram) => {
    setEditingProgram(program);
    setShowProgramForm(true);
    setProgramForm({
      level: { ...EMPTY_LOCALIZED, ...program.level },
      title: { ...EMPTY_LOCALIZED, ...program.title },
      description: { ...EMPTY_LOCALIZED, ...program.description },
      detailedContent: { ...EMPTY_LOCALIZED, ...program.detailedContent },
      imageUrl: program.imageUrl,
      isActive: program.isActive,
    });
  };

  const saveProgram = async () => {
    try {
      if (editingProgram) {
        await api(`/website/admin/home/programs/items/${editingProgram.id}`, {
          method: "PATCH",
          body: JSON.stringify(programForm),
        });
        toast.success("Program updated");
      } else {
        await api("/website/admin/home/programs/items", {
          method: "POST",
          body: JSON.stringify(programForm),
        });
        toast.success("Program created");
      }
      setEditingProgram(null);
      setShowProgramForm(false);
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save program");
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    try {
      await api(`/website/admin/home/programs/items/${id}`, { method: "DELETE" });
      toast.success("Program deleted");
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete");
    }
  };

  const moveProgram = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    const sorted = [...programs].sort((a, b) => a.displayOrder - b.displayOrder);
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const ids = sorted.map((p) => p.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(newIndex, 0, removed);
    try {
      const reordered = await api<HomeProgram[]>("/website/admin/home/programs/items/reorder", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setPrograms(reordered);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to reorder");
    }
  };

  if (loading || !section) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedPrograms = [...programs].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 space-y-4">
        <h3 className="font-bold text-lg">Section Content</h3>
        <LocalizedFields
          label="Section Header"
          value={section.sectionHeader}
          onChange={(v) => setSection({ ...section, sectionHeader: v })}
        />
        <LocalizedFields
          label="Main Title"
          value={section.mainTitle}
          onChange={(v) => setSection({ ...section, mainTitle: v })}
        />
        <LocalizedFields
          label="Description"
          value={section.description}
          onChange={(v) => setSection({ ...section, description: v })}
          multiline
        />
        <Button onClick={saveSection} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Section
        </Button>
      </GlassPanel>

      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Programs</h3>
          <Button size="sm" variant="outline" onClick={openNewProgram} className="gap-1">
            <Plus className="h-4 w-4" /> Add Program
          </Button>
        </div>

        <div className="space-y-2">
          {sortedPrograms.map((program, index) => (
            <div
              key={program.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3 bg-background/50"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveProgram(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={index === sortedPrograms.length - 1}
                  onClick={() => moveProgram(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{program.title?.en || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">
                  {program.isActive ? "Active" : "Inactive"} · {program.level?.en} · Order{" "}
                  {program.displayOrder}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEditProgram(program)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => deleteProgram(program.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {showProgramForm && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <h4 className="font-semibold">{editingProgram ? "Edit Program" : "New Program"}</h4>
            <LocalizedFields
              label="Level"
              value={programForm.level}
              onChange={(v) => setProgramForm({ ...programForm, level: v })}
            />
            <LocalizedFields
              label="Title"
              value={programForm.title}
              onChange={(v) => setProgramForm({ ...programForm, title: v })}
            />
            <LocalizedFields
              label="Description"
              value={programForm.description}
              onChange={(v) => setProgramForm({ ...programForm, description: v })}
              multiline
            />
            <LocalizedRichTextField
              label="Detailed Content"
              value={programForm.detailedContent}
              onChange={(v) => setProgramForm({ ...programForm, detailedContent: v })}
              placeholder="Full course details, syllabus, learning outcomes..."
            />
            <ImageUploadField
              label="Program Image"
              imageUrl={programForm.imageUrl}
              onChange={(url) => setProgramForm({ ...programForm, imageUrl: url })}
              onUpload={uploadCmsImage}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={programForm.isActive}
                onCheckedChange={(v) => setProgramForm({ ...programForm, isActive: v })}
              />
              <span className="text-sm">Active on home page</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveProgram}>Save Program</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingProgram(null);
                  setShowProgramForm(false);
                  setProgramForm({
                    level: EMPTY_LOCALIZED,
                    title: EMPTY_LOCALIZED,
                    description: EMPTY_LOCALIZED,
                    detailedContent: EMPTY_LOCALIZED,
                    imageUrl: null,
                    isActive: true,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function TestimonialsSectionEditor() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [previewTestimonial, setPreviewTestimonial] = useState<Testimonial | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "ar" | "am">("en");

  const [form, setForm] = useState({
    studentName: "",
    parentName: "",
    displayName: "",
    studentType: "child" as "child" | "adult" | "parent",
    country: "",
    city: "",
    photo: null as string | null,
    rating: 5,
    program: "",
    learningDuration: "",
    studentSince: "",
    testimonialText: { en: "", ar: "", am: "" },
    isFeatured: false,
    isPublished: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Testimonial[]>("/website/admin/home/testimonials");
      setTestimonials(data || []);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingTestimonial(null);
    setShowForm(true);
    setForm({
      studentName: "",
      parentName: "",
      displayName: "",
      studentType: "child",
      country: "",
      city: "",
      photo: null,
      rating: 5,
      program: "",
      learningDuration: "",
      studentSince: "",
      testimonialText: { en: "", ar: "", am: "" },
      isFeatured: false,
      isPublished: true,
    });
  };

  const openEdit = (t: Testimonial) => {
    setEditingTestimonial(t);
    setShowForm(true);
    setForm({
      studentName: t.studentName || "",
      parentName: t.parentName || "",
      displayName: t.displayName || "",
      studentType: t.studentType || "child",
      country: t.country || "",
      city: t.city || "",
      photo: t.photo || null,
      rating: t.rating || 5,
      program: t.program || "",
      learningDuration: t.learningDuration || "",
      studentSince: t.studentSince || "",
      testimonialText: {
        en: t.testimonialText?.en || "",
        ar: t.testimonialText?.ar || "",
        am: t.testimonialText?.am || "",
      },
      isFeatured: !!t.isFeatured,
      isPublished: !!t.isPublished,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName || !form.displayName || !form.country) {
      toast.error("Student Name, Display Name, and Country are required");
      return;
    }
    setSaving(true);
    try {
      if (editingTestimonial) {
        await api(`/website/admin/home/testimonials/${editingTestimonial.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Testimonial updated");
      } else {
        await api("/website/admin/home/testimonials", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Testimonial created");
      }
      setShowForm(false);
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to save testimonial");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    try {
      await api(`/website/admin/home/testimonials/${id}`, { method: "DELETE" });
      toast.success("Testimonial deleted");
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to delete testimonial");
    }
  };

  const handleQuickPublishToggle = async (t: Testimonial) => {
    try {
      await api(`/website/admin/home/testimonials/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !t.isPublished }),
      });
      toast.success(`Testimonial ${t.isPublished ? "unpublished" : "published"}`);
      await load();
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to toggle publish status");
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    const sorted = [...testimonials].sort((a, b) => a.displayOrder - b.displayOrder);
    if (newIndex < 0 || newIndex >= sorted.length) return;
    const ids = sorted.map((t) => t.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(newIndex, 0, removed);
    try {
      const reordered = await api<Testimonial[]>("/website/admin/home/testimonials/reorder", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      setTestimonials(reordered);
      toast.success("Display order updated");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Failed to reorder testimonials");
    }
  };

  const getInitials = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : "T";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedTestimonials = [...testimonials].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Testimonials</h3>
            <p className="text-sm text-muted-foreground">
              Manage client reviews displayed on the website landing page.
            </p>
          </div>
          <Button onClick={openNew} className="gap-1">
            <Plus className="h-4 w-4" /> Add Testimonial
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-b">
              <tr>
                <th className="py-3 px-4 w-12">Photo</th>
                <th className="py-3 px-4">Display Name</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Languages</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedTestimonials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-muted-foreground">
                    No testimonials found. Add a testimonial to get started.
                  </td>
                </tr>
              ) : (
                sortedTestimonials.map((t, idx) => {
                  const hasEn = !!t.testimonialText?.en?.trim();
                  const hasAr = !!t.testimonialText?.ar?.trim();
                  const hasAm = !!t.testimonialText?.am?.trim();

                  return (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4">
                        {t.photo ? (
                          <img
                            src={resolveCmsImageUrl(t.photo)}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {getInitials(t.displayName || t.studentName)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {t.displayName}
                        {t.parentName && (
                          <span className="block text-xs text-muted-foreground">
                            Parent: {t.parentName}
                          </span>
                        )}
                        <span className="block text-[10px] text-muted-foreground uppercase font-semibold">
                          {t.studentType}
                        </span>
                      </td>
                      <td className="py-3 px-4">{t.program || "\u2014"}</td>
                      <td className="py-3 px-4">
                        {t.country}
                        {t.city && (
                          <span className="block text-xs text-muted-foreground">{t.city}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-0.5 text-yellow-500">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 text-[10px] font-mono">
                          <span className={hasEn ? "text-green-600 font-bold" : "text-muted-foreground/40"}>EN</span>
                          <span className={hasAr ? "text-green-600 font-bold" : "text-muted-foreground/40"}>AR</span>
                          <span className={hasAm ? "text-green-600 font-bold" : "text-muted-foreground/40"}>AM</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleQuickPublishToggle(t)}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            t.isPublished
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {t.isPublished ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={t.isFeatured ? "text-primary font-bold" : "text-muted-foreground"}>
                          {t.isFeatured ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{t.displayOrder}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={idx === 0} onClick={() => handleMove(idx, -1)} title="Move Up" type="button">
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={idx === sortedTestimonials.length - 1} onClick={() => handleMove(idx, 1)} title="Move Down" type="button">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreviewTestimonial(t)} title="Preview Testimonial" type="button">
                            <Eye className="h-4 w-4 text-sky-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)} title="Edit" type="button">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(t.id)} title="Delete" type="button">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {showForm && (
        <GlassPanel className="p-6 border border-primary/20 space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">
            {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="studentName">Student Name *</Label>
                <Input id="studentName" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} placeholder="e.g. Fatima Hussein" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input id="displayName" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Name visible on review (e.g. Fatima H.)" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="parentName">Parent Name (Optional)</Label>
                <Input id="parentName" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="e.g. Ibrahim Hussein" />
              </div>
              <div className="space-y-1">
                <Label>Student Type</Label>
                <Select value={form.studentType} onValueChange={(val: "child" | "adult" | "parent") => setForm({ ...form, studentType: val })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="country">Country *</Label>
                <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. United States" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city">City (Optional)</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Seattle" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="program">Program / Course (Optional)</Label>
                <Input id="program" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="e.g. Qaida Nooraniya / Hifz" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="learningDuration">Learning Duration (Optional)</Label>
                <Input id="learningDuration" value={form.learningDuration} onChange={(e) => setForm({ ...form, learningDuration: e.target.value })} placeholder="e.g. 6 Months / 1 Year" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="studentSince">Student Since (Optional)</Label>
                <Input id="studentSince" value={form.studentSince} onChange={(e) => setForm({ ...form, studentSince: e.target.value })} placeholder="e.g. Jan 2025" />
              </div>
              <div className="space-y-1">
                <Label>Rating stars</Label>
                <Select value={String(form.rating)} onValueChange={(val) => setForm({ ...form, rating: Number(val) })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ImageUploadField label="Profile Photo" imageUrl={form.photo} onChange={(url) => setForm({ ...form, photo: url })} onUpload={uploadCmsImage} />
            <LocalizedFields label="Testimonial text" value={form.testimonialText} onChange={(v) => setForm({ ...form, testimonialText: v })} multiline />
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                <span className="text-sm font-semibold">Published (visible on website)</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                <span className="text-sm font-semibold">Featured (pin to top)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTestimonial ? "Update Testimonial" : "Create Testimonial"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingTestimonial(null); }}>Cancel</Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5 ml-auto"
                onClick={() => {
                  setPreviewTestimonial({ id: "temp", createdAt: "", updatedAt: "", displayOrder: 0, ...form } as Testimonial);
                }}
              >
                <Eye className="h-4 w-4" /> Live Preview
              </Button>
            </div>
          </form>
        </GlassPanel>
      )}

      <Dialog open={previewTestimonial !== null} onOpenChange={() => setPreviewTestimonial(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-6 dark:bg-nejah-surface dark:border-nejah-border-blue">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Testimonial Live Preview
            </DialogTitle>
          </DialogHeader>
          {previewTestimonial && (
            <div className="space-y-6 py-4">
              <p className="text-xs text-muted-foreground">
                Toggle languages to preview the testimonial exactly as it will render on the landing page.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["en", "ar", "am"] as const).map((lang) => (
                  <Button key={lang} variant={previewLang === lang ? "default" : "outline"} size="sm" className="rounded-xl uppercase font-bold" onClick={() => setPreviewLang(lang)}>
                    {lang === "en" ? "English \ud83c\uddec\ud83c\udde7" : lang === "ar" ? "Arabic \ud83c\uddf8\ud83c\udde6" : "Amharic \ud83c\uddea\ud83c\uddf9"}
                  </Button>
                ))}
              </div>
              <div className="border border-border rounded-3xl p-8 bg-background relative overflow-hidden shadow-sm dark:bg-nejah-surface dark:border-nejah-border-blue">
                <Quote className="absolute top-6 end-6 size-14 text-primary/10" />
                <div className="flex gap-0.5 mb-5 text-yellow-500">
                  {Array.from({ length: previewTestimonial.rating || 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4.5 w-4.5 fill-current" />
                  ))}
                </div>
                <p className="text-base md:text-lg font-medium leading-relaxed mb-6 italic" dir={previewLang === "ar" ? "rtl" : "ltr"}>
                  &ldquo;{previewTestimonial.testimonialText?.[previewLang] || previewTestimonial.testimonialText?.en || "No testimonial text added for this language."}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  {previewTestimonial.photo ? (
                    <img src={previewTestimonial.photo.startsWith("http") ? previewTestimonial.photo : resolveCmsImageUrl(previewTestimonial.photo)} alt="" className="h-11 w-11 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {getInitials(previewTestimonial.displayName || previewTestimonial.studentName)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground">
                      {previewTestimonial.displayName || previewTestimonial.studentName}
                      {previewTestimonial.parentName && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">(Parent: {previewTestimonial.parentName})</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span>{previewTestimonial.country}</span>
                      {previewTestimonial.program && (<><span className="opacity-40">&bull;</span><span className="text-primary font-medium">{previewTestimonial.program}</span></>)}
                      {previewTestimonial.learningDuration && (<><span className="opacity-40">&bull;</span><span>{previewTestimonial.learningDuration}</span></>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WebsiteHomeCmsPage() {
  const [tab, setTab] = useState("mission");

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website Management"
          title="Home Page CMS"
          description="Manage Our Mission, Programs, and Testimonials sections in English, Arabic, and Amharic"
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="mission">Our Mission Section</TabsTrigger>
            <TabsTrigger value="programs">Programs Section</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials Section</TabsTrigger>
          </TabsList>
          <TabsContent value="mission" className="mt-6">
            <MissionSectionEditor />
          </TabsContent>
          <TabsContent value="programs" className="mt-6">
            <ProgramsSectionEditor />
          </TabsContent>
          <TabsContent value="testimonials" className="mt-6">
            <TestimonialsSectionEditor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
