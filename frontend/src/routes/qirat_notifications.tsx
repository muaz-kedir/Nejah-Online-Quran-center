import { apiUrl, api } from "@/lib/api";
import { useState, useEffect, useCallback, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import {
  Bell,
  AlertCircle,
  Search,
  X,
  Trash2,
  Mail,
  MailOpen,
  RefreshCw,
  Info,
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  FileText,
  Video,
  CheckCircle,
  BookOpen,
  Award,
  Megaphone,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatFullDate } from '@/lib/notification-helpers';

export const Route = createFileRoute('/qirat_notifications')({
  component: QiratNotificationsPage,
  beforeLoad: () => requireAuth(['qirat_manager', 'super_admin', 'admin']),
});

const CHANNEL_LABELS: Record<string, string> = {
  MEETING_STARTED: 'Meeting Started',
  MEETING_ENDED: 'Meeting Ended',
  ATTENDANCE_MARKED: 'Attendance',
  CLASS_ALERT: 'Class Alert',
  STUDENT_JOINED: 'Student Assigned',
  STUDENT_LEFT: 'Student Removed',
  SYSTEM_ALERT: 'System Alert',
  TEMP_REPLACEMENT: 'Replacement',
  HOMEWORK_ASSIGNED: 'Homework',
  HOMEWORK_UPDATED: 'Homework',
  HOMEWORK_GRADED: 'Homework',
  CLASS_REMINDER: 'Reminder',
  SESSION_CANCELLED: 'Cancelled',
  SCHEDULE_CHANGED: 'Schedule',
  RESOURCE_ADDED: 'Resource',
  SYSTEM_ANNOUNCEMENT: 'Announcement',
  LEVEL_CHANGED: 'Level Progress',
  EVALUATION_PUBLISHED: 'Evaluation',
};

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  MEETING_STARTED: Video,
  MEETING_ENDED: Video,
  ATTENDANCE_MARKED: CheckCircle,
  CLASS_ALERT: AlertTriangle,
  STUDENT_JOINED: UserPlus,
  STUDENT_LEFT: UserMinus,
  SCHEDULE_CHANGED: Calendar,
  CLASS_REMINDER: Clock,
  HOMEWORK_ASSIGNED: FileText,
  HOMEWORK_UPDATED: FileText,
  HOMEWORK_GRADED: FileText,
  RESOURCE_ADDED: FileText,
  SYSTEM_ALERT: Megaphone,
  SYSTEM_ANNOUNCEMENT: Megaphone,
  TEMP_REPLACEMENT: RefreshCw,
  LEVEL_CHANGED: BookOpen,
  EVALUATION_PUBLISHED: Award,
};

const CHANNEL_COLORS: Record<string, string> = {
  MEETING_STARTED: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  MEETING_ENDED: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  ATTENDANCE_MARKED: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  CLASS_ALERT: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  STUDENT_JOINED: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  STUDENT_LEFT: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  SYSTEM_ALERT: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
  TEMP_REPLACEMENT: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  SCHEDULE_CHANGED: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
  HOMEWORK_ASSIGNED: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  HOMEWORK_GRADED: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  RESOURCE_ADDED: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
  CLASS_REMINDER: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30',
  SESSION_CANCELLED: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  LEVEL_CHANGED: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30',
  EVALUATION_PUBLISHED: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'MEETING_STARTED', label: 'Sessions' },
  { value: 'SCHEDULE_CHANGED', label: 'Schedule' },
  { value: 'TEMP_REPLACEMENT', label: 'Replacement' },
  { value: 'STUDENT_JOINED', label: 'Students' },
  { value: 'LEVEL_CHANGED', label: 'Progress' },
];

function NotificationIcon({ channel }: { channel: string }) {
  const Icon = CHANNEL_ICONS[channel] || Info;
  return <Icon className="h-5 w-5" />;
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
      CHANNEL_COLORS[channel] || 'text-muted-foreground bg-muted'
    )}>
      {CHANNEL_LABELS[channel] || channel}
    </span>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <Card className="border-border dark:border-nejah-border-blue">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QiratNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<{ total: number; unread: number; byChannel: any[] } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [marking, setMarking] = useState<string[]>([]);
  const limit = 10;
  const pollingRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchNotifications = useCallback(async (p = page, s = search, f = filter) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const url = `${apiUrl('/notifications')}?page=${p}&limit=${limit}${s ? `&search=${encodeURIComponent(s)}` : ''}${f !== 'all' ? `&filter=${f}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || `Request failed (${response.status})`);
      }
      const data = await response.json();
      const list = data.notifications || [];
      setNotifications(list);
      if (data.meta) {
        setTotalPages(data.meta.totalPages || 1);
        setTotal(data.meta.total || list.length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api('/notifications/summary');
      setSummary(data);
    } catch (e) {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchSummary();
  }, [page, search, filter, fetchNotifications, fetchSummary]);

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchNotifications();
      fetchSummary();
    }, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchNotifications, fetchSummary]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(1);
  };

  const handlePrevious = () => { if (page > 1) setPage(page - 1); };
  const handleNext = () => { if (page < totalPages) setPage(page + 1); };

  const handleMarkRead = async (id: string) => {
    setMarking(prev => [...prev, id]);
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await fetchSummary();
    } catch (e) {
      console.error('Failed to mark as read', e);
    } finally {
      setMarking(prev => prev.filter(x => x !== id));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      await fetchNotifications();
      await fetchSummary();
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(prev => [...prev, id]);
    try {
      await api(`/notifications/${id}`, { method: 'DELETE' });
      await fetchNotifications();
      await fetchSummary();
    } catch (e) {
      console.error('Failed to delete', e);
    } finally {
      setDeleting(prev => prev.filter(x => x !== id));
    }
  };

  const handleClearRead = async () => {
    try {
      await api('/notifications/clear-read', { method: 'POST' });
      await fetchNotifications();
      await fetchSummary();
    } catch (e) {
      console.error('Failed to clear read', e);
    }
  };

  const openDetail = (n: any) => {
    setSelectedNotification(n);
    setDetailOpen(true);
    if (!n.isRead) handleMarkRead(n.id);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <PageHeader
              eyebrow="Alerts"
              title="Notifications"
              description="Academic announcements and alerts"
            />
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="h-9 rounded-lg text-xs font-bold dark:border-nejah-border-blue">
                <MailOpen className="h-4 w-4 mr-1.5" />
                Mark All Read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleClearRead} className="h-9 rounded-lg text-xs font-bold dark:border-nejah-border-blue">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear Read
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Total" value={summary.total} icon={Bell} color="bg-primary" />
            <SummaryCard label="Unread" value={summary.unread} icon={Mail} color="bg-red-500" />
            {summary.byChannel?.slice(0, 2).map((item: any) => (
              <SummaryCard
                key={item.channel}
                label={CHANNEL_LABELS[item.channel] || item.channel}
                value={Number(item.count)}
                icon={CHANNEL_ICONS[item.channel] || Info}
                color="bg-indigo-500"
              />
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border-border dark:border-nejah-border-blue bg-background"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Tabs value={filter} onValueChange={handleFilterChange} className="w-full sm:w-auto">
            <TabsList className="h-10 rounded-xl bg-muted dark:bg-nejah-surface">
              {FILTER_OPTIONS.map(opt => (
                <TabsTrigger key={opt.value} value={opt.value} className="text-xs rounded-lg px-3">
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-sm border border-border dark:border-nejah-border-blue overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nejah-border-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground font-medium">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Error Loading Notifications</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchNotifications()} variant="outline" className="rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Notifications</h3>
              <p className="text-muted-foreground">You're all caught up! No new notifications to show.</p>
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-nejah-border-blue">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 sm:p-5 hover:bg-muted/50 dark:hover:bg-nejah-surface/30 transition-colors cursor-pointer",
                    !notification.isRead && "bg-primary/5 dark:bg-primary/5"
                  )}
                  onClick={() => openDetail(notification)}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      CHANNEL_COLORS[notification.channel] || 'bg-muted text-muted-foreground'
                    )}>
                      <NotificationIcon channel={notification.channel} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className={cn(
                            "text-sm truncate",
                            !notification.isRead ? "font-bold text-foreground" : "font-semibold text-muted-foreground"
                          )}>
                            {notification.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {notification.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <ChannelBadge channel={notification.channel} />
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        <div className="flex-1" />
                        {!notification.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                            disabled={marking.includes(notification.id)}
                            className="text-[11px] font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                          >
                            {marking.includes(notification.id) ? '...' : 'Mark read'}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                          disabled={deleting.includes(notification.id)}
                          className="text-[11px] font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          {deleting.includes(notification.id) ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {(total > 0) && (
            <div className="px-6 py-4 border-t border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/50 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={handlePrevious}
                  className="h-9 rounded-lg px-3 dark:border-nejah-border-blue text-xs font-bold"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={handleNext}
                  className="h-9 rounded-lg px-3 dark:border-nejah-border-blue text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl dark:bg-nejah-surface border-border dark:border-nejah-border-blue">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                selectedNotification && (CHANNEL_COLORS[selectedNotification.channel] || 'bg-muted')
              )}>
                {selectedNotification && <NotificationIcon channel={selectedNotification.channel} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold truncate">{selectedNotification?.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedNotification && <ChannelBadge channel={selectedNotification.channel} />}
                  <span className="text-xs text-muted-foreground">
                    {selectedNotification && formatRelativeTime(selectedNotification.createdAt)}
                  </span>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {selectedNotification?.content}
            </p>
            {selectedNotification?.dataJson && (
              <div className="mt-4 p-3 bg-muted dark:bg-nejah-surface/50 rounded-xl border border-border dark:border-nejah-border-blue">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</p>
                <div className="space-y-1.5">
                  {Object.entries(selectedNotification.dataJson).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-foreground font-medium truncate ml-4 max-w-[200px]">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNotification?.actionUrl && (
              <div className="mt-4">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-xl text-xs font-bold w-full"
                  onClick={() => {
                    setDetailOpen(false);
                    navigate({ to: selectedNotification.actionUrl });
                  }}
                >
                  View Related Page
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
