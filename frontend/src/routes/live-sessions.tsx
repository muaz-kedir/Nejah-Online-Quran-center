import { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, BentoStatCard, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Search,
  Clock,
  Calendar,
  Users,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Play,
  AlertTriangle,
  FileText,
  BarChart3,
  Timer,
  Activity,
  Percent,
  MoreHorizontal,
  ListFilter,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';

export const Route = createFileRoute('/live-sessions')({
  component: LiveSessionsPage,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager', 'teacher']),
});

function LiveSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('scheduledStart');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const userRole = useRef('');

  useEffect(() => {
    userRole.current = localStorage.getItem('userRole') || '';
    fetchAll();
    const interval = setInterval(() => fetchLiveOnly(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [page, sortField, sortDir]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchLiveOnly(), fetchKPIs(), fetchSessions()]);
    setLoading(false);
  };

  const fetchLiveOnly = async () => {
    try {
      const [live, today] = await Promise.all([
        api<any[]>('/live-sessions/live').catch(() => []),
        api<any[]>('/live-sessions/today').catch(() => []),
      ]);
      setLiveSessions(Array.isArray(live) ? live : []);
      setTodaySessions(Array.isArray(today) ? today : []);
    } catch {}
  };

  const fetchKPIs = async () => {
    try {
      const [analyticsData, statsData] = await Promise.all([
        api<any>('/zoom-analytics/dashboard').catch(() => null),
        api<any>('/live-sessions/stats').catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setStats(statsData);
    } catch {}
  };

  const fetchSessions = async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sortBy: sortField, sortOrder: sortDir });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await api<any>(`/live-sessions?${params}`);
      setSessions(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch {
      setSessions([]);
    } finally {
      setTableLoading(false);
    }
  };

  const filteredSessions = useMemo(() => {
    if (!search) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.teacher?.fullName?.toLowerCase().includes(q) ||
        s.student?.fullName?.toLowerCase().includes(q) ||
        s.schedule?.className?.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  const handleStartSession = async (id: string) => {
    setStartingId(id);
    try {
      const res = await api<any>(`/live-sessions/${id}/start`, { method: 'POST' });
      toast.success('Session started!');
      if (res?.zoomStartUrl || res?.startUrl) {
        window.open(res.zoomStartUrl || res.startUrl, '_blank');
      }
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start session');
    } finally {
      setStartingId(null);
    }
  };

  const handleEndSession = async (id: string) => {
    setCompletingId(id);
    try {
      await api(`/live-sessions/${id}/end`, { method: 'POST' });
      toast.success('Session completed');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session');
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancelSession = async (id: string) => {
    setCancelling(true);
    try {
      await api(`/live-sessions/${id}/cancel`, { method: 'POST' });
      toast.success('Session cancelled');
      setCancelDialog(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel session');
    } finally {
      setCancelling(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'ASC' ? 'DESC' : 'ASC'));
    else { setSortField(field); setSortDir('DESC'); }
    setPage(1);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'LIVE': return 'bg-red-500 text-white border-none animate-pulse';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none';
      case 'CANCELLED': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none';
      case 'NO_SHOW': return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-none';
      case 'EXPIRED': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none';
    }
  };

  const kpiCards = [
    {
      label: 'Active Sessions',
      value: stats?.live ?? analytics?.activeSessions ?? liveSessions.length,
      icon: <Activity className="h-5 w-5" />,
      highlight: (stats?.live ?? 0) > 0,
      sub: (stats?.live ?? 0) > 0 ? 'Live now' : 'No active sessions',
    },
    {
      label: 'Sessions Today',
      value: todaySessions.length,
      icon: <Calendar className="h-5 w-5" />,
      sub: `${todaySessions.filter((s: any) => s.status === 'COMPLETED').length} completed`,
    },
    {
      label: 'Attendance Rate',
      value: analytics?.attendanceRate != null ? `${Math.round(analytics.attendanceRate)}%` : '—',
      icon: <Percent className="h-5 w-5" />,
      progress: analytics?.attendanceRate ?? 0,
    },
    {
      label: 'Avg Duration',
      value: analytics?.averageSessionDuration ? `${analytics.averageSessionDuration} min` : '—',
      icon: <Timer className="h-5 w-5" />,
      sub: 'Per completed session',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? analytics?.completedSessions ?? 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      sub: `${stats?.total ?? 0} total sessions`,
    },
  ];

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest hover:text-nejah-electric transition-colors"
    >
      {children}
      <ArrowUpDown className={cn('h-3 w-3', sortField === field && 'text-nejah-electric')} />
    </button>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Session Center"
          title="Live Sessions"
          description="Monitor and manage all live sessions across the platform."
          actions={
            <Button onClick={fetchAll} variant="outline" className="gap-2 rounded-xl h-11" disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {kpiCards.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <BentoStatCard
                  label={kpi.label}
                  value={kpi.value}
                  sub={kpi.sub}
                  icon={kpi.icon}
                  highlight={kpi.highlight}
                  progress={kpi.progress}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <AnimatePresence>
          {liveSessions.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <h2 className="text-lg font-bold">Live Now ({liveSessions.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {liveSessions.map((s: any) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="relative overflow-hidden border-2 border-red-100 dark:border-red-950/30 rounded-[2rem] shadow-lg bg-card dark:bg-nejah-surface">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-red-500 text-white border-none text-[10px] font-black tracking-wider">
                            <span className="relative flex h-2 w-2 mr-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            LIVE
                          </Badge>
                          <span className="text-[10px] font-bold text-nejah-slate-blue tabular-nums flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {s.actualStart ? new Date(s.actualStart).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-nejah-sapphire dark:text-white mb-1">
                          {s.schedule?.className || 'Quran Class'}
                        </h3>
                        <p className="text-xs text-nejah-slate-blue mb-3">{s.teacher?.fullName}</p>
                        <div className="grid grid-cols-2 gap-3 bg-background/50 dark:bg-nejah-midnight/30 rounded-2xl p-4 mb-4">
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-wider">Present</p>
                            <p className="text-lg font-bold text-green-600">
                              {s.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-wider">Duration</p>
                            <p className="text-lg font-bold tabular-nums">
                              {s.actualStart
                                ? `${Math.floor((Date.now() - new Date(s.actualStart).getTime()) / 60000)}m`
                                : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(s.meetingLink || s.zoomJoinUrl) && (
                            <Button
                              onClick={() => window.open(s.meetingLink || s.zoomJoinUrl, '_blank')}
                              className="flex-1 bg-nejah-sapphire hover:bg-nejah-azure text-white rounded-xl h-10 text-xs font-bold gap-1"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Join Meeting
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold">All Sessions</h2>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none lg:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teacher, student, class..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background/50 border-none rounded-xl text-xs w-full"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {['all', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap',
                      statusFilter === s
                        ? 'bg-nejah-sapphire text-white'
                        : 'bg-background/50 text-nejah-slate-blue hover:bg-muted',
                    )}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <GlassPanel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border dark:border-white/5">
                    <th className="py-4 px-6"><SortHeader field="schedule.className">Class</SortHeader></th>
                    <th className="py-4 px-4"><SortHeader field="teacher.fullName">Teacher</SortHeader></th>
                    <th className="py-4 px-4"><SortHeader field="scheduledStart">Scheduled</SortHeader></th>
                    <th className="py-4 px-4"><SortHeader field="actualStart">Actual</SortHeader></th>
                    <th className="py-4 px-4"><SortHeader field="durationMinutes">Duration</SortHeader></th>
                    <th className="py-4 px-4"><SortHeader field="status">Status</SortHeader></th>
                    <th className="py-4 px-4">Attendance</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-nejah-border-blue">
                  {tableLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="p-6"><Skeleton className="h-8 w-full rounded-xl" /></td>
                      </tr>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="py-16 text-center">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Video className="h-8 w-8 text-nejah-slate-blue" />
                          </div>
                          <p className="text-sm font-bold text-nejah-slate-blue">No sessions found</p>
                          <p className="text-xs text-nejah-slate-blue mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s: any) => (
                      <tr
                        key={s.id}
                        className="hover:bg-background/50 dark:hover:bg-nejah-surface/20 transition-all"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-sm text-nejah-sapphire dark:text-foreground">
                            {s.schedule?.className || 'Quran Class'}
                          </p>
                          <p className="text-[10px] text-muted-foreground dark:text-nejah-slate-blue font-bold uppercase mt-0.5">
                            {s.student?.fullName || (s.studentId ? `Student #${s.studentId.slice(0, 8)}` : 'Group Session')}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-nejah-sapphire dark:text-nejah-electric">
                              {s.teacher?.fullName?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs font-semibold text-nejah-slate-blue">{s.teacher?.fullName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs font-bold tabular-nums">{new Date(s.scheduledStart).toLocaleDateString()}</p>
                          <p className="text-[10px] text-nejah-slate-blue tabular-nums">
                            {new Date(s.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-xs tabular-nums">
                          {s.actualStart
                            ? new Date(s.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-4 px-4 text-xs tabular-nums font-medium">
                          {s.durationMinutes ? `${s.durationMinutes}m` : '—'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full', statusColor(s.status))}>
                            {s.status === 'COMPLETED' ? 'Completed' : s.status === 'CANCELLED' ? 'Cancelled' : s.status === 'LIVE' ? 'Live' : s.status === 'NO_SHOW' ? 'No Show' : s.status === 'EXPIRED' ? 'Expired' : 'Scheduled'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-green-600 font-bold">
                              {s.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0}
                            </span>
                            <span className="text-nejah-slate-blue">/</span>
                            <span className="text-nejah-slate-blue">{s.attendances?.length || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                              {(s.meetingLink || s.zoomJoinUrl) && (
                                <DropdownMenuItem onClick={() => window.open(s.meetingLink || s.zoomJoinUrl, '_blank')}>
                                  <ExternalLink className="h-4 w-4 mr-2" /> Join Session
                                </DropdownMenuItem>
                              )}
                              {s.status === 'SCHEDULED' && (
                                <DropdownMenuItem
                                  disabled={startingId === s.id}
                                  onClick={(e) => { e.stopPropagation(); handleStartSession(s.id); }}
                                >
                                  {startingId === s.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                                  Start Session
                                </DropdownMenuItem>
                              )}
                              {s.status === 'LIVE' && (
                                <DropdownMenuItem
                                  disabled={completingId === s.id}
                                  onClick={(e) => { e.stopPropagation(); handleEndSession(s.id); }}
                                >
                                  {completingId === s.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                  End Session
                                </DropdownMenuItem>
                              )}
                              {s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && s.status !== 'NO_SHOW' && s.status !== 'EXPIRED' && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={(e) => { e.stopPropagation(); setCancelDialog(s.id); }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Cancel Session
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border dark:border-white/5">
                <p className="text-xs text-nejah-slate-blue">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </GlassPanel>
        </section>
      </div>

      <Dialog open={!!cancelDialog} onOpenChange={(o) => !o && setCancelDialog(null)}>
        <DialogContent className="sm:max-w-[400px] dark:bg-nejah-surface dark:border-white/5 rounded-[2rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Session
            </DialogTitle>
            <DialogDescription className="text-xs text-nejah-slate-blue">
              This will cancel the session, end the meeting, and notify the student. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelDialog(null)} className="flex-1 rounded-xl">
              Keep Session
            </Button>
            <Button
              onClick={() => cancelDialog && handleCancelSession(cancelDialog)}
              disabled={cancelling}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2"
            >
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
