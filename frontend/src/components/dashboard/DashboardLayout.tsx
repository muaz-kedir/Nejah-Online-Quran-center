import { memo, ReactNode, useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AppProvider } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayoutInner = memo(function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setMobileSidebarOpen(prev => !prev), []);

  return (
    <div className="flex h-screen overflow-hidden admin-shell-bg">
      <Sidebar isOpen={mobileSidebarOpen} onToggle={toggleSidebar} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={toggleSidebar} />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 admin-shell-bg">
          <div className="pointer-events-none absolute inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
});

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AppProvider>
  );
});

export { DashboardLayout as default };
