import { API_BASE } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Bell,
  HelpCircle,
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
  X,
  Save,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { toast } from "sonner";
import { TemporaryReplacementClassCard } from "@/components/teachers/TemporaryReplacementClassCard";
import { TeacherPortalLayout, TeacherPageLoader } from "@/components/teachers/TeacherPortalLayout";

const API = API_BASE;
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ─── Note types ────────────────────────────────────────────────────────────────
const NOTE_TYPES = ["Class Reminder", "Observation", "General Reminder"] as const;
type NoteType = (typeof NOTE_TYPES)[number];

const noteTypeColor: Record<NoteType, string> = {
  "Class Reminder": "bg-primary",
  Observation: "bg-amber-500",
  "General Reminder": "bg-blue-500",
};
const noteTypeLabelColor: Record<NoteType, string> = {
  "Class Reminder": "text-nejah-electric",
  Observation: "text-amber-600",
  "General Reminder": "text-blue-600",
};

// ─── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({ teacher }: any) => (
  <div className="h-20 hidden lg:flex items-center justify-between px-10 bg-card dark:bg-nejah-surface border-b border-border dark:border-white/5 sticky top-0 z-10 w-full">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-primary/10 rounded-lg lg:hidden">
        <LayoutDashboard className="h-5 w-5 text-nejah-electric" />
      </div>
      <h2 className="text-xl font-bold text-foreground font-serif hidden md:block">
        Teacher Suite
      </h2>
    </div>

    <div className="flex-1 max-w-xl mx-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-nejah-slate-blue" />
        <Input
          placeholder="Search students, resources, or notes..."
          className="pl-12 bg-muted dark:bg-background border-none rounded-2xl h-12 w-full focus-visible:ring-nejah-electric text-sm"
        />
      </div>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">
            {teacher?.name || "Teacher"}
          </p>
          <p className="text-[10px] text-muted-foreground dark:text-nejah-slate-blue font-bold uppercase tracking-wider">
            {teacher?.title || "Instructor"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-nejah-electric/15 p-0.5 bg-primary/10 flex items-center justify-center text-nejah-sapphire font-bold">
          {teacher?.avatar ? (
            <img
              src={teacher.avatar}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{(teacher?.name || "T").charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="w-px h-8 bg-muted dark:bg-white/5" />
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground dark:text-nejah-slate-blue hover:text-nejah-electric transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
        </button>
        <button className="p-2 text-muted-foreground dark:text-nejah-slate-blue hover:text-nejah-electric transition-colors">
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, subValue, label, color, bgColor }: any) => (
  <div className="glass-panel bg-card dark:bg-nejah-surface p-6 rounded-[24px] border border-border dark:border-white/5 shadow-sm flex flex-col justify-between">
    <div className="flex items-start justify-between">
      <div className={cn("p-4 rounded-2xl", bgColor)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      {subValue && (
        <Badge
          className={cn(
            "rounded-full border-none px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            subValue.includes("+")
              ? "bg-primary/10 text-nejah-electric"
              : subValue.includes("Next")
                ? "bg-amber-50 text-amber-600"
                : "bg-blue-50 text-blue-600",
          )}
        >
          {subValue}
        </Badge>
      )}
    </div>
    <div className="mt-6">
      <h3 className="text-3xl font-extrabold text-foreground font-serif leading-none">{value}</h3>
      <p className="text-sm font-semibold text-muted-foreground dark:text-nejah-slate-blue mt-2">
        {label}
      </p>
    </div>
  </div>
);

// ─── Note Modal ─────────────────────────────────────────────────────────────────
interface NoteModalProps {
  note: any;
  onClose: () => void;
  onSave: (data: { title: string; content: string; type: string }) => void;
}

const NoteModal = ({ note, onClose, onSave }: NoteModalProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [type, setType] = useState<NoteType>(note?.type || "General Reminder");
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    await onSave({ title, content, type });
    setSaving(false);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border dark:border-white/5">
          <div>
            <h3 className="text-xl font-extrabold text-foreground font-serif">
              {note ? "Edit Note" : "Add Personal Reflection"}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-nejah-slate-blue font-medium mt-0.5">
              Your notes are private and visible only to you
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground dark:text-nejah-slate-blue hover:bg-muted dark:hover:bg-background hover:text-muted-foreground dark:hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest">
              Note Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                    type === t
                      ? t === "Class Reminder"
                        ? "bg-primary border-nejah-electric text-white"
                        : t === "Observation"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-blue-500 border-blue-500 text-white"
                      : "border-border dark:border-white/10 text-muted-foreground dark:text-nejah-slate-blue hover:border-border dark:hover:border-white/20",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Focus on Makharij with Sarah"
              className="w-full px-4 py-3 rounded-xl border border-border dark:border-white/10 text-sm font-semibold text-foreground placeholder:text-muted-foreground dark:placeholder:text-nejah-slate-blue/50 focus:outline-none focus:ring-2 focus:ring-nejah-electric focus:border-transparent transition-all"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-widest">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note or observation here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border dark:border-white/10 text-sm font-medium text-muted-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-nejah-slate-blue/50 focus:outline-none focus:ring-2 focus:ring-nejah-electric focus:border-transparent transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground dark:text-nejah-slate-blue hover:bg-muted dark:hover:bg-background transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl text-sm font-bold bg-nejah-surface text-white hover:bg-nejah-sapphire transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : note ? "Save Changes" : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
function TeacherDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ open: boolean; note: any }>({
    open: false,
    note: null,
  });

  // ── Dynamic time status
  const getSessionStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const cur = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    if (cur > endTime) return "COMPLETED";
    if (cur >= startTime && cur <= endTime) return "LIVE NOW";
    return "READY TO START";
  };

  // ── Format date relative
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0)
      return `Today, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  };

  // ── Launch / start session via live-sessions
  const handleStartSession = async (session: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!session.liveSessionId) {
      toast.error("Session not ready yet. Please wait a moment and refresh.");
      return;
    }
    try {
      if (session.sessionStatus !== "LIVE") {
        const startRes = await fetch(`${API}/live-sessions/${session.liveSessionId}/start`, {
          method: "POST",
          headers: authHeaders(),
        });
        if (!startRes.ok) {
          const err = await startRes.json().catch(() => ({}));
          throw new Error(err.message || "Failed to start session");
        }
      }
      window.location.href = `/classroom/${session.liveSessionId}`;
    } catch (e: any) {
      toast.error(e.message || "Failed to start session");
    }
  };

  const handleOpenSession = async (scheduleId: string) => {
    try {
      const response = await fetch(`${API}/live-sessions/for-schedule-today/${scheduleId}`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const liveSession = await response.json();
        if (liveSession?.id) {
          window.location.href = `/classroom/${liveSession.id}`;
        } else {
          toast.error("No session scheduled for today");
        }
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to load session");
      }
    } catch {
      toast.error("Network error loading classroom");
    }
  };

  const loadTodaySessions = async () => {
    try {
      const sessRes = await fetch(`${API}/teacher/dashboard/today-sessions`, {
        headers: authHeaders(),
      });
      if (sessRes.ok) setTodaySessions(await sessRes.json());
    } catch {
      console.error("Failed to refresh today sessions");
    }
  };

  const handleEndSession = async (session: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!session.liveSessionId) {
      toast.error("Session not ready yet.");
      return;
    }
    if (!confirm("End this live session for all students?")) return;

    setEndingSessionId(session.liveSessionId);
    try {
      const res = await fetch(`${API}/live-sessions/${session.liveSessionId}/end`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to end session");
      }
      toast.success("Session ended successfully");
      await loadTodaySessions();
    } catch (e: any) {
      toast.error(e.message || "Failed to end session");
    } finally {
      setEndingSessionId(null);
    }
  };

  // ── Fetch all dashboard data
  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, sessRes, notesRes] = await Promise.all([
          fetch(`${API}/teacher/dashboard`, { headers: authHeaders() }),
          fetch(`${API}/teacher/dashboard/today-sessions`, { headers: authHeaders() }),
          fetch(`${API}/teacher/dashboard/notes`, { headers: authHeaders() }),
        ]);
        if (dashRes.ok) {
          const dash = await dashRes.json();
          if (dash.message) {
            toast.error(dash.message);
          } else {
            setData(dash);
          }
        } else if (dashRes.status === 403 || dashRes.status === 404) {
          const err = await dashRes.json().catch(() => ({}));
          toast.error(err.message || "Teacher profile not found for your account");
        }
        if (sessRes.ok) setTodaySessions(await sessRes.json());
        if (notesRes.ok) setNotes(await notesRes.json());
      } catch {
        console.error("Dashboard load failed");
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(loadTodaySessions, 60000);
    return () => clearInterval(iv);
  }, []);

  // ── Notes actions
  const openCreate = () => setNoteModal({ open: true, note: null });
  const openEdit = (note: any) => setNoteModal({ open: true, note });
  const closeModal = () => setNoteModal({ open: false, note: null });

  const handleSaveNote = async (body: { title: string; content: string; type: string }) => {
    const { note } = noteModal;
    try {
      if (note) {
        const res = await fetch(`${API}/teacher/dashboard/notes/${note.id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
          toast.success("Note updated!");
          closeModal();
        } else toast.error("Failed to update note");
      } else {
        const res = await fetch(`${API}/teacher/dashboard/notes`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          setNotes((prev) => [created, ...prev]);
          toast.success("Note added!");
          closeModal();
        } else toast.error("Failed to create note");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`${API}/teacher/dashboard/notes/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        toast.success("Note deleted");
      } else toast.error("Failed to delete note");
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
      <Topbar teacher={data?.teacher} />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-[0.2em] mb-2">
                Assalamu Alaikum, Teacher
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
              value={`${data?.stats?.overallAttendance || 0}%`}
              label="Overall Attendance"
              color="text-nejah-electric"
              bgColor="bg-primary/10"
            />
            <StatCard
              icon={ClipboardList}
              value={data?.stats?.homeworkPending || 0}
              label="Homework Pending"
              color="text-red-700"
              bgColor="bg-red-50/50"
            />
          </div>

          {/* My Students Gallery */}
          {data?.studentProgress?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Users className="h-5 w-5 text-nejah-electric" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground font-serif">My Students</h3>
                    <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider">
                      {data.studentProgress.length} active student
                      {data.studentProgress.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/teacher_students", search: {} })}
                  className="text-xs font-bold text-nejah-sapphire flex items-center gap-1 hover:underline"
                >
                  View All Students <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {data.studentProgress.slice(0, 8).map((student: any) => {
                  const statusColor =
                    student.status === "EXCEEDING"
                      ? "bg-green-500"
                      : student.status === "ON TRACK"
                        ? "bg-nejah-electric"
                        : student.status === "NEEDS REVIEW"
                          ? "bg-amber-500"
                          : "bg-muted-foreground";

                  return (
                    <div
                      key={student.id}
                      onClick={() =>
                        navigate({
                          to: "/teacher_students/$studentId",
                          params: { studentId: student.id },
                          search: {}
                        })
                      }
                      className="group bg-card dark:bg-nejah-surface rounded-[20px] p-5 border border-border dark:border-white/5 shadow-sm hover:shadow-md hover:border-nejah-electric/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-full bg-muted dark:bg-background flex items-center justify-center font-bold text-sm text-muted-foreground dark:text-nejah-slate-blue group-hover:bg-primary/10 group-hover:text-nejah-electric transition-colors shrink-0">
                          {student.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate leading-tight">
                            {student.name}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider truncate">
                            {student.currentSurah || "No current surah"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-2 h-2 rounded-full", statusColor)} />
                          <span className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider">
                            {student.status.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          {student.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 bg-muted dark:bg-background rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            student.status === "EXCEEDING"
                              ? "bg-green-500"
                              : student.status === "NEEDS REVIEW"
                                ? "bg-amber-500"
                                : "bg-nejah-electric",
                          )}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>

                      <div className="mt-4 pt-3 border-t border-border dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground dark:text-nejah-slate-blue font-medium">
                          View Details
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-nejah-electric opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(data?.temporaryStudents?.length > 0 || data?.reassignedAwayStudents?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.temporaryStudents?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-amber-900 mb-1">Temporary Students</h3>
                  <p className="text-xs text-amber-700 mb-4">
                    Enter your Zoom link and create the class — the student will be notified to
                    join.
                  </p>
                  <ul className="space-y-3">
                    {data.temporaryStudents.map((r: any) => (
                      <TemporaryReplacementClassCard
                        key={r.id}
                        assignment={r}
                        onStarted={() => {
                          fetch(`${API}/teacher/dashboard`, {
                            headers: { Authorization: `Bearer ${getToken()}` },
                          })
                            .then((res) => res.json())
                            .then(setData)
                            .catch(() => {});
                        }}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {data?.reassignedAwayStudents?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">
                    Students Temporarily Reassigned
                  </h3>
                  <ul className="space-y-2">
                    {data.reassignedAwayStudents.map((r: any) => (
                      <li
                        key={r.id}
                        className="text-sm text-blue-900 bg-white/70 rounded-lg px-3 py-2"
                      >
                        <span className="font-semibold">{r.student?.fullName}</span>
                        <span className="text-blue-700"> → {r.replacementTeacher?.fullName}</span>
                        <span className="text-blue-600">
                          {" "}
                          ({r.startDate} – {r.endDate})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Progress Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground font-serif">
                  Active Student Progress
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    navigate({ to: "/teacher_students", search: {} });
                  }}
                  className="text-xs font-bold text-nejah-sapphire flex items-center gap-1 hover:underline"
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
                    {data?.studentProgress?.map((student: any) => (
                      <tr
                        key={student.id}
                        className="group hover:bg-muted/50 dark:hover:bg-background/50 transition-colors cursor-pointer"
                        onClick={() => {
                          navigate({
                            to: "/teacher_students/$studentId",
                            params: { studentId: student.id },
                            search: {}
                          });
                        }}
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

                {notes.map((note: any) => (
                  <div
                    key={note.id}
                    className="glass-panel bg-card dark:bg-nejah-surface rounded-[24px] p-6 border border-border dark:border-white/5 shadow-sm relative group overflow-hidden"
                  >
                    {/* Colored accent bar */}
                    <div
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full",
                        noteTypeColor[note.type as NoteType] ||
                          "bg-nejah-slate-blue dark:bg-nejah-slate-blue",
                      )}
                    />

                    {/* Hover action buttons */}
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
                          noteTypeLabelColor[note.type as NoteType] ||
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
                {todaySessions.map((session: any) => {
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

      {/* Note Modal */}
      {noteModal.open && (
        <NoteModal note={noteModal.note} onClose={closeModal} onSave={handleSaveNote} />
      )}
    </TeacherPortalLayout>
  );
}

export const Route = createFileRoute("/teacher_dashboard")({
  component: TeacherDashboard,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      if (!token) {
        throw redirect({ to: "/login" });
      }
      if (role !== "teacher") {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
});
