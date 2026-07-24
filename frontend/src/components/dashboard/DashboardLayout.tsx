import { memo, ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AppSidebar } from '@/components/ui/AppSidebar';
import { Topbar } from './Topbar';
import { menuByRole } from './menuConfig';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { SidebarProvider, useSidebar } from '@/hooks/useSidebar';
import { LogoutConfirmDialog } from '@/components/ui/logout-confirm-dialog';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const notifCountRef = useRef(notifCount);
  notifCountRef.current = notifCount;
  const { openMobile } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userRole = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || '') : '';
  const resolvedRole = userRole === 'admin' ? 'qirat_manager' : userRole;
  const menuItems = resolvedRole ? (menuByRole[resolvedRole] || []) : [];
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') || 'Admin' : 'Admin';

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

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    navigate({ to: '/login', replace: true });
    setTimeout(() => {
      localStorage.clear();
      import('@/lib/push-notifications').then(m =>
        m.unsubscribeFromPushNotifications().catch(() => {}),
      );
    }, 0);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden admin-shell-bg">
        <AppSidebar
          menuItems={menuItems}
          notifCount={notifCount}
          notifPath="/teacher_notifications"
          brandName="Nejah"
          brandSubtitle="Command Center"
          user={{ name: userName, role: resolvedRole }}
          onLogout={handleLogout}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={openMobile} notifCount={notifCount} />
          <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 admin-shell-bg">
            <div className="pointer-events-none absolute inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
            <div className="relative z-10">{children}</div>
          </main>
        </div>

        <LogoutConfirmDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          onConfirm={confirmLogout}
          userName={userName}
          userRole={resolvedRole}
        />
      </div>
    </SidebarProvider>
  );
});

export { DashboardLayout as default };
