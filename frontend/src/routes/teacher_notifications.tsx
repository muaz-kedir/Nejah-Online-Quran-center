import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { Bell, AlertCircle, CheckCircle, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_BASE = 'http://localhost:3000/api';

export const Route = createFileRoute('/teacher_notifications')({
  component: TeacherNotificationsPage,
  beforeLoad: () => requireAuth(['teacher', 'admin', 'super_admin']),
});

const NotificationIcon = ({ type, channel }: { type: string; channel: string }) => {
  if (channel === 'MEETING_STARTED' || channel === 'MEETING_ENDED') {
    return <MessageSquare className="h-5 w-5 text-blue-600" />;
  }
  if (channel === 'ATTENDANCE_MARKED') {
    return <CheckCircle className="h-5 w-5 text-primary" />;
  }
  if (channel === 'CLASS_ALERT') {
    return <AlertCircle className="h-5 w-5 text-amber-600" />;
  }
  return <Info className="h-5 w-5 text-muted-foreground" />;
};

const NotificationChannelLabel = (channel: string) => {
  switch (channel) {
    case 'MEETING_STARTED': return 'Meeting Started';
    case 'MEETING_ENDED': return 'Meeting Ended';
    case 'ATTENDANCE_MARKED': return 'Attendance Recorded';
    case 'CLASS_ALERT': return 'Class Alert';
    default: return 'System Alert';
  }
};

function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState('teacher');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole') || 'teacher');
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole') || 'teacher';
      const isTeacher = role === 'teacher';
      const url = isTeacher
        ? `${API_BASE}/teachers/notifications`
        : `${API_BASE}/notifications`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const list = isTeacher ? (data.notifications || []) : (Array.isArray(data) ? data : []);
        setNotifications(list);
        setUnreadCount(list.filter((n: any) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-primary dark:text-primary tracking-widest uppercase mb-1">
              Notifications
            </p>
            <h1 className="text-4xl font-extrabold text-nejah-sapphire text-foreground font-serif">
              Notifications & Updates
            </h1>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white h-9 px-4 rounded-xl text-sm">
              {unreadCount} Unread
            </Badge>
          )}
        </div>

        {/* Notifications Container */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-sm border border-border dark:border-nejah-border-blue overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nejah-border-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground dark:text-muted-foreground font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-primary text-nejah-electric" />
              </div>
              <h3 className="text-lg font-bold text-nejah-sapphire text-foreground mb-2">No Notifications</h3>
              <p className="text-muted-foreground dark:text-muted-foreground">You're all caught up! No new notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-nejah-border-blue">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-6 hover:bg-muted/50 dark:hover:bg-nejah-surface/30 transition-colors",
                    !notification.isRead && "bg-primary/10/30 dark:bg-primary/10/10"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-muted dark:bg-nejah-surface flex items-center justify-center">
                        <NotificationIcon type={notification.type} channel={notification.channel} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-foreground text-foreground">{notification.title}</h3>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 leading-relaxed">{notification.content}</p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary/100 ml-3 mt-2"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/100"></span>
                          {NotificationChannelLabel(notification.channel)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(notification.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {notifications.length > 0 && (
            <div className="px-6 py-4 border-t border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/50 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {notifications.length} notifications
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled className="h-9 w-9 rounded-lg dark:border-nejah-border-blue opacity-50">
                  <span className="text-xs">Previous</span>
                </Button>
                <Button variant="outline" disabled className="h-9 w-9 rounded-lg dark:border-nejah-border-blue opacity-50">
                  <span className="text-xs">Next</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
