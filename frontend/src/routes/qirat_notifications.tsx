import { API_BASE } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { Bell } from 'lucide-react';

export const Route = createFileRoute('/qirat_notifications')({
  component: QiratNotificationsPage,
  beforeLoad: () => requireAuth(['qirat_manager', 'super_admin', 'admin']),
});

function QiratNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setNotifications)
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Alerts" title="Notifications" description="Academic announcements and alerts" />
      {notifications.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-2xl py-20 text-center">
          <Bell className="mb-4 h-12 w-12 text-nejah-electric/50" />
          <p className="text-nejah-slate-blue">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="glass-panel rounded-2xl p-4">
              <p className="font-medium text-foreground">{n.title || n.message}</p>
              <p className="mt-1 text-sm text-nejah-slate-blue">{n.body || n.content}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
