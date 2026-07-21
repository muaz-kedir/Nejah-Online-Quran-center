/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState } from "react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
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
import { api } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { TeacherDashboardData, TodaySession, TeacherNote } from "@/lib/teacher-types";

export const Route = createLazyFileRoute('/teacher_dashboard')({
  component: TeacherDashboard,
});

const noteTypeColor: Record<string, string> = {
  "Class Reminder": "bg-primary",
  Observation: "bg-amber-500",
  "General Reminder": "bg-blue-500",
};
const noteTypeLabelColor: Record<string, string> = {
  "Class Reminder": "text-nejah-electric",
  Observation: "text-amber-600",
  "General Reminder": "text-blue-600",
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
function TeacherDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
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

  const { data: data, isLoading: loading } = useApiQuery<TeacherDashboardData>({
    queryKey: ['teacher-dashboard'],
    path: '/teacher/dashboard',
    refetchInterval: 30_000,
  });

  const { data: todaySessions, refetch: refetchSessions } = useApiQuery<TodaySession[]>({
    queryKey: ['teacher-today-sessions'],
    path: '/teacher/dashboard/today-sessions',
    refetchInterval: 60_000,
  });

  const { data: notes } = useApiQuery<TeacherNote[]>({
    queryKey: ['teacher-notes'],
    path: '/teacher/dashboard/notes',
    refetchInterval: 30_000,
  });

  const { data: completedTodaySessions } = useApiQuery<TodaySession[]>({
    queryKey: ['teacher-completed-today'],
    path: '/live-sessions/today',
    refetchInterval: 30_000,
  });

  const completedToday = completedTodaySessions?.filter(
    (s) => s.sessionStatus === "COMPLETED" || s.sessionStatus === "completed",
  ).length || 0;
  const completedSessions = completedTodaySessions?.filter(
    (s) => s.sessionStatus === "COMPLETED" || s.sessionStatus === "completed",
  ) || [];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0)
      return `Today, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  };

  const handleStartSession = async (session: TodaySession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!session.liveSessionId) {
      toast.error("Session not ready yet. Please wait a moment and refresh.");
      return;
    }
    if (session.sessionStatus === "LIVE") {
      window.location.href = `/classroom/${session.liveSessionId}`;
      return;
    }
    setStartSessionModal({ open: true, session });
  };

  const handleConfirmStartSession = async (meetingLink?: string) => {
    const session = startSessionModal.session;
    if (!session?.liveSessionId) return;

    const body = meetingLink ? JSON.stringify({ meetingLink }) : undefined;
    const result = await api<{
      meetingLink: string | null;
      notificationSummary: { studentCount: number; parentCount: number; warnings: string[] };
    }>(`/live-sessions/${session.liveSessionId}/start`, {
      method: "POST",
      body,
    });
    setStartSessionModal({ open: false, session: null });
    setStartedSessionResult({
      open: true,
      session,
      meetingLink: result.meetingLink || meetingLink || null,
      notificationSummary: result.notificationSummary,
    });
  };

  const handleOpenSession = async (scheduleId: string) => {
    try {
      const liveSession = await api<{ id?: string }>(
        `/live-sessions/for-schedule-today/${scheduleId}`,
      );
      if (liveSession?.id) {
        window.location.href = `/classroom/${liveSession.id}`;
      } else {
        toast.error("No session scheduled for today");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load session");
    }
  };

  const handleEndSession = async (session: TodaySession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!session.liveSessionId) {
      toast.error("Session not ready yet.");
      return;
    }
    if (!confirm("End this live session for all students?")) return;

    setEndingSessionId(session.liveSessionId);
    try {
      await api(`/live-sessions/${session.liveSessionId}/end`, { method: "POST" });
      toast.success("Session ended successfully");
      refetchSessions();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to end session");
    } finally {
      setEndingSessionId(null);
    }
  };

  // ── Notes actions
  const openCreate = () => setNoteModal({ open: true, note: null });
  const openEdit = (note: TeacherNote) => setNoteModal({ open: true, note });
  const closeModal = () => setNoteModal({ open: false, note: null });

  const handleSaveNote = async (body: { title: string; content: string; type: string }) => {
    const { note } = noteModal;
    try {
      if (note) {
        await api<TeacherNote>(`/teacher/dashboard/notes/${note.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        queryClient.invalidateQueries({ queryKey: ['teacher-notes'] });
        toast.success("Note updated!");
        closeModal();
      } else {
        await api<TeacherNote>("/teacher/dashboard/notes", {
          method: "POST",
          body: JSON.stringify(body),
        });
        queryClient.invalidateQueries({ queryKey: ['teacher-notes'] });
        toast.success("Note added!");
        closeModal();
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await api(`/teacher/dashboard/notes/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ['teacher-notes'] });
      toast.success("Note deleted");
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) return <TeacherPageLoader />;

  return (
    <TeacherPortalLayout
      activePath="/teacher_dashboard"
      teacher={data?.teacher}
      unreadNotifications={data?.unreadNotificationsCount}
    >
      <TeacherTopbar teacher={data?.teacher} />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-[0.2em] mb-2">
              Assalamu Alaikum, {data?.teacher?.fullName?.split(" ")[0] || "Teacher"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground font-serif">
              Dashboard Overview
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/teacher_schedule", search: {} })}
              className="h-12 flex-1 sm:flex-none rounded-xl px-6 border-border dark:border-white/10 font-bold text-muted-foreground dark:text-foreground gap-2"
            >
              View Schedule
            </Button>
            <Button
              onClick={openCreate}
              className="h-12 flex-1 sm:flex-none rounded-xl px-6 bg-nejah-surface hover:bg-nejah-sapphire font-bold gap-2 text-white shadow-xl"
            >
              <Plus className="h-5 w-5" /> New Lesson Note
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            value={data?.stats?.totalStudents || 0}
            label="My Students"
            color="text-nejah-electric"
            bgColor="bg-primary/10"
          />
          <StatCard
            icon={Calendar}
            value={data?.stats?.todayClasses || 0}
            label="Today's Classes"
            color="text-amber-700"
            bgColor="bg-amber-50/50"
          />
          <StatCard
            icon={Filter}
            value={`${data?.stats?.attendanceRate || 0}%`}
            label="Overall Attendance"
            color="text-nejah-electric"
            bgColor="bg-primary/10"
          />
          <StatCard
            icon={ClipboardList}
            value={data?.stats?.pendingHomeworkReviews || 0}
            label="Homework Pending"
            color="text-red-700"
            bgColor="bg-red-50/50"
          />
          <StatCard
            icon={CheckCircle2}
            value={completedToday}
            label="Today's Completed"
            color="text-emerald-600"
            bgColor="bg-emerald-50/50"
          />
        </div>

        {/* Temporary sections */}
        {(data?.temporaryStudents?.length ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-amber-900 mb-1">Temporary Students</h3>
            <p className="text-xs text-amber-700 mb-4">
              Enter a meeting link and create the class — the student will be notified to join.
            </p>
            <ul className="space-y-3">
              {data!.temporaryStudents!.map((r) => (
                <TemporaryReplacementClassCard
                  key={r.id}
                  assignment={r}
                  onStarted={() => {
                    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
                  }}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Progress Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground font-serif">
                Active Student Progress
              </h3>
              <button
                type="button"
                onClick={() => navigate({ to: "/teacher_students", search: {} })}
                className="text-xs font-bold text-nejah-sapphire text-foreground flex items-center gap-1 hover:underline"
              >
                View All Students <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="glass-panel bg-card dark:bg-nejah-surface rounded-[32px] overflow-hidden border border-border dark:border-white/5 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 dark:bg-background/30 text-[9px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest border-b border-border dark:border-white/5">
                    <th className="px-8 py-5">Student Name</th>
                    <th className="px-8 py-5">Current Surah/Juz</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-white/5">
                  {data?.studentProgress?.map((student) => (
                    <tr
                      key={student.id}
                      className="group hover:bg-muted/50 dark:hover:bg-background/50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/teacher_students/$studentId",
                          params: { studentId: student.id },
                          search: {},
                        })
                      }
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted dark:bg-background flex items-center justify-center font-bold text-xs text-muted-foreground dark:text-nejah-slate-blue group-hover:bg-primary/10 group-hover:text-nejah-electric transition-colors">
                            {student.initials}
                          </div>
                          <span className="font-bold text-foreground">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-semibold text-muted-foreground dark:text-foreground">
                          {student.currentSurah}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <Badge
                          className={cn(
                            "rounded-full border-none px-3 py-1 text-[8px] font-extrabold uppercase tracking-widest leading-none",
                            student.status === "EXCEEDING"
                              ? "bg-primary/10 text-nejah-electric"
                              : student.status === "ON TRACK"
                                ? "bg-primary/10 text-nejah-electric/70"
                                : student.status === "NEEDS REVIEW"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-muted dark:bg-background text-muted-foreground dark:text-nejah-slate-blue",
                          )}
                        >
                          {student.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-20">
                          <ProgressBar
                            value={student.progress}
                            className={cn(
                              "h-1.5",
                              student.status === "EXCEEDING"
                                ? "bg-primary/15 [&>div]:bg-primary"
                                : student.status === "NEEDS REVIEW"
                                  ? "bg-amber-100 [&>div]:bg-amber-600"
                                  : "bg-muted dark:bg-background [&>div]:bg-nejah-slate-blue dark:[&>div]:bg-nejah-slate-blue",
                            )}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Teacher Notes */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground font-serif">Teacher's Notes</h3>
              <button className="p-2 bg-muted dark:bg-background rounded-lg text-muted-foreground dark:text-nejah-slate-blue hover:bg-muted dark:hover:bg-nejah-surface transition-all">
                <Filter className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {notes.length === 0 && (
                <div className="bg-card dark:bg-nejah-surface rounded-[24px] p-8 border border-dashed border-border dark:border-white/10 text-center">
                  <p className="text-sm text-muted-foreground dark:text-nejah-slate-blue font-medium">
                    No notes yet. Add your first reflection!
                  </p>
                </div>
              )}

              {notes.map((note) => (
                <div
                  key={note.id}
                  className="glass-panel bg-card dark:bg-nejah-surface rounded-[24px] p-6 border border-border dark:border-white/5 shadow-sm relative group overflow-hidden"
                >
                  <div
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full",
                      noteTypeColor[note.type] || "bg-nejah-slate-blue dark:bg-nejah-slate-blue",
                    )}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEdit(note)}
                      className="p-1.5 rounded-lg bg-muted dark:bg-background hover:bg-primary/15 hover:text-nejah-electric text-muted-foreground dark:text-nejah-slate-blue transition-all"
                      title="Edit note"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 rounded-lg bg-muted dark:bg-background hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 text-muted-foreground dark:text-nejah-slate-blue transition-all"
                      title="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3 pr-16">
                    <span
                      className={cn(
                        "text-[9px] font-extrabold uppercase tracking-widest",
                        noteTypeLabelColor[note.type] ||
                          "text-muted-foreground dark:text-nejah-slate-blue",
                      )}
                    >
                      {note.type}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-foreground font-serif leading-tight mb-2">
                    {note.title}
                  </h4>
                  <p className="text-xs text-muted-foreground dark:text-nejah-slate-blue font-medium leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}

              <button
                onClick={openCreate}
                className="w-full h-16 rounded-[24px] border-2 border-dashed border-border dark:border-white/10 text-muted-foreground dark:text-nejah-slate-blue text-xs font-bold uppercase tracking-widest hover:border-nejah-electric/20 hover:text-nejah-electric transition-all"
              >
                + Add Personal Reflection
              </button>
            </div>
          </div>
        </div>

        {/* Today's Remaining Sessions */}
        <div className="space-y-8 pt-8">
          <h3 className="text-2xl font-bold text-foreground font-serif">
            Today's Remaining Sessions
          </h3>

          {todaySessions.length === 0 ? (
            <div className="glass-panel bg-card dark:bg-nejah-surface rounded-[32px] p-12 border border-border dark:border-white/5 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-10 w-10 text-nejah-electric" />
              </div>
              <h4 className="text-2xl font-bold text-foreground font-serif mb-2">
                No remaining sessions for today.
              </h4>
              <p className="text-muted-foreground dark:text-nejah-slate-blue font-medium">
                You have completed all your scheduled classes or have a day off.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {todaySessions.map((session) => {
                const isLive = session.sessionPhase === "live" || session.sessionStatus === "LIVE";
                const isReady = session.sessionPhase === "ready" || isLive;
                const isCompleted = session.sessionPhase === "completed";

                return (
                  <div
                    key={session.scheduleId}
                    className="glass-panel bg-card dark:bg-nejah-surface rounded-[40px] p-10 overflow-hidden relative group shadow-sm border border-border dark:border-white/5 hover:shadow-md hover:border-nejah-electric/15 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-bold text-foreground">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>

                    {!isCompleted && session.countdownMinutes !== null && !isLive && (
                      <p className="text-xs font-bold text-nejah-electric uppercase tracking-wider mb-4">
                        Starts in: {session.countdownMinutes} minute
                        {session.countdownMinutes !== 1 ? "s" : ""}
                      </p>
                    )}

                    <h4 className="text-4xl font-extrabold text-foreground font-serif mb-2 line-clamp-1">
                      {session.title}
                    </h4>
                    <p className="text-sm text-muted-foreground dark:text-nejah-slate-blue font-semibold mb-6">
                      {session.sessionType}
                    </p>
                    <p className="text-xs font-bold text-foreground mb-8">{session.studentName}</p>

                    <div className="flex items-center justify-between gap-4">
                      <Badge
                        className={cn(
                          "border-none font-bold text-[9px] uppercase tracking-wider px-3 py-1",
                          isCompleted
                            ? "bg-muted dark:bg-background text-muted-foreground"
                            : isLive
                              ? "bg-red-50 text-red-600 animate-pulse"
                              : isReady
                                ? "bg-primary/10 text-nejah-electric"
                                : "bg-blue-50 text-blue-600",
                        )}
                      >
                        {isLive
                          ? "LIVE NOW"
                          : isCompleted
                            ? "COMPLETED"
                            : isReady
                              ? "READY"
                              : "UPCOMING"}
                      </Badge>

                      {!isCompleted && (isLive || isReady) && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="rounded-xl font-bold uppercase tracking-wider text-[10px]"
                            onClick={(e) => handleStartSession(session, e)}
                          >
                            {isLive ? "Enter Classroom" : "Start Session"}
                          </Button>
                          {isLive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl font-bold uppercase tracking-wider text-[10px] border-red-200 text-red-600 hover:bg-red-50"
                              disabled={endingSessionId === session.liveSessionId}
                              onClick={(e) => handleEndSession(session, e)}
                            >
                              {endingSessionId === session.liveSessionId
                                ? "Ending..."
                                : "End Session"}
                            </Button>
                          )}
                        </div>
                      )}

                      {!isLive && !isReady && !isCompleted && (
                        <button
                          type="button"
                          className="text-sm font-extrabold text-nejah-electric hover:underline"
                          onClick={() => handleOpenSession(session.scheduleId)}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Completed Sessions */}
        {completedSessions.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground font-serif">
                    Recently Completed
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider">
                    {completedToday} session{completedToday !== 1 ? "s" : ""} completed today
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/live-sessions" })}
                className="text-xs font-bold text-nejah-sapphire text-foreground flex items-center gap-1 hover:underline"
              >
                View All Sessions <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {completedSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id || session.scheduleId}
                  className="group bg-card dark:bg-nejah-surface rounded-2xl p-5 border border-border dark:border-white/5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate group-hover:text-emerald-600 transition-colors">
                          {session.metadata?.className || "Quran Class"}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground dark:text-nejah-slate-blue truncate">
                          {session.student?.fullName || session.studentName || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0 ml-4">
                      {session.actualStart && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-nejah-slate-blue" />
                          <span className="text-xs font-bold tabular-nums text-foreground">
                            {new Date(session.actualStart).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {session.actualEnd &&
                              ` - ${new Date(session.actualEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5 text-nejah-slate-blue" />
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {session.durationMinutes || "—"}m
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-nejah-slate-blue" />
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {session.attendances?.length || session.participantCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Add Note button */}
      <div className="fixed bottom-10 right-10">
        <button
          onClick={openCreate}
          className="w-14 h-14 bg-nejah-surface rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {noteModal.open && (
        <NoteModal note={noteModal.note} onClose={closeModal} onSave={handleSaveNote} />
      )}

      {startSessionModal.open && startSessionModal.session && (
        <StartSessionModal
          open={startSessionModal.open}
          onClose={() => setStartSessionModal({ open: false, session: null })}
          onStart={handleConfirmStartSession}
          session={{
            title: startSessionModal.session.title,
            studentName: startSessionModal.session.studentName,
            startTime: startSessionModal.session.startTime,
            endTime: startSessionModal.session.endTime,
          }}
        />
      )}

      {startedSessionResult.open && startedSessionResult.session && (
        <SessionStartedDialog
          open={startedSessionResult.open}
          onClose={() => setStartedSessionResult({ open: false, session: null, meetingLink: null, notificationSummary: { studentCount: 0, parentCount: 0, warnings: [] } })}
          onGoToClassroom={() => {
            window.location.href = `/classroom/${startedSessionResult.session!.liveSessionId}`;
          }}
          session={{
            title: startedSessionResult.session.title,
            studentName: startedSessionResult.session.studentName,
          }}
          meetingLink={startedSessionResult.meetingLink}
          notificationSummary={startedSessionResult.notificationSummary}
        />
      )}
    </TeacherPortalLayout>
  );
}
