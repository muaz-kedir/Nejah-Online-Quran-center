import { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { menuByRole } from './menuConfig';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const location = useLocation();
  const { t, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const [userRole, setUserRole] = useState('student');
  const [mobileOpen, setMobileOpen] = useState(isOpen);

  useEffect(() => {
    setMobileOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole') || 'student');
    }
  }, []);

  const menuItems = menuByRole[userRole] || menuByRole.student;

  // Labels from translations
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
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 bg-gradient-to-b from-emerald-900 via-emerald-900 to-emerald-950 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl',
          // mobile: slide in/out
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // desktop: collapsed or expanded width
          sidebarCollapsed ? 'lg:w-[70px]' : 'lg:w-64',
          'w-64'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center border-b border-emerald-800 flex-shrink-0',
            sidebarCollapsed ? 'justify-center p-4' : 'justify-between px-5 py-5'
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Nejah Logo" className="object-contain w-full h-full drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">Nejah</h1>
                <p className="text-[10px] text-emerald-300 uppercase tracking-widest mt-0.5">
                  Admin Console
                </p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Nejah Logo" className="object-contain w-full h-full drop-shadow-md" />
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-emerald-800 hover:bg-emerald-700 text-emerald-200 hover:text-white transition-all duration-200 flex-shrink-0',
              sidebarCollapsed && 'mt-3'
            )}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile close */}
          <button
            onClick={onToggle}
            className={cn(
              'lg:hidden flex items-center justify-center w-7 h-7 rounded-full bg-emerald-800 hover:bg-emerald-700 text-emerald-200 flex-shrink-0',
              sidebarCollapsed && 'hidden'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-track-emerald-900 scrollbar-thumb-emerald-700">
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
                      'flex items-center gap-3 rounded-xl transition-all duration-200 group relative',
                      sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-emerald-200 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-300 rounded-r-full" />
                    )}

                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                        isActive ? 'text-white' : 'text-emerald-300 group-hover:text-white',
                        !sidebarCollapsed && 'group-hover:scale-110'
                      )}
                    />

                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium text-sm flex-1">{label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                    {/* Collapsed tooltip */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-3 hidden group-hover:flex items-center bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none">
                        {label}
                        {item.badge && (
                          <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-emerald-800 flex-shrink-0">
            <p className="text-xs text-emerald-400 text-center">© 2026 Nejah Center</p>
          </div>
        )}
      </aside>
    </>
  );
}
