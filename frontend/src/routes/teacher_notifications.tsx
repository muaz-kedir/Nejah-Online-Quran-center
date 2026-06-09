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
    return <CheckCircle className="h-5 w-5 text-emerald-600" />;
  }
  if (channel === 'CLASS_ALERT') {
    return <AlertCircle className="h-5 w-5 text-amber-600" />;
  }
  return <Info className="h-5 w-5 text-gray-600" />;
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
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 tracking-widest uppercase mb-1">
              Notifications
            </p>
            <h1 className="text-4xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">
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
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-900 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950 dark:text-gray-100 mb-2">No Notifications</h3>
              <p className="text-gray-500 dark:text-gray-400">You're all caught up! No new notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-6 hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors",
                    !notification.isRead && "bg-emerald-50/30 dark:bg-emerald-900/10"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                        <NotificationIcon type={notification.type} channel={notification.channel} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{notification.title}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{notification.content}</p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 ml-3 mt-2"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {notifications.length} notifications
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled className="h-9 w-9 rounded-lg dark:border-gray-700 opacity-50">
                  <span className="text-xs">Previous</span>
                </Button>
                <Button variant="outline" disabled className="h-9 w-9 rounded-lg dark:border-gray-700 opacity-50">
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
