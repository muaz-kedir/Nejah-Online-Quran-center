import { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  FileText,
  Clock,
  Video,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar, type AppMenuItem } from '@/components/ui/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useSidebar } from '@/hooks/useSidebar';
import { OnboardingGuard } from '@/components/ui/OnboardingGuard';

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

export function ParentPortalLayout({
  activePath,
  activeTab = 'dashboard',
  onTabChange,
  parent,
  unreadNotifications = 0,
  children,
}: Props) {
  const navigate = useNavigate();
  const { translations, lang, setLang } = useLanguage();
  const { openMobile } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const displayName = parent?.name || 'Parent';
  const initials = displayName.charAt(0);

  const menuItems: AppMenuItem[] = [
    { label: translations.dashboard, icon: LayoutDashboard, tab: 'dashboard', path: '/parent_dashboard' },
    { label: translations.myChildren, icon: Users, tab: 'children', path: '/parent_dashboard' },
    { label: translations.quranProgress, icon: BookOpen, tab: 'quran', path: '/parent_dashboard' },
    { label: translations.homework, icon: ClipboardList, tab: 'homework', path: '/parent_dashboard' },
    { label: translations.examsResults, icon: FileText, tab: 'exams', path: '/parent_dashboard' },
    { label: translations.classSchedule, icon: Clock, tab: 'schedule', path: '/parent_dashboard' },
    { label: 'Sessions', icon: Video, tab: 'sessions', path: '/parent_sessions' },
  ];

  const handleItemClick = (item: AppMenuItem) => {
    if (item.path !== '/parent_dashboard') {
      navigate({ to: item.path });
    } else {
      if (activePath === '/parent_dashboard' && onTabChange) {
        onTabChange(item.tab || 'dashboard');
      } else {
        navigate({ to: '/parent_dashboard', search: { tab: item.tab } as any });
      }
    }
  };

  const isItemActive = (item: AppMenuItem) => {
    if (item.path !== '/parent_dashboard') {
      return activePath === item.path;
    }
    return activePath === '/parent_dashboard' && activeTab === (item.tab || 'dashboard');
  };

  const languageSwitcher = (
    <div className="flex items-center gap-2">
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
  );

  return (
    <OnboardingGuard>
      <SidebarProvider>
      <div className="flex h-screen dark:bg-background bg-gray-50/80 overflow-hidden text-foreground font-sans">
        <AppSidebar
          menuItems={menuItems}
          brandSubtitle="Parent Portal"
          onItemClick={handleItemClick}
          isItemActive={isItemActive}
          user={{ name: displayName, avatarUrl: parent?.avatarUrl || undefined, initials }}
          notifCount={unreadNotifications}
          onLogout={handleLogout}
          onNotificationClick={() => navigate({ to: '/parent_notifications' })}
          extraTop={<div className="px-3 pb-2">{languageSwitcher}</div>}
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
          <div className="flex items-center gap-2">
            {parent?.avatarUrl ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center overflow-hidden">
                <img src={parent.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nejah-electric/20 to-primary/30 flex items-center justify-center">
                <span className="font-bold text-xs text-nejah-electric">{initials}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto min-w-0 lg:pt-0 pt-16">
          {children}
        </div>
      </div>
    </SidebarProvider>
    </OnboardingGuard>
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
