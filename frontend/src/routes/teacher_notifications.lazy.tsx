/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

import { apiUrl, api } from "@/lib/api";
import { useState, useCallback, useRef } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { Bell, AlertCircle, CheckCircle, MessageSquare, Info, Search, X, Trash2, Mail, MailOpen, Calendar, UserPlus, UserMinus, Clock, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useApiQuery } from '@/hooks/useApiQuery';

const CHANNEL_LABELS: Record<string, string> = {
  MEETING_STARTED: 'Meeting Started',
  MEETING_ENDED: 'Meeting Ended',
  ATTENDANCE_MARKED: 'Attendance Recorded',
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
};

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  MEETING_STARTED: VideoIcon,
  MEETING_ENDED: VideoIcon,
  STUDENT_JOINED: UserPlus,
  STUDENT_LEFT: UserMinus,
  SCHEDULE_CHANGED: Calendar,
  CLASS_REMINDER: Clock,
  HOMEWORK_ASSIGNED: FileText,
  HOMEWORK_UPDATED: FileText,
  HOMEWORK_GRADED: FileText,
  RESOURCE_ADDED: FileText,
};

function VideoIcon(props: any) {
  return <MessageSquare {...props} />;
}

const CHANNEL_COLORS: Record<string, string> = {
  MEETING_STARTED: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  MEETING_ENDED: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  ATTENDANCE_MARKED: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  CLASS_ALERT: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  STUDENT_JOINED: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  STUDENT_LEFT: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  SYSTEM_ALERT: 'text-muted-foreground bg-muted dark:bg-gray-900/30',
  TEMP_REPLACEMENT: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  SCHEDULE_CHANGED: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
  HOMEWORK_ASSIGNED: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  HOMEWORK_GRADED: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  RESOURCE_ADDED: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
  CLASS_REMINDER: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30',
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'STUDENT_JOINED', label: 'Students' },
  { value: 'SCHEDULE_CHANGED', label: 'Schedule' },
  { value: 'TEMP_REPLACEMENT', label: 'Replacement' },
  { value: 'MEETING_STARTED', label: 'Sessions' },
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
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

export const Route = createLazyFileRoute('/teacher_notifications')({
  component: TeacherNotificationsPage,
});

function TeacherNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [marking, setMarking] = useState<string[]>([]);
  const limit = 10;

  const { data: notificationsData, isLoading: loading } = useApiQuery<{ notifications: any[]; meta: { totalPages: number; total: number } }>({
    queryKey: ['teacher-notifications', page, search, filter],
    path: `/notifications?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}${filter !== 'all' ? `&filter=${filter}` : ''}`,
    refetchInterval: 30_000,
  });

  const { data: summary } = useApiQuery<{ total: number; unread: number; byChannel: any[] }>({
    queryKey: ['teacher-notifications-summary'],
    path: '/notifications/summary',
    refetchInterval: 30_000,
  });

  const notifications = notificationsData?.notifications || [];
  const totalPages = notificationsData?.meta?.totalPages || 1;
  const total = notificationsData?.meta?.total || 0;

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
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications-summary'] });
    } catch (e) {
      console.error('Failed to mark as read', e);
    } finally {
      setMarking(prev => prev.filter(x => x !== id));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications-summary'] });
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(prev => [...prev, id]);
    try {
      await api(`/notifications/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications-summary'] });
    } catch (e) {
      console.error('Failed to delete', e);
    } finally {
      setDeleting(prev => prev.filter(x => x !== id));
    }
  };

  const handleClearRead = async () => {
    try {
      await api('/notifications/clear-read', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications-summary'] });
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
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const Layout = userRole === 'super_admin' ? DashboardLayout : TeacherLayout;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-primary dark:text-primary tracking-widest uppercase mb-1">
              Notifications
            </p>
            <h1 className="text-4xl font-extrabold text-foreground font-serif">
              Notifications & Updates
            </h1>
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
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground font-medium">No notifications found.</p>
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
                          {formatDate(notification.createdAt)}
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
                    {selectedNotification && formatDate(selectedNotification.createdAt)}
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
    </Layout>
  );
}
