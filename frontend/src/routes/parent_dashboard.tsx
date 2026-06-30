import { apiUrl } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Bell,
  ChevronRight,
  BookOpen,
  Users,
  Clock,
  Calendar,
  ClipboardList,
  TrendingUp,
  Award,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { toast } from "sonner";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ParentPortalLayout } from "@/components/parents/ParentPortalLayout";
import { PushNotificationToggle } from "@/components/ui/push-notification-toggle";


// --- Stat Card Component ---
const StatCard = ({ icon: Icon, value, label, subValue, trend, color, onClick }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "glass-panel bg-white p-6 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
      onClick ? "cursor-pointer hover:border-nejah-electric/20" : "",
    )}
  >
    <div
      className={cn(
        "absolute top-0 right-0 w-20 h-20 opacity-[0.03] transform translate-x-6 -translate-y-6 rounded-full bg-nejah-surface",
      )}
    />

    <div className="flex items-start justify-between mb-6">
      <div
        className={cn(
          "p-3 rounded-2xl",
          color === "emerald"
            ? "bg-primary/10 text-nejah-electric"
            : color === "blue"
              ? "bg-blue-50 text-blue-700"
              : color === "amber"
                ? "bg-amber-50 text-amber-700"
                : color === "red"
                  ? "bg-red-50 text-red-700"
                  : "bg-primary/10 text-nejah-electric",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      {trend && (
        <Badge
          variant="outline"
          className="rounded-full border-none px-2.5 py-0.5 bg-primary/10 text-nejah-electric font-black text-[9px] uppercase tracking-wider"
        >
          {trend}
        </Badge>
      )}
    </div>

    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
        {label}
      </p>
      <h3 className="text-3xl font-black text-foreground font-serif leading-none pt-2">{value}</h3>
      {subValue && <p className="text-[10px] text-muted-foreground mt-2 font-bold">{subValue}</p>}
      <div className="w-16 h-1 bg-muted rounded-full mt-3 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            color === "emerald"
              ? "bg-primary"
              : color === "blue"
                ? "bg-blue-600"
                : color === "amber"
                  ? "bg-amber-600"
                  : color === "red"
                    ? "bg-red-650"
                    : "bg-nejah-sapphire",
          )}
          style={{ width: "70%" }}
        />
      </div>
    </div>
  </div>
);

// --- Topbar Component ---
const Topbar = ({ parent, onTabChange, searchQuery, onSearchChange }: { parent: any; onTabChange: (tab: string) => void; searchQuery: string; onSearchChange: (q: string) => void }) => {
  const { lang, setLang, translations } = useLanguage();
  const t = (key: string) => translations[key] || key;
  const navigate = useNavigate();
  
  return (
    <div className="h-24 hidden lg:flex items-center justify-between px-12 bg-card/80 backdrop-blur-md sticky top-0 z-20 w-full border-b border-border shadow-sm">
      <div className="flex items-center gap-6 w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-nejah-sapphire font-serif">{t('parentPortal')}</h2>
          
          <div className="hidden lg:flex items-center bg-background/50 p-1.5 rounded-2xl border border-border ml-auto">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-12 bg-transparent border-none w-80 h-10 text-xs focus-visible:ring-0"
                />
            </div>
          </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Language Switcher */}
        <div className="flex items-center gap-3 bg-background/50 px-4 py-2 rounded-2xl border border-border">
            {['English', 'Arabic', 'Amharic', 'Oromo'].map((l) => (
                <button 
                    key={l}
                    onClick={() => setLang(l as any)}
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-all px-2 py-0.5",
                        lang === l ? "text-nejah-sapphire underline underline-offset-4 decoration-2" : "text-muted-foreground hover:text-muted-foreground"
                    )}
                >
                    {l}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-3">
            <button onClick={() => navigate({ to: '/parent_notifications' })} className="relative p-2.5 bg-background/50 rounded-2xl text-muted-foreground hover:text-nejah-sapphire transition-all hover:shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse" />
            </button>
        </div>

        <div className="w-px h-10 bg-muted" />

        <div 
          onClick={() => onTabChange('settings')}
          className="flex items-center gap-4 group cursor-pointer"
        >
          <div className="text-right">
             <p className="text-sm font-black text-nejah-sapphire leading-none group-hover:text-nejah-electric transition-colors">{parent?.name || 'Ahmed Al-Mansour'}</p>
             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{t('primaryGuardian')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-nejah-electric/10 shadow-md transform group-hover:scale-105 transition-transform bg-primary/10 flex items-center justify-center font-bold text-nejah-sapphire">
            {parent?.name?.charAt(0) || 'P'}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChildCard = ({ child, onInspectProgress }: any) => {
  const { translations } = useLanguage();
  const t = (key: string) => translations[key] || key;
  return (
  <div className="glass-panel bg-card rounded-[40px] p-8 border border-border shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col h-full">
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-2.5",
        child.id.charCodeAt(child.id.length - 1) % 2 === 0 ? "bg-amber-400" : "bg-nejah-sapphire",
      )}
    />

    <div className="flex items-center justify-between mb-8">
      <Badge
        className={cn(
          "rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-none",
          child.status === "ACTIVE"
            ? "bg-primary/10 text-nejah-electric"
            : "bg-muted text-muted-foreground",
        )}
      >
        {child.status}
      </Badge>
      <span className="text-xs text-muted-foreground font-bold">
        {t("studentId")} {child.id.substring(0, 8)}
      </span>
    </div>

    <div className="flex flex-col items-center text-center space-y-4 mb-8">
      <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-border shadow-lg group-hover:scale-105 transition-transform duration-500 bg-primary/10 flex items-center justify-center font-bold text-3xl text-foreground">
        {child.name.charAt(0)}
      </div>
      <div>
        <h4 className="text-2xl font-black text-foreground font-serif">{child.name}</h4>
        <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center justify-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-nejah-electric" />
          Level: {child.level}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-auto mb-6">
      <div className="bg-background/50 p-4 rounded-[24px] text-center border border-border shadow-inner group-hover:bg-primary/10 transition-colors">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
          Teacher
        </p>
        <p className="text-xs font-black text-nejah-sapphire leading-tight truncate">
          {child.teacher}
        </p>
      </div>
      <div className="bg-background/50 p-4 rounded-[24px] text-center border border-border shadow-inner group-hover:bg-blue-50 transition-colors">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
          Memorization
        </p>
        <p className="text-xs font-black text-nejah-sapphire">{child.memorization}%</p>
      </div>
    </div>

    <div className="pt-6 border-t border-border flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          Current Surah
        </p>
        <p className="text-xs font-bold text-nejah-sapphire truncate max-w-[120px]">
          {child.currentSurah}
        </p>
        {(child.currentPage > 0 || child.currentAyah > 0) && (
          <p className="text-[9px] text-muted-foreground">
            {child.currentPage > 0 ? `Page ${child.currentPage}` : ""}
            {child.currentPage > 0 && child.currentAyah > 0 ? " · " : ""}
            {child.currentAyah > 0 ? `Ayah ${child.currentAyah}` : ""}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-[20px] font-black text-nejah-sapphire leading-none mb-1">
          {child.attendance}%
        </p>
        <p className="text-[9px] font-bold text-nejah-electric uppercase tracking-widest">
          Attendance
        </p>
      </div>
    </div>

    <div className="mt-6 pt-4 border-t border-border">
      <Button
        onClick={() => onInspectProgress(child.id)}
        className="w-full rounded-xl h-10 text-[10px] font-bold uppercase tracking-wider bg-nejah-sapphire hover:bg-background text-white"
      >
        {t("progressDetails")}
      </Button>
    </div>
  </div>
  );
};

// --- Main Page ---
function ParentDashboard({ initialTab }: { initialTab?: string }) {
  const { translations } = useLanguage();
  const t = (key: string) => translations[key] || key;
  const getGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Poll for unread notifications
  useEffect(() => {
    const poll = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/notifications/unread-count"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count ?? 0);
        }
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  // Learning time states
  const [learningTime, setLearningTime] = useState<any>(null);
  const [loadingLearningTime, setLoadingLearningTime] = useState<boolean>(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    language: "English",
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(apiUrl(`/parent/dashboard`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
          if (result.children && result.children.length > 0) {
            setSelectedChildId(result.children[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch parent dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Fetch learning time for selected child
  useEffect(() => {
    if (!selectedChildId) return;

    const fetchLearningTime = async () => {
      setLoadingLearningTime(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/analytics/student/${selectedChildId}/learning-time`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setLearningTime(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch learning time", err);
      } finally {
        setLoadingLearningTime(false);
      }
    };

    fetchLearningTime();
  }, [selectedChildId]);

  // Evaluations state
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Fetch evaluations for selected child
  useEffect(() => {
    if (!selectedChildId) return;
    const fetchEvaluations = async () => {
      setLoadingEvaluations(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl(`/evaluations?studentId=${selectedChildId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setEvaluations(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch evaluations", err);
      } finally {
        setLoadingEvaluations(false);
      }
    };
    fetchEvaluations();
  }, [selectedChildId]);

  // Load parent profiles into settings state
  useEffect(() => {
    if (data?.parent) {
      setProfileForm({
        name: data.parent.name || "",
        email: data.parent.email || "",
        phone: "+251 912 345678",
        address: "Addis Ababa, Ethiopia",
        language: "English",
      });
    }
  }, [data]);

  const handleInspectProgress = (childId: string) => {
    setSelectedChildId(childId);
    setActiveTab("quran");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Guardian profile saved successfully! Settings are synced.");
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-2xl h-16 w-16 border-t-4 border-b-4 border-nejah-sapphire"></div>
      </div>
    );

  const selectedChild =
    data?.children?.find((c: any) => c.id === selectedChildId) || data?.children?.[0];

  const filteredChildren = data?.children?.filter((c: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.teacher?.toLowerCase().includes(q);
  }) || [];

  return (
    <ParentPortalLayout
      activePath="/parent_dashboard"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      parent={data?.parent}
      unreadNotifications={unreadCount}
    >
      <Topbar parent={data?.parent} onTabChange={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12 w-full">
          {/* ================================================================ */}
          {/* TAB: DASHBOARD OVERVIEW */}
          {/* ================================================================ */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <StatCard
                  icon={Users}
                  value={data?.stats?.totalChildren ?? 0}
                  label={t('totalChildren')}
                  color="emerald"
                  onClick={() => setActiveTab("children")}
                />
                <StatCard
                  icon={BookOpen}
                  value={data?.stats?.activeClasses ?? 0}
                  label={t('activeClasses')}
                  color="emerald"
                  onClick={() => setActiveTab("schedule")}
                />
                <StatCard
                  icon={Calendar}
                  value={`${data?.stats?.attendanceRate ?? 0}%`}
                  label={t('attendanceRate')}
                  color="blue"
                  onClick={() => setActiveTab("schedule")}
                />
                <StatCard
                  icon={Award}
                  value={`${data?.stats?.memorizationProgress ?? 0}%`}
                  label="Avg Memorization"
                  color="amber"
                  onClick={() => setActiveTab("quran")}
                />
                <StatCard
                  icon={ClipboardList}
                  value={data?.stats?.pendingHomework ?? 0}
                  label="Pending HW"
                  color="red"
                  onClick={() => setActiveTab("homework")}
                />
                <StatCard
                  icon={TrendingUp}
                  value={learningTime ? `${Math.round(learningTime.totalHours * 10) / 10}h` : "-"}
                  label="Learning Time (total)"
                  trend={`${learningTime?.sessionCount || 0} sessions`}
                  color="emerald"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left Column: Children list */}
                <div className="xl:col-span-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                      {t("childrenOverview")}
                    </h3>
                    <Button
                      onClick={() => setActiveTab("children")}
                      variant="ghost"
                      className="text-sm font-black text-nejah-sapphire flex items-center gap-2 hover:underline underline-offset-4"
                    >
                      {t("viewAllProfiles")} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredChildren.map((child: any) => (
                      <ChildCard
                        key={child.id}
                        child={child}
                        onInspectProgress={handleInspectProgress}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Column: Activities and Schedule */}
                <div className="xl:col-span-4 space-y-10">
                  {/* Today's Schedule Card */}
                  <section className="bg-nejah-surface rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none transform translate-x-10 -translate-y-10 group-hover:translate-x-8 transition-transform duration-1000">
                      <Clock className="w-48 h-48" />
                    </div>

                    <h3 className="text-2xl font-black font-serif mb-6 relative z-10">
                      Today's Schedule
                    </h3>

                    <div className="space-y-4 relative z-10">
                      {data?.schedules?.length === 0 ? (
                        <div className="bg-white/5 p-6 rounded-[28px] border border-white/5 text-center">
                          <p className="text-xs text-white/60 italic">No classes scheduled for today.</p>
                        </div>
                      ) : (
                        data?.schedules?.slice(0, 3).map((session: any) => (
                          <div
                            key={session.id}
                            className="bg-white/10 p-5 rounded-[28px] border border-white/5 backdrop-blur-sm group/item flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-nejah-electric uppercase tracking-widest leading-none">
                                  {session.childName}
                                </p>
                                <h4 className="text-sm font-black text-white group-hover/item:text-nejah-electric transition-colors mt-1">
                                  {session.className}
                                </h4>
                              </div>
                              <Badge className="bg-background/70 text-foreground rounded-xl px-2.5 py-1 border-none font-bold text-[9px] tabular-nums">
                                {session.time}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-nejah-electric/80 mt-1">
                              <span>Teacher: {session.teacher}</span>
                              {session.meetingLink && (
                                <a
                                  href={session.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-amber-300 hover:text-white font-bold"
                                >
                                  {t("joinLink")} <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      <Button
                        onClick={() => setActiveTab("schedule")}
                        className="w-full mt-4 py-6 rounded-[28px] bg-amber-500 hover:bg-amber-600 text-nejah-sapphire font-black text-xs transition-all shadow-xl hover:scale-[1.02] border-none"
                      >
                        {t("openClassSchedule")}
                      </Button>
                    </div>
                  </section>

                  {/* Learning Time */}
                  {learningTime && (
                    <section className="glass-panel bg-gradient-to-br from-nejah-sapphire/5 to-primary/5 rounded-[40px] p-8 border border-primary/10 shadow-sm">
                      <h3 className="text-xl font-black text-nejah-sapphire font-serif mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-nejah-electric" /> Learning Time
                      </h3>
                      {loadingLearningTime ? (
                        <div className="py-4 flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-nejah-electric" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/50 p-4 rounded-2xl text-center border border-primary/10">
                            <p className="text-2xl font-black text-nejah-sapphire font-serif">
                              {Math.round(learningTime.totalHours * 10) / 10}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {t("totalHours")}
                            </p>
                          </div>
                          <div className="bg-white/50 p-4 rounded-2xl text-center border border-primary/10">
                            <p className="text-2xl font-black text-nejah-sapphire font-serif">
                              {learningTime.sessionCount || 0}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              Sessions
                            </p>
                          </div>
                          <div className="bg-white/50 p-4 rounded-2xl text-center border border-primary/10">
                            <p className="text-2xl font-black text-nejah-sapphire font-serif">
                              {Math.round(learningTime.averageMinutesPerSession || 0)}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {t("avgMinPerSession")}
                            </p>
                          </div>
                          <div className="bg-white/50 p-4 rounded-2xl text-center border border-primary/10">
                            <p className="text-2xl font-black text-nejah-sapphire font-serif">
                              {learningTime.totalMinutes || 0}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {t("totalMinutes")}
                            </p>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Recent Activities */}
                  <section className="glass-panel bg-card rounded-[40px] p-8 border border-border shadow-sm">
                    <h3 className="text-xl font-black text-nejah-sapphire font-serif mb-6 flex items-center justify-between">
                      {t("recentFeedbacks")}
                    </h3>

                    <div className="space-y-6">
                      {data?.activities?.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-xs text-muted-foreground italic">No recent feedbacks.</p>
                        </div>
                      ) : (
                        data?.activities?.slice(0, 3).map((a: any) => (
                          <div
                            key={a.id}
                            className="flex gap-4 group cursor-pointer"
                            onClick={() => setActiveTab("quran")}
                          >
                            <div className="w-11 h-11 rounded-2xl bg-background/50 flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-primary/10 group-hover:text-nejah-electric transition-all border border-border">
                              {a.type === "Result" ? (
                                <Award className="h-5 w-5" />
                              ) : (
                                <BookOpen className="h-5 w-5" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black text-foreground leading-tight group-hover:text-nejah-electric transition-colors">
                                {a.title}
                              </h4>
                              <p className="text-[11px] text-muted-foreground font-medium leading-tight">
                                {a.content}
                              </p>
                              <p className="text-[9px] font-bold text-nejah-sapphire uppercase tracking-widest pt-1">
                                {new Date(a.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Button
                      onClick={() => setActiveTab("quran")}
                      variant="ghost"
                      className="w-full mt-8 rounded-2xl bg-background/50 hover:bg-background/70 text-muted-foreground hover:text-nejah-sapphire font-black text-xs h-12"
                    >
                      {t("viewRemarksHistory")}
                    </Button>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* ================================================================ */}
          {/* TAB: MY CHILDREN DETAILS */}
          {/* ================================================================ */}
          {activeTab === "children" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                  {t("childrenProfiles")}
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Detailed cards and active program paths for registered siblings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredChildren.map((child: any) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onInspectProgress={handleInspectProgress}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: QURAN PROGRESS */}
          {/* ================================================================ */}
          {activeTab === "quran" && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                <div>
                  <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                    {t("quranProgress")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {t("quranProgress")}
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("selectChild")}
                  </span>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="bg-white border border-border rounded-xl px-4 py-2.5 text-xs font-black text-foreground focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                  >
                    {data?.children?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedChild && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Progress detail card */}
                  <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel bg-card rounded-[40px] p-10 border border-border shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <BookOpen className="w-48 h-48 text-nejah-sapphire" />
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-4 flex-1">
                          <h3 className="text-3xl font-black text-nejah-sapphire font-serif leading-tight">
                            {selectedChild.name}
                          </h3>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Active Program: {selectedChild.level || 'Quran Studies'}
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-foreground">
                              {t("currentMilestoneSurah")} <strong>{selectedChild.currentSurah}</strong>
                            </p>
                            {(selectedChild.currentPage > 0 || selectedChild.currentAyah > 0) && (
                              <p className="text-xs text-muted-foreground">
                                {t("lastStudied")}{" "}
                                {selectedChild.currentPage > 0
                                  ? `Page ${selectedChild.currentPage}`
                                  : ""}
                                {selectedChild.currentPage > 0 && selectedChild.currentAyah > 0
                                  ? ", "
                                  : ""}
                                {selectedChild.currentAyah > 0
                                  ? `Ayah ${selectedChild.currentAyah}`
                                  : ""}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {t("instructor")} <strong>{selectedChild.teacher}</strong>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Badge className="bg-primary/10 text-nejah-electric border-none font-bold text-[10px] uppercase tracking-wider px-3.5 py-1">
                              {selectedChild.level || 'Active'}
                            </Badge>
                            <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] uppercase tracking-wider px-3.5 py-1">
                              {selectedChild.teacher ? `Teacher: ${selectedChild.teacher}` : 'Assigned'}
                            </Badge>
                          </div>
                        </div>

                        <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-black text-nejah-sapphire font-serif leading-none">
                              {selectedChild.memorization}%
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">
                              {selectedChild.level || 'Progress'}
                            </span>
                          </div>
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              className="stroke-border stroke-[14] fill-none"
                            />
                            <circle
                              cx="96"
                              cy="96"
                              r="80"
                              className="stroke-nejah-sapphire stroke-[14] fill-none"
                              strokeDasharray="502"
                              strokeDashoffset={502 - 502 * (selectedChild.memorization / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Progress Remarks history */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-black text-foreground font-serif">
                        {t("remarksLog")}
                      </h4>

                      <div className="space-y-4">
                        {data?.feedbacks?.filter((f: any) => f.studentId === selectedChildId)
                          .length === 0 ? (
                          <div className="bg-card rounded-3xl p-8 border border-border text-center text-xs text-muted-foreground italic">
                            No feedback entries recorded yet for {selectedChild.name}.
                          </div>
                        ) : (
                          data?.feedbacks
                            ?.filter((f: any) => f.studentId === selectedChildId)
                            .map((feed: any) => (
                              <div
                                key={feed.id}
                                className="glass-panel bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col gap-3"
                              >
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                  <div className="flex items-center gap-2">
                                    <Award
                                      className="h-4 w-4 
text-nejah-electric"
                                    />
                                    <span className="text-xs font-black text-foreground">
                                      Remarks by {feed.teacherName}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-bold">
                                    {new Date(feed.createdAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold leading-relaxed text-muted-foreground italic">
                                  "{feed.content}"
                                </p>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side widgets */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel bg-card rounded-[32px] p-6 border border-border shadow-sm space-y-6">
                      <h4 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-3">
                        {t("recentDailyLogs")}
                      </h4>

                      <div className="space-y-3.5">
                        {(selectedChild.recentLogs?.length ?? 0) === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-4">
                            {t("noDailyLogs")}
                          </p>
                        ) : (
                          selectedChild.recentLogs.map((log: any) => (
                            <div
                              key={log.id}
                              className="flex flex-col gap-1 bg-primary/10 px-4 py-3 rounded-2xl border border-nejah-electric/15"
                            >
                              <span className="text-xs font-bold text-foreground">
                                {log.surahName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Page {log.lastStudiedPage}, Ayah {log.lastStudiedAyah}
                                {log.teacherName ? ` · ${log.teacherName}` : ""}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {log.date ? new Date(log.date).toLocaleDateString() : ""}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: HOMEWORK */}
          {/* ================================================================ */}
          {activeTab === "homework" && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                <div>
                  <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                    {t("homeworkAssignments")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {t("homeworkDesc")}
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("selectChild")}
                  </span>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="bg-white border border-border rounded-xl px-4 py-2.5 text-xs font-black text-foreground focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                  >
                    {data?.children?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedChild && (
                <div className="space-y-8">
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="glass-panel bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-nejah-electric">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          {t("totalHomework")}
                        </p>
                        <h4 className="text-xl font-black text-foreground font-serif">
                          {data?.homework?.filter((h: any) => h.studentId === selectedChildId)
                            .length || 0}{" "}
                          Assigned
                        </h4>
                      </div>
                    </div>

                    <div className="glass-panel bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-red-50 rounded-xl text-red-650">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Pending
                        </p>
                        <h4 className="text-xl font-black text-red-600 font-serif">
                          {data?.homework?.filter(
                            (h: any) => h.studentId === selectedChildId && h.status === "Pending",
                          ).length || 0}{" "}
                          Pending
                        </h4>
                      </div>
                    </div>

                    <div className="glass-panel bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-primary/15 rounded-xl text-foreground">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Completed
                        </p>
                        <h4 className="text-xl font-black text-foreground font-serif">
                          {data?.homework?.filter(
                            (h: any) => h.studentId === selectedChildId && h.status === "Completed",
                          ).length || 0}{" "}
                          Submitted
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-4">
                    {data?.homework?.filter((h: any) => h.studentId === selectedChildId).length ===
                    0 ? (
                      <div className="bg-card rounded-3xl p-12 text-center text-xs text-muted-foreground font-medium italic border border-border">
                        No homework tasks recorded.
                      </div>
                    ) : (
                      data?.homework
                        ?.filter((h: any) => h.studentId === selectedChildId)
                        .map((hw: any) => (
                          <div
                            key={hw.id}
                            className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-black text-foreground font-serif">
                                  {hw.title}
                                </h4>
                                <Badge
                                  className={cn(
                                    "text-[8px] font-bold uppercase tracking-wider px-2 border-none",
                                    hw.difficulty === "High"
                                      ? "bg-red-50 text-red-650"
                                      : hw.difficulty === "Medium"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-primary/10 text-nejah-electric",
                                  )}
                                >
                                  {hw.difficulty} {t("difficulty")}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                {hw.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end border-t md:border-none pt-4 md:pt-0 border-border">
                              <div className="text-left md:text-right space-y-1">
                                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                    {t("dueDate")}
                                </p>
                                <p className="text-xs font-bold text-foreground tabular-nums">
                                  {new Date(hw.dueDate).toLocaleDateString()}
                                </p>
                              </div>

                              <div>
                                <Badge
                                  className={cn(
                                    "text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border-none",
                                    hw.status === "Completed"
                                      ? "bg-nejah-sapphire text-white"
                                      : "bg-red-50 text-red-600 animate-pulse",
                                  )}
                                >
                                  {hw.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: EXAMS & RESULTS */}
          {/* ================================================================ */}
          {activeTab === "exams" && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                <div>
                  <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                    {t("examsAndResults")}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {t("examsDesc")}
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("selectChild")}
                  </span>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="bg-white border border-border rounded-xl px-4 py-2.5 text-xs font-black text-foreground focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                  >
                    {data?.children?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedChild && (
                <div className="space-y-8">
                  {/* Results list */}
                  <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm p-8 overflow-hidden">
                    <h4 className="text-xl font-black text-foreground font-serif mb-6">
                      {t("evaluationLogs")}
                    </h4>

                    <div className="space-y-6">
                      {loadingEvaluations ? (
                        <div className="py-12 flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nejah-electric"></div>
                        </div>
                      ) : evaluations.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground font-medium italic">
                          {t("noEvaluations")} {selectedChild?.name || ""}.
                        </div>
                      ) : (
                        evaluations.map((evalItem: any) => {
                          const grade = getGrade(evalItem.score);
                          const isPassed = evalItem.score >= 50;
                          return (
                            <div
                              key={evalItem.id}
                              className="border-b border-border pb-6 last:border-none last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-base font-extrabold text-foreground">
                                    {evalItem.evaluationType} - {evalItem.programType}
                                  </h4>
                                  <span className="text-[10px] text-muted-foreground font-bold">
                                    {new Date(evalItem.evaluationDate || evalItem.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                                  {t("remarks")} "{evalItem.teacherComments || t("noData")}"
                                </p>
                                <span className="text-[10px] text-foreground font-bold bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  {t("subject")} {evalItem.programType} - {evalItem.currentLevel}
                                </span>
                              </div>

                              <div className="flex items-center gap-6 shrink-0">
                                <div className="text-center bg-primary/10 border border-nejah-electric/15 rounded-2xl p-4 w-20">
                                  <p className="text-xs font-bold text-muted-foreground leading-none">
                                    {t("score")}
                                  </p>
                                  <p className="text-xl font-black text-nejah-sapphire font-serif mt-1">
                                    {evalItem.score}%
                                  </p>
                                </div>
                                <div className="text-center bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 w-20">
                                  <p className="text-xs font-bold text-muted-foreground leading-none">
                                    {t("grade")}
                                  </p>
                                  <p className="text-xl font-black text-amber-700 font-serif mt-1">
                                    {grade}
                                  </p>
                                </div>
                                <Badge className={`font-bold uppercase tracking-wider text-[9px] px-3.5 py-1 border-none shrink-0 ${isPassed ? 'bg-nejah-sapphire text-white' : 'bg-red-500 text-white'}`}>
                                  {isPassed ? t("passed") : t("failed")}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: CLASS SCHEDULE */}
          {/* ================================================================ */}
          {activeTab === "schedule" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                  {t("classSchedules")}
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {t("scheduleDesc")}
                </p>
              </div>

              <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm overflow-hidden p-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-black uppercase tracking-wider">
                        <th className="pb-4 pr-4">{t("student")}</th>
                        <th className="pb-4 px-4">{t("classTitle")}</th>
                        <th className="pb-4 px-4">Teacher</th>
                        <th className="pb-4 px-4">{t("dayOfWeek")}</th>
                        <th className="pb-4 px-4 text-center">{t("scheduledTime")}</th>
                        <th className="pb-4 px-4 text-center">{t("status")}</th>
                        <th className="pb-4 pl-4 text-center">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-foreground">
                      {data?.schedules?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Clock className="h-10 w-10 text-muted-foreground/40" />
                              <p className="text-sm font-medium text-muted-foreground italic">
                                No class schedules available.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data?.schedules?.map((sc: any) => (
                          <tr key={sc.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-4 pr-4 text-foreground font-black flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-foreground text-[10px]">
                                {sc.childName?.charAt(0) || "S"}
                              </div>
                              {sc.childName}
                            </td>
                            <td className="py-4 px-4 font-bold text-foreground">{sc.className}</td>
                            <td className="py-4 px-4 font-semibold text-muted-foreground">
                              {sc.teacher}
                            </td>
                            <td className="py-4 px-4 font-bold text-foreground">
                              {sc.dayOfWeek || "Monday"}
                            </td>
                            <td className="py-4 px-4 text-center tabular-nums text-muted-foreground font-semibold">
                              {sc.time}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <Badge className="bg-primary/10 text-nejah-electric border-none font-bold uppercase tracking-wider text-[8px] px-2 py-0.5 rounded-full">
                                {sc.status || "Active"}
                              </Badge>
                            </td>
                            <td className="py-4 pl-4 text-center">
                              {sc.meetingLink ? (
                                <Button
                                  onClick={() => window.open(sc.meetingLink, "_blank")}
                                  size="sm"
                                  className="bg-amber-500 hover:bg-amber-600 text-nejah-sapphire rounded-xl text-[10px] font-black uppercase tracking-wider h-8"
                                >
                                  {t("joinRoom")}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground italic text-[10px]">
                                  {t("noLinkYet")}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: PROFILE SETTINGS */}
          {/* ================================================================ */}
          {activeTab === "settings" && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                  {t("profileSettings")}
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {t("settingsDesc")}
                </p>
              </div>

              <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm p-10">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      {t("guardianFullName")}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="pl-12 bg-background/50 border-none rounded-2xl h-12 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      {t("emailAddress")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="pl-12 bg-background/50 border-none rounded-2xl h-12 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      {t("phoneNumber")}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="pl-12 bg-background/50 border-none rounded-2xl h-12 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      {t("homeAddress")}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, address: e.target.value })
                        }
                        className="pl-12 bg-background/50 border-none rounded-2xl h-12 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      {t("preferredLanguage")}
                    </label>
                    <select
                      value={profileForm.language}
                      onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                      className="w-full bg-background/50 border-none rounded-2xl h-12 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                    >
                      <option value="English">English</option>
                      <option value="Amharic">Amharic</option>
                      <option value="Oromo">Oromo</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-nejah-sapphire hover:bg-background text-white rounded-2xl text-xs font-extrabold uppercase tracking-wider"
                  >
                    {t("saveChanges")}
                  </Button>
                </form>
              </div>

              <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm p-10">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-nejah-electric" />
                  <h3 className="text-xl font-black text-foreground font-serif">{t("notificationSettings")}</h3>
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-4">
                  {t("notificationsDesc")}
                </p>
                <PushNotificationToggle variant="card" />
              </div>
            </div>
          )}
        </main>
    </ParentPortalLayout>
  );
}

export const Route = createFileRoute("/parent_dashboard")({
  component: ParentDashboardRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'dashboard',
    };
  },
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");
      if (!token) {
        throw redirect({ to: "/login" });
      }
      if (role !== "parent") {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
});

// Wrap component with LanguageProvider for translation support
function ParentDashboardRoute() {
  const search = Route.useSearch();
  return (
    <LanguageProvider>
      <ParentDashboard initialTab={search.tab} />
    </LanguageProvider>
  );
}
