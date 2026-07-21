import { apiUrl } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireParentAuth } from "@/lib/auth";
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

export const Route = createFileRoute("/parent_dashboard")({validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'dashboard'
    };
  },
  beforeLoad: () => requireParentAuth(['parent']),
});
