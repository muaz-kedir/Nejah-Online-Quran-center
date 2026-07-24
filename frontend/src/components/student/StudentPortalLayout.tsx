import { ReactNode, useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ClipboardList,
  FolderOpen,
  Bell,
  Menu,
} from "lucide-react";
import { studentPaths, api } from "@/lib/student-portal";
import { LogoutConfirmDialog } from "@/components/ui/logout-confirm-dialog";
import { useApp } from "@/context/AppContext";
import { useSidebar } from "@/hooks/useSidebar";
import { AppSidebar } from "@/components/ui/AppSidebar";
import { OnboardingGuard } from "@/components/ui/OnboardingGuard";

type Props = {
  activePath: string;
  student?: {
    name?: string;
    fullName?: string;
    level?: string;
    avatarUrl?: string | null;
    initials?: string;
  };
  unreadNotifications?: number;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  children: ReactNode;
};

export function StudentPortalLayout({
  activePath,
  student,
  unreadNotifications = 0,
  onOpenSettings,
  onOpenProfile,
  children,
}: Props) {
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(unreadNotifications);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { openMobile } = useSidebar();
  const { t } = useApp();

  const studentMenuItems = [
    { label: t.dashboard, icon: LayoutDashboard, path: studentPaths.dashboard, labelKey: "dashboard" },
    { label: t.myClasses, icon: Users, path: studentPaths.classes, labelKey: "myClasses" },
    { label: t.myProgress, icon: TrendingUp, path: studentPaths.progress, labelKey: "myProgress" },
    { label: t.homework, icon: ClipboardList, path: studentPaths.homework, labelKey: "homework" },
    { label: t.resources, icon: FolderOpen, path: studentPaths.resources, labelKey: "resources" },
    { label: t.notifications, icon: Bell, path: studentPaths.notifications, labelKey: "notifications" },
  ];

  useEffect(() => {
    setNotifCount(unreadNotifications);
  }, [unreadNotifications]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const s = await api<{ unread: number }>("/student/dashboard/notifications/summary");
        if (s && typeof s.unread === "number") setNotifCount(s.unread);
      } catch {}
    };
    fetchUnread();
    pollingRef.current = setInterval(fetchUnread, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    navigate({ to: '/login', replace: true });
    setTimeout(() => localStorage.clear(), 0);
  };

  const displayName = student?.fullName || student?.name || "Student";
  const avatarUrl = student?.avatarUrl;
  const initials = student?.initials || "S";

  return (
    <OnboardingGuard>
      <div className="flex h-screen dark:bg-background bg-gray-50/80 overflow-hidden text-foreground font-sans">
      {/* ─── Ambient Background ─── */}
      <div className="bg-ambient-layer">
        <div className="bg-mesh-gradient animate-mesh w-full h-full" />
        <div className="orb orb-1 orb-glow-pulse" />
        <div className="orb orb-2 orb-glow-pulse" />
        <div className="orb orb-3 orb-glow-pulse" />
        <div className="bg-grid-overlay w-full h-full" />
        <div className="scan-line" />
        <div className="vignette-glow" />
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>
      <div className="bg-noise" />

      <AppSidebar
        menuItems={studentMenuItems}
        notifCount={notifCount}
        notifPath={studentPaths.notifications}
        brandName="Nejah"
        brandSubtitle={t.studentPortal}
        user={{ name: displayName, subtitle: student?.level ? `${student.level} Program` : undefined, avatarUrl, initials }}
        translations={t as unknown as Record<string, string>}
        onLogout={handleLogout}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
      />

      {/* ─── Mobile Top Bar ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-card/95 dark:bg-nejah-surface/95 backdrop-blur-xl border-b border-border/50 dark:border-nejah-border-blue/40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openMobile}
            className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center">
              <span className="text-nejah-electric font-black text-xs">N</span>
            </div>
            <span className="font-extrabold text-foreground text-base">Nejah</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: studentPaths.notifications })}
            className="relative p-2 rounded-xl hover:bg-primary/10 transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-xs text-nejah-electric">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-w-0 lg:pt-0 pt-16 content-layer">
        {children}
      </div>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={confirmLogout}
      />
    </div>
    </OnboardingGuard>
  );
}

export function StudentPageLoader() {
  let loadingText = 'Loading...';
  try {
    const { t } = useApp();
    loadingText = t.loading;
  } catch {}
  return (
    <div className="flex h-screen items-center justify-center dark:bg-background bg-gray-50/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-primary/20" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-nejah-electric animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{loadingText}</p>
      </div>
    </div>
  );
}
