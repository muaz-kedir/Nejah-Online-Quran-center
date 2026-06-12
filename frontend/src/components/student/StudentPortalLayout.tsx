import { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ClipboardList,
  FolderOpen,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { studentPaths } from '@/lib/student-portal';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: studentPaths.dashboard },
  { label: 'My Classes', icon: Users, path: studentPaths.classes },
  { label: 'My Progress', icon: TrendingUp, path: studentPaths.progress },
  { label: 'Homework', icon: ClipboardList, path: studentPaths.homework },
  { label: 'Resources', icon: FolderOpen, path: studentPaths.resources },
  { label: 'Messages', icon: MessageSquare, path: studentPaths.messages },
  { label: 'Notifications', icon: Bell, path: studentPaths.notifications },
];

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const displayName = student?.fullName || student?.name || 'Student';

  return (
    <div className="flex h-screen dark:bg-background bg-white overflow-hidden dark:text-foreground text-foreground font-sans">
      <div className="w-64 dark:bg-nejah-surface bg-card/80 backdrop-blur-xl border-r dark:border-white/5 border-slate-200 flex flex-col h-screen shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full ring-2 ring-nejah-electric/30 ring-offset-2 ring-offset-nejah-surface flex items-center justify-center bg-background shrink-0">
              <span className="text-nejah-electric font-black text-sm">N</span>
            </div>
            <div>
              <h1 className="font-extrabold text-foreground tracking-tight leading-none text-lg">Nejah</h1>
              <p className="text-[10px] text-nejah-electric font-bold uppercase tracking-widest mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate({ to: item.path })}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/15 text-foreground shadow-sm border-l-4 border-nejah-electric'
                    : 'dark:text-nejah-slate-blue text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-nejah-electric' : 'dark:text-nejah-slate-blue text-muted-foreground group-hover:text-nejah-electric',
                  )}
                />
                <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                {item.path === studentPaths.notifications && unreadNotifications > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-2 space-y-1">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl dark:text-nejah-slate-blue text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              <span className="font-bold text-sm">Settings</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl dark:text-nejah-slate-blue text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>

        <div className="p-6">
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-full dark:bg-nejah-surface bg-white p-3 rounded-2xl border dark:border-white/10 border-border shadow-sm flex items-center gap-3 hover:border-nejah-electric/30 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden shrink-0">
              {student?.avatarUrl ? (
                <img src={student.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm text-nejah-electric">{student?.initials || 'S'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold dark:text-foreground text-foreground leading-tight truncate">{displayName}</p>
              <p className="text-[10px] dark:text-nejah-slate-blue text-muted-foreground font-medium truncate">{student?.level || 'Student'} Program</p>
            </div>
            <User className="h-4 w-4 dark:text-nejah-slate-blue text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">{children}</div>
    </div>
  );
}

export function StudentPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center dark:bg-background bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nejah-electric" />
    </div>
  );
}
