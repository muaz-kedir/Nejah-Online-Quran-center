import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ClipboardList,
  ClipboardCheck,
  FolderOpen,
  Bell,
  Clock,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { studentPaths, api } from "@/lib/student-portal";
import { LogoutConfirmDialog } from "@/components/ui/logout-confirm-dialog";
import { TelegramOnboardingOverlay } from "@/components/student/TelegramOnboardingOverlay";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/components/site/ThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileDialog } from "@/components/student/dialogs/ProfileDialog";
import { ChangePasswordDialog } from "@/components/student/dialogs/ChangePasswordDialog";
import { PushNotificationToggle } from "@/components/ui/push-notification-toggle";
import { TelegramLink } from "@/components/ui/telegram-link";
import type { StudentProfileData } from "@/lib/student-types";



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
  children: ReactNode;
};

const SIDEBAR_KEY = "nejah_sidebar_collapsed";

export function StudentPortalLayout({
  activePath,
  student,
  unreadNotifications = 0,
  children,
}: Props) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [liveUnread, setLiveUnread] = useState(unreadNotifications);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, toggleTheme } = useTheme();

  const { t } = useApp();

  // Settings & profile dialogs state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);

  // Fetch profile data when dialog opens
  useEffect(() => {
    if (profileOpen && !profileData) {
      api<StudentProfileData>("/student/profile").then(setProfileData).catch(() => {});
    }
  }, [profileOpen, profileData]);

  const menuItems = [
    { label: t.dashboard, icon: LayoutDashboard, path: studentPaths.dashboard },
    { label: t.myClasses, icon: Users, path: studentPaths.classes },
    { label: t.myProgress, icon: TrendingUp, path: studentPaths.progress },
    { label: t.homework, icon: ClipboardList, path: studentPaths.homework },
    { label: t.resources, icon: FolderOpen, path: studentPaths.resources },
    { label: t.attendance, icon: ClipboardCheck, path: studentPaths.attendance },
    { label: 'Class History', icon: Clock, path: '/student/history' },
    { label: t.notifications, icon: Bell, path: studentPaths.notifications },
  ];

  // Sync from prop and auto-refresh from summary API
  useEffect(() => {
    setLiveUnread(unreadNotifications);
  }, [unreadNotifications]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const s = await api<{ unread: number }>("/student/dashboard/notifications/summary");
        if (s && typeof s.unread === "number") setLiveUnread(s.unread);
      } catch {
        /* ignore */
      }
    };
    fetchUnread();
    pollingRef.current = setInterval(fetchUnread, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [activePath]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    navigate({ to: '/login', replace: true });
    setTimeout(() => {
      localStorage.clear();
      window.dispatchEvent(new Event('auth-changed'));
    }, 0);
  };

  const displayName = student?.fullName || student?.name || "Student";

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex items-center gap-3",
          collapsed && !isMobile ? "justify-center px-4 py-8" : "px-6 py-7",
        )}
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 ring-2 ring-nejah-electric/20 ring-offset-2 ring-offset-transparent flex items-center justify-center shrink-0">
          <span className="text-nejah-electric font-black text-sm">N</span>
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <h1 className="font-extrabold text-foreground tracking-tight leading-none text-lg">
              Nejah
            </h1>
            <p className="text-[10px] text-nejah-electric font-bold uppercase tracking-widest mt-0.5">
              {t.studentPortal}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "ml-auto p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95",
            "text-muted-foreground hover:text-foreground hover:bg-primary/8",
            collapsed && !isMobile && "ml-0",
          )}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 transition-transform duration-500 rotate-0" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-500 -rotate-12" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn("flex-1 space-y-1 overflow-y-auto", collapsed && !isMobile ? "px-2" : "px-3")}
      >
        {menuItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <div key={item.path} className="relative group">
              <button
                type="button"
                onClick={() => navigate({ to: item.path })}
                className={cn(
                  "sidebar-nav-item w-full",
                  collapsed && !isMobile ? "justify-center px-3 py-3" : "px-4 py-3",
                  isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-200",
                    isActive
                      ? "text-nejah-electric"
                      : "text-muted-foreground group-hover:text-nejah-electric",
                  )}
                />
                {(!collapsed || isMobile) && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {item.path === studentPaths.notifications && liveUnread > 0 && (
                  <span
                    className={cn(
                      "bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0",
                      collapsed && !isMobile
                        ? "absolute -top-1 -right-1 w-5 h-5"
                        : "px-1.5 py-0.5 min-w-[20px]",
                    )}
                  >
                    {liveUnread}
                  </span>
                )}
              </button>
              {/* Tooltip when collapsed */}
              {collapsed && !isMobile && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
                  {item.label}
                  {item.path === studentPaths.notifications && liveUnread > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {liveUnread}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={cn("space-y-1", collapsed && !isMobile ? "px-2 pb-2" : "px-3 pb-2")}>
        <div className="relative group">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={cn(
              "sidebar-nav-item sidebar-nav-item-inactive w-full",
              collapsed && !isMobile ? "justify-center px-3 py-3" : "px-4 py-3",
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {(!collapsed || isMobile) && <span>{t.settings}</span>}
          </button>
          {collapsed && !isMobile && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
              {t.settings}
            </div>
          )}
        </div>
        <div className="relative group">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "sidebar-nav-item w-full hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground",
              collapsed && !isMobile ? "justify-center px-3 py-3" : "px-4 py-3",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(!collapsed || isMobile) && <span>{t.logout}</span>}
          </button>
          {collapsed && !isMobile && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
              {t.logout}
            </div>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className={cn(collapsed && !isMobile ? "px-2 pb-4" : "px-3 pb-4")}>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className={cn(
            "w-full rounded-2xl border border-border/60 dark:border-nejah-border-blue/50 shadow-sm flex items-center gap-3 hover:border-nejah-electric/30 transition-colors text-left",
            "bg-gradient-to-br from-card to-muted/30 dark:from-nejah-surface dark:to-nejah-surface/50",
            collapsed && !isMobile ? "p-2 justify-center" : "p-3",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden shrink-0">
            {student?.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-sm text-nejah-electric">
                {student?.initials || "S"}
              </span>
            )}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground leading-tight truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {student?.level || t.studentPortal} Program
              </p>
            </div>
          )}
          {(!collapsed || isMobile) && <User className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
      </div>
    </>
  );

  return (
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

      {/* ─── Desktop Sidebar ─── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen shrink-0 sidebar-transition overflow-x-hidden",
          "bg-card/90 dark:bg-nejah-surface/95 backdrop-blur-xl",
          "border-r border-border/50 dark:border-nejah-border-blue/40",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {sidebarContent(false)}

        {/* Collapse toggle */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/8 transition-all duration-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-card/95 dark:bg-nejah-surface/95 backdrop-blur-xl border-b border-border/50 dark:border-nejah-border-blue/40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
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
            {liveUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {liveUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden"
          >
            {student?.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-xs text-nejah-electric">
                {student?.initials || "S"}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Mobile Drawer Overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 mobile-overlay"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col overflow-x-hidden overflow-y-auto bg-white dark:bg-nejah-surface shadow-2xl border-r border-border dark:border-nejah-border-blue"
            >
              <div className="flex items-center justify-end px-4 pt-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-w-0 lg:pt-0 pt-16 content-layer">
        {children}
      </div>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={confirmLogout}
      />

      <TelegramOnboardingOverlay />

      {/* Settings Dialog */}
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
            <div className="border-t border-border pt-3 space-y-4">
              <PushNotificationToggle variant="card" />
              <div className="border-t pt-4">
                <TelegramLink />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profileData}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
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
