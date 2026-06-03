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
    <div className="flex h-screen bg-white overflow-hidden text-gray-900 font-sans">
      <div className="w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col h-screen shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nejah" className="h-10 w-auto" />
            <div>
              <h1 className="font-extrabold text-emerald-900 tracking-tight leading-none text-lg">Nejah</h1>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Student Portal</p>
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
                    ? 'bg-white text-emerald-900 shadow-sm border-l-4 border-emerald-700'
                    : 'text-gray-500 hover:bg-white hover:text-emerald-700',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-emerald-700' : 'text-gray-400 group-hover:text-emerald-600',
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-white hover:text-emerald-700"
            >
              <Settings className="h-5 w-5" />
              <span className="font-bold text-sm">Settings</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>

        <div className="p-6">
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-full bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 hover:border-emerald-200 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
              {student?.avatarUrl ? (
                <img src={student.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm text-emerald-700">{student?.initials || 'S'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-gray-800 leading-tight truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 font-medium truncate">{student?.level || 'Student'} Program</p>
            </div>
            <User className="h-4 w-4 text-gray-400 shrink-0" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">{children}</div>
    </div>
  );
}

export function StudentPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700" />
    </div>
  );
}
