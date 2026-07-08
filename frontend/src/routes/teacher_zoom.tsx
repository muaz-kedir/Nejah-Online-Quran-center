import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TeacherLayout } from "@/components/dashboard/TeacherLayout";
import { PageHeader } from "@/components/dashboard/design-system";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  ClipboardList,
  Loader2,
  ChevronRight,
  AlertTriangle,
  X,
  ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/teacher_zoom")({
  component: TeacherZoomPage,
  beforeLoad: () => requireAuth(["teacher"]),
});

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getWeekDays(weekOffset = 0): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatSessionTime(d: string): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TeacherZoomPage() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [teacherSessions, setTeacherSessions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [viewTab, setViewTab] = useState<"week" | "history">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  // Reset selected day when week changes
  useEffect(() => {
    setSelectedDay(0);
  }, [weekOffset]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const day of weekDays) {
      const key = day.toISOString().slice(0, 10);
      map[key] = upcoming.filter((s: any) =>
        isSameDay(new Date(s.scheduledStart), day),
      );
    }
    return map;
  }, [upcoming, weekDays]);

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
      if (session?.zoomJoinUrl) window.location.href = session.zoomJoinUrl;
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

  const SessionCard = ({ session }: { session: any }) => (
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
          <Clock className="h-3 w-3" />{" "}
          {formatSessionTime(session.scheduledStart)}
          {session.scheduledEnd ? ` - ${formatSessionTime(session.scheduledEnd)}` : ""}
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
          onClick={() => {
            setDetailSessionId(session.id);
            setDetailLoading(true);
            setDetailSession(null);
            api<any>(`/live-sessions/${session.id}`)
              .then((data) => setDetailSession(data))
              .catch(() => toast.error("Failed to load session details"))
              .finally(() => setDetailLoading(false));
          }}
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

  const getTodayIndex = (): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekDays.findIndex((d) => isSameDay(d, today));
  };

  return (
    <TeacherLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Teacher Workspace"
          title="My Zoom Sessions"
          description="Manage your live Zoom sessions, start classes, and review attendance."
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
            value={analytics?.averageSessionDuration ? `${analytics.averageSessionDuration} min` : "—"}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        <Tabs value={viewTab} onValueChange={(v) => { setViewTab(v as "week" | "history"); setSelectedDay(0); }}>
          <TabsList className="rounded-2xl bg-background/50 p-1 border border-border dark:border-white/5">
            <TabsTrigger
              value="week"
              className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2"
            >
              <Calendar className="h-4 w-4" /> Week View ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2"
            >
              <ClipboardList className="h-4 w-4" /> History ({teacherSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-6">
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => setWeekOffset((p) => p - 1)}
                className="rounded-xl h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold text-nejah-slate-blue">
                {weekOffset === 0 ? "This Week" : weekOffset < 0 ? `${Math.abs(weekOffset)} weeks ago` : `${weekOffset} weeks ahead`}
              </span>
              <Button
                variant="outline"
                onClick={() => setWeekOffset((p) => p + 1)}
                className="rounded-xl h-10 w-10 p-0"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6">
              {weekDays.map((day, i) => {
                const dateStr = day.toISOString().slice(0, 10);
                const sessions = sessionsByDay[dateStr] || [];
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date(new Date().toDateString());
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDay(i)}
                    className={cn(
                      "flex flex-col items-center gap-1 min-w-[80px] px-3 py-3 rounded-2xl border transition-all",
                      selectedDay === i
                        ? "bg-nejah-sapphire text-white border-nejah-sapphire shadow-md"
                        : isPast
                          ? "bg-background/30 border-border dark:border-white/5 text-muted-foreground opacity-60"
                          : "bg-background/50 border-border dark:border-white/5 hover:bg-muted/50",
                    )}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {DAY_NAMES[day.getDay()]}
                    </span>
                    <span className="text-lg font-bold font-mono leading-none">
                      {day.getDate()}
                    </span>
                    <span className="text-[9px] font-medium opacity-70">
                      {MONTH_NAMES[day.getMonth()]}
                    </span>
                    {sessions.length > 0 && (
                      <span className={cn(
                        "text-[9px] font-bold mt-0.5 px-2 py-0.5 rounded-full",
                        selectedDay === i
                          ? "bg-white/20 text-white"
                          : "bg-nejah-sapphire/10 text-nejah-sapphire",
                      )}>
                        {sessions.length}
                      </span>
                    )}
                    {isToday && !selectedDay && (
                      <span className="text-[8px] font-bold uppercase mt-0.5 text-nejah-electric">
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sessions for selected day */}
            {(() => {
              if (weekDays.length === 0) return null;
              const day = weekDays[selectedDay];
              const dateStr = day.toISOString().slice(0, 10);
              const daySessions = sessionsByDay[dateStr] || [];

              if (daySessions.length === 0) {
                return (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-nejah-slate-blue" />
                    </div>
                    <p className="text-sm font-bold text-nejah-slate-blue">
                      No sessions on {day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <p className="text-xs text-nejah-slate-blue mt-1">
                      {isSameDay(day, new Date()) ? "No sessions scheduled for today" : "No sessions on this day"}
                    </p>
                  </div>
                );
              }

              return (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-nejah-sapphire/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-nejah-sapphire" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-[10px] text-nejah-slate-blue font-medium">
                        {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {daySessions.map((s: any) => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </div>
                </div>
              );
            })()}
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

      {detailSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailSessionId(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border dark:border-white/5">
              <div>
                <h3 className="text-xl font-extrabold text-foreground font-serif">Session Details</h3>
                <p className="text-xs text-muted-foreground dark:text-nejah-slate-blue font-medium mt-0.5">
                  {detailSession?.student?.fullName || 'Session'} &middot; {detailSession?.status || ''}
                </p>
              </div>
              <button
                onClick={() => setDetailSessionId(null)}
                className="p-2 rounded-xl text-muted-foreground dark:text-nejah-slate-blue hover:bg-muted dark:hover:bg-background transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-nejah-electric" />
              </div>
            ) : detailSession ? (
              <div className="px-8 py-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5">
                    <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(detailSession.scheduledStart).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {DAY_NAMES[new Date(detailSession.scheduledStart).getDay()]}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5">
                    <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider mb-1">Duration</p>
                    <p className="text-sm font-bold text-foreground">
                      {detailSession.durationMinutes ? `${detailSession.durationMinutes} min` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {detailSession.actualStart && detailSession.actualEnd
                        ? `Actual: ${Math.round((new Date(detailSession.actualEnd).getTime() - new Date(detailSession.actualStart).getTime()) / 60000)} min`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground dark:text-nejah-slate-blue uppercase tracking-wider mb-2">Start & End Times</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Scheduled Start</p>
                      <p className="font-bold text-foreground mt-0.5">
                        {new Date(detailSession.scheduledStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Scheduled End</p>
                      <p className="font-bold text-foreground mt-0.5">
                        {new Date(detailSession.scheduledEnd).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {detailSession.actualStart && (
                    <div className="flex items-center gap-4 text-sm mt-3 pt-3 border-t border-border dark:border-white/5">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Actual Start</p>
                        <p className="font-bold text-foreground mt-0.5">
                          {new Date(detailSession.actualStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Actual End</p>
                        <p className="font-bold text-foreground mt-0.5">
                          {detailSession.actualEnd
                            ? new Date(detailSession.actualEnd).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-sm font-bold text-foreground">Status</p>
                  <Badge className={cn(
                    'rounded-full border-none px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider',
                    detailSession.status === 'LIVE' ? 'bg-red-100 text-red-700' :
                    detailSession.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-muted text-muted-foreground',
                  )}>
                    {detailSession.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Failed to load session details.</p>
              </div>
            )}

            <div className="flex justify-end px-8 pb-8 pt-2">
              <Button
                onClick={() => setDetailSessionId(null)}
                className="rounded-xl px-6 h-10 text-sm font-bold"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </TeacherLayout>
  );
}
