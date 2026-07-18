/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect } from "react";
import { createLazyFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Bell,
  ChevronRight,
  BookOpen,
  Plus,
  Clock,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Filter,
  Pencil,
  Trash2,
  Save,
  ArrowRight,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { toast } from "sonner";
import { TemporaryReplacementClassCard } from "@/components/teachers/TemporaryReplacementClassCard";
import { TeacherPortalLayout, TeacherPageLoader } from "@/components/teachers/TeacherPortalLayout";
import { TeacherTopbar } from "@/components/teachers/TeacherTopbar";
import { NoteModal } from "@/components/teachers/NoteModal";
import { StartSessionModal } from "@/components/teachers/StartSessionModal";
import { SessionStartedDialog } from "@/components/teachers/SessionStartedDialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { api, API_BASE } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import type { TeacherDashboardData, TodaySession, TeacherNote } from "@/lib/teacher-types";

export const Route = createLazyFileRoute('/teacher_dashboard')({
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState(0);
  const [completedSessions, setCompletedSessions] = useState<TodaySession[]>([]);
  const [noteModal, setNoteModal] = useState<{ open: boolean; note: TeacherNote | null }>({
    open: false,
    note: null,
  });
  const [startSessionModal, setStartSessionModal] = useState<{
    open: boolean;
    session: TodaySession | null;
  }>({ open: false, session: null });
  const [startedSessionResult, setStartedSessionResult] = useState<{
    open: boolean;
    session: TodaySession | null;
    meetingLink: string | null;
    notificationSummary: { studentCount: number; parentCount: number; warnings: string[] };
  }>({ open: false, session: null, meetingLink: null, notificationSummary: { studentCount: 0, parentCount: 0, warnings: [] } });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0)
      return `Today, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  }
