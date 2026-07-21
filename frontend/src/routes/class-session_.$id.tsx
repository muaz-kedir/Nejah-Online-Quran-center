import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/class-session_/$id")({
  component: ClassSessionPage,
  beforeLoad: () => requireAuth(["super_admin", "qirat_manager", "teacher", "student"]),
});

function ClassSessionPage() {
  return (
    <DashboardLayout>
      <ClassSessionContent />
    </DashboardLayout>
  );
}

function ClassSessionContent() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState("student");
  const [studentId, setStudentId] = useState("");

  const fetchSessionDetails = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const data = await api<any>(`/attendance/sessions/${id}`);
        setSession(data);
        if (data.meetingLink) {
          setMeetingLink(data.meetingLink);
        }
      } catch {
        toast.error("Failed to load session details");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setUserRole(localStorage.getItem("userRole") || "student");

    if (localStorage.getItem("userRole") === "student") {
      getLinkedStudentId()
        .then((id) => {
          if (id) setStudentId(id);
        })
        .catch((err) => console.error("Failed to get student profile", err));
    }

    fetchSessionDetails();

    pollIntervalRef.current = setInterval(() => {
      fetchSessionDetails(false);
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id, fetchSessionDetails]);

  const handleStartMeeting = async () => {
    if (!meetingLink.trim()) {
      toast.error("Please paste your Zoom/Google Meet link above before starting.");
      return;
    }
    if (!meetingLink.startsWith("http://") && !meetingLink.startsWith("https://")) {
      toast.error("Link must start with http:// or https://");
      return;
    }

    setIsSubmitting(true);
    try {
      await api("/attendance/sessions/start-meeting", {
        method: "POST",
        body: JSON.stringify({
          classSessionId: id,
          meetingLink: meetingLink.trim(),
        }),
      });
      
      const studentCount = session?.studentAttendances?.length || 0;
      toast.success(
        studentCount > 1
          ? "Online session is now LIVE! Notifications sent to all assigned students & parents."
          : "Online session is now LIVE! Notifications sent to students & parents.",
      );
      
      fetchSessionDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to start meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndMeeting = async () => {
    setIsSubmitting(true);
    try {
      await api("/attendance/sessions/end", {
        method: "POST",
        body: JSON.stringify({
          classSessionId: id,
          notes: "Class session completed successfully.",
        }),
      });
      toast.success("Class session ended and final attendance saved.");
      fetchSessionDetails();
      setTimeout(() => {
        navigate({ to: userRole === "teacher" ? "/teacher_dashboard" : "/dashboard" });
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to end meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinMeeting = async () => {
    setIsSubmitting(true);
    let resolvedStudentId = studentId;
    if (userRole === "student" && !resolvedStudentId) {
      resolvedStudentId = (await getLinkedStudentId()) || "";
      if (resolvedStudentId) setStudentId(resolvedStudentId);
    }

    try {
      await api("/attendance/record", {
        method: "POST",
        body: JSON.stringify({
          classSessionId: id,
          ...(resolvedStudentId ? { studentId: resolvedStudentId } : {}),
          action: "join",
        }),
      });
      toast.success("Your attendance has been automatically recorded as PRESENT/LATE!");
      window.open(meetingLink, "_blank");
      fetchSessionDetails(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to record joining log. Connecting to class anyway...");
      window.open(meetingLink, "_blank");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveMeeting = async () => {
    const resolvedStudentId = studentId || (await getLinkedStudentId()) || "";
    if (!resolvedStudentId) {
      navigate({ to: "/student_dashboard" });
      return;
    }

    try {
      await api("/attendance/record", {
        method: "POST",
        body: JSON.stringify({
          classSessionId: id,
          action: "leave",
        }),
      });
      toast.success("Left session. Redirecting to dashboard...");
    } catch {
      // still redirect
    } finally {
      setTimeout(() => {
        navigate({ to: "/student_dashboard" });
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel flex h-[70vh] items-center justify-center bg-card dark:bg-nejah-surface rounded-[32px] border border-border dark:border-white/5 shadow-sm">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nejah-electric mx-auto" />
          <p className="text-sm font-bold text-nejah-slate-blue font-serif">
            Connecting to Quranic Classroom...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="glass-panel bg-card dark:bg-nejah-surface p-12 rounded-[32px] text-center border border-border dark:border-white/5 shadow-sm max-w-lg mx-auto">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-foreground dark:text-foreground font-serif mb-2">
          Class Session Not Found
        </h2>
        <p className="text-sm text-nejah-slate-blue mb-6">
          The requested class session ID does not exist or has been deleted.
        </p>
        <Button
          onClick={() => navigate({ to: "/dashboard" })}
          className="bg-nejah-sapphire hover:bg-background text-white rounded-xl"
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <Badge className="bg-red-500 text-white animate-pulse border-none px-3.5 py-1 text-[10px] font-black tracking-widest uppercase">
            LIVE NOW
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-muted text-nejah-slate-blue dark:bg-nejah-surface dark:text-nejah-slate-blue border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
            COMPLETED
          </Badge>
        );
      case "NO_SHOW":
        return (
          <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
            NO SHOW
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
            EXPIRED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">
            SCHEDULED
          </Badge>
        );
    }
  };

  const myAttendance = session.studentAttendances?.find((a: any) => a.studentId === studentId);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <button
          type="button"
          onClick={() => {
            if (userRole === "teacher") navigate({ to: "/teacher_dashboard" });
            else if (userRole === "student") navigate({ to: "/student_dashboard" });
            else navigate({ to: "/dashboard" });
          }}
          className="flex items-center gap-1.5 text-xs font-black text-nejah-slate-blue hover:text-nejah-sapphire dark:hover:text-nejah-electric uppercase tracking-widest transition-colors mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-nejah-surface via-nejah-sapphire to-nejah-surface text-white p-10 shadow-2xl border border-nejah-sapphire/20">
        <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusBadge(session.status)}
              <span className="text-[10px] text-nejah-electric/70 font-bold uppercase tracking-[0.2em]">
                {session.quranLevel} Level
              </span>
            </div>
            <h1 className="text-4xl font-extrabold font-serif tracking-tight drop-shadow-md">
              {session.classTitle}
            </h1>
            <p className="text-foreground/90 text-sm max-w-xl flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span>
                Subject: <strong>{session.subject}</strong>
              </span>
              <span className="opacity-40">|</span>
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>
                {new Date(session.sessionDate).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 space-y-3 min-w-[240px]">
            <div className="flex items-center gap-3 text-xs text-foreground/80 uppercase font-black tracking-widest">
              <Clock className="h-4 w-4 text-nejah-electric" />
              <span>Class Timings</span>
            </div>
            <div className="text-2xl font-black font-serif text-white tabular-nums">
              {session.scheduledStartTime} - {session.scheduledEndTime}
            </div>
            <div className="text-[10px] text-nejah-electric/70 font-bold uppercase">
              Teacher: {session.teacher?.fullName || "Assigned Instructor"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {session.status === "SCHEDULED" && (
            <Card className="glass-panel rounded-[2.5rem] border-border dark:border-white/5 shadow-sm p-8 bg-card dark:bg-nejah-surface">
              <CardHeader className="p-0 mb-6">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
                  <Video className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold font-serif text-foreground dark:text-foreground">
                  Start the Online Meeting
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-nejah-slate-blue dark:text-nejah-slate-blue uppercase tracking-wider">
                  For Teacher Only
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {userRole === "teacher" ? (
                  <div className="space-y-4">
                    <p className="text-sm text-nejah-slate-blue dark:text-nejah-slate-blue leading-relaxed">
                      Paste your meeting link below (Zoom, Google Meet, or any video platform).
                      Students and parents will be automatically notified when you start.
                    </p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest ml-1">
                        Meeting Connection URL
                      </label>
                      <Input
                        placeholder="https://zoom.us/j/...  or  https://meet.google.com/..."
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="h-12 bg-background/50 border-none rounded-xl text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleStartMeeting}
                      disabled={isSubmitting}
                      className="w-full h-12 bg-nejah-sapphire hover:bg-background text-white rounded-xl text-sm font-extrabold gap-2 shadow-lg"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      {isSubmitting ? "Initializing Meeting..." : "Start Meeting & Mark Present"}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 flex items-start gap-4">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">
                        Waiting for Instructor
                      </h4>
                      <p className="text-xs text-amber-800/80 dark:text-nejah-slate-blue leading-relaxed">
                        Assalamu Alaikum. This Quran class session is scheduled but the meeting has
                        not been started yet. You will see a &quot;Join Meeting&quot; option here as
                        soon as your teacher launches the class. Keep this tab open.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {session.status === "LIVE" && (
            <Card className="glass-panel rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-gradient-to-br from-nejah-sapphire to-nejah-surface text-white p-8 relative">
              <div className="absolute right-4 bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <CardContent className="p-0 space-y-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-ping absolute top-8 right-8 opacity-20" />
                <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-lg border border-white/5 mb-2">
                  <Video className="h-10 w-10 text-nejah-electric" />
                </div>

                <div className="space-y-2">
                  <Badge className="bg-red-500 text-white border-none font-bold uppercase tracking-widest text-[9px]">
                    Class is Live
                  </Badge>
                  <h2 className="text-3xl font-extrabold font-serif">Virtual Classroom Active</h2>
                  <p className="text-foreground/70 text-xs max-w-md leading-relaxed">
                    Teacher started this session. All attendance logs are updated automatically upon
                    joining and leaving.
                  </p>
                </div>

                {userRole === "teacher" ? (
                  <div className="w-full pt-4 space-y-4">
                    <div className="flex gap-2 w-full max-w-md mx-auto">
                      <Input
                        readOnly
                        value={meetingLink}
                        className="h-11 bg-white/10 border-white/10 text-white text-xs text-center rounded-xl"
                      />
                      <Button
                        onClick={() => window.open(meetingLink, "_blank")}
                        className="h-11 bg-white hover:bg-primary/10 text-foreground font-extrabold rounded-xl shrink-0 px-4"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleEndMeeting}
                        disabled={isSubmitting}
                        className="bg-red-650 hover:bg-red-750 text-white border-none rounded-xl px-8 h-12 text-sm font-extrabold gap-2 shadow-xl"
                      >
                        <LogOut className="h-4 w-4" />
                        {isSubmitting ? "Ending Meeting..." : "End Class & Save Attendance"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full pt-4 space-y-4 max-w-sm">
                    {myAttendance?.joinTime ? (
                      <div className="space-y-4">
                        <div className="bg-white/10 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-left">
                          <div>
                            <p className="text-[9px] font-bold uppercase text-nejah-electric/70">
                              Your Attendance
                            </p>
                            <p className="text-sm font-bold">{myAttendance.attendanceStatus}</p>
                          </div>
                          <span className="text-[10px] text-foreground/80 tabular-nums">
                            Joined:{" "}
                            {new Date(myAttendance.joinTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => window.open(meetingLink, "_blank")}
                            className="flex-1 h-12 bg-white hover:bg-primary/10 text-foreground font-extrabold rounded-xl"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" /> Re-Join Call
                          </Button>
                          <Button
                            onClick={handleLeaveMeeting}
                            className="h-12 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl px-6"
                          >
                            Exit Class
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleJoinMeeting}
                        className="w-full h-14 bg-white hover:bg-primary/10 text-nejah-sapphire text-foreground font-black rounded-2xl text-base shadow-xl gap-3"
                      >
                        <PlayIcon className="h-5 w-5 fill-nejah-sapphire text-nejah-sapphire text-foreground" />
                        Join Meeting Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {session.status === "COMPLETED" && (
            <Card className="glass-panel rounded-[2.5rem] border-border dark:border-white/5 shadow-sm p-8 bg-card dark:bg-nejah-surface">
              <CardContent className="p-0 space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 dark:bg-nejah-sapphire/20 text-nejah-electric dark:text-nejah-electric rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-foreground">
                    Session Completed
                  </h2>
                  <p className="text-sm text-nejah-slate-blue mt-1">
                    Class has ended. See the summary below.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background/50 rounded-2xl p-4 text-center">
                    <Timer className="h-5 w-5 text-nejah-electric mx-auto mb-2" />
                    <p className="text-2xl font-bold font-mono">
                      {session.totalDuration || session.durationMinutes || "—"}
                    </p>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-wider mt-1">
                      Duration (min)
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-2xl p-4 text-center">
                    <Users className="h-5 w-5 text-nejah-electric mx-auto mb-2" />
                    <p className="text-2xl font-bold font-mono">
                      {session.totalStudentsPresent || 0}
                    </p>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-wider mt-1">
                      Present
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-2xl p-4 text-center">
                    <BarChart3 className="h-5 w-5 text-nejah-electric mx-auto mb-2" />
                    <p className="text-2xl font-bold font-mono">{session.totalStudentsLate || 0}</p>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-wider mt-1">
                      Late
                    </p>
                  </div>
                  <div className="bg-background/50 rounded-2xl p-4 text-center">
                    <ClipboardList className="h-5 w-5 text-nejah-electric mx-auto mb-2" />
                    <p className="text-2xl font-bold font-mono">{session.notes || "—"}</p>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-wider mt-1">
                      Notes
                    </p>
                  </div>
                </div>

                {session.actualStartTime && (
                  <div className="bg-background/30 rounded-2xl p-4 text-sm">
                    <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-wider mb-2">
                      Timeline
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Started: {new Date(session.actualStartTime).toLocaleTimeString()}</span>
                      {session.actualEndTime && (
                        <span>Ended: {new Date(session.actualEndTime).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <Button
                    onClick={() => {
                      if (userRole === "teacher") navigate({ to: "/teacher_dashboard" });
                      else if (userRole === "student") navigate({ to: "/student_dashboard" });
                      else navigate({ to: "/dashboard" });
                    }}
                    className="bg-nejah-sapphire hover:bg-background text-white rounded-xl h-11 px-8 font-bold"
                  >
                    Go Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-panel rounded-[2.5rem] border-border dark:border-white/5 shadow-sm p-6 bg-card dark:bg-nejah-surface h-full">
            <CardHeader className="p-0 border-b border-border dark:border-white/5 pb-4 mb-4">
              <CardTitle className="text-lg font-bold font-serif text-foreground dark:text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-nejah-electric" />
                Assigned Students ({session.studentAttendances?.length || 0})
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground dark:text-nejah-slate-blue tracking-wider">
                Attendance Logs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              {!session.studentAttendances || session.studentAttendances.length === 0 ? (
                <div className="py-8 text-center text-xs text-nejah-slate-blue font-medium italic">
                  No students assigned to this class.
                </div>
              ) : (
                session.studentAttendances.map((record: any) => {
                  const student = record.student || {};
                  const isJoined = !!record.joinTime;

                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                        isJoined
                          ? "bg-primary/5 border-nejah-electric/15"
                          : "bg-background/50 border-border dark:bg-nejah-surface/20 dark:border-white/5",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-nejah-sapphire text-foreground text-xs shrink-0">
                          {student.fullName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground dark:text-foreground">
                            {student.fullName}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-widest mt-0.5">
                            ID: {student.studentCode || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge
                          className={cn(
                            "text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border-none",
                            record.attendanceStatus === "PRESENT"
                              ? "bg-primary/15 text-nejah-electric"
                              : record.attendanceStatus === "LATE"
                                ? "bg-amber-100 text-amber-700"
                                : record.attendanceStatus === "LEFT_EARLY"
                                  ? "bg-blue-150 text-blue-700"
                                  : "bg-red-50 text-red-600",
                          )}
                        >
                          {record.attendanceStatus}
                        </Badge>

                        {isJoined && (
                          <p className="text-[9px] text-nejah-slate-blue font-bold tabular-nums mt-1.5">
                            Duration: {record.durationMinutes || 0} mins
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
