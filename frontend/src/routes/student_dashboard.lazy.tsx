/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  Bell as BellIcon,
  Sparkles,
  GraduationCap,
  UserCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StudentPortalLayout, StudentPageLoader } from "@/components/student/StudentPortalLayout";
import { storeStudentId, studentPaths } from "@/lib/student-portal";
import { useApiQuery } from "@/hooks/useApiQuery";
import { LearningPathCard, useLearningPath } from "@/components/progress/LearningPathCard";
import { LevelProgressCard } from "@/components/progress/LevelProgressCard";
import { useSocket } from "@/hooks/useSocket";
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
  NOTIFICATION_BG_COLORS,
} from "@/lib/notification-helpers";
import { isLiveSessionActive, joinLiveSessionWhenActive } from "@/lib/student-live-session";
import { TodayLesson } from "@/components/student/lessons/TodayLesson";
import { LiveSessionHero } from "@/components/student/sessions/LiveSessionHero";
import { TodayScheduleSection } from "@/components/student/sessions/TodayScheduleSection";
import type { StudentDashboardData, StudentProfileData, StudentClassesData } from "@/lib/student-types";

const dayLabels: Record<string, string> = {
  Sunday: "Sun", Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat",
};

export const Route = createLazyFileRoute('/student_dashboard')({
  component: StudentDashboard,
});

function StudentDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { path: learningPath } = useLearningPath(undefined);

  const { data: data, isLoading: loading } = useApiQuery<StudentDashboardData>({
    queryKey: ['student-dashboard'],
    path: '/student/dashboard',
    refetchInterval: 15_000,
  });

  const { data: profile } = useApiQuery<StudentProfileData>({
    queryKey: ['student-profile-dashboard'],
    path: '/student/profile',
    refetchInterval: 30_000,
    select: (prof) => {
      if (prof?.student) {
        storeStudentId(prof.student.id);
      }
      return prof;
    },
  });

  const { data: todayClasses } = useApiQuery<StudentClassesData>({
    queryKey: ['student-today-classes'],
    path: '/student/dashboard/classes',
    refetchInterval: 15_000,
  });

  useSocket({
    onNotification: (notif) => {
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      if (notif.channel === "MEETING_STARTED" && notif.data?.sessionId) {
        const sessionId = notif.data.sessionId;
        toast(notif.title, {
          description: notif.content,
          duration: 10000,
          action: {
            label: "Join Now",
            onClick: async () => {
              try {
                const result = await joinLiveSessionWhenActive(sessionId, "LIVE");
                toast.success(
                  result.alreadyJoined
                    ? "Rejoined session — attendance already recorded"
                    : "Attendance recorded — joining session",
                );
              } catch (e: unknown) {
                toast.error(e instanceof Error ? e.message : "Could not join session");
              }
            },
          },
        });
      }
    },
  });

  if (loading) return <StudentPageLoader />;

  const student = data?.student;
  const welcome = data?.welcome;
  const progress = data?.progress;

  const displayLevel = student?.level || welcome?.quranLevel || profile?.student?.level || "—";
  const displayTeacher =
    student?.effectiveTeacher ||
    student?.assignedTeacher ||
    welcome?.assignedTeacher ||
    profile?.student?.assignedTeacher ||
    "Not assigned yet";
  const enrollmentRaw =
    student?.enrollmentDate || welcome?.enrollmentDate || profile?.student?.enrollmentDate;
  const displayEnrolled = enrollmentRaw
    ? new Date(enrollmentRaw).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const isSessionLive = isLiveSessionActive(data?.liveClass?.status);

  const joinClass = async () => {
    if (!isSessionLive) {
      toast.info(
        "Your teacher has not started the session yet. The join button will activate when class is live.",
      );
      return;
    }
    const sessionId = data?.liveClass?.id;
    if (!sessionId) {
      toast.info("No live session available yet.");
      return;
    }
    try {
      const result = await joinLiveSessionWhenActive(sessionId, data.liveClass!.status);
      toast.success(
        result.alreadyJoined
          ? "Rejoined session — attendance already recorded"
          : "Attendance recorded — joining session",
      );
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Could not join session. Attendance was not recorded.",
      );
    }
  };

  const joinSessionById = async (sessionId: string) => {
    try {
      const result = await joinLiveSessionWhenActive(sessionId, "LIVE");
      toast.success(
        result.alreadyJoined
          ? "Rejoined session — attendance already recorded"
          : "Attendance recorded — joining session",
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not join session");
    }
  };

  const firstName =
    welcome?.firstName ||
    student?.firstName ||
    localStorage.getItem("userName")?.split(" ")[0] ||
    "Student";

  return (
    <StudentPortalLayout
      activePath={studentPaths.dashboard}
      student={student ? { ...student, level: displayLevel } : undefined}
      unreadNotifications={data?.unreadNotifications}
    >
      <main className="flex-1 px-4 sm:px-6 lg:px-10 pb-8 lg:pb-10">
        {/* Hero Header */}
        <div className="hero-gradient rounded-2xl lg:rounded-3xl p-6 sm:p-8 mb-6 lg:mb-8 animate-fade-in-up border border-border/30 dark:border-nejah-border-blue/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Assalamu Alaikum, {firstName}!
                </p>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                Your Learning Center
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-200 bg-card/60 dark:bg-nejah-surface/60 border border-border/40 rounded-full px-3 py-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-nejah-electric" />
                  {displayLevel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-200 bg-card/60 dark:bg-nejah-surface/60 border border-border/40 rounded-full px-3 py-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-nejah-electric" />
                  {displayTeacher}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground dark:text-gray-200 bg-card/60 dark:bg-nejah-surface/60 border border-border/40 rounded-full px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-nejah-electric" />
                  {displayEnrolled}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Temporary teacher notice */}
        {student?.isTemporaryTeacher && student?.temporaryTeacher && (
          <div
            className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 text-sm text-amber-900 dark:text-amber-200 mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.05s" }}
          >
            <p className="font-bold mb-1">Temporary Teacher Assigned</p>
            <p>
              <strong>{student.temporaryTeacher.name}</strong> is teaching your classes from{" "}
              {student.temporaryTeacher.startDate} to {student.temporaryTeacher.endDate}. Your
              regular teacher is {student.temporaryTeacher.originalTeacher}.
            </p>
          </div>
        )}

        {/* Live Session Hero */}
        <div className="mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <LiveSessionHero
            liveClass={data?.liveClass || null}
            upcomingClass={data?.upcomingClass || null}
            onJoin={joinClass}
          />
        </div>

        {/* Today's Schedule */}
        <TodayScheduleSection
          sessions={todayClasses?.current || []}
          liveSessionId={data?.liveClass?.id || todayClasses?.liveClass?.id}
          liveSessionStatus={data?.liveClass?.status || todayClasses?.liveClass?.status}
          onJoin={joinSessionById}
        />

        {/* Learning Path */}
        {learningPath && (
          <div
            className="glass-card-static p-5 sm:p-6 mb-6 lg:mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <LearningPathCard path={learningPath} />
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* Left column — 2/3 */}
          <div className="lg:col-span-2 space-y-5 lg:space-y-6">
            {/* Level-Aware Progress Card */}
            {data?.levelProgress ? (
              <LevelProgressCard
                levelProgress={data.levelProgress}
                legacyProgress={progress}
                onViewProgress={() => navigate({ to: studentPaths.progress })}
              />
            ) : (
              <div
                className="glass-card overflow-hidden animate-fade-in-up"
                style={{ animationDelay: "0.15s" }}
              >
                <div className="gradient-accent-bar" />
                <div className="p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Current Hifz Progress</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-200 mt-0.5">
                        {progress?.currentSurah
                          ? `${progress.currentSurah} · Ayah ${progress.currentAyah}`
                          : "Not started yet"}
                      </p>
                    </div>
                    <Badge className="bg-nejah-electric/10 text-nejah-electric border border-nejah-electric/20 font-semibold">
                      {progress?.rank || "Beginner"}
                    </Badge>
                  </div>
                  <div className="relative h-2.5 bg-muted dark:bg-nejah-surface rounded-full mb-5 overflow-hidden">
                    <div
                      className="progress-gradient h-full transition-all duration-700 ease-out"
                      style={{ width: `${progress?.percentage || 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="stat-card">
                      <p className="font-bold text-xl text-foreground">
                        {progress?.memorizedSurahs ?? 0}
                      </p>
                      <p className="text-xs text-foreground mt-1 font-medium">Surahs</p>
                    </div>
                    <div className="stat-card">
                      <p className="font-bold text-xl text-foreground">
                        {progress?.memorizedAyahs ?? 0}
                      </p>
                      <p className="text-xs text-foreground mt-1 font-medium">Ayahs</p>
                    </div>
                    <div className="stat-card">
                      <p className="font-bold text-xl text-foreground">
                        {progress?.completedJuz ?? 0}
                      </p>
                      <p className="text-xs text-foreground mt-1 font-medium">Juz</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-border/60 hover:border-nejah-electric/30 hover:bg-primary/5 transition-all"
                    onClick={() => navigate({ to: studentPaths.progress })}
                  >
                    View Full Progress <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Today's Lesson */}
            <div
              className="glass-card overflow-hidden animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-nejah-electric" />
                  <h3 className="text-lg font-bold text-foreground">
                    {data?.todaysLesson?.level === "Qaida Nooraniya"
                      ? "Today's Qaida Lesson"
                      : data?.todaysLesson?.level === "Tajweed Program"
                        ? "Today's Tajweed Lesson"
                        : data?.todaysLesson?.level === "Hifz Program" ||
                            data?.todaysLesson?.level === "Hifz Muraja'a"
                          ? "Today's Hifz Lesson"
                          : "Today's Lesson"}
                  </h3>
                </div>
                <TodayLesson lesson={data?.todaysLesson} />
              </div>
            </div>

            {/* Recent Feedback */}
            {data?.recentFeedback && data.recentFeedback.length > 0 && (
              <div
                className="glass-card overflow-hidden animate-fade-in-up"
                style={{ animationDelay: "0.25s" }}
              >
                <div className="p-5 sm:p-6">
                  <h3 className="font-bold text-foreground mb-4">Recent Teacher Feedback</h3>
                  {data.recentFeedback.slice(0, 2).map((f) => (
                    <div
                      key={f.id}
                      className="mb-4 last:mb-0 border-b border-border/40 dark:border-nejah-border-blue/30 pb-4 last:border-0"
                    >
                      <p className="text-xs text-nejah-electric font-medium">
                        {f.teacherName} · {f.date ? new Date(f.date).toLocaleDateString() : ""}
                      </p>
                      <p className="text-sm mt-1.5 italic text-muted-foreground dark:text-gray-200">
                        &quot;{f.summary}&quot;
                      </p>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="rounded-xl border-border/60 hover:border-nejah-electric/30 hover:bg-primary/5"
                    onClick={() => navigate({ to: studentPaths.progress })}
                  >
                    View All Feedback
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right column — 1/3 */}
          <div className="space-y-5 lg:space-y-6">
            {/* Weekly Attendance */}
            <button
              type="button"
              className="glass-card w-full text-left p-5 sm:p-6 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
              onClick={() => navigate({ to: studentPaths.progress })}
            >
              <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 text-center">
                Weekly Attendance
              </h4>
              <div className="flex justify-between px-2 mb-4">
                {data?.attendance?.weekly?.map((day) => {
                  const wd = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                  const short = dayLabels[wd] || "?";
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-2.5 h-12 rounded-full transition-colors ${
                          day.present
                            ? "bg-gradient-to-t from-primary to-nejah-electric"
                            : "bg-muted dark:bg-nejah-surface"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground dark:text-gray-200">{short}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-sm font-bold text-foreground">
                {data?.attendance?.rate ?? 0}% · Present {data?.attendance?.presentDays ?? 0} /
                Absent {data?.attendance?.absentDays ?? 0}
              </p>
            </button>

            {/* Notifications */}
            <div
              className="glass-card-static p-5 sm:p-6 animate-fade-in-up"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <BellIcon className="h-4 w-4 text-nejah-electric" /> Notifications
                </h3>
                {(data?.unreadNotifications ?? 0) > 0 && (
                  <Badge className="bg-red-500 text-white border-none text-[10px] font-bold px-2">
                    {data!.unreadNotifications}
                  </Badge>
                )}
              </div>
              {data?.notifications && data.notifications.length > 0 ? (
                <ul className="space-y-2.5 text-sm">
                  {data.notifications.slice(0, 3).map((n) => {
                    const Icon = NOTIFICATION_ICONS[n.type || n.channel] || BellIcon;
                    const iconColor =
                      NOTIFICATION_COLORS[n.type || n.channel] || "text-nejah-electric";
                    const bgColor = NOTIFICATION_BG_COLORS[n.type || n.channel] || "";
                    return (
                      <li
                        key={n.id}
                        className={`flex items-start gap-2.5 ${n.isRead ? "text-muted-foreground dark:text-gray-200" : "font-medium text-foreground"}`}
                      >
                        <div
                          className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center relative ${bgColor}`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                          {!n.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-nejah-electric ring-2 ring-background" />
                          )}
                        </div>
                        <span className="flex-1">{n.title}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground dark:text-gray-200">No notifications</p>
              )}
              <Button
                variant="link"
                className="px-0 text-nejah-electric mt-3 font-semibold text-sm"
                onClick={() => navigate({ to: studentPaths.notifications })}
              >
                View All Notifications
              </Button>
            </div>
          </div>
        </div>
      </main>
    </StudentPortalLayout>
  );
}
