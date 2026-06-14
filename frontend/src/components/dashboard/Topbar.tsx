import { memo, useState, useEffect, useCallback } from 'react';
import { Search, Bell, Menu, User, Settings, LogOut, Sun, Moon, Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useNavigate } from '@tanstack/react-router';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { getRoleLabel } from '@/components/ui/role-badge';

interface TopbarProps {
  onMenuClick: () => void;
}

const LANGUAGES = [
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
  { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
];

function TopbarInner({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme, language, setLanguage, t } = useApp();
  const [notifCount, setNotifCount] = useState(0);
  const [userName, setUserName] = useState('Admin User');
  const [userRole, setUserRole] = useState('super_admin');

  const fetchNotifCount = useCallback(async () => {
    try {
      const data = await api<any[]>('/notifications');
      const unread = Array.isArray(data) ? data.filter((n: any) => !n.isRead).length : 0;
      setNotifCount(unread);
    } catch {}
  }, []);

  useEffect(() => {
    const loadUserData = () => {
      setUserName(localStorage.getItem('userName') || 'Admin User');
      setUserRole(localStorage.getItem('userRole') || 'super_admin');
    };

    if (typeof window !== 'undefined') {
      loadUserData();
      fetchNotifCount();
      window.addEventListener('profileUpdated', loadUserData);
      const interval = setInterval(fetchNotifCount, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('profileUpdated', loadUserData);
      };
    }
  }, [fetchNotifCount]);

  const handleLogout = () => {
    localStorage.clear();
    navigate({ to: '/login' });
  };

  const iconBtn = cn(
    'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
    'text-nejah-slate-blue hover:bg-primary/10 hover:text-nejah-electric',
  );

  return (
    <header
      className={cn(
        'flex h-16 flex-shrink-0 items-center gap-4 border-b px-6',
        'border-border bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-nejah-surface/60',
      )}
    >
      <button onClick={onMenuClick} className={cn(iconBtn, 'p-1 lg:hidden')}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="max-w-lg flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nejah-slate-blue" />
          <Input
            placeholder={t.searchPlaceholder}
            className={cn(
              'h-9 border-border bg-nejah-surface/30 pl-9 text-sm text-foreground',
              'placeholder:text-nejah-slate-blue focus:border-nejah-electric/50 dark:border-white/10 dark:bg-background/50',
            )}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={iconBtn}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={iconBtn} title="Change Language">
              <Globe className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-panel w-44 border-border dark:border-white/5">
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-nejah-slate-blue">
              Language
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-nejah-border-blue/20" />
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'cursor-pointer text-foreground focus:bg-primary/10',
                  language === lang.code && 'font-medium text-nejah-electric',
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {language === lang.code && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative">
          <button className={iconBtn} onClick={() => {
            const role = localStorage.getItem('userRole');
            const paths: Record<string, string> = {
              teacher: '/teacher_notifications',
              student: '/student/notifications',
              qirat_manager: '/qirat_notifications',
              parent: '/parent_notifications',
            };
            navigate({ to: paths[role || ''] || '/dashboard' });
          }}>
            <Bell className="h-4 w-4" />
          </button>
          {notifCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-red-500 font-mono text-[10px] text-white">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'ml-1 flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200',
                'hover:bg-primary/10',
              )}
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-tight text-foreground">{userName}</span>
                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  {getRoleLabel(userRole)}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-nejah-electric/30 bg-gradient-to-br from-nejah-sapphire to-nejah-electric text-sm font-semibold text-white shadow-[0_0_12px_rgba(0,102,204,0.4)]">
                {userName.charAt(0)}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-panel w-56 border-border dark:border-white/5">
            <DropdownMenuLabel className="text-nejah-slate-blue">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-nejah-border-blue/20" />
            <DropdownMenuItem
              onClick={() => navigate({ to: '/profile' })}
              className="text-foreground focus:bg-primary/10"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate({ to: '/settings' })}
              className="text-foreground focus:bg-primary/10"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-nejah-border-blue/20" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-500 focus:bg-red-500/10 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export const Topbar = memo(TopbarInner);
