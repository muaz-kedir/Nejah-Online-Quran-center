import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { toast } from 'sonner';

function StudentNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const load = async () => {
    try {
      const data = await api<any[]>('/student/dashboard/notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api(`/student/dashboard/notifications/${id}/read`, { method: 'PATCH' });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await api('/student/dashboard/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const filtered = filter === 'unread' ? items.filter((n) => !n.isRead) : items;
  const unread = items.filter((n) => !n.isRead).length;

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.notifications} unreadNotifications={unread}>
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
            <h1 className="text-4xl font-extrabold text-nejah-sapphire font-serif">Notifications</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}>
              {filter === 'all' ? 'Unread only' : 'Show all'}
            </Button>
            <Button size="sm" className="bg-primary" onClick={markAllRead} disabled={unread === 0}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-muted rounded-3xl p-16 text-center border border-border">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  'w-full text-left bg-card rounded-2xl p-5 border transition-all',
                  n.isRead ? 'border-border opacity-80' : 'border-primary/200 shadow-sm',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-nejah-sapphire">{n.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-wider">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Badge className="bg-primary/10 text-nejah-sapphire border-none shrink-0">New</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/notifications')({
  component: StudentNotificationsPage,
  beforeLoad: requireStudentAuth,
});
