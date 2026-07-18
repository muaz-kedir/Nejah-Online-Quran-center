/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { apiUrl } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { createLazyFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Bell,
  ChevronRight,
  BookOpen,
  Users,
  Clock,
  Calendar,
  ClipboardList,
  TrendingUp,
  Award,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ParentPortalLayout } from "@/components/parents/ParentPortalLayout";
import { PushNotificationToggle } from "@/components/ui/push-notification-toggle";
import { TelegramLink } from "@/components/ui/telegram-link";

export const Route = createLazyFileRoute('/parent_dashboard')({
  component: ParentDashboardRoute,
});

function ParentDashboardRoute() {
  const search = Route.useSearch();
  return (
    <LanguageProvider>
      <ParentDashboard initialTab={search.tab} />
    </LanguageProvider>
  );
}
