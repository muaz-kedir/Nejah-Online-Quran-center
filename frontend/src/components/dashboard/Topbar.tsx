import { memo } from 'react';
import { Search, Bell, Menu, User, Settings, LogOut, Sun, Moon, Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') || 'Admin User' : 'Admin User';
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'super_admin' : 'super_admin';

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

  return (
    <header className={cn(
      'h-16 border-b flex items-center gap-4 px-6 flex-shrink-0 transition-colors duration-200',
      'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
    )}>
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder={t.searchPlaceholder}
            className={cn(
              'pl-9 h-9 text-sm border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500',
              'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
            'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            'hover:text-emerald-600 dark:hover:text-emerald-400'
          )}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                'hover:text-emerald-600 dark:hover:text-emerald-400'
              )}
              title="Change Language"
            >
              <Globe className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 dark:bg-gray-800 dark:border-gray-700">
            <DropdownMenuLabel className="dark:text-gray-300 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Language
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'flex items-center justify-between cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700',
                  language === lang.code && 'text-emerald-600 dark:text-emerald-400 font-medium'
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

        {/* Notifications */}
        <div className="relative">
          <button className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
            'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            'hover:text-emerald-600 dark:hover:text-emerald-400'
          )}>
            <Bell className="h-4 w-4" />
          </button>
          {notifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-2 border-white dark:border-gray-900">
              {notifications}
            </Badge>
          )}
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'flex items-center gap-2.5 ml-1 rounded-xl px-2 py-1.5 transition-all duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  {getRoleLabel(userRole)}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {userName.charAt(0)}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 dark:bg-gray-800 dark:border-gray-700">
            <DropdownMenuLabel className="dark:text-gray-300">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            <DropdownMenuItem onClick={() => navigate({ to: '/profile' })} className="dark:text-gray-200 dark:hover:bg-gray-700">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: '/settings' })} className="dark:text-gray-200 dark:hover:bg-gray-700">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:border-gray-700" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700">
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
