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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(isOpen);
  }, [isOpen]);

  const handleLogout = useCallback(() => {
    import('@/lib/push-notifications').then(m =>
      m.unsubscribeFromPushNotifications().catch(() => {}),
    );
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  }, []);

  const toggleCollapse = useCallback(() => setSidebarCollapsed(!sidebarCollapsed), [sidebarCollapsed, setSidebarCollapsed]);

  const menuItems = userRole ? (menuByRole[userRole] || menuByRole.student) : [];

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
          'border-r border-border bg-card/80 backdrop-blur-xl dark:border-nejah-border-blue dark:bg-nejah-surface/90',
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
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-nejah-electric/30 bg-nejah-surface/50 p-1 shadow-[0_0_16px_rgba(0,102,204,0.25)]">
                  <img src="/logo.png" alt="Nejah" className="h-7 w-7 rounded-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-medium leading-none tracking-tight text-foreground">
                    Nejah Admin Console
                  </h1>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-nejah-electric">
                    Command Center
                  </p>
                </div>
              </div>
              <button
                onClick={toggleCollapse}
                className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-nejah-sapphire/30 text-nejah-slate-blue transition-all duration-200 hover:border-nejah-electric/40 hover:text-foreground lg:flex"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={onToggle}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-nejah-sapphire/30 text-nejah-slate-blue lg:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-nejah-electric/30 bg-nejah-surface/50 p-1 shadow-[0_0_16px_rgba(0,102,204,0.25)]">
                <img src="/logo.png" alt="Nejah" className="h-7 w-7 rounded-full object-cover" />
              </div>
              <button
                onClick={toggleCollapse}
                className="hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-nejah-sapphire/30 text-nejah-slate-blue transition-all hover:border-nejah-electric/40 hover:text-foreground lg:flex"
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
          {!userRole && (
            <div className="space-y-3 px-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-lg bg-nejah-slate-blue/10 animate-pulse" />
                  {!sidebarCollapsed && <div className="h-3 flex-1 rounded-md bg-nejah-slate-blue/10 animate-pulse" />}
                </div>
              ))}
            </div>
          )}
          {userRole && (
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const label = menuLabels[item.label] || item.label;

              return (
                <li key={`${item.path}-${item.label}`}>
                  <Link
                    to={item.path}
                    title={sidebarCollapsed ? label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
                      sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                      isActive
                        ? 'nav-item-active text-foreground'
                        : 'text-foreground/60 nav-item-hover hover:text-foreground',
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_rgba(0,102,204,0.6)]" />
                    )}

                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                        isActive ? 'text-nejah-electric' : 'text-foreground/50 group-hover:text-foreground',
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
                      <div className="pointer-events-none absolute left-full z-50 ml-3 hidden items-center whitespace-nowrap rounded-lg glass-panel px-2.5 py-1.5 text-xs text-foreground shadow-lg group-hover:flex">
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
          )}
        </nav>

        <SilverDivider />

        {/* Logout */}
        <div className="group flex-shrink-0 p-2">
          <button
            onClick={handleLogout}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-xl transition-all duration-200',
              'text-nejah-slate-blue hover:bg-red-500/10 hover:text-red-400',
              sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
            )}
            title={!sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
            {sidebarCollapsed && (
              <div className="pointer-events-none absolute left-full z-50 ml-3 hidden items-center whitespace-nowrap rounded-lg glass-panel px-2.5 py-1.5 text-xs text-foreground shadow-lg group-hover:flex">
                Logout
              </div>
            )}
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-shrink-0 p-4">
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-nejah-slate-blue">
              © 2026 Nejah Center
            </p>
          </div>
        )}
      </aside>
    </>
  );
});
