import { memo, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const notifCountRef = useRef(notifCount);
  notifCountRef.current = notifCount;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api<{ count: number }>('/notifications/unread-count');
      setNotifCount(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useSocket({
    onNotification: () => {
      setNotifCount(notifCountRef.current + 1);
    },
  });

  const toggleSidebar = useCallback(() => setMobileSidebarOpen(prev => !prev), []);

  return (
    <div className="flex h-screen overflow-hidden admin-shell-bg">
      <Sidebar isOpen={mobileSidebarOpen} onToggle={toggleSidebar} notifCount={notifCount} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={toggleSidebar} notifCount={notifCount} />
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 admin-shell-bg">
          <div className="pointer-events-none absolute inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
});

export { DashboardLayout as default };
