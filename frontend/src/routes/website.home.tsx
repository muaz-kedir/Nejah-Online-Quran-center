import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  uploadCmsImage,
  type HomeMissionCard,
  type HomeMissionSection,
  type HomeProgram,
  type HomeProgramsSection,
  type LocalizedText,
  EMPTY_LOCALIZED,
} from '@/lib/home-cms';
import { LocalizedFields, ImageUploadField } from '@/components/website-cms/CmsFormFields';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
} from 'lucide-react';

export const Route = createFileRoute('/website/home')({
  component: WebsiteHomeCmsPage,
  beforeLoad: () => requireAuth(['super_admin']),
});

function WebsiteHomeCmsPage() {
  const [tab, setTab] = useState('mission');

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          eyebrow="Website Management"
          title="Home Page CMS"
          description="Manage Our Mission and Programs sections in English, Arabic, and Amharic"
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="mission">Our Mission Section</TabsTrigger>
            <TabsTrigger value="programs">Programs Section</TabsTrigger>
          </TabsList>
          <TabsContent value="mission" className="mt-6">
            <MissionSectionEditor />
          </TabsContent>
          <TabsContent value="programs" className="mt-6">
            <ProgramsSectionEditor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

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
        '/website/admin/home/mission',
      );
      setSection(data.section);
      setCards(data.cards);
    } catch (e: any) {
      const msg =
        e.message?.includes('404') || e.message?.includes('Request failed: 404')
          ? 'Website CMS API not found on the server. Redeploy the backend (Render) with the latest code, then refresh.'
          : e.message || 'Failed to load mission content';
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
      const updated = await api<HomeMissionSection>('/website/admin/home/mission', {
        method: 'PUT',
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
      toast.success('Mission section saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
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
          method: 'PATCH',
          body: JSON.stringify(cardForm),
        });
        toast.success('Card updated');
      } else {
        await api('/website/admin/home/mission/cards', {
          method: 'POST',
          body: JSON.stringify(cardForm),
        });
        toast.success('Card created');
      }
      setEditingCard(null);
      setShowCardForm(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save card');
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm('Delete this card?')) return;
    try {
      await api(`/website/admin/home/mission/cards/${id}`, { method: 'DELETE' });
      toast.success('Card deleted');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const moveCard = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= cards.length) return;
    const ids = [...cards].sort((a, b) => a.displayOrder - b.displayOrder).map((c) => c.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(newIndex, 0, removed);
    try {
      const reordered = await api<HomeMissionCard[]>('/website/admin/home/mission/cards/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      setCards(reordered);
    } catch (e: any) {
      toast.error(e.message || 'Failed to reorder');
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
                <p className="font-semibold truncate">{card.title?.en || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground">
                  {card.isActive ? 'Visible' : 'Hidden'} · Order {card.displayOrder}
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
            <h4 className="font-semibold">{editingCard ? 'Edit Card' : 'New Card'}</h4>
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
    imageUrl: null as string | null,
    isActive: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ section: HomeProgramsSection; programs: HomeProgram[] }>(
        '/website/admin/home/programs',
      );
      setSection(data.section);
      setPrograms(data.programs);
    } catch (e: any) {
      const msg =
        e.message?.includes('404') || e.message?.includes('Request failed: 404')
          ? 'Website CMS API not found on the server. Redeploy the backend (Render) with the latest code, then refresh.'
          : e.message || 'Failed to load programs';
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
      const updated = await api<HomeProgramsSection>('/website/admin/home/programs', {
        method: 'PUT',
        body: JSON.stringify({
          sectionHeader: section.sectionHeader,
          mainTitle: section.mainTitle,
          description: section.description,
        }),
      });
      setSection(updated);
      toast.success('Programs section saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
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
      imageUrl: program.imageUrl,
      isActive: program.isActive,
    });
  };

  const saveProgram = async () => {
    try {
      if (editingProgram) {
        await api(`/website/admin/home/programs/items/${editingProgram.id}`, {
          method: 'PATCH',
          body: JSON.stringify(programForm),
        });
        toast.success('Program updated');
      } else {
        await api('/website/admin/home/programs/items', {
          method: 'POST',
          body: JSON.stringify(programForm),
        });
        toast.success('Program created');
      }
      setEditingProgram(null);
      setShowProgramForm(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save program');
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm('Delete this program?')) return;
    try {
      await api(`/website/admin/home/programs/items/${id}`, { method: 'DELETE' });
      toast.success('Program deleted');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
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
      const reordered = await api<HomeProgram[]>('/website/admin/home/programs/items/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      setPrograms(reordered);
    } catch (e: any) {
      toast.error(e.message || 'Failed to reorder');
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
                <p className="font-semibold truncate">{program.title?.en || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground">
                  {program.isActive ? 'Active' : 'Inactive'} · {program.level?.en} · Order{' '}
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
            <h4 className="font-semibold">{editingProgram ? 'Edit Program' : 'New Program'}</h4>
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
