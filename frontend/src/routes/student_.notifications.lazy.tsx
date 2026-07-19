/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useCallback } from "react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StudentPortalLayout, StudentPageLoader } from "@/components/student/StudentPortalLayout";
import { api, requireStudentAuth, studentPaths } from "@/lib/student-portal";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
  NOTIFICATION_BG_COLORS,
  NOTIFICATION_ACTIONS,
  formatRelativeTime,
  formatFullDate,
} from "@/lib/notification-helpers";
import { useApiQuery } from "@/hooks/useApiQuery";

export const Route = createLazyFileRoute('/student_/notifications')({
  component: StudentNotificationsPage,
});

function StudentNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailNotif, setDetailNotif] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: notificationsData, isLoading: loading } = useApiQuery<{ items: any[]; totalPages: number }>({
    queryKey: ['student-notifications', filter, search, page],
    path: `/student/dashboard/notifications?${new URLSearchParams({ ...(filter !== "all" ? { filter } : {}), ...(search ? { search } : {}), page: String(page), limit: "20" }).toString()}`,
    refetchInterval: 30_000,
  });

  const { data: summary } = useApiQuery<{ total: number; unread: number; read: number; today: number }>({
    queryKey: ['student-notifications-summary'],
    path: '/student/dashboard/notifications/summary',
    refetchInterval: 30_000,
  });

  const items = notificationsData?.items || [];
  const totalPages = notificationsData?.totalPages || 1;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['student-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['student-notifications-summary'] });
  };

  useSocket({
    onNotification: () => {
      invalidateAll();
    },
  });

  const markRead = async (id: string) => {
    await api(`/student/dashboard/notifications/${id}/read`, { method: "PATCH" });
    invalidateAll();
    if (detailNotif?.id === id) setDetailNotif((prev: any) => ({ ...prev, isRead: true }));
  };

  const markAllRead = async () => {
    await api("/student/dashboard/notifications/read-all", { method: "PATCH" });
    invalidateAll();
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    setDeletingId(id);
    try {
      await api(`/student/dashboard/notifications/${id}`, { method: "DELETE" });
      invalidateAll();
      if (detailNotif?.id === id) setDetailNotif(null);
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api("/student/dashboard/notifications/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
        headers: { "Content-Type": "application/json" },
      });
      setSelectedIds(new Set());
      invalidateAll();
      toast.success(`${selectedIds.size} notifications deleted`);
    } catch {
      toast.error("Failed to delete notifications");
    }
  };

  const clearRead = async () => {
    try {
      const res = await api<any>("/student/dashboard/notifications", { method: "DELETE" });
      const deleted = res?.deleted || 0;
      invalidateAll();
      toast.success(`${deleted} read notifications cleared`);
    } catch {
      toast.error("Failed to clear read notifications");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayedItems = items.filter((n) => matchesTypeFilter(n.channel, typeFilter));

  const summaryCards = [
    { label: "Total", value: summary.total, color: "text-foreground", bg: "bg-card/80" },
    { label: "Unread", value: summary.unread, color: "text-nejah-electric", bg: "bg-nejah-electric/8" },
    { label: "Read", value: summary.read, color: "text-muted-foreground", bg: "bg-muted/50" },
    { label: "Today", value: summary.today, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
  ];

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.notifications} unreadNotifications={summary.unread}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">
              Student Portal
            </p>
            <h1 className="text-4xl font-extrabold text-foreground font-serif flex items-center gap-3">
              <Bell className="h-8 w-8 text-nejah-electric" />
              Notifications
              {summary.unread > 0 && (
                <Badge className="bg-red-500 text-white border-none text-xs font-bold px-3 py-1">
                  {summary.unread} new
                </Badge>
              )}
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                "rounded-2xl p-4 border border-border/50 dark:border-nejah-border-blue/30 text-center transition-all hover:shadow-sm",
                card.bg,
              )}
            >
              <p className={cn("text-2xl font-extrabold", card.color)}>{card.value}</p>
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider mt-1">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="glass-panel p-4 mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick filters */}
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setFilter(f); setPage(1); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                  filter === f
                    ? "bg-nejah-electric text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-primary/10",
                )}
              >
                {f === "all" ? "All" : f === "unread" ? "Unread" : "Read"}
              </button>
            ))}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={markAllRead}
              disabled={summary.unread === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 text-red-500 hover:text-red-600"
              onClick={clearRead}
              disabled={summary.read === 0}
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear Read
            </Button>
          </div>

          {/* Search + Type chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 h-9 text-sm rounded-xl"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {TYPE_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => { setTypeFilter(chip.value); setPage(1); }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                    typeFilter === chip.value
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground border border-transparent",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs h-8"
                onClick={deleteSelected}
              >
                <Trash className="h-3.5 w-3.5 mr-1" /> Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Notification List */}
        {displayedItems.length === 0 ? (
          <div className="rounded-3xl p-16 text-center border border-border/50 dark:border-nejah-border-blue/30 bg-muted/30">
            <Bell className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-semibold text-lg">No notifications</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search || typeFilter
                ? "Try adjusting your search or filters"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedItems.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.channel] || Bell;
              const iconColor = NOTIFICATION_COLORS[n.channel] || "text-muted-foreground";
              const bgColor = NOTIFICATION_BG_COLORS[n.channel] || "";
              const action = NOTIFICATION_ACTIONS[n.channel];
              const isDeleting = deletingId === n.id;

              return (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-2xl p-4 border transition-all cursor-pointer",
                    n.isRead
                      ? "border-border/40 dark:border-nejah-border-blue/20 bg-transparent"
                      : "border-primary/20 dark:border-primary/30 bg-primary/[0.02]",
                  )}
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    setDetailNotif(n);
                  }}
                >
                  {/* Select checkbox (desktop) */}
                  <div
                    className="hidden sm:flex items-center pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(n.id)}
                      onChange={() => toggleSelect(n.id)}
                      className="h-4 w-4 rounded border-border accent-nejah-electric cursor-pointer"
                    />
                  </div>

                  {/* Icon */}
                  <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", bgColor)}>
                    <Icon className={cn("h-5 w-5", iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-nejah-electric shrink-0" />
                          )}
                          <h3 className={cn(
                            "text-sm truncate",
                            n.isRead ? "text-muted-foreground font-medium" : "text-foreground font-bold",
                          )}>
                            {n.title}
                          </h3>
                        </div>
                        <p className={cn(
                          "text-xs mt-0.5 line-clamp-2",
                          n.isRead ? "text-muted-foreground/70" : "text-muted-foreground",
                        )}>
                          {n.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    </div>
                  </div>

                  {/* Delete button — visible on hover desktop, always on mobile */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    disabled={isDeleting}
                    className="sm:absolute sm:top-3 sm:right-3 p-1.5 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs font-medium text-muted-foreground px-3">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}

        {/* ─── Slide-over Detail Drawer ─── */}
        {detailNotif && (
          <>
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 lg:bg-transparent"
              onClick={() => setDetailNotif(null)}
            />
            <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-nejah-surface z-50 shadow-2xl border-l border-border/50 dark:border-nejah-border-blue/30 overflow-y-auto animate-in slide-in-from-right">
              <div className="sticky top-0 bg-white dark:bg-nejah-surface border-b border-border/50 dark:border-nejah-border-blue/30 z-10 flex items-center justify-between px-6 py-4">
                <h2 className="font-extrabold text-foreground text-lg">Notification Details</h2>
                <button
                  type="button"
                  onClick={() => setDetailNotif(null)}
                  className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Icon + badge */}
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center",
                    NOTIFICATION_BG_COLORS[detailNotif.channel] || "bg-muted",
                  )}>
                    {(() => {
                      const Icon = NOTIFICATION_ICONS[detailNotif.channel] || Bell;
                      return <Icon className={cn("h-7 w-7", NOTIFICATION_COLORS[detailNotif.channel] || "text-muted-foreground")} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-lg">{detailNotif.title}</h3>
                      {!detailNotif.isRead && (
                        <Badge className="bg-nejah-electric text-white border-none text-[10px] font-bold">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {detailNotif.channel.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold">{formatFullDate(detailNotif.createdAt)}</p>
                  {detailNotif.readAt && (
                    <p className="text-xs mt-1">Read {formatRelativeTime(detailNotif.readAt)}</p>
                  )}
                </div>

                {/* Content */}
                <div className="rounded-2xl bg-muted/50 dark:bg-nejah-surface/80 p-5 border border-border/40 dark:border-nejah-border-blue/20">
                  <p className="text-sm text-foreground leading-relaxed">{detailNotif.content}</p>
                </div>

                {/* Action button */}
                {detailNotif.actionUrl ? (
                  <Button
                    className="w-full rounded-xl bg-nejah-electric hover:bg-nejah-electric/90 text-white font-bold"
                    onClick={() => {
                      navigate({ to: detailNotif.actionUrl } as any);
                      setDetailNotif(null);
                    }}
                  >
                    {NOTIFICATION_ACTIONS[detailNotif.channel]?.label || "View Details"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  NOTIFICATION_ACTIONS[detailNotif.channel] && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-semibold"
                      onClick={() => {
                        navigate({ to: NOTIFICATION_ACTIONS[detailNotif.channel].defaultPath } as any);
                        setDetailNotif(null);
                      }}
                    >
                      {NOTIFICATION_ACTIONS[detailNotif.channel].label}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )
                )}

                {/* Data info */}
                {detailNotif.dataJson && (
                  <div className="rounded-2xl bg-muted/30 p-4 border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Additional Info
                    </p>
                    <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(detailNotif.dataJson, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {!detailNotif.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl text-xs"
                      onClick={() => markRead(detailNotif.id)}
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                    onClick={() => {
                      deleteNotification(detailNotif.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </StudentPortalLayout>
  );
}
