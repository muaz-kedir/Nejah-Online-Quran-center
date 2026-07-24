import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useTheme } from "@/components/site/ThemeProvider";
import { LogoutConfirmDialog } from "@/components/ui/logout-confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AppMenuItem {
  label: string;
  labelKey?: string;
  icon: any;
  path: string;
  badge?: string | number;
  tab?: string;
}

export interface AppSidebarUser {
  name: string;
  role?: string;
  subtitle?: string;
  avatarUrl?: string | null;
  initials?: string;
}

interface AppSidebarProps {
  menuItems: AppMenuItem[];
  bottomItems?: AppMenuItem[];
  user?: AppSidebarUser;
  notifCount?: number;
  notifPath?: string;
  onNotificationClick?: () => void;
  brandName?: string;
  brandSubtitle?: string;
  roleLabel?: string;
  logo?: ReactNode;
  translations?: Record<string, string>;
  onLogout?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onItemClick?: (item: AppMenuItem) => void;
  isItemActive?: (item: AppMenuItem) => boolean;
  extraTop?: ReactNode;
  extraBottom?: ReactNode;
}

export function AppSidebar({
  menuItems,
  bottomItems,
  user,
  notifCount = 0,
  notifPath,
  onNotificationClick,
  brandName = "Nejah",
  brandSubtitle = "Admin Console",
  roleLabel,
  logo,
  translations: t,
  onLogout,
  onOpenSettings,
  onOpenProfile,
  onItemClick,
  isItemActive: customIsActive,
  extraTop,
  extraBottom,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleCollapsed, mobileOpen, closeMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const defaultIsActive = (item: AppMenuItem) => {
    if (item.path) {
      return location.pathname.startsWith(item.path);
    }
    return false;
  };

  const isActive = customIsActive || defaultIsActive;

  const resolveLabel = (item: AppMenuItem) => {
    if (item.labelKey && t?.[item.labelKey]) return t[item.labelKey];
    return item.label;
  };

  const handleItemClick = (item: AppMenuItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (onNotificationClick && notifPath && item.path === notifPath) {
      onNotificationClick();
    } else {
      navigate({ to: item.path as any });
    }
    closeMobile();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
      window.location.href = "/login";
    }
  };

  const userInitials = user?.initials || user?.name?.charAt(0) || "U";
  const displayName = user?.name || "User";

  const renderNavItem = (item: AppMenuItem, idx: number) => {
    const active = isActive(item);
    const label = resolveLabel(item);
    const showBadge = item.path === notifPath && notifCount > 0;

    const btn = (
      <button
        type="button"
        onClick={() => handleItemClick(item)}
        className={cn(
          "sidebar-nav-item w-full group",
          collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
          active ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive",
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-200",
            active
              ? "text-nejah-electric"
              : "text-muted-foreground group-hover:text-nejah-electric",
          )}
        />
        {!collapsed && (
          <span className="flex-1 text-left truncate font-semibold">{label}</span>
        )}
        {showBadge && (
          <span
            className={cn(
              "bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0",
              collapsed
                ? "absolute -top-1 -right-1 w-5 h-5"
                : "px-1.5 py-0.5 min-w-[20px]",
            )}
          >
            {notifCount > 9 ? "9+" : notifCount}
          </span>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.path || idx} delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="relative">{btn}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{label}</span>
            {showBadge && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.path || idx}>{btn}</div>;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen shrink-0 sidebar-transition overflow-hidden",
          "bg-card/90 dark:bg-nejah-surface/95 backdrop-blur-xl",
          "border-r border-border/50 dark:border-nejah-border-blue/40",
          collapsed ? "w-[72px]" : "w-[280px]",
        )}
      >
        <div className="flex flex-col h-full min-w-0 overflow-hidden">
          {/* Logo / Brand */}
          <div
            className={cn(
              "flex items-center shrink-0 min-w-0",
              collapsed ? "flex-col gap-2 px-4 py-6" : "px-6 py-6",
            )}
          >
            {logo || (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 ring-2 ring-nejah-electric/20 ring-offset-2 ring-offset-transparent flex items-center justify-center shrink-0">
                <span className="text-nejah-electric font-black text-sm">
                  {brandName.charAt(0)}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <h1 className="font-extrabold text-foreground tracking-tight leading-none text-lg truncate">
                  {brandName}
                </h1>
                <p className="text-[10px] text-nejah-electric font-bold uppercase tracking-widest mt-0.5 truncate">
                  {brandSubtitle}
                </p>
              </div>
            )}
          </div>

          {/* Toggle + Theme */}
          <div
            className={cn(
              "flex items-center shrink-0",
              collapsed ? "justify-center px-3 pb-4" : "justify-between px-5 pb-4",
            )}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "flex items-center justify-center rounded-full border transition-all duration-200 cursor-pointer",
                "border-white/10 bg-nejah-sapphire/30 text-muted-foreground",
                "hover:border-nejah-electric/40 hover:text-foreground",
                collapsed ? "h-8 w-8" : "h-7 w-7",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            {!collapsed && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 text-muted-foreground hover:text-foreground hover:bg-primary/8 cursor-pointer"
                aria-label={mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Switch to dark mode"}
              >
                {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Extra content (language switcher, etc.) */}
          {!collapsed && extraTop && (
            <div className="shrink-0 px-3 pb-4">{extraTop}</div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto min-w-0 space-y-1 px-2">
            <TooltipProvider>
              {menuItems.map((item, idx) => renderNavItem(item, idx))}
            </TooltipProvider>
          </nav>

          {/* Bottom items */}
          <div className={cn("shrink-0 min-w-0 space-y-1", collapsed ? "px-2 pb-2" : "px-3 pb-2")}>
            <TooltipProvider>
              {bottomItems?.map((item, idx) => renderNavItem(item, idx))}

              {onOpenSettings && (
                <TooltipProvider>
                  {collapsed ? (
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={onOpenSettings}
                            className="sidebar-nav-item sidebar-nav-item-inactive w-full justify-center px-3 py-3 group"
                          >
                            <Settings className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-nejah-electric transition-colors duration-200" />
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="sidebar-nav-item sidebar-nav-item-inactive w-full px-4 py-3 group"
                    >
                      <Settings className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-nejah-electric transition-colors duration-200" />
                      <span className="flex-1 text-left truncate font-semibold">Settings</span>
                    </button>
                  )}
                </TooltipProvider>
              )}

              {/* Logout */}
              {collapsed ? (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="sidebar-nav-item w-full justify-center px-3 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground group"
                      >
                        <LogOut className="h-5 w-5 shrink-0" />
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="sidebar-nav-item w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground group"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="font-semibold">Logout</span>
                    </button>
                  )}
                </TooltipProvider>
              </div>

          {/* Profile card */}
          {(onOpenProfile || user) && (
            <div className={cn("shrink-0 min-w-0", collapsed ? "px-2 pb-4" : "px-3 pb-4")}>
              <button
                type="button"
                onClick={onOpenProfile || handleLogout}
                className={cn(
                  "w-full rounded-2xl border border-border/60 dark:border-nejah-border-blue/50 shadow-sm flex items-center gap-3 hover:border-nejah-electric/30 transition-colors text-left",
                  "bg-gradient-to-br from-card to-muted/30 dark:from-nejah-surface dark:to-nejah-surface/50",
                  collapsed ? "p-2 justify-center" : "p-3",
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-sm text-nejah-electric">{userInitials}</span>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-foreground leading-tight truncate">
                      {displayName}
                    </p>
                    {(user?.subtitle || roleLabel) && (
                      <p className="text-[10px] text-muted-foreground font-medium truncate">
                        {user?.subtitle || roleLabel}
                      </p>
                    )}
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-card dark:bg-nejah-surface shadow-2xl transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            type="button"
            onClick={closeMobile}
            className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6">
            {logo || (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 ring-2 ring-nejah-electric/20 flex items-center justify-center shrink-0">
                <span className="text-nejah-electric font-black text-sm">
                  {brandName.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-extrabold text-foreground tracking-tight leading-none text-lg">
                {brandName}
              </h1>
              <p className="text-[10px] text-nejah-electric font-bold uppercase tracking-widest mt-0.5">
                {brandSubtitle}
              </p>
            </div>
          </div>

          {extraTop && <div className="px-3 pb-4">{extraTop}</div>}

          <nav className="flex-1 overflow-y-auto min-w-0 space-y-1 px-3">
            {menuItems.map((item, idx) => (
              <button
                key={item.path || idx}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  "sidebar-nav-item w-full px-4 py-3",
                  isActive(item) ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0 transition-colors duration-200 text-muted-foreground" />
                <span className="flex-1 text-left truncate font-semibold">{resolveLabel(item)}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-1 px-3 pb-2">
            {bottomItems?.map((item, idx) => (
              <button
                key={item.path || idx}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  "sidebar-nav-item w-full px-4 py-3",
                  isActive(item) ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0 transition-colors duration-200 text-muted-foreground" />
                <span className="flex-1 text-left truncate font-semibold">{resolveLabel(item)}</span>
              </button>
            ))}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="sidebar-nav-item sidebar-nav-item-inactive w-full px-4 py-3"
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className="font-semibold">Settings</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar-nav-item w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
