/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { ParentPortalLayout } from '@/components/parents/ParentPortalLayout';
import { LanguageProvider } from '@/context/LanguageContext';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Video,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/parent_notifications')({
  component: ParentNotificationsRoute,
});

function ParentNotificationsRoute() {
  return (
    <LanguageProvider>
      <ParentNotificationsPage />
    </LanguageProvider>
  );
}

function ParentNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useApiQuery<any>({
    queryKey: ["parent-notifications"],
    path: `/notifications`,
    refetchInterval: 30_000,
  });

  const notifications = Array.isArray(data) ? data : [];

  const fetchNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["parent-notifications"] });
  }, [queryClient]);

  useSocket({ onNotification: fetchNotifications });

  const markAsRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ["parent-notifications"] });
    } catch {}
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const channelIcon = (channel: string) => {
    switch (channel) {
      case 'MEETING_STARTED': return <Video className="h-4 w-4" />;
      case 'MEETING_ENDED': return <CheckCircle2 className="h-4 w-4" />;
      case 'CLASS_ALERT': return <AlertTriangle className="h-4 w-4" />;
      case 'ATTENDANCE_MARKED': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const channelColor = (channel: string) => {
    switch (channel) {
      case 'MEETING_STARTED': return 'bg-red-100 dark:bg-red-900/20 text-red-600';
      case 'MEETING_ENDED': return 'bg-green-100 dark:bg-green-900/20 text-green-600';
      case 'CLASS_ALERT': return 'bg-amber-100 dark:bg-amber-900/20 text-amber-600';
      case 'ATTENDANCE_MARKED': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
      default: return 'bg-primary/10 text-nejah-electric';
    }
  };

  return (
    <ParentPortalLayout activePath="/parent_notifications">
      <div className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12">
        <PageHeader
          eyebrow="Notifications"
          title="Parent Notifications"
          description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
          actions={
            <Button onClick={fetchNotifications} variant="outline" className="gap-2 rounded-xl h-11" disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          }
        />

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">Notifications from your children's classes will appear here</p>
          </div>
        ) : (
          <GlassPanel className="overflow-hidden">
            <div className="divide-y divide-border dark:divide-nejah-border-blue/20">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 p-5 transition-colors cursor-pointer hover:bg-muted/30',
                    !n.isRead && 'bg-primary/5',
                  )}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', channelColor(n.channel))}>
                    {channelIcon(n.channel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', !n.isRead && 'font-bold')}>{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-nejah-electric shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 tabular-nums">
                      {new Date(n.createdAt || n.sentAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg h-8 px-2 shrink-0"
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </GlassPanel>
        )}
      </div>
    </ParentPortalLayout>
  );
}
