import { API_BASE, apiUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Search,
  Bell,
  MessageSquare,
  ChevronRight,
  BookOpen,
  Users,
  Clock,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  Mic,
  TrendingUp,
  Award,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { toast } from "sonner";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";

// --- Sidebar Component ---
const ParentSidebar = ({
  activeTab,
  onTabChange,
  isCollapsed,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
}) => {
  const { translations } = useLanguage();

  const menuItems = [
    { label: translations.dashboard, icon: LayoutDashboard, tab: "dashboard" },
    { label: translations.myChildren, icon: Users, tab: "children" },
    { label: translations.quranProgress, icon: BookOpen, tab: "quran" },
    { label: translations.attendance, icon: Calendar, tab: "attendance" },
    { label: translations.homework, icon: ClipboardList, tab: "homework" },
    { label: translations.examsResults, icon: FileText, tab: "exams" },
    { label: translations.classSchedule, icon: Clock, tab: "schedule" },
    { label: translations.recitationAudio, icon: Mic, tab: "recitations" },
  ];

  const bottomItems = [
    { label: translations.messagesChat, icon: MessageSquare, tab: "messages" },
    { label: translations.profileSettings, icon: Settings, tab: "settings" },
    { label: "Logout", icon: LogOut, tab: "logout", className: "text-red-400 hover:bg-red-500/10" },
  ];

  const handleItemClick = (tab: string) => {
    if (tab === "logout") {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      window.location.href = "/login";
    } else {
      onTabChange(tab);
    }
  };

  const toggleSidebar = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("sidebarCollapsed", newValue.toString());
  };

  return (
    <div
      className={`${isCollapsed ? "w-20" : "w-72"} dark:bg-nejah-surface bg-card/80 backdrop-blur-xl dark:border-white/5 border-r border-slate-200 text-foreground flex flex-col h-screen fixed inset-y-0 left-0 shadow-2xl z-30 transition-all duration-300`}
    >
      {/* Brand Logo */}
      <div className="p-6 pb-8 flex items-center justify-between shrink-0">
        <div
          className={`flex items-center gap-3 transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0 px-0" : "w-auto opacity-100"}`}
        >
          <img src="/logo.png" alt="Nejah" className="h-10 w-auto rounded-xl flex-shrink-0" />
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-lg leading-none tracking-tight text-foreground whitespace-nowrap">
              Nejah Online
            </h1>
            <p className="text-[9px] text-nejah-electric font-bold tracking-[0.2em] mt-1 uppercase whitespace-nowrap">
              Islamic Center
            </p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => handleItemClick(item.tab)}
              className={cn(
                "w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative",
                isActive
                  ? "bg-primary/15 text-foreground shadow-inner"
                  : "text-foreground/50 hover:bg-white/5 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive
                    ? "text-nejah-electric"
                    : "text-foreground/30 group-hover:text-nejah-electric",
                )}
              />
              <span
                className={cn(
                  "font-bold text-[13px] tracking-wide transition-all duration-300",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto",
                )}
              >
                {item.label}
              </span>
              {isActive && <div className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="p-4 mt-auto space-y-1 bg-background/80 shrink-0">
        {bottomItems.map((item) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => handleItemClick(item.tab)}
              className={cn(
                "w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300",
                item.className ||
                  (isActive
                    ? "bg-white/10 text-foreground"
                    : "text-foreground/50 hover:bg-white/5 hover:text-foreground"),
              )}
            >
              <item.icon className="h-5 w-5 opacity-50 shrink-0" />
              <span
                className={cn(
                  "font-bold text-[13px] tracking-wide transition-all duration-300",
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Topbar Component ---
const Topbar = ({
  parent,
  onTabChange,
  isCollapsed,
  setIsCollapsed,
}: {
  parent: any;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}) => {
  const { lang, setLang, translations } = useLanguage();

  return (
    <div className="h-24 flex items-center justify-between px-12 bg-card/80 backdrop-blur-md sticky top-0 z-20 w-full border-b border-border shadow-sm">
      <div className="flex items-center gap-6 w-full max-w-7xl mx-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors text-foreground/50"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5 rotate-180" />
          )}
        </button>
        <h2 className="text-2xl font-black text-nejah-sapphire font-serif">Parent Portal</h2>

        <div className="hidden lg:flex items-center bg-background/50 p-1.5 rounded-2xl border border-border ml-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search curriculum, teachers..."
              className="pl-12 bg-transparent border-none w-80 h-10 text-xs focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Language Switcher */}
        <div className="flex items-center gap-3 bg-background/50 px-4 py-2 rounded-2xl border border-border">
          {["English", "Amharic", "Oromo"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-all px-2 py-0.5",
                lang === l
                  ? "text-nejah-sapphire underline underline-offset-4 decoration-2"
                  : "text-muted-foreground hover:text-muted-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2.5 bg-background/50 rounded-2xl text-muted-foreground hover:text-nejah-sapphire transition-all hover:shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full animate-pulse" />
          </button>
          <button
            onClick={() => onTabChange("messages")}
            className="relative p-2.5 bg-background/50 rounded-2xl text-muted-foreground hover:text-nejah-sapphire transition-all hover:shadow-sm"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        <div className="w-px h-10 bg-muted" />

        <div
          onClick={() => onTabChange("settings")}
          className="flex items-center gap-4 group cursor-pointer"
        >
          <div className="text-right">
            <p className="text-sm font-black text-nejah-sapphire leading-none group-hover:text-nejah-electric transition-colors">
              {parent?.name || "Ahmed Al-Mansour"}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Primary Guardian
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-nejah-electric/10 shadow-md transform group-hover:scale-105 transition-transform bg-primary/10 flex items-center justify-center font-bold text-nejah-sapphire">
            {parent?.name?.charAt(0) || "P"}
          </div>
        </div>
      </div>
    </div>
  );
};

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

// --- Child Card Component ---
const ChildCard = ({ child, onInspectAttendance, onInspectProgress }: any) => (
  <div className="glass-panel bg-card rounded-[40px] p-8 border border-border shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col h-full">
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-2.5",
        child.name.includes("Lina") ? "bg-amber-400" : "bg-nejah-sapphire",
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
        Student ID: {child.id.substring(0, 8)}
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

    <div className="mt-6 pt-4 border-t border-border flex gap-2">
      <Button
        onClick={() => onInspectAttendance(child.id)}
        variant="outline"
        className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-wider border-nejah-electric/15 hover:bg-primary/10 text-foreground"
      >
        Attendance Log
      </Button>
      <Button
        onClick={() => onInspectProgress(child.id)}
        className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-wider bg-nejah-sapphire hover:bg-background text-white"
      >
        Progress Details
      </Button>
    </div>
  </div>
);

// --- Main Page ---
function ParentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Attendance details states
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);

  // Learning time states
  const [learningTime, setLearningTime] = useState<any>(null);
  const [loadingLearningTime, setLoadingLearningTime] = useState<boolean>(false);

  // Recitations states
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Messages / Chat states
  const [messages, setMessages] = useState<any[]>([
    {
      id: "1",
      sender: "Sheikh Abdullah",
      role: "Teacher",
      content:
        "Assalamu Alaikum. Zaid did exceptionally well in class today. He memorized 10 new verses of Surah Al-Buruj.",
      time: "Today, 4:45 PM",
      child: "Zaid",
    },
    {
      id: "2",
      sender: "Ustadha Maryam",
      role: "Teacher",
      content:
        "Assalamu Alaikum. Lina is struggling slightly with the letters with Sukoon. Please practice with her at home.",
      time: "Yesterday, 6:15 PM",
      child: "Lina",
    },
    {
      id: "3",
      sender: "Admin Office",
      role: "Staff",
      content:
        "Dear Parent, this is a reminder that the monthly tuition fee invoice for June has been posted.",
      time: "2 days ago",
      child: "General",
    },
  ]);
  const [newMessageText, setNewMessageText] = useState("");

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    language: "English",
  });

  const mockRecitations = [
    {
      id: "1",
      studentId: "1",
      childName: "Zaid Al-Mansour",
      surah: "Surah Al-Mulk",
      verses: "Verses 1-10",
      date: "2026-05-24",
      duration: "1:45",
      teacherScore: "9.5/10",
      remarks: "Beautiful pronunciation. Keep up the good work on Makhraj.",
      file: "surah_al_mulk.mp3",
    },
    {
      id: "2",
      studentId: "1",
      childName: "Zaid Al-Mansour",
      surah: "Surah Al-Jinn",
      verses: "Verses 1-5",
      date: "2026-05-20",
      duration: "1:12",
      teacherScore: "8.8/10",
      remarks: "Good flow, but make sure to emphasize the Qalqalah at verse 3.",
      file: "surah_al_jinn.mp3",
    },
    {
      id: "3",
      studentId: "2",
      childName: "Lina Al-Mansour",
      surah: "Surah Al-Fatiha",
      verses: "Full Surah",
      date: "2026-05-25",
      duration: "0:45",
      teacherScore: "10/10",
      remarks: "MashaAllah! Perfect recitation for her level.",
      file: "surah_al_fatiha.mp3",
    },
    {
      id: "4",
      studentId: "2",
      childName: "Lina Al-Mansour",
      surah: "Surah An-Nas",
      verses: "Full Surah",
      date: "2026-05-18",
      duration: "0:35",
      teacherScore: "9.0/10",
      remarks: "Excellent memorization, very confident.",
      file: "surah_an_nas.mp3",
    },
  ];

  const mockExams = [
    {
      id: "1",
      studentId: "1",
      childName: "Zaid Al-Mansour",
      name: "Juz 30 Final Evaluation",
      date: "2026-05-15",
      subject: "Quran Hifz",
      score: "94%",
      grade: "A",
      status: "Passed",
      feedback: "Very strong memorization. Minor mistakes in Surah Al-Ghashiyah.",
    },
    {
      id: "2",
      studentId: "1",
      childName: "Zaid Al-Mansour",
      name: "Tajweed Rules Quiz",
      date: "2026-05-02",
      subject: "Tajweed Theory",
      score: "88%",
      grade: "B+",
      status: "Passed",
      feedback: "Clear understanding of Noon Sakinah and Tanween rules.",
    },
    {
      id: "3",
      studentId: "2",
      childName: "Lina Al-Mansour",
      name: "Arabic Alphabets Test",
      date: "2026-05-22",
      subject: "Arabic Basics",
      score: "98%",
      grade: "A+",
      status: "Passed",
      feedback: "Identifies all shapes of letters perfectly. Excellent progression.",
    },
  ];

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

  // Fetch student-specific attendance when child changes
  useEffect(() => {
    if (!selectedChildId) return;

    const fetchChildAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const token = localStorage.getItem("token");
        const [historyRes, statsRes] = await Promise.all([
          fetch(apiUrl(`/attendance/student/history?studentId=${selectedChildId}`), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(apiUrl(`/attendance/student/stats?studentId=${selectedChildId}`), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (historyRes.ok) {
          const history = await historyRes.json();
          setAttendanceHistory(history);
        }
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setAttendanceStats(stats);
        }
      } catch (err) {
        console.error("Failed to fetch child attendance details", err);
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchChildAttendance();
  }, [selectedChildId]);

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

  const handleInspectAttendance = (childId: string) => {
    setSelectedChildId(childId);
    setActiveTab("attendance");
  };

  const handleInspectProgress = (childId: string) => {
    setSelectedChildId(childId);
    setActiveTab("quran");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: data?.parent?.name || "Ahmed Al-Mansour",
      role: "Guardian",
      content: newMessageText,
      time: "Just now",
      child: "General",
    };
    setMessages([...messages, newMsg]);
    setNewMessageText("");
    toast.success("Message sent to instructor successfully.");
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

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] text-foreground font-sans selection:bg-primary/15">
      {/* Sidebar navigation */}
      <ParentSidebar activeTab={activeTab} onTabChange={setActiveTab} isCollapsed={isCollapsed} />

      <div
        className={`flex-1 flex flex-col ${isCollapsed ? "ml-20" : "ml-72"} transition-all duration-300`}
      >
        {/* Topbar */}
        <Topbar
          parent={data?.parent}
          onTabChange={setActiveTab}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="p-12 space-y-12 w-full">
          {/* ================================================================ */}
          {/* TAB: DASHBOARD OVERVIEW */}
          {/* ================================================================ */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <StatCard
                  icon={Users}
                  value={data?.stats?.totalChildren || 2}
                  label="Total Children"
                  trend="+0%"
                  color="emerald"
                  onClick={() => setActiveTab("children")}
                />
                <StatCard
                  icon={BookOpen}
                  value={data?.stats?.activeClasses || 4}
                  label="Active Classes"
                  trend="Weekly"
                  color="emerald"
                  onClick={() => setActiveTab("schedule")}
                />
                <StatCard
                  icon={Calendar}
                  value={`${data?.stats?.attendanceRate || 98}%`}
                  label="Attendance Rate"
                  trend="Auto-tracked"
                  color="blue"
                  onClick={() => setActiveTab("attendance")}
                />
                <StatCard
                  icon={Award}
                  value={`${data?.stats?.memorizationProgress || 75}%`}
                  label="Avg Memorization"
                  trend="Juz 30"
                  color="amber"
                  onClick={() => setActiveTab("quran")}
                />
                <StatCard
                  icon={ClipboardList}
                  value={data?.stats?.pendingHomework || 2}
                  label="Pending HW"
                  trend="Due soon"
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
                      Children Overview
                    </h3>
                    <Button
                      onClick={() => setActiveTab("children")}
                      variant="ghost"
                      className="text-sm font-black text-nejah-sapphire flex items-center gap-2 hover:underline underline-offset-4"
                    >
                      View All Profiles <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {data?.children?.map((child: any) => (
                      <ChildCard
                        key={child.id}
                        child={child}
                        onInspectAttendance={handleInspectAttendance}
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
                      {data?.schedules?.slice(0, 3).map((session: any) => (
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
                                Join Link <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                      <Button
                        onClick={() => setActiveTab("schedule")}
                        className="w-full mt-4 py-6 rounded-[28px] bg-amber-500 hover:bg-amber-600 text-nejah-sapphire font-black text-xs transition-all shadow-xl hover:scale-[1.02] border-none"
                      >
                        Open Class Schedule
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
                              Total Hours
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
                              Avg Min/Session
                            </p>
                          </div>
                          <div className="bg-white/50 p-4 rounded-2xl text-center border border-primary/10">
                            <p className="text-2xl font-black text-nejah-sapphire font-serif">
                              {learningTime.totalMinutes || 0}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              Total Minutes
                            </p>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Recent Activities */}
                  <section className="glass-panel bg-card rounded-[40px] p-8 border border-border shadow-sm">
                    <h3 className="text-xl font-black text-nejah-sapphire font-serif mb-6 flex items-center justify-between">
                      Recent Feedbacks
                    </h3>

                    <div className="space-y-6">
                      {data?.activities?.slice(0, 3).map((a: any) => (
                        <div
                          key={a.id}
                          className="flex gap-4 group cursor-pointer"
                          onClick={() => setActiveTab("quran")}
                        >
                          <div className="w-11 h-11 rounded-2xl bg-background/50 flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-primary/10 group-hover:text-nejah-electric transition-all border border-border">
                            {a.type === "Message" ? (
                              <MessageSquare className="h-5 w-5" />
                            ) : a.type === "Result" ? (
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
                      ))}
                    </div>

                    <Button
                      onClick={() => setActiveTab("quran")}
                      variant="ghost"
                      className="w-full mt-8 rounded-2xl bg-background/50 hover:bg-background/70 text-muted-foreground hover:text-nejah-sapphire font-black text-xs h-12"
                    >
                      View Remarks History
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
                  Children Profiles
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Detailed cards and active program paths for registered siblings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data?.children?.map((child: any) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onInspectAttendance={handleInspectAttendance}
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
                    Quran Memorization Progress
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Track child's milestones, Tajweed reviews, and revision comments.
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Select Child:
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
                            Active Program: Hifz & Tajweed
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-foreground">
                              Current Milestone Surah: <strong>{selectedChild.currentSurah}</strong>
                            </p>
                            {(selectedChild.currentPage > 0 || selectedChild.currentAyah > 0) && (
                              <p className="text-xs text-muted-foreground">
                                Last studied:{" "}
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
                              Instructor: <strong>{selectedChild.teacher}</strong>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Badge className="bg-primary/10 text-nejah-electric border-none font-bold text-[10px] uppercase tracking-wider px-3.5 py-1">
                              Tajweed: Level 2
                            </Badge>
                            <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[10px] uppercase tracking-wider px-3.5 py-1">
                              Revision: Daily
                            </Badge>
                          </div>
                        </div>

                        <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-black text-nejah-sapphire font-serif leading-none">
                              {selectedChild.memorization}%
                            </span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">
                              Juz 30 Progress
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
                        Remarks & Lessons Log
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
                        Recent Daily Logs
                      </h4>

                      <div className="space-y-3.5">
                        {(selectedChild.recentLogs?.length ?? 0) === 0 ? (
                          <p className="text-xs text-muted-foreground italic text-center py-4">
                            No daily progress logged yet.
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

                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-[32px] p-6 space-y-4">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertCircle className="h-5 w-5" />
                        <h4 className="text-sm font-black uppercase tracking-wider">Tajweed Tip</h4>
                      </div>
                      <p className="text-xs text-amber-800/80 leading-relaxed font-semibold">
                        Ensure {selectedChild.name} revises Surat Al-Mulk daily paying close
                        attention to "Ghunnah" lengths and "Mudood" markers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: AUTOMATED ATTENDANCE */}
          {/* ================================================================ */}
          {activeTab === "attendance" && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                <div>
                  <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                    Automated Attendance Log
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Synchronized automatically in real-time when student joins/leaves online meeting
                    links.
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Select Child:
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
                <>
                  {/* Attendance Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-border text-center space-y-1 shadow-sm">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        Average Attendance
                      </p>
                      <h4 className="text-3xl font-black text-nejah-sapphire font-serif">
                        {attendanceStats?.attendanceRate || selectedChild.attendance}%
                      </h4>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-border text-center space-y-1 shadow-sm">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        Late Arrivals
                      </p>
                      <h4 className="text-3xl font-black text-amber-600 font-serif">
                        {attendanceStats?.lateCount || 0} Sessions
                      </h4>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-border text-center space-y-1 shadow-sm">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        Absent Sessions
                      </p>
                      <h4 className="text-3xl font-black text-red-600 font-serif">
                        {attendanceStats?.absentCount || 0} Sessions
                      </h4>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-border text-center space-y-1 shadow-sm">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        Left Early
                      </p>
                      <h4 className="text-3xl font-black text-orange-600 font-serif">
                        {attendanceStats?.leftEarlyCount || 0} Sessions
                      </h4>
                    </div>
                  </div>

                  {/* Attendance logs table */}
                  <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm overflow-hidden p-8">
                    <h4 className="text-xl font-black text-foreground font-serif mb-6">
                      Attendance History
                    </h4>

                    {loadingAttendance ? (
                      <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nejah-electric"></div>
                      </div>
                    ) : attendanceHistory.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground font-medium italic">
                        No attendance logs found in the database.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground font-black uppercase tracking-wider">
                              <th className="pb-4 pr-4">Date</th>
                              <th className="pb-4 px-4">Class Session</th>
                              <th className="pb-4 px-4">Instructor</th>
                              <th className="pb-4 px-4 text-center">Status</th>
                              <th className="pb-4 px-4">Join Time</th>
                              <th className="pb-4 px-4">Leave Time</th>
                              <th className="pb-4 px-4 text-center">Student Duration</th>
                              <th className="pb-4 px-4 text-center">Teacher Duration</th>
                              <th className="pb-4 pl-4 text-center">Late Alert</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border font-medium text-foreground">
                            {attendanceHistory.map((log: any) => {
                              const status = log.attendanceStatus;
                              const sess = log.classSession || {};

                              const displayJoin = log.joinTime
                                ? new Date(log.joinTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-";
                              const displayLeave = log.leaveTime
                                ? new Date(log.leaveTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-";

                              return (
                                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                                  <td className="py-4 pr-4 text-foreground font-black">
                                    {new Date(
                                      sess.sessionDate || log.createdAt,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="py-4 px-4 font-bold text-foreground">
                                    {sess.classTitle || "Quran Lesson"}
                                    <span className="block text-[10px] text-muted-foreground font-medium">
                                      {sess.subject || "Quranic Studies"}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-semibold text-muted-foreground">
                                    {sess.teacher?.fullName || "Teacher"}
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <Badge
                                      className={cn(
                                        "text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-none",
                                        status === "PRESENT"
                                          ? "bg-primary/10 text-nejah-electric"
                                          : status === "LATE"
                                            ? "bg-amber-50 text-amber-700"
                                            : status === "LEFT_EARLY"
                                              ? "bg-orange-50 text-orange-700"
                                              : "bg-red-50 text-red-700",
                                      )}
                                    >
                                      {status}
                                    </Badge>
                                  </td>
                                  <td className="py-4 px-4 tabular-nums text-muted-foreground">
                                    {displayJoin}
                                  </td>
                                  <td className="py-4 px-4 tabular-nums text-muted-foreground">
                                    {displayLeave}
                                  </td>
                                  <td className="py-4 px-4 text-center font-bold text-foreground tabular-nums">
                                    {log.durationMinutes ? `${log.durationMinutes} min` : "-"}
                                  </td>
                                  <td className="py-4 px-4 text-center font-semibold text-muted-foreground tabular-nums">
                                    {sess.teacherDuration ? `${sess.teacherDuration} min` : "-"}
                                  </td>
                                  <td className="py-4 pl-4 text-center">
                                    {status === "LATE" ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                                        <AlertCircle className="h-3 w-3" /> Late Arrival
                                      </span>
                                    ) : status === "LEFT_EARLY" ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md">
                                        <AlertCircle className="h-3 w-3" /> Left Call Early
                                      </span>
                                    ) : status === "PRESENT" ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-nejah-electric font-bold bg-primary/10 px-2 py-0.5 rounded-md">
                                        <CheckCircle2 className="h-3 w-3" /> Punctual
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                        Missed
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
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
                    Homework Assignments
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Review pending homework tasks and child submission statuses.
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Select Child:
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
                          Total Homework
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
                                  {hw.difficulty} Difficulty
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-2xl">
                                {hw.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end border-t md:border-none pt-4 md:pt-0 border-border">
                              <div className="text-left md:text-right space-y-1">
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                  Due Date
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
                    Exams & Test Results
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Review official grades, evaluations, and comments from teachers.
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Select Child:
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
                      Evaluation Logs
                    </h4>

                    <div className="space-y-6">
                      {mockExams
                        .filter((e) => e.studentId === selectedChildId)
                        .map((exam) => (
                          <div
                            key={exam.id}
                            className="border-b border-border pb-6 last:border-none last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-base font-extrabold text-foreground">
                                  {exam.name}
                                </h4>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  {new Date(exam.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                                Remarks: "{exam.feedback}"
                              </p>
                              <span className="text-[10px] text-foreground font-bold bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Subject: {exam.subject}
                              </span>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-center bg-primary/10 border border-nejah-electric/15 rounded-2xl p-4 w-20">
                                <p className="text-xs font-bold text-muted-foreground leading-none">
                                  Score
                                </p>
                                <p className="text-xl font-black text-nejah-sapphire font-serif mt-1">
                                  {exam.score}
                                </p>
                              </div>
                              <div className="text-center bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 w-20">
                                <p className="text-xs font-bold text-muted-foreground leading-none">
                                  Grade
                                </p>
                                <p className="text-xl font-black text-amber-700 font-serif mt-1">
                                  {exam.grade}
                                </p>
                              </div>
                              <Badge className="bg-nejah-sapphire text-white font-bold uppercase tracking-wider text-[9px] px-3.5 py-1 border-none shrink-0">
                                {exam.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
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
                  Class Schedules
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Full class slots mapping for all children registered under your guardianship.
                </p>
              </div>

              <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm overflow-hidden p-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-black uppercase tracking-wider">
                        <th className="pb-4 pr-4">Student</th>
                        <th className="pb-4 px-4">Class Title</th>
                        <th className="pb-4 px-4">Teacher</th>
                        <th className="pb-4 px-4">Day of Week</th>
                        <th className="pb-4 px-4 text-center">Scheduled Time</th>
                        <th className="pb-4 px-4 text-center">Status</th>
                        <th className="pb-4 pl-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-foreground">
                      {data?.schedules?.map((sc: any) => (
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
                                Join Room
                              </Button>
                            ) : (
                              <span className="text-muted-foreground italic text-[10px]">
                                No link yet
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: RECITATION AUDIO */}
          {/* ================================================================ */}
          {activeTab === "recitations" && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                <div>
                  <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                    Student Recitations Audio
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    Listen to submitted Quran recitation audio recordings and check teacher scores.
                  </p>
                </div>

                {/* Child selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Select Child:
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Audios lists */}
                  <div className="lg:col-span-2 space-y-4">
                    {mockRecitations
                      .filter((r) => r.studentId === selectedChildId)
                      .map((audio) => {
                        const isPlaying = playingAudioId === audio.id;
                        return (
                          <div
                            key={audio.id}
                            className="glass-panel bg-card rounded-3xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6"
                          >
                            <div className="flex items-center gap-4">
                              <Button
                                onClick={() => setPlayingAudioId(isPlaying ? null : audio.id)}
                                className={cn(
                                  "w-12 h-12 rounded-full shrink-0 flex items-center justify-center border-none",
                                  isPlaying
                                    ? "bg-nejah-surface hover:bg-background text-white"
                                    : "bg-primary/10 hover:bg-primary/15 text-nejah-sapphire",
                                )}
                              >
                                {isPlaying ? (
                                  <Pause className="h-5 w-5" />
                                ) : (
                                  <Play className="h-5 w-5 fill-nejah-sapphire" />
                                )}
                              </Button>

                              <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-foreground">
                                  {audio.surah}
                                </h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                  {audio.verses} | Length: {audio.duration}
                                </p>
                                <p className="text-[9px] text-nejah-sapphire font-bold">
                                  Uploaded on: {new Date(audio.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="text-right space-y-1 shrink-0">
                              <div className="flex items-center gap-1.5 justify-end">
                                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-black text-foreground font-serif">
                                  Score: {audio.teacherScore}
                                </span>
                              </div>
                              <Badge className="bg-primary/10 text-nejah-electric border-none text-[8px] font-bold uppercase tracking-wider px-2 py-0.5">
                                Reviewed
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Player detail / teacher remarks */}
                  <div className="glass-panel bg-card rounded-[32px] border border-border shadow-sm p-6 space-y-6">
                    <h4 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-3">
                      Evaluation Remarks
                    </h4>

                    {playingAudioId ? (
                      (() => {
                        const activeRec = mockRecitations.find((r) => r.id === playingAudioId);
                        if (!activeRec) return null;
                        return (
                          <div className="space-y-6">
                            <div className="space-y-1.5">
                              <h5 className="text-base font-black text-nejah-sapphire font-serif">
                                {activeRec.surah}
                              </h5>
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {activeRec.verses}
                              </p>
                            </div>

                            <div className="bg-primary/5 p-5 rounded-2xl border border-nejah-electric/15 space-y-3">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-nejah-electric animate-bounce" />
                                <span className="text-[10px] font-black text-foreground uppercase tracking-wider">
                                  Teacher Comments
                                </span>
                              </div>
                              <p className="text-xs italic font-medium leading-relaxed text-foreground/80">
                                "{activeRec.remarks}"
                              </p>
                            </div>

                            {/* Simulated waveform */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                <span>Playing Recitation</span>
                                <span>{activeRec.duration}</span>
                              </div>
                              <div className="h-6 flex items-center gap-0.5 justify-center">
                                {[...Array(30)].map((_, idx) => (
                                  <span
                                    key={idx}
                                    className="w-1 bg-primary rounded-full animate-pulse"
                                    style={{
                                      height: `${Math.max(10, Math.sin(idx * 0.5) * 20 + 10)}%`,
                                      animationDelay: `${idx * 0.05}s`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground font-medium italic">
                        Click the play icon on any audio file to inspect teacher evaluations and
                        notes.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB: MESSAGES / CHAT */}
          {/* ================================================================ */}
          {activeTab === "messages" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-black text-nejah-sapphire font-serif tracking-tight">
                  Direct Teacher Messages
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Communicate directly with Sheikhs, Ustadhas, and administrative staff.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 glass-panel bg-white border border-white/10 rounded-[40px] shadow-sm overflow-hidden h-[600px]">
                {/* Contacts pane */}
                <div className="lg:col-span-4 border-r border-border flex flex-col h-full bg-background/50">
                  <div className="p-6 border-b border-border">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      Active Chats
                    </h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-nejah-electric/15 shadow-sm text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-nejah-sapphire text-white flex items-center justify-center font-bold text-xs shrink-0">
                          SA
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Sheikh Abdullah</p>
                          <p className="text-[9px] text-muted-foreground font-bold truncate max-w-[150px]">
                            Assalamu Alaikum. Zaid did...
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] text-nejah-electric font-bold uppercase shrink-0">
                        Active
                      </span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-card rounded-2xl transition-colors text-left text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                          UM
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Ustadha Maryam</p>
                          <p className="text-[9px] text-muted-foreground">
                            Assalamu Alaikum. Lina is...
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Chat pane */}
                <div className="lg:col-span-8 flex flex-col h-full bg-white justify-between">
                  {/* Messages Feed */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.role === "Guardian";
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[70%]",
                            isMe ? "ml-auto items-end" : "mr-auto items-start",
                          )}
                        >
                          <span className="text-[9px] font-bold text-muted-foreground mb-1">
                            {msg.sender} ({msg.role})
                          </span>
                          <div
                            className={cn(
                              "p-4 rounded-3xl text-xs font-medium leading-relaxed shadow-sm",
                              isMe
                                ? "bg-nejah-sapphire text-white rounded-tr-none"
                                : "bg-background/50 text-foreground rounded-tl-none border border-border",
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[8px] text-muted-foreground font-bold mt-1 tabular-nums">
                            {msg.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input box */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-6 border-t border-border flex gap-3"
                  >
                    <Input
                      placeholder="Type your message to instructor..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      className="flex-1 bg-background/50 border-none rounded-2xl h-12 text-xs focus-visible:ring-nejah-electric"
                    />
                    <Button
                      type="submit"
                      className="bg-nejah-sapphire hover:bg-background text-white h-12 px-6 rounded-2xl text-xs font-extrabold uppercase tracking-wider"
                    >
                      Send Message
                    </Button>
                  </form>
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
                  Profile Settings
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  Review and manage your primary guardian details and configurations.
                </p>
              </div>

              <div className="glass-panel bg-card rounded-[40px] border border-border shadow-sm p-10">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                      Guardian Full Name
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
                      Email Address
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
                      Phone Number
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
                      Home Address
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
                      Preferred Language
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
                    Save Changes
                  </Button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/parent_dashboard")({
  component: ParentDashboardRoute,
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
  return (
    <LanguageProvider>
      <ParentDashboard />
    </LanguageProvider>
  );
}
