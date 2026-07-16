import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Clock,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

type TabType =
  | 'dashboard'
  | 'children'
  | 'quran'
  | 'homework'
  | 'exams'
  | 'schedule'
  | 'settings'
  | 'sessions'
  | 'notifications';

interface MenuItem {
  label: string;
  icon: any;
  tab: TabType;
  path: string;
}

type Props = {
  activePath: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  parent?: {
    name?: string;
    avatarUrl?: string | null;
  };
  unreadNotifications?: number;
  children: ReactNode;
};

const SIDEBAR_KEY = 'nejah_parent_sidebar_collapsed';

export function ParentPortalLayout({
  activePath,
  activeTab,
  onTabChange,
  parent,
  unreadNotifications = 0,
  children,
}: Props) {
  const navigate = useNavigate();
  const { translations, lang, setLang } = useLanguage();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

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
  }, [activePath, activeTab]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const displayName = parent?.name || 'Ahmed Al-Mansour';
  const initials = displayName.charAt(0);

  const menuItems: MenuItem[] = [
    { label: translations.dashboard, icon: LayoutDashboard, tab: 'dashboard', path: '/parent_dashboard' },
    { label: translations.myChildren, icon: Users, tab: 'children', path: '/parent_dashboard' },
    { label: translations.quranProgress, icon: BookOpen, tab: 'quran', path: '/parent_dashboard' },
    { label: translations.homework, icon: ClipboardList, tab: 'homework', path: '/parent_dashboard' },
    { label: translations.examsResults, icon: FileText, tab: 'exams', path: '/parent_dashboard' },
    { label: translations.classSchedule, icon: Clock, tab: 'schedule', path: '/parent_dashboard' },
  ];

  const bottomItems: MenuItem[] = [
    { label: translations.profileSettings, icon: Settings, tab: 'settings', path: '/parent_dashboard' },
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.path !== '/parent_dashboard') {
      navigate({ to: item.path });
    } else {
      if (activePath === '/parent_dashboard' && onTabChange) {
        onTabChange(item.tab);
      } else {
        // If not on parent dashboard, navigate there with search parameter
        navigate({ to: '/parent_dashboard', search: { tab: item.tab } as any });
      }
    }
  };

  const isItemActive = (item: MenuItem) => {
    if (item.path !== '/parent_dashboard') {
      return activePath === item.path;
    }
    return activePath === '/parent_dashboard' && activeTab === item.tab;
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Brand Logo */}
      <div className={cn('flex items-center gap-3', collapsed && !isMobile ? 'justify-center px-4 py-8' : 'px-6 py-7')}>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 ring-2 ring-nejah-electric/20 ring-offset-2 ring-offset-transparent flex items-center justify-center shrink-0">
          <span className="text-nejah-electric font-black text-sm">N</span>
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <h1 className="font-extrabold text-foreground tracking-tight leading-none text-lg">Nejah</h1>
            <p className="text-[10px] text-nejah-electric font-bold uppercase tracking-widest mt-0.5">Parent Portal</p>
          </div>
        )}
      </div>

      {/* Language Switcher inside sidebar */}
      {(!collapsed || isMobile) && (
        <div className="px-6 pb-4 flex items-center gap-2">
          {['English', 'Arabic', 'Amharic', 'Oromo'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l as any)}
              className={cn(
                'text-[9px] font-extrabold uppercase tracking-wider transition-all px-1.5 py-0.5 rounded',
                lang === l
                  ? 'bg-primary/20 text-nejah-electric font-black'
                  : 'text-muted-foreground hover:bg-muted dark:hover:bg-white/5'
              )}
            >
              {l.substring(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 space-y-1 overflow-y-auto', collapsed && !isMobile ? 'px-2' : 'px-3')}>
        {menuItems.map((item) => {
          const isActive = isItemActive(item);
          return (
            <div key={item.tab} className="relative group">
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  'sidebar-nav-item w-full',
                  collapsed && !isMobile ? 'justify-center px-3 py-3' : 'px-4 py-3',
                  isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors duration-200',
                    isActive ? 'text-nejah-electric' : 'text-muted-foreground group-hover:text-nejah-electric',
                  )}
                />
                {(!collapsed || isMobile) && (
                  <span className="flex-1 text-left truncate font-semibold">{item.label}</span>
                )}
              </button>
              {/* Tooltip when collapsed */}
              {collapsed && !isMobile && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={cn('space-y-1', collapsed && !isMobile ? 'px-2 pb-2' : 'px-3 pb-2')}>
        {bottomItems.map((item) => {
          const isActive = isItemActive(item);
          return (
            <div key={item.tab} className="relative group">
              <button
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  'sidebar-nav-item w-full',
                  collapsed && !isMobile ? 'justify-center px-3 py-3' : 'px-4 py-3',
                  isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors duration-200',
                    isActive ? 'text-nejah-electric' : 'text-muted-foreground group-hover:text-nejah-electric',
                  )}
                />
                {(!collapsed || isMobile) && (
                  <span className="flex-1 text-left truncate font-semibold">{item.label}</span>
                )}
              </button>
              {/* Tooltip when collapsed */}
              {collapsed && !isMobile && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}

        <div className="relative group">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'sidebar-nav-item w-full hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground',
              collapsed && !isMobile ? 'justify-center px-3 py-3' : 'px-4 py-3',
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(!collapsed || isMobile) && <span className="font-semibold">Logout</span>}
          </button>
          {collapsed && !isMobile && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
              Logout
            </div>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className={cn(collapsed && !isMobile ? 'px-2 pb-4' : 'px-3 pb-4')}>
        <button
          type="button"
          onClick={() => {
            if (activePath === '/parent_dashboard' && onTabChange) {
              onTabChange('settings');
            } else {
              navigate({ to: '/parent_dashboard', search: { tab: 'settings' } as any });
            }
          }}
          className={cn(
            'w-full rounded-2xl border border-border/60 dark:border-nejah-border-blue/50 shadow-sm flex items-center gap-3 hover:border-nejah-electric/30 transition-colors text-left',
            'bg-gradient-to-br from-card to-muted/30 dark:from-nejah-surface dark:to-nejah-surface/50',
            collapsed && !isMobile ? 'p-2 justify-center' : 'p-3',
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden shrink-0">
            {parent?.avatarUrl ? (
              <img src={parent.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sm text-nejah-electric">{initials}</span>
            )}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-foreground leading-tight truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">Primary Guardian</p>
            </div>
          )}
          {(!collapsed || isMobile) && (
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen dark:bg-background bg-gray-50/80 overflow-hidden text-foreground font-sans">
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen shrink-0 sidebar-transition',
          'bg-card/90 dark:bg-nejah-surface/95 backdrop-blur-xl',
          'border-r border-border/50 dark:border-nejah-border-blue/40',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        {sidebarContent(false)}

        {/* Collapse toggle */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/8 transition-all duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
            onClick={() => navigate({ to: '/parent_notifications' })}
            className="relative p-2 rounded-xl hover:bg-primary/10 transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (activePath === '/parent_dashboard' && onTabChange) {
                onTabChange('settings');
              } else {
                navigate({ to: '/parent_dashboard', search: { tab: 'settings' } as any });
              }
            }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden"
          >
            <span className="font-bold text-xs text-nejah-electric">{initials}</span>
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-card dark:bg-nejah-surface shadow-2xl"
            >
              <div className="flex items-center justify-end px-4 pt-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0 lg:pt-0 pt-16">
        {children}
      </div>
    </div>
  );
}

export function ParentPageLoader() {
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
