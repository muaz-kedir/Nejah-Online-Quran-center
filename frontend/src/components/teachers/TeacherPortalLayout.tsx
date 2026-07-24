import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppSidebar } from "@/components/ui/AppSidebar";
import {
  Menu,
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  User,
  Clock,
} from "lucide-react";
import { LogoutConfirmDialog } from "@/components/ui/logout-confirm-dialog";
import { SidebarProvider, useSidebar } from "@/hooks/useSidebar";
import { apiUrl } from "@/lib/api";

type Props = {
  activePath: string;
  teacher?: {
    name?: string;
    fullName?: string;
    title?: string;
    avatarUrl?: string | null;
    avatar?: string | null;
    initials?: string;
  };
  unreadNotifications?: number;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  children: ReactNode;
};

const TEACHER_MENU = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/teacher_dashboard" },
  { label: "Students", icon: Users, path: "/teacher_students" },
  { label: "Schedule", icon: Calendar, path: "/teacher_schedule" },
  { label: "Session History", icon: Clock, path: "/teacher_sessions" },
  { label: "Notifications", icon: Bell, path: "/teacher_notifications" },
  { label: "Profile", icon: User, path: "/teacher_profile" },
];

export function TeacherPortalLayout({
  activePath,
  teacher,
  unreadNotifications = 0,
  onOpenSettings,
  onOpenProfile,
  children,
}: Props) {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { openMobile } = useSidebar();
  const [notifCount, setNotifCount] = useState(unreadNotifications);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/notifications/unread-count"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifCount(data.count || 0);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    navigate({ to: '/login', replace: true });
    setTimeout(() => localStorage.clear(), 0);
  };

  const displayName = teacher?.fullName || teacher?.name || "Teacher";
  const avatarUrl = teacher?.avatarUrl || teacher?.avatar;
  const initials = teacher?.initials || displayName.charAt(0);
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") || "" : "";

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      navigate({ to: "/teacher_profile" });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen dark:bg-background bg-gray-50/80 overflow-hidden text-foreground font-sans">
        {/* Ambient Background */}
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

        {/* Sidebar */}
        <AppSidebar
          menuItems={TEACHER_MENU}
          notifCount={notifCount}
          notifPath="/teacher_notifications"
          brandName="Nejah"
          brandSubtitle="Teacher Suite"
          user={{ name: displayName, role: userRole, avatarUrl, initials }}
          onLogout={handleLogout}
          onOpenSettings={onOpenSettings}
          onOpenProfile={handleProfileClick}
        />

        {/* Mobile Top Bar */}
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
          <button
            type="button"
            onClick={handleProfileClick}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-xs text-nejah-electric">{initials}</span>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-w-0 lg:pt-0 pt-16 content-layer">
          {children}
        </div>

        <LogoutConfirmDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          onConfirm={confirmLogout}
        />
      </div>
    </SidebarProvider>
  );
}

export function TeacherPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center dark:bg-background bg-gray-50/80">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-primary/20" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-nejah-electric animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
