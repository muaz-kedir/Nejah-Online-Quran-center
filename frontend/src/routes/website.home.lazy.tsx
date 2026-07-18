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
