import { useState, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TeacherLayout } from "@/components/dashboard/TeacherLayout";
import { PageHeader, GlassPanel } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { requireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Video,
  Clock,
  Calendar,
  Users,
  ExternalLink,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquareText,
  ClipboardList,
  Loader2,
  Plus,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  X,
  CalendarDays,
  UserPlus,
  Bell,
} from "lucide-react";

export const Route = createFileRoute("/teacher_zoom")({
  component: TeacherZoomPage,
  beforeLoad: () => requireAuth(["teacher"]),
});

function TeacherZoomPage() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [teacherSessions, setTeacherSessions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    studentId: "",
    scheduledStart: new Date().toISOString().slice(0, 16),
    notes: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api<any>("/teachers/students?limit=100");
      setStudents(data.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleScheduleSession = async () => {
    if (!scheduleForm.studentId || !scheduleForm.scheduledStart) {
      toast.error("Please select a student and start time");
      return;
    }
    setScheduling(true);
    try {
      const startDate = new Date(scheduleForm.scheduledStart);
      await api("/live-sessions/with-zoom", {
        method: "POST",
        body: JSON.stringify({
          studentId: scheduleForm.studentId,
          scheduledStart: startDate.toISOString(),
          notes: scheduleForm.notes || undefined,
        }),
      });
      toast.success("Session scheduled! Zoom meeting created and student notified.");
      setShowScheduleModal(false);
      setScheduleForm({ studentId: "", scheduledStart: new Date().toISOString().slice(0, 16), notes: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule session");
    } finally {
      setScheduling(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [upcomingData, sessionsData, analyticsData] = await Promise.all([
        api<any[]>("/live-sessions/upcoming").catch(() => []),
        api<any>("/live-sessions/teacher?limit=50").catch(() => ({ data: [] })),
        api<any>("/zoom-analytics/teacher").catch(() => null),
      ]);
      setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
      setTeacherSessions(Array.isArray(sessionsData?.data) ? sessionsData.data : []);
      setAnalytics(analyticsData);
    } catch {
      toast.error("Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    setStartingId(sessionId);
    try {
      await api(`/live-sessions/${sessionId}/start`, { method: "POST" });
      toast.success("Session started! Opening Zoom...");
      const session =
        upcoming.find((s: any) => s.id === sessionId) ||
        teacherSessions.find((s: any) => s.id === sessionId);
      if (session?.zoomJoinUrl) window.open(session.zoomJoinUrl, "_blank");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to start session");
    } finally {
      setStartingId(null);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    setCompletingId(sessionId);
    try {
      await api(`/live-sessions/${sessionId}/end`, { method: "POST" });
      toast.success("Session completed");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to end session");
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    setCancellingId(sessionId);
    try {
      await api(`/live-sessions/${sessionId}/cancel`, { method: "POST" });
      toast.success("Session cancelled");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel session");
    } finally {
      setCancellingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <Badge className="bg-red-500 text-white border-none text-[9px] font-black uppercase tracking-widest animate-pulse">
            LIVE
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none text-[9px] font-black uppercase tracking-widest">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none text-[9px] font-black uppercase tracking-widest">
            Cancelled
          </Badge>
        );
      case "NO_SHOW":
        return (
          <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-none text-[9px] font-black uppercase tracking-widest">
            No Show
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none text-[9px] font-black uppercase tracking-widest">
            Expired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none text-[9px] font-black uppercase tracking-widest">
            Scheduled
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="space-y-8 pb-12">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </TeacherLayout>
    );
  }

  const SessionCard = ({ session, isUpcoming }: { session: any; isUpcoming?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-background/50 border border-border dark:border-white/5 hover:bg-muted/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              session.status === "LIVE"
                ? "bg-red-100 dark:bg-red-900/30"
                : session.status === "COMPLETED"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : session.status === "NO_SHOW"
                    ? "bg-gray-200 dark:bg-gray-700"
                    : session.status === "EXPIRED"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-amber-100 dark:bg-amber-900/30",
            )}
          >
            {session.status === "LIVE" ? (
              <Video className="h-5 w-5 text-red-500" />
            ) : session.status === "COMPLETED" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : session.status === "NO_SHOW" ? (
              <XCircle className="h-5 w-5 text-gray-500" />
            ) : session.status === "EXPIRED" ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold">{session.schedule?.className || "Quran Class"}</p>
            <p className="text-[10px] text-nejah-slate-blue font-medium">
              {session.student?.fullName || "Group Session"}
            </p>
          </div>
        </div>
        {statusBadge(session.status)}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-nejah-slate-blue font-bold mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {new Date(session.scheduledStart).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />{" "}
          {new Date(session.scheduledStart).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {session.durationMinutes && <span>{session.durationMinutes} min</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {session.status === "SCHEDULED" && (
          <>
            <Button
              onClick={() => handleStartSession(session.id)}
              disabled={startingId === session.id}
              className="bg-nejah-sapphire hover:bg-nejah-azure text-white rounded-xl h-9 text-xs font-bold gap-1.5"
            >
              {startingId === session.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Start Session
            </Button>
            <Button
              onClick={() => handleCancelSession(session.id)}
              disabled={cancellingId === session.id}
              variant="outline"
              className="rounded-xl h-9 text-xs font-bold gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-900/30"
            >
              {cancellingId === session.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Cancel
            </Button>
          </>
        )}
        {(session.status === "NO_SHOW" || session.status === "EXPIRED") && (
          <div className="flex gap-2">
            <Button variant="outline" disabled className="rounded-xl h-9 text-xs font-bold opacity-50 cursor-not-allowed">
              {session.status === "NO_SHOW" ? "No participant joined" : "Session window expired"}
            </Button>
          </div>
        )}
        {session.status === "LIVE" && (
          <>
            {session.zoomJoinUrl && (
              <Button
                onClick={() => window.open(session.zoomJoinUrl, "_blank")}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-9 text-xs font-bold gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Join Zoom
              </Button>
            )}
            <Button
              onClick={() => handleEndSession(session.id)}
              disabled={completingId === session.id}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-9 text-xs font-bold gap-1.5"
            >
              {completingId === session.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              End Session
            </Button>
          </>
        )}
        <Button
          onClick={() => navigate({ to: "/live-sessions/$id", params: { id: session.id } })}
          variant="outline"
          className="rounded-xl h-9 text-xs font-bold gap-1.5"
        >
          <ChevronRight className="h-3.5 w-3.5" /> Details
        </Button>
      </div>
    </motion.div>
  );

  const StatCard = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
  }) => (
    <div className="p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-nejah-electric">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );

  return (
    <TeacherLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Teacher Workspace"
          title="My Zoom Sessions"
          description="Manage your live Zoom sessions, start classes, and review attendance."
          actions={
            <Button
              onClick={() => {
                setShowScheduleModal(true);
                fetchStudents();
              }}
              className="bg-nejah-sapphire hover:bg-nejah-azure text-white rounded-xl h-10 px-5 gap-2 text-xs font-bold"
            >
              <Plus className="h-4 w-4" /> Schedule Session
            </Button>
          }
        />

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Upcoming" value={upcoming.length} icon={<Clock className="h-4 w-4" />} />
          <StatCard
            label="Total Sessions"
            value={analytics?.totalSessions ?? teacherSessions.length}
            icon={<Video className="h-4 w-4" />}
          />
          <StatCard
            label="Attendance Rate"
            value={
              analytics?.attendanceRate != null ? `${Math.round(analytics.attendanceRate)}%` : "—"
            }
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            label="Avg Duration"
            value={analytics?.averageDuration ? `${analytics.averageDuration} min` : "—"}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-2xl bg-background/50 p-1 border border-border dark:border-white/5">
            <TabsTrigger
              value="upcoming"
              className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2"
            >
              <Clock className="h-4 w-4" /> Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2"
            >
              <ClipboardList className="h-4 w-4" /> History ({teacherSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcoming.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-nejah-slate-blue" />
                </div>
                <p className="text-sm font-bold text-nejah-slate-blue">No upcoming sessions</p>
                <p className="text-xs text-nejah-slate-blue mt-1">
                  Your scheduled sessions will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcoming.map((s: any) => (
                  <SessionCard key={s.id} session={s} isUpcoming />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {teacherSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-nejah-slate-blue" />
                </div>
                <p className="text-sm font-bold text-nejah-slate-blue">No session history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherSessions.map((s: any) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border dark:border-white/5"
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border dark:border-white/5">
              <div>
                <h3 className="text-xl font-bold font-serif">Schedule Zoom Session</h3>
                <p className="text-xs text-nejah-slate-blue font-medium mt-0.5">
                  A Zoom meeting will be auto-created and the student will be notified.
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                  Select Student <span className="text-red-500">*</span>
                </Label>
                <select
                  value={scheduleForm.studentId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, studentId: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border dark:border-white/10 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                >
                  <option value="">-- Choose a student --</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} {s.level ? `(${s.level})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                  Start Date & Time <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduledStart}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, scheduledStart: e.target.value })
                    }
                    className="flex-1 h-12 px-4 rounded-xl border border-border dark:border-white/10 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setScheduleForm({ ...scheduleForm, scheduledStart: new Date().toISOString().slice(0, 16) })
                    }
                    className="h-12 px-4 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 transition-colors border border-border dark:border-white/10"
                  >
                    Now
                  </button>
                </div>
                <p className="text-[10px] text-nejah-slate-blue font-medium mt-1">
                  Session duration is auto-set to 60 minutes. Ends when you click "End Session".
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                  Notes (optional)
                </Label>
                <Textarea
                  placeholder="Focus area, surah revision, etc."
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  className="rounded-xl border-border dark:border-white/10 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 pb-8 border-t border-border dark:border-white/5 pt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleScheduleSession}
                disabled={scheduling}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-nejah-sapphire hover:bg-nejah-azure text-white gap-2"
              >
                {scheduling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {scheduling ? "Scheduling..." : "Create & Notify Student"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </TeacherLayout>
  );
}
