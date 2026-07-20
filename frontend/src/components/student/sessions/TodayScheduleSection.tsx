import { CalendarDays, Clock, User, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionStatusBadge } from "./SessionStatusBadge";
import { isLiveSessionActive } from "@/lib/student-live-session";

interface ScheduleItem {
  id?: string;
  className?: string;
  name?: string;
  dayOfWeek?: string;
  day?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  teacherName?: string;
  teacher?: string;
  status?: string;
  sessionId?: string | null;
}

interface TodayScheduleSectionProps {
  sessions: ScheduleItem[];
  liveSessionId?: string | null;
  liveSessionStatus?: string | null;
  onJoin: (sessionId: string) => void;
}

function ScheduleCard({
  session,
  isLive,
  onJoin,
}: {
  session: ScheduleItem;
  isLive: boolean;
  onJoin: () => void;
}) {
  const name = session.className || session.name || "Quran Class";
  const teacher = session.teacherName || session.teacher || "—";
  const time = session.time || (session.startTime && session.endTime ? `${session.startTime} — ${session.endTime}` : "—");
  const status = isLive ? "LIVE" : session.status || "SCHEDULED";

  return (
    <div
      className={cn(
        "relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
        isLive
          ? "bg-red-50/50 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/40"
          : "bg-card/50 border-border/40 hover:border-border/80",
      )}
    >
      {/* Timeline dot */}
      <div className="relative mt-1">
        <div
          className={cn(
            "w-3 h-3 rounded-full border-2",
            isLive
              ? "bg-red-500 border-red-300 dark:border-red-700 animate-pulse"
              : "bg-muted border-border",
          )}
        />
        {isLive && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-400 animate-ping opacity-40" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-foreground truncate">{name}</h4>
              <SessionStatusBadge status={status} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground dark:text-gray-200">
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {teacher}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isLive ? (
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm"
                onClick={onJoin}
              >
                <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Join
              </Button>
            ) : status === "COMPLETED" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TodayScheduleSection({
  sessions,
  liveSessionId,
  liveSessionStatus,
  onJoin,
}: TodayScheduleSectionProps) {
  if (!sessions.length) {
    return (
      <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-nejah-electric" />
            <h3 className="text-lg font-bold text-foreground">Today&apos;s Schedule</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <CalendarDays className="h-7 w-7 text-muted-foreground dark:text-gray-200/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No classes today</p>
            <p className="text-xs text-muted-foreground dark:text-gray-200 mt-1">
              Enjoy your day or review previous lessons
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-nejah-electric" />
            <h3 className="text-lg font-bold text-foreground">Today&apos;s Schedule</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground dark:text-gray-200 bg-muted/50 px-2.5 py-1 rounded-full">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-2">
          {sessions.map((session, i) => {
            const sid = session.sessionId || session.id;
            const live = isLiveSessionActive(liveSessionStatus) && sid === liveSessionId;
            return (
              <ScheduleCard
                key={session.id || i}
                session={session}
                isLive={live}
                onJoin={() => {
                  if (sid && live) onJoin(sid);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
