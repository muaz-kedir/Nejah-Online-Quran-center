/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { apiUrl, api } from "@/lib/api";
import { useState, useEffect, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Bell, DollarSign, AlertTriangle, CheckCircle, RefreshCw,
  Search, X, Trash2, CheckCheck, Info, TrendingUp, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createLazyFileRoute('/finance_notifications')({
  component: FinanceNotificationsPage,
});

function FinanceNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter !== 'all') params.set('filter', filter);
      if (search.trim()) params.set('search', search.trim());
      const data = await api<any>(`/notifications?${params}`);
      setNotifications(Array.isArray(data) ? data : data?.data || []);
      if (data?.meta) setTotalPages(data.meta.totalPages || 1);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api<any>('/notifications/summary');
      setSummary(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchSummary();
  }, [fetchNotifications, fetchSummary]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useSocket({ onNotification: fetchNotifications });

  const markAsRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      fetchSummary();
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchSummary();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchSummary();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const clearRead = async () => {
    try {
      await api('/notifications/clear-read', { method: 'POST' });
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      fetchSummary();
      toast.success('Read notifications cleared');
    } catch {
      toast.error('Failed to clear');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await api('/notifications/delete-multiple', {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setNotifications((prev) => prev.filter((n) => !selected.has(n.id)));
      setSelected(new Set());
      fetchSummary();
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'PAYMENT_REMINDER', label: 'Reminders' },
    { value: 'PAYMENT_OVERDUE', label: 'Overdue' },
    { value: 'PAYMENT_RECEIVED', label: 'Payments' },
    { value: 'SYSTEM_ALERT', label: 'System' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Alerts"
        title="Financial Notifications"
        description="Payment reminders, overdue alerts, and financial summaries"
        actions={
          <div className="flex gap-2">
            <Button onClick={fetchNotifications} variant="outline" className="gap-2 rounded-xl h-11" disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total" value={summary?.total || 0} icon={Bell} color="bg-blue-500" />
        <SummaryCard label="Unread" value={summary?.unread || 0} icon={Bell} color="bg-amber-500" />
        <SummaryCard label="Payment Alerts" value={summary?.byChannel?.find((c: any) => c.channel === 'PAYMENT_REMINDER')?.count || 0} icon={DollarSign} color="bg-emerald-500" />
        <SummaryCard label="Overdue" value={summary?.byChannel?.find((c: any) => c.channel === 'PAYMENT_OVERDUE')?.count || 0} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFilter(opt.value); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === opt.value
                ? 'bg-nejah-electric text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {selected.size > 0 && (
            <Button size="sm" variant="destructive" onClick={bulkDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete ({selected.size})
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
          <Button size="sm" variant="ghost" onClick={clearRead}>
            <X className="h-4 w-4 mr-1" /> Clear Read
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-10 pl-9 border-border bg-nejah-surface/30 dark:bg-background/50"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center rounded-2xl py-20 text-center">
          <Bell className="mb-4 h-12 w-12 text-nejah-electric/50" />
          <p className="font-bold text-nejah-slate-blue">No financial notifications</p>
          <p className="text-xs text-nejah-slate-blue mt-1">Payment reminders and financial alerts will appear here</p>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer border',
                'hover:bg-muted/30 border-border dark:border-nejah-border-blue/20',
                !n.isRead && 'bg-primary/5 border-primary/20 dark:border-primary/30',
              )}
              onClick={() => !n.isRead && markAsRead(n.id)}
            >
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  checked={selected.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded"
                />
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  CHANNEL_COLORS[n.channel] || 'bg-muted text-muted-foreground',
                )}>
                  <NotificationIcon channel={n.channel} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-sm', !n.isRead && 'font-bold')}>{n.title}</span>
                    <ChannelBadge channel={n.channel} />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-nejah-electric" />}
                    <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatDate(n.createdAt || n.sentAt)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{n.content}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.isRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg"
                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600"
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </DashboardLayout>
  );
}
