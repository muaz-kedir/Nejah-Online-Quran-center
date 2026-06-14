import { memo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Calendar, Bell, User, LogOut, Video } from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher_dashboard' },
  { label: 'Students', icon: Users, path: '/teacher_students' },
  { label: 'Zoom Sessions', icon: Video, path: '/teacher_zoom' },
  { label: 'Schedule', icon: Calendar, path: '/teacher_schedule' },
  { label: 'Notifications', icon: Bell, path: '/teacher_notifications' },
  { label: 'Profile', icon: User, path: '/teacher_profile' },
];

interface TeacherSidebarProps {
  activePath?: string;
}

export const TeacherSidebar = memo(function TeacherSidebar({ activePath }: TeacherSidebarProps) {
  const nav = useNavigate();

  return (
    <div className="w-64 dark:bg-nejah-surface bg-card/80 backdrop-blur-xl dark:border-white/5 border-r border-slate-200 text-foreground flex flex-col h-screen fixed inset-y-0 left-0 z-30">
      <div className="p-8 pb-12">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Nejah" className="h-10 w-auto rounded-xl" />
          <div>
            <h1 className="font-bold text-base leading-none">Teacher Suite</h1>
            <p className="text-[10px] text-nejah-electric font-medium tracking-widest mt-1 uppercase">Modern Maqam</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button key={item.path} onClick={() => nav({ to: item.path as any })} className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive ? "bg-nejah-sapphire/50 dark:text-white text-foreground" : "text-muted-foreground hover:bg-nejah-sapphire/30 hover:text-foreground dark:hover:text-white"
            )}>
              <item.icon className={cn("h-5 w-5", isActive ? "text-nejah-electric" : "text-muted-foreground group-hover:text-nejah-electric")} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              window.location.href = '/login';
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-300 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
});
