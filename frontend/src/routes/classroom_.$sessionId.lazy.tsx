/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE } from "@/lib/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { createLazyFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Video,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  StopCircle,
  Users,
  Wifi,
  FileText,
  BookOpen,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { isLiveSessionActive, joinLiveSessionWhenActive } from "@/lib/student-live-session";

export const Route = createLazyFileRoute('/classroom_/$sessionId')({
  component: ClassroomPage,
});

function ClassroomPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [classroom, setClassroom] = useState<ClassroomAccess | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [noteForm, setNoteForm] = useState({
    lessonSummary: "",
    topicsCovered: "",
    homeworkAssigned: "",
    completionRemarks: "",
    studentPerformance: "",
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  const loadClassroom = useCallback(async () => {
    try {
      const res = await fetch(`${API}/live-sessions/${sessionId}/classroom`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          toast.error("You don't have access to this classroom");
          navigate({ to: "/dashboard" });
          return;
        }
        throw new Error(err.message || "Cannot access classroom");
      }
      setClassroom(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    loadClassroom();
    pollRef.current = setInterval(loadClassroom, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadClassroom]);

  useEffect(() => {
    if (classroom?.countdownSeconds != null && classroom.countdownSeconds > 0) {
      setCountdown(classroom.countdownSeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev == null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [classroom?.countdownSeconds, classroom?.session?.status]);

  const goToDashboard = () => {
    if (role === "teacher") {
      navigate({ to: "/teacher_dashboard" });
    } else {
      navigate({ to: "/student_dashboard" });
    }
  };

  const recordLeave = async () => {
    try {
      await fetch(apiUrl(`/live-sessions/${sessionId}/leave`), {
        method: 'POST',
        headers: authHeaders(),
      });
    } catch {
      // Non-blocking — session end will still finalize attendance
    }
  };

  const handleLeave = async () => {
    await recordLeave();
    setSessionEnded(true);
    goToDashboard();
    toast.success("Session completed successfully");
  };

  const openExternalZoom = (access: ClassroomAccess) => {
    const url = access.meetingLink || (role === "teacher" ? access.startUrl || access.joinUrl : access.joinUrl);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opened meeting in a new tab");
    } else {
      toast.error("Meeting link not available yet");
    }
  };

  const joinSession = async () => {
    if (!classroom) return;

    const terminal = ["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"];
    if (role === "student" && terminal.includes(classroom.session?.status)) {
      toast.error(getStatusError(classroom.session?.status));
      return;
    }

    if (role === "student" && !isLiveSessionActive(classroom.session?.status)) {
      toast.info("Your teacher has not started the session yet. Please wait.");
      return;
    }

    setJoining(true);
    try {
      if (role === "student") {
        const result = await joinLiveSessionWhenActive(sessionId, classroom.session?.status);
        toast.success(
          result.alreadyJoined ? "Rejoined session — attendance already recorded" :           "Attendance recorded — joining session",
        );
      } else {
        const res = await fetch(`${API}/live-sessions/${sessionId}/join`, {
          method: "POST",
          headers: authHeaders(),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to join session");
        }
        openExternalZoom(classroom);
      }
      loadClassroom();
    } catch (e: any) {
      toast.error(e.message || "Failed to join session");
    } finally {
      setJoining(false);
    }
  };

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const body = meetingLinkInput ? JSON.stringify({ meetingLink: meetingLinkInput }) : undefined;
      const res = await fetch(`${API}/live-sessions/${sessionId}/start`, {
        method: "POST",
        headers: authHeaders(),
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to start session");
      }
      const result = await res.json().catch(() => ({}));
      const summary = result?.notificationSummary;
      if (summary && summary.studentCount > 0) {
        toast.success(
          `Session started — ${summary.studentCount} student${summary.studentCount !== 1 ? "s" : ""} notified` +
          (summary.parentCount > 0 ? `, ${summary.parentCount} parent${summary.parentCount !== 1 ? "s" : ""}` : "")
        );
      } else {
        toast.success("Session started!");
      }
      if (summary?.warnings?.length > 0) {
        toast.warning("Some notification channels reported temporary issues. Students may still receive notifications through other available channels.");
      }
      setMeetingLinkInput("");
      loadClassroom();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    setEnding(true);
    try {
      const res = await fetch(`${API}/live-sessions/${sessionId}/end`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ completionReason: "Teacher ended session" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to end session");
      }
      setSessionEnded(true);
      toast.success("Session ended successfully");
      loadClassroom();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnding(false);
    }
  };

  const handleSubmitNote = async () => {
    setSubmittingNote(true);
    try {
      const res = await fetch(`${API}/session-notes/session/${sessionId}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(noteForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save lesson notes");
      }
      toast.success("Lesson notes saved successfully");
      setShowNoteForm(false);
      setNoteForm({
        lessonSummary: "",
        topicsCovered: "",
        homeworkAssigned: "",
        completionRemarks: "",
        studentPerformance: "",
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const getStatusError = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "This session has already ended.";
      case "CANCELLED":
        return "This session was cancelled.";
      case "NO_SHOW":
        return "This session ended because no one joined.";
      case "EXPIRED":
        return "This session expired without starting.";
      default:
        return "This session is not available to join yet.";
    }
  };

  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return "Starting now";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const session = classroom?.session;
  const className = session?.metadata?.className || session?.schedule?.className || "Quran Class";
  const statusConfig =
    CLASSROOM_STATUS_LABELS[classroom?.classroomStatus || ""] ||
    CLASSROOM_STATUS_LABELS.not_available;
  const StatusIcon = statusConfig.icon;
  const isLive = classroom?.session?.status === "LIVE";
  const isScheduled = classroom?.session?.status === "SCHEDULED";
  const isTerminal = ["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"].includes(
    classroom?.session?.status,
  );
  const canJoin =
    role === "student"
      ? isLive
      : isLive || (isScheduled && classroom?.classroomStatus !== "not_available");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={goToDashboard}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold font-serif">{className}</h1>
            <p className="text-xs text-white/60">NEJAH Online Classroom</p>
          </div>
        </div>
        <Badge className={cn("uppercase text-[10px] border", statusConfig.color)}>
          <StatusIcon className="h-3 w-3 mr-1 inline" />
          {statusConfig.label}
        </Badge>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 text-center space-y-6">
        {!isTerminal && !sessionEnded && !isLive && countdown != null && countdown > 0 && (
          <div className="glass-panel bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="text-4xl font-bold font-mono text-emerald-400 mb-2">
              {formatCountdown(countdown)}
            </div>
            <p className="text-sm text-white/50">until session starts</p>
          </div>
        )}

        <div
          className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
            isLive ? "bg-red-500/20 animate-pulse" : "bg-emerald-500/20",
          )}
        >
          {isLive ? (
            <Wifi className="h-10 w-10 text-red-400" />
          ) : (
            <Video className="h-10 w-10 text-emerald-400" />
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold font-serif mb-2">
            {isLive ? "Class is Live" : isTerminal ? "Session Ended" : "Ready to Join"}
          </h2>
          <p className="text-white/70">
            {session?.scheduledStart
              ? new Date(session.scheduledStart).toLocaleString()
              : "Scheduled session"}
          </p>
          {classroom?.joinWindowOpenAt && !isLive && !isTerminal && (
            <p className="text-xs text-white/40 mt-1">
              Join window opens at {new Date(classroom.joinWindowOpenAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="glass-panel bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          {sessionEnded ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="font-semibold">Session Completed Successfully</p>
            </div>
          ) : classroom?.session?.status === "COMPLETED" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="font-semibold">Session Completed Successfully</p>
              {session?.durationMinutes && (
                <p className="text-sm text-white/50">Duration: {session.durationMinutes} minutes</p>
              )}
            </div>
          ) : classroom?.session?.status === "CANCELLED" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-12 w-12 text-red-400" />
              <p className="font-semibold text-red-300">Session Cancelled</p>
              {session?.cancellationReason && (
                <p className="text-sm text-white/50">{session.cancellationReason}</p>
              )}
            </div>
          ) : classroom?.session?.status === "NO_SHOW" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-12 w-12 text-gray-400" />
              <p className="font-semibold text-gray-300">No participants joined this session</p>
            </div>
          ) : classroom?.session?.status === "EXPIRED" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertTriangle className="h-12 w-12 text-orange-400" />
              <p className="font-semibold text-orange-300">Session expired without starting</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-white/60">
                {isLive
          ? "Class is in session. Click below to join the meeting."
          : "Click the button below to join when the session starts."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {role === "teacher" && isScheduled && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full max-w-md">
                      <Input
                        placeholder="Paste meeting link (Zoom, Meet, Teams...)"
                        value={meetingLinkInput}
                        onChange={(e) => setMeetingLinkInput(e.target.value)}
                        className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 text-center"
                      />
                    </div>
                    <Button
                      size="lg"
                      className="rounded-2xl px-8 bg-emerald-500 hover:bg-emerald-600"
                      onClick={handleStartSession}
                      disabled={starting}
                    >
                      {starting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start & Notify Students
                    </Button>
                  </div>
                )}

                {role === "teacher" && isLive && (
                  <Button
                    size="lg"
                    className="rounded-2xl px-8 bg-red-500 hover:bg-red-600"
                    onClick={handleEndSession}
                    disabled={ending}
                  >
                    {ending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <StopCircle className="h-4 w-4 mr-2" />
                    )}
                    End Session
                  </Button>
                )}

                <Button
                  size="lg"
                  className={cn(
                    "rounded-2xl px-8",
                    canJoin
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-white/10 text-white/50 cursor-not-allowed",
                  )}
                  onClick={joinSession}
                  disabled={joining || !canJoin}
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Video className="h-4 w-4 mr-2" />
                  )}
                  {role === "teacher" ? "Enter Classroom" : "Join Session"}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-white/20 text-white hover:bg-white/10"
                  onClick={handleLeave}
                >
                  Return to Dashboard
                </Button>
              </div>
            </>
          )}
        </div>

        {isLive && classroom?.session?.attendances?.length > 0 && (
          <div className="glass-panel bg-white/5 border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Live Attendance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(() => {
                const att = classroom.session.attendances || [];
                const present = att.filter(
                  (a: any) => a.attendanceStatus === "PRESENT" || a.attendanceStatus === "LATE",
                ).length;
                const absent = att.filter((a: any) => a.attendanceStatus === "ABSENT").length;
                const connected = att.filter((a: any) => a.joinTime && !a.leaveTime).length;
                return (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">{present}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{absent}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{connected}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        Connected
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{att.length}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Total</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {role === "teacher" && session?.status === "COMPLETED" && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button className="rounded-2xl" onClick={() => setShowNoteForm(!showNoteForm)}>
              <FileText className="h-4 w-4 mr-2" />
              {showNoteForm ? "Close Note Form" : "Post-Class Summary"}
            </Button>
          </div>
        )}

        {role === "teacher" && showNoteForm && session?.status === "COMPLETED" && (
          <div className="glass-panel bg-white/5 border border-white/10 rounded-3xl p-6 text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Post-Class Lesson Summary
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                  Lesson Summary
                </label>
                <Textarea
                  value={noteForm.lessonSummary}
                  onChange={(e) => setNoteForm({ ...noteForm, lessonSummary: e.target.value })}
                  placeholder="What was covered in today's lesson?"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                  Topics Covered
                </label>
                <Input
                  value={noteForm.topicsCovered}
                  onChange={(e) => setNoteForm({ ...noteForm, topicsCovered: e.target.value })}
                  placeholder="e.g. Surah Al-Mulk verses 1-10, Tajweed rules of Qalqalah"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                  Homework Assigned
                </label>
                <Input
                  value={noteForm.homeworkAssigned}
                  onChange={(e) => setNoteForm({ ...noteForm, homeworkAssigned: e.target.value })}
                  placeholder="e.g. Memorize verses 11-15, practice letter م"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                  <GraduationCap className="h-3 w-3 inline mr-1" /> Student Performance Notes
                </label>
                <Textarea
                  value={noteForm.studentPerformance}
                  onChange={(e) => setNoteForm({ ...noteForm, studentPerformance: e.target.value })}
                  placeholder="Overall class performance, noteworthy students, areas for improvement..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold block mb-1">
                  <MessageSquare className="h-3 w-3 inline mr-1" /> Completion Remarks
                </label>
                <Input
                  value={noteForm.completionRemarks}
                  onChange={(e) => setNoteForm({ ...noteForm, completionRemarks: e.target.value })}
                  placeholder="Any additional notes or reminders"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="rounded-2xl bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleSubmitNote}
                  disabled={submittingNote}
                >
                  {submittingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/20 text-white hover:bg-white/10"
                  onClick={() => setShowNoteForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isTerminal && !sessionEnded && (
          <div className="flex items-center justify-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {session?.scheduledStart
                ? new Date(session.scheduledStart).toLocaleTimeString()
                : "—"}
            </span>
            {session?.durationMinutes && <span>{session.durationMinutes} min</span>}
          </div>
        )}
      </main>
    </div>
  );
}
