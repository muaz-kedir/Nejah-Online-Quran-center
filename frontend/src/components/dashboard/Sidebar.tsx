import { memo, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { menuByRole } from './menuConfig';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SilverDivider } from './design-system';

export const Sidebar = memo(function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const location = useLocation();
  const { t, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const [mobileOpen, setMobileOpen] = useState(isOpen);
  const [userRole, setUserRole] = useState('student');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') || 'student';
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(isOpen);
  }, [isOpen]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  }, []);

  const toggleCollapse = useCallback(() => setSidebarCollapsed(!sidebarCollapsed), [sidebarCollapsed, setSidebarCollapsed]);

  const menuItems = menuByRole[userRole] || menuByRole.student;

  const menuLabels: Record<string, string> = {
    Dashboard: t.dashboard,
    Students: t.students,
    Teachers: t.teachers,
    Parents: t.parents,
    Classes: t.classes,
    Attendance: t.attendance,
    Reports: t.reports,
    Settings: t.settings,
    Messages: t.messages,
    'Content Edition': t.contentEdition,
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'flex h-full flex-col transition-all duration-300 ease-in-out',
          'border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-brand-abyss/90',
          /* Mobile: fixed overlay drawer */
          'fixed inset-y-0 left-0 z-30 w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          /* Desktop: in-flow sidebar — prevents content overlap */
          'lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:overflow-visible',
          sidebarCollapsed ? 'lg:w-[70px]' : 'lg:w-64',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex flex-shrink-0 items-center',
            sidebarCollapsed ? 'flex-col gap-2 p-3' : 'justify-between px-5 py-5',
          )}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-brand-electric/30 bg-brand-abyss/50 p-1 shadow-[0_0_16px_rgba(0,102,204,0.25)]">
                  <img src="/logo.png" alt="Nejah" className="h-7 w-7 rounded-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-medium leading-none tracking-tight text-brand-silver">
                    Nejah Admin Console
                  </h1>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-brand-electric">
                    Command Center
                  </p>
                </div>
              </div>
              <button
                onClick={toggleCollapse}
                className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-primary/30 text-brand-platinum transition-all duration-200 hover:border-brand-electric/40 hover:text-brand-silver lg:flex"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={onToggle}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-primary/30 text-brand-platinum lg:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-electric/30 bg-brand-abyss/50 p-1 shadow-[0_0_16px_rgba(0,102,204,0.25)]">
                <img src="/logo.png" alt="Nejah" className="h-7 w-7 rounded-full object-cover" />
              </div>
              <button
                onClick={toggleCollapse}
                className="hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-brand-primary/30 text-brand-platinum transition-all hover:border-brand-electric/40 hover:text-brand-silver lg:flex"
                title="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <SilverDivider />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const label = menuLabels[item.label] || item.label;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
                      sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                      isActive
                        ? 'nav-item-active text-brand-silver'
                        : 'text-brand-platinum nav-item-hover hover:text-brand-silver',
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-electric shadow-[0_0_8px_rgba(0,102,204,0.6)]" />
                    )}

                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                        isActive ? 'text-brand-electric' : 'text-brand-platinum group-hover:text-brand-silver',
                        !sidebarCollapsed && 'group-hover:scale-110',
                      )}
                    />

                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{label}</span>
                        {item.badge && (
                          <span className="badge-live-pulse ml-auto min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {sidebarCollapsed && (
                      <div className="pointer-events-none absolute left-full z-50 ml-3 hidden items-center whitespace-nowrap rounded-lg glass-panel px-2.5 py-1.5 text-xs text-brand-silver shadow-lg group-hover:flex">
                        {label}
                        {item.badge && (
                          <span className="badge-live-pulse ml-2">{item.badge}</span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <SilverDivider />

        {/* Logout */}
        <div className="group flex-shrink-0 p-2">
          <button
            onClick={handleLogout}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-xl transition-all duration-200',
              'text-brand-platinum hover:bg-red-500/10 hover:text-red-400',
              sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
            )}
            title={!sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            {sidebarCollapsed && (
              <div className="pointer-events-none absolute left-full z-50 ml-3 hidden items-center whitespace-nowrap rounded-lg glass-panel px-2.5 py-1.5 text-xs text-brand-silver shadow-lg group-hover:flex">
                Logout
              </div>
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-shrink-0 p-4">
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-brand-platinum">
              © 2026 Nejah Center
            </p>
          </div>
        )}
      </aside>
    </>
  );
});
