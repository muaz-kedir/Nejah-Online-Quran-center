import { memo, useState, useEffect } from 'react';
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
  const notifications = 3;
  const [userName, setUserName] = useState('Admin User');
  const [userRole, setUserRole] = useState('super_admin');

  useEffect(() => {
    const loadUserData = () => {
      setUserName(localStorage.getItem('userName') || 'Admin User');
      setUserRole(localStorage.getItem('userRole') || 'super_admin');
    };

    if (typeof window !== 'undefined') {
      loadUserData();
      window.addEventListener('profileUpdated', loadUserData);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profileUpdated', loadUserData);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate({ to: '/login' });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Administrator',
      admin: 'Administrator',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
    };
    return labels[role] || role;
  };

  const iconBtn = cn(
    'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
    'text-brand-platinum hover:bg-brand-electric/10 hover:text-brand-electric',
  );

  return (
    <header
      className={cn(
        'flex h-16 flex-shrink-0 items-center gap-4 border-b px-6',
        'border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-brand-abyss/60',
      )}
    >
      <button onClick={onMenuClick} className={cn(iconBtn, 'p-1 lg:hidden')}>
        <Menu className="h-5 w-5" />
      </button>

      <div className="max-w-lg flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-platinum" />
          <Input
            placeholder={t.searchPlaceholder}
            className={cn(
              'h-9 border-slate-200/80 bg-brand-abyss/30 pl-9 text-sm text-brand-silver',
              'placeholder:text-brand-platinum focus:border-brand-electric/50 dark:border-white/10 dark:bg-brand-void/50',
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
          <DropdownMenuContent align="end" className="glass-panel w-44 border-slate-200/80 dark:border-white/5">
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-brand-platinum">
              Language
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-brand-silver/20" />
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'cursor-pointer text-brand-silver focus:bg-brand-electric/10',
                  language === lang.code && 'font-medium text-brand-electric',
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
          <button className={iconBtn}>
            <Bell className="h-4 w-4" />
          </button>
          {notifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-void bg-red-500 font-mono text-[10px] text-white">
              {notifications}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'ml-1 flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200',
                'hover:bg-brand-electric/10',
              )}
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-tight text-brand-silver">{userName}</span>
                <span className="text-[10px] uppercase tracking-wide text-brand-platinum">
                  {getRoleLabel(userRole)}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-electric/30 bg-gradient-to-br from-brand-primary to-brand-electric text-sm font-semibold text-white shadow-[0_0_12px_rgba(0,102,204,0.4)]">
                {userName.charAt(0)}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-panel w-56 border-slate-200/80 dark:border-white/5">
            <DropdownMenuLabel className="text-brand-platinum">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-brand-silver/20" />
            <DropdownMenuItem
              onClick={() => navigate({ to: '/profile' })}
              className="text-brand-silver focus:bg-brand-electric/10"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate({ to: '/settings' })}
              className="text-brand-silver focus:bg-brand-electric/10"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-brand-silver/20" />
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
