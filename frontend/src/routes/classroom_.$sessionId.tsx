import { API_BASE } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Video, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ZoomEmbeddedMeeting,
  type ClassroomJoinConfig,
} from "@/components/classroom/ZoomEmbeddedMeeting";

const API = API_BASE;
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

type ClassroomAccess = {
  session: any;
  joinUrl: string | null;
  startUrl: string | null;
  sdkSignature: string | null;
  clientId: string | null;
  meetingNumber: string | null;
  password: string | null;
  role: 0 | 1;
  userName: string;
  userEmail: string;
  zak: string | null;
  sdkEnabled: boolean;
};

function ClassroomPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [classroom, setClassroom] = useState<ClassroomAccess | null>(null);
  const [embedConfig, setEmbedConfig] = useState<ClassroomJoinConfig | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  const loadClassroom = useCallback(async () => {
    try {
      const res = await fetch(`${API}/live-sessions/${sessionId}/classroom`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Cannot access classroom");
      }
      setClassroom(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadClassroom();
  }, [loadClassroom]);

  const goToDashboard = () => {
    if (role === "teacher") {
      navigate({ to: "/teacher_dashboard" });
    } else {
      navigate({ to: "/student_dashboard" });
    }
  };

  const handleLeave = () => {
    setSessionEnded(true);
    setEmbedConfig(null);
    goToDashboard();
    toast.success("Session completed successfully");
  };

  const openExternalZoom = (access: ClassroomAccess) => {
    const url = role === "teacher" ? access.startUrl || access.joinUrl : access.joinUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opened Zoom in a new tab");
    } else {
      toast.error("Meeting link not available yet");
    }
  };

  const startEmbeddedMeeting = async () => {
    if (!classroom) return;

    if (!classroom.meetingNumber) {
      toast.error("Meeting has not been created yet. Ask the teacher to start the session.");
      return;
    }

    if (
      role === "student" &&
      classroom.session?.status !== "LIVE" &&
      classroom.session?.status !== "SCHEDULED"
    ) {
      toast.error("This session is not available to join yet.");
      return;
    }

    setJoining(true);
    try {
      await fetch(`${API}/live-sessions/${sessionId}/join`, {
        method: "POST",
        headers: authHeaders(),
      });

      if (classroom.sdkEnabled && classroom.sdkSignature && classroom.meetingNumber) {
        setEmbedConfig({
          sdkSignature: classroom.sdkSignature,
          meetingNumber: classroom.meetingNumber,
          password: classroom.password || "",
          userName: classroom.userName,
          userEmail: classroom.userEmail || "",
          role: classroom.role,
          zak: classroom.zak,
        });
        setUseFallback(false);
      } else {
        setUseFallback(true);
        openExternalZoom(classroom);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to join session");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const session = classroom?.session;
  const className =
    session?.metadata?.className || session?.schedule?.className || "Quran Class";

  if (embedConfig) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <header className="h-[72px] shrink-0 border-b border-white/10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={handleLeave}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold font-serif">{className}</h1>
              <p className="text-xs text-white/60">NEJAH Live Classroom</p>
            </div>
          </div>
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 uppercase text-[10px] animate-pulse">
            Live
          </Badge>
        </header>
        <ZoomEmbeddedMeeting
          config={embedConfig}
          onLeft={handleLeave}
          onError={() => {
            if (classroom) {
              setUseFallback(true);
              setEmbedConfig(null);
              openExternalZoom(classroom);
            }
          }}
        />
      </div>
    );
  }

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
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 uppercase text-[10px]">
          {session?.status === "LIVE" ? "Live" : session?.status || "Scheduled"}
        </Badge>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Video className="h-10 w-10 text-emerald-400" />
        </div>

        <div>
          <h2 className="text-3xl font-bold font-serif mb-2">
            {role === "teacher" ? "Host Your Class" : "Join Live Class"}
          </h2>
          <p className="text-white/70">
            {session?.scheduledStart
              ? new Date(session.scheduledStart).toLocaleString()
              : "Scheduled session"}
          </p>
        </div>

        {!classroom?.sdkEnabled && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-100/90">
              Embedded Zoom uses your Zoom OAuth app credentials (
              <code className="text-xs">ZOOM_CLIENT_ID</code> and{" "}
              <code className="text-xs">ZOOM_CLIENT_SECRET</code>). You can still join using the
              external Zoom link fallback.
            </p>
          </div>
        )}

        <div className="glass-panel bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
          <p className="text-sm text-white/60">
            Your class runs inside NEJAH using the Zoom Meeting SDK. Attendance is tracked when you
            enter the classroom.
          </p>

          {session?.status === "COMPLETED" || sessionEnded ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="font-semibold">Session Completed Successfully</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="rounded-2xl px-10 bg-emerald-500 hover:bg-emerald-600"
                onClick={startEmbeddedMeeting}
                disabled={joining || session?.status === "COMPLETED"}
              >
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                {role === "teacher" ? "Enter Classroom" : "Join Session"}
              </Button>
              {classroom && (
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-white/20 text-white hover:bg-white/10"
                  onClick={() => openExternalZoom(classroom)}
                >
                  Open in Zoom App
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/20 text-white hover:bg-white/10"
                onClick={handleLeave}
              >
                Return to Dashboard
              </Button>
            </div>
          )}

          {useFallback && (
            <p className="text-xs text-white/50 pt-2">
              Embedded meeting unavailable — use &quot;Open in Zoom App&quot; if video did not start.
            </p>
          )}
        </div>

        {role === "teacher" && session?.status === "COMPLETED" && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button className="rounded-2xl" onClick={() => navigate({ to: "/teacher_dashboard" })}>
              Log Daily Progress
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border-white/20 text-white hover:bg-white/10"
              onClick={() => navigate({ to: "/teacher_dashboard" })}
            >
              Submit Exam Evaluation
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export const Route = createFileRoute("/classroom_/$sessionId")({
  component: ClassroomPage,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      if (!token) throw redirect({ to: "/login" });
      if (role !== "teacher" && role !== "student") throw redirect({ to: "/dashboard" });
    }
  },
});
