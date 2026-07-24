import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, Clock, User, Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionStatusBadge } from "./SessionStatusBadge";
import { CountdownTimer } from "./CountdownTimer";

interface LiveSessionHeroProps {
  liveClass: {
    id: string;
    status: string;
    classTitle?: string;
    scheduledStart?: string;
    teacher?: { fullName: string };
  } | null;
  upcomingClass: {
    name: string;
    teacher: string;
    time: string;
    startTime?: string;
    sessionId?: string | null;
  } | null;
  onJoin: () => void;
}

export function LiveSessionHero({ liveClass, upcomingClass, onJoin }: LiveSessionHeroProps) {
  const isLive = liveClass?.status === "LIVE";
  const isScheduled = !isLive && upcomingClass;

  return (
    <div
      className={cn(
        "relative rounded-2xl lg:rounded-3xl overflow-hidden animate-fade-in-up transition-all duration-500",
        isLive
          ? "bg-gradient-to-br from-red-600 via-red-500 to-rose-600 shadow-xl shadow-red-500/20"
          : "bg-gradient-to-br from-nejah-sapphire via-nejah-sapphire/90 to-nejah-electric/80 shadow-lg",
      )}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20",
            isLive ? "bg-red-400" : "bg-card",
          )}
        />
        <div
          className={cn(
            "absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-10",
            isLive ? "bg-red-300" : "bg-card",
          )}
        />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 p-5 sm:p-6 lg:p-8">
        {isLive && liveClass ? (
          /* ── LIVE STATE ── */
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="live-pulse-dot" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                  Live Now
                </span>
              </div>
              <SessionStatusBadge status="LIVE" size="sm" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              {liveClass.classTitle || "Quran Class"}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-6">
              {liveClass.teacher?.fullName && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {liveClass.teacher.fullName}
                </span>
              )}
              {liveClass.scheduledStart && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(liveClass.scheduledStart).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            <Button
              size="lg"
              className="bg-card text-red-600 hover:bg-destructive/10 font-bold rounded-xl px-8 py-6 text-base shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={onJoin}
            >
              <Play className="h-5 w-5 mr-2 fill-current" />
              Join Live Class
            </Button>
          </>
        ) : isScheduled && upcomingClass ? (
          /* ── UPCOMING STATE ── */
          <>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-white/15 text-white/90 border-none text-xs font-semibold">
                Upcoming Class
              </Badge>
              <SessionStatusBadge status="SCHEDULED" size="sm" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              {upcomingClass.name}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-6">
              {upcomingClass.teacher && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {upcomingClass.teacher}
                </span>
              )}
              {upcomingClass.time && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {upcomingClass.time}
                </span>
              )}
            </div>

            {/* Countdown */}
            {upcomingClass.startTime && (
              <div className="mb-2">
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                  Starting in
                </p>
                <CountdownTimer
                  targetTime={upcomingClass.startTime}
                  onExpired={() => {
                    /* parent will refetch and re-render */
                  }}
                />
              </div>
            )}

            <Button
              variant="outline"
              className="mt-6 border-white/25 text-white hover:bg-white/10 rounded-xl"
              disabled
            >
              <Clock className="h-4 w-4 mr-2" />
              Waiting for teacher to start
            </Button>
          </>
        ) : (
          /* ── NO SESSION STATE ── */
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No Session Today</h3>
                <p className="text-sm text-white/60">Enjoy your day or review previous lessons</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar className="h-3.5 w-3.5" />
              <span>Check back tomorrow for your next class</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
