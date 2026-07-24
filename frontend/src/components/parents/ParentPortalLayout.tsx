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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar, type AppMenuItem } from '@/components/ui/AppSidebar';
import { SidebarProvider } from '@/hooks/useSidebar';
import { useLanguage } from '@/context/LanguageContext';
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
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
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
