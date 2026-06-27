import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play, BookOpen, ChevronRight, Lock, Eye, EyeOff, Bell, MessageSquare, Calendar, GraduationCap, UserCheck, Sparkles, Bell as BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { StudentPortalLayout, StudentPageLoader } from "@/components/student/StudentPortalLayout";
import {
  api,
  apiHeaders,
  requireStudentAuth,
  storeStudentId,
  studentPaths,
} from "@/lib/student-portal";
import { LearningPathCard, useLearningPath } from "@/components/progress/LearningPathCard";
import { LevelProgressCard } from "@/components/progress/LevelProgressCard";
import { useSocket } from "@/hooks/useSocket";
import { NOTIFICATION_ICONS, NOTIFICATION_COLORS, NOTIFICATION_BG_COLORS } from "@/lib/notification-helpers";
import { PushNotificationToggle } from "@/components/ui/push-notification-toggle";

const dayLabels: Record<string, string> = {
  Sunday: "S",
  Monday: "M",
  Tuesday: "T",
  Wednesday: "W",
  Thursday: "T",
  Friday: "F",
  Saturday: "S",
};

function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPw, setChangingPw] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: "", email: "" });
  const { path: learningPath } = useLearningPath(profile?.student?.id);

  useEffect(() => {
    Promise.all([api("/student/dashboard"), api("/student/profile").catch(() => null)])
      .then(([dash, prof]) => {
        setData(dash);
        setProfile(prof);
        if (prof?.student) {
          storeStudentId(prof.student.id);
          setProfileForm({ phone: prof.student.phone || "", email: prof.student.email || "" });
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error("Could not load your dashboard. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, []);

  // WebSocket for real-time notifications
  useSocket({
    onNotification: (notif) => {
      api("/student/dashboard")
        .then((dash) => setData(dash))
        .catch(() => {});
      if (notif.channel === "MEETING_STARTED" && notif.data?.sessionId) {
        const sessionId = notif.data.sessionId;
        toast(notif.title, {
          description: notif.content,
          duration: 10000,
          action: {
            label: "Join Now",
            onClick: () =>
              navigate({ to: "/classroom/$sessionId", params: { sessionId } }),
          },
        });
      }
    },
  });

  const handleChangePassword = async () => {
    if (
      !pwForm.currentPassword ||
      !pwForm.newPassword ||
      pwForm.newPassword !== pwForm.confirmPassword
    ) {
      toast.error("Check password fields");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch(
        apiUrl(`/users/change-password`),
        {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify(pwForm),
        },
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      toast.success("Password updated");
      setChangePasswordOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChangingPw(false);
    }
  };

  const saveProfile = async () => {
    try {
      await fetch(apiUrl(`/users/profile`), {
        method: "PATCH",
        headers: apiHeaders(),
        body: JSON.stringify({ phone: profileForm.phone, email: profileForm.email }),
      });
      toast.success("Profile updated");
      setProfileOpen(false);
    } catch {
      toast.error("Could not update profile");
    }
  };

  if (loading) return <StudentPageLoader />;

  const student = data?.student;
  const welcome = data?.welcome;
  const progress = data?.progress;
  const attendance = data?.attendance;

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

  const joinClass = async () => {
    const sessionId = data?.liveClass?.id || data?.upcomingClass?.sessionId;
    if (data?.liveClass?.status === "LIVE" && sessionId) {
      try {
        await fetch(apiUrl(`/live-sessions/${sessionId}/join`), {
          method: "POST",
          headers: apiHeaders(),
        });
      } catch {
        /* join may fail if already joined */
      }
      navigate({ to: "/classroom/$sessionId", params: { sessionId } });
    } else if (sessionId) {
      toast.info("Your teacher has not started the session yet.");
    } else if (data?.upcomingClass?.meetingLink) {
      window.open(data.upcomingClass.meetingLink, "_blank");
    } else {
      toast.info("No live meeting available yet.");
    }
  };

  const firstName = welcome?.firstName || student?.firstName || localStorage.getItem('userName')?.split(" ")[0] || "Student";

  return (
    <StudentPortalLayout
      activePath={studentPaths.dashboard}
      student={student ? { ...student, level: displayLevel } : undefined}
      unreadNotifications={data?.unreadNotifications}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenProfile={() => setProfileOpen(true)}
    >
      <main className="flex-1 px-4 sm:px-6 lg:px-10 pb-8 lg:pb-10">
        {/* ─── Hero Header ─── */}
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
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground bg-card/60 dark:bg-nejah-surface/60 border border-border/40 rounded-full px-3 py-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-nejah-electric" />
                  {displayLevel}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground bg-card/60 dark:bg-nejah-surface/60 border border-border/40 rounded-full px-3 py-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-nejah-electric" />
                  {displayTeacher}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground bg-card/60 dark:bg-nejah-surface/60 border border-border/40 rounded-full px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-nejah-electric" />
                  {displayEnrolled}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Temporary teacher notice */}
        {student?.isTemporaryTeacher && student?.temporaryTeacher && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 text-sm text-amber-900 dark:text-amber-200 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <p className="font-bold mb-1">Temporary Teacher Assigned</p>
            <p>
              <strong>{student.temporaryTeacher.name}</strong> is teaching your classes from{" "}
              {student.temporaryTeacher.startDate} to {student.temporaryTeacher.endDate}. Your
              regular teacher is {student.temporaryTeacher.originalTeacher}.
            </p>
          </div>
        )}

        {/* Learning Path */}
        {learningPath && (
          <div className="glass-card-static p-5 sm:p-6 mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <LearningPathCard path={learningPath} />
          </div>
        )}

        {/* ─── Main Grid ─── */}
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
            <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="gradient-accent-bar" />
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Current Hifz Progress
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {progress?.currentSurah ? `${progress.currentSurah} · Ayah ${progress.currentAyah}` : 'Not started yet'}
                    </p>
                  </div>
                  <Badge className="bg-nejah-electric/10 text-nejah-electric border border-nejah-electric/20 font-semibold">
                    {progress?.rank || 'Beginner'}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="relative h-2.5 bg-muted dark:bg-nejah-surface rounded-full mb-5 overflow-hidden">
                  <div
                    className="progress-gradient h-full transition-all duration-700 ease-out"
                    style={{ width: `${progress?.percentage || 0}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="stat-card">
                    <p className="font-bold text-xl text-foreground">
                      {progress?.memorizedSurahs ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Surahs</p>
                  </div>
                  <div className="stat-card">
                    <p className="font-bold text-xl text-foreground">
                      {progress?.memorizedAyahs ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Ayahs</p>
                  </div>
                  <div className="stat-card">
                    <p className="font-bold text-xl text-foreground">
                      {progress?.completedJuz ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Juz</p>
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
            <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-nejah-electric" />
                  <h3 className="text-lg font-bold text-foreground">
                    Today&apos;s Lesson
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 p-4 rounded-xl border border-primary/8">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                      Surah
                    </p>
                    <p className="font-semibold text-foreground">{data?.todaysLesson?.surah || '—'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 p-4 rounded-xl border border-primary/8">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                      Ayah Range
                    </p>
                    <p className="font-semibold text-foreground">
                      {data?.todaysLesson?.ayahRange || '—'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 p-4 rounded-xl sm:col-span-2 border border-primary/8">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                      Revision
                    </p>
                    <p className="font-semibold text-foreground">{data?.todaysLesson?.revision || 'Complete your daily revision.'}</p>
                  </div>
                  {data?.todaysLesson?.homework && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl sm:col-span-2 border border-amber-100 dark:border-amber-800/50">
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider mb-1">
                        Homework
                      </p>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">{data.todaysLesson.homework.title}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Feedback */}
            {data?.recentFeedback?.length > 0 && (
              <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <div className="p-5 sm:p-6">
                  <h3 className="font-bold text-foreground mb-4">Recent Teacher Feedback</h3>
                  {data.recentFeedback.slice(0, 2).map((f: any) => (
                    <div
                      key={f.id}
                      className="mb-4 last:mb-0 border-b border-border/40 dark:border-nejah-border-blue/30 pb-4 last:border-0"
                    >
                      <p className="text-xs text-nejah-electric font-medium">
                        {f.teacherName} · {f.date ? new Date(f.date).toLocaleDateString() : ""}
                      </p>
                      <p className="text-sm mt-1.5 italic text-muted-foreground">&quot;{f.summary}&quot;</p>
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
            {/* Upcoming / Live Class */}
            <div className="upcoming-class-gradient rounded-2xl text-white overflow-hidden animate-fade-in-up shadow-lg" style={{ animationDelay: '0.15s' }}>
              <div className="p-5 sm:p-6">
                {data?.liveClass?.status === "LIVE" ? (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="live-pulse-dot" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-200">Live Now</span>
                  </div>
                ) : (
                  <Badge className="bg-white/15 text-white/90 border-none mb-3 text-xs font-semibold">
                    Upcoming Class
                  </Badge>
                )}
                {data?.liveClass?.status === "LIVE" ? (
                  <>
                    <h3 className="text-xl font-bold">{data.liveClass.classTitle}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      Teacher: {data.liveClass.teacher?.fullName || displayTeacher}
                    </p>
                    <p className="text-sm font-bold text-nejah-electric mt-1">
                      {data.liveClass.scheduledStart
                        ? new Date(data.liveClass.scheduledStart).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : data?.upcomingClass?.time}
                    </p>
                  </>
                ) : data?.upcomingClass ? (
                  <>
                    <h3 className="text-xl font-bold">{data.upcomingClass.name}</h3>
                    <p className="text-white/60 text-sm mt-1">
                      with {data.upcomingClass.teacher}
                    </p>
                    <p className="text-sm font-bold text-nejah-electric mt-1">
                      {data.upcomingClass.time}
                    </p>
                  </>
                ) : (
                  <p className="text-white/50">No class scheduled</p>
                )}
                <div className="flex flex-col gap-2 mt-5">
                  <Button
                    className="bg-white text-nejah-sapphire hover:bg-white/90 font-semibold rounded-xl shadow-md"
                    onClick={joinClass}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {data?.liveClass?.status === "LIVE" ? "Join Session" : "Join Class"}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/25 text-white hover:bg-white/10 rounded-xl"
                    onClick={() => navigate({ to: studentPaths.classes })}
                  >
                    View Schedule
                  </Button>
                </div>
              </div>
            </div>

            {/* Weekly Attendance */}
            <button
              type="button"
              className="glass-card w-full text-left p-5 sm:p-6 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
              onClick={() => navigate({ to: studentPaths.progress })}
            >
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
                Weekly Attendance
              </h4>
              <div className="flex justify-between px-2 mb-4">
                {attendance?.weekly?.map((day: any) => {
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
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {short}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-sm font-bold text-foreground">
                {attendance?.rate ?? 0}% · Present {attendance?.presentDays ?? 0} / Absent{" "}
                {attendance?.absentDays ?? 0}
              </p>
            </button>

            {/* Notifications */}
            <div className="glass-card-static p-5 sm:p-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4 text-nejah-electric" /> Notifications
                </h3>
                {data?.unreadNotifications > 0 && (
                  <Badge className="bg-red-500 text-white border-none text-[10px] font-bold px-2">
                    {data.unreadNotifications}
                  </Badge>
                )}
              </div>
              {data?.notifications?.length ? (
                <ul className="space-y-2.5 text-sm">
                  {data.notifications.slice(0, 3).map((n: any) => {
                    const Icon = NOTIFICATION_ICONS[n.type || n.channel] || BellIcon;
                    const iconColor = NOTIFICATION_COLORS[n.type || n.channel] || "text-nejah-electric";
                    const bgColor = NOTIFICATION_BG_COLORS[n.type || n.channel] || "";
                    return (
                      <li
                        key={n.id}
                        className={`flex items-start gap-2.5 ${
                          n.isRead
                            ? "text-muted-foreground"
                            : "font-medium text-foreground"
                        }`}
                      >
                        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center relative ${bgColor}`}>
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
                <p className="text-sm text-muted-foreground">
                  No notifications
                </p>
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

      {/* ─── Settings Dialog ─── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center gap-3 p-4 rounded-xl dark:bg-nejah-surface/50 bg-muted hover:bg-primary/5 transition-colors"
              onClick={() => {
                setSettingsOpen(false);
                setChangePasswordOpen(true);
              }}
            >
              <Lock className="h-5 w-5 text-nejah-electric" />
              <span className="font-bold text-sm">Change Password</span>
            </button>
            <div className="border-t border-border pt-3">
              <PushNotificationToggle variant="card" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Profile Dialog ─── */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <p>
              <strong>Name:</strong> {profile?.student?.fullName}
            </p>
            <p>
              <strong>Level:</strong> {displayLevel}
            </p>
            <p>
              <strong>Teacher:</strong> {displayTeacher}
            </p>
            <p>
              <strong>Enrolled:</strong> {displayEnrolled}
            </p>
            <div>
              <Label>Phone</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="stat-card">
                <p className="font-bold text-foreground">
                  {profile?.statistics?.attendancePercentage}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Attendance
                </p>
              </div>
              <div className="stat-card">
                <p className="font-bold text-foreground">
                  {profile?.statistics?.progressPercentage}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Progress</p>
              </div>
              <div className="stat-card">
                <p className="font-bold text-foreground">
                  {profile?.statistics?.homeworkCompletionRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Homework</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveProfile} className="bg-nejah-sapphire rounded-xl">
              Save Contact Info
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Change Password Dialog ─── */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field, i) => (
              <div key={field}>
                <Label>
                  {field === "currentPassword"
                    ? "Current"
                    : field === "newPassword"
                      ? "New"
                      : "Confirm"}
                </Label>
                <div className="relative">
                  <Input
                    type={
                      (i === 0 ? showCurrentPw : i === 1 ? showNewPw : showConfirmPw)
                        ? "text"
                        : "password"
                    }
                    value={pwForm[field]}
                    onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => [setShowCurrentPw, setShowNewPw, setShowConfirmPw][i]((v) => !v)}
                  >
                    {(i === 0 ? showCurrentPw : i === 1 ? showNewPw : showConfirmPw) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={handleChangePassword}
              disabled={changingPw}
              className="bg-nejah-sapphire rounded-xl"
            >
              {changingPw ? "Saving..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute("/student_dashboard")({
  component: StudentDashboard,
  beforeLoad: requireStudentAuth,
});
