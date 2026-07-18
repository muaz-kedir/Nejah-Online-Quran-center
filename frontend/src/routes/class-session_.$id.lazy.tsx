/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useRef, useCallback } from "react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  Video,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  BookOpen,
  Calendar,
  LogOut,
  Sparkles,
  Info,
  ExternalLink,
  Timer,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { getLinkedStudentId } from "@/lib/student-portal";

export const Route = createLazyFileRoute('/class-session_/$id')({
  component: ClassSessionPage,
});

function ClassSessionPage() {
  return (
    <DashboardLayout>
      <ClassSessionContent />
    </DashboardLayout>
  );
}
