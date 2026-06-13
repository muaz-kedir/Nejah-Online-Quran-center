import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel, BentoStatCard } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Video,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Activity,
  Percent,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';

export const Route = createFileRoute('/parent_sessions')({
  component: ParentSessionsPage,
  beforeLoad: () => requireAuth(['parent']),
});

function ParentSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await api<any>('/parent/sessions');
      setSessions(data?.data || []);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const upcomingSessions = useMemo(
    () => sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE'),
    [sessions],
  );
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'COMPLETED'),
    [sessions],
  );

  const presentCount = useMemo(
    () => sessions.reduce((acc, s) => acc + (s.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0), 0),
    [sessions],
  );
  const totalAttendance = useMemo(
    () => sessions.reduce((acc, s) => acc + (s.attendances?.length || 0), 0),
    [sessions],
  );

  const kpiCards = [
    { label: 'Total Sessions', value: sessions.length, icon: <Video className="h-5 w-5" />, sub: `${upcomingSessions.length} upcoming` },
    { label: 'Upcoming Classes', value: upcomingSessions.length, icon: <Calendar className="h-5 w-5" />, highlight: upcomingSessions.length > 0 },
    { label: 'Attendance Rate', value: totalAttendance > 0 ? `${Math.round((presentCount / totalAttendance) * 100)}%` : '—', icon: <Percent className="h-5 w-5" />, progress: totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0 },
    { label: 'Completed', value: completedSessions.length, icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  const statusColor = (s: string) => {
    switch (s) {
      case 'LIVE': return 'bg-red-500 text-white border-none animate-pulse';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none';
      case 'CANCELLED': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none';
    }
  };

  const SessionRow = ({ session }: { session: any }) => {
    const studentPresent = session.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0;
    const studentTotal = session.attendances?.length || 0;

    return (
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="hover:bg-background/50 dark:hover:bg-nejah-surface/20 transition-all cursor-pointer border-b border-border dark:border-nejah-border-blue/20 last:border-0"
        onClick={() => session.id && navigate({ to: '/live-sessions/$id', params: { id: session.id } })}
      >
        <td className="py-4 px-6">
          <p className="text-sm font-bold">{session.schedule?.className || 'Quran Class'}</p>
          <p className="text-[10px] text-nejah-slate-blue font-medium mt-0.5">{session.teacher?.fullName || 'Teacher'}</p>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-nejah-sapphire/10 flex items-center justify-center text-xs font-bold text-nejah-sapphire dark:text-nejah-electric">
              {session.student?.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-xs font-bold">{session.student?.fullName || 'Student'}</p>
              <p className="text-[9px] text-nejah-slate-blue">{session.student?.studentCode || ''}</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-xs tabular-nums font-medium">
          {new Date(session.scheduledStart).toLocaleDateString()}
        </td>
        <td className="py-4 px-4 text-xs tabular-nums">
          {new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="py-4 px-4 text-xs tabular-nums font-medium">
          {session.durationMinutes ? `${session.durationMinutes}m` : '—'}
        </td>
        <td className="py-4 px-4">
          <Badge className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full', statusColor(session.status))}>
            {session.status}
          </Badge>
        </td>
        <td className="py-4 px-4">
          <span className="text-xs font-bold">{studentPresent}/{studentTotal}</span>
        </td>
        <td className="py-4 px-6 text-right">
          <div className="flex gap-1 justify-end">
            {session.zoomJoinUrl && session.status === 'LIVE' && (
              <Button onClick={(e) => { e.stopPropagation(); window.open(session.zoomJoinUrl, '_blank'); }} size="sm" className="rounded-lg h-8 w-8 p-0" variant="outline" title="Join Session">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button onClick={(e) => { e.stopPropagation(); navigate({ to: '/live-sessions/$id', params: { id: session.id } }); }} size="sm" className="rounded-lg h-8 w-8 p-0" variant="outline" title="View Details">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Parent Portal"
          title="My Children's Sessions"
          description="View all Zoom sessions, attendance records, and class details for your children."
          actions={
            <Button onClick={fetchSessions} variant="outline" className="gap-2 rounded-xl h-11" disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          }
        />

        {loading ? (
          <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {kpiCards.map((kpi) => (
              <motion.div key={kpi.label} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <BentoStatCard label={kpi.label} value={kpi.value} icon={kpi.icon} sub={kpi.sub} highlight={kpi.highlight} progress={kpi.progress} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <Tabs defaultValue="all">
          <TabsList className="rounded-2xl bg-background/50 p-1 border border-border dark:border-white/5">
            <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2">
              <Video className="h-4 w-4" /> All Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2">
              <Calendar className="h-4 w-4" /> Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2">
              <CheckCircle2 className="h-4 w-4" /> Completed ({completedSessions.length})
            </TabsTrigger>
          </TabsList>

          {(['all', 'upcoming', 'completed'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8 text-nejah-slate-blue" />
                  </div>
                  <p className="text-sm font-bold text-nejah-slate-blue">No sessions found</p>
                  <p className="text-xs text-nejah-slate-blue mt-1">Your children's Zoom sessions will appear here</p>
                </div>
              ) : (
                <GlassPanel className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background/50 border-b border-border dark:border-white/5">
                          <th className="py-4 px-6 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Class</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Child</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Date</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Time</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Duration</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Status</th>
                          <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Attendance</th>
                          <th className="py-4 px-6" />
                        </tr>
                      </thead>
                      <tbody>
                        {(tab === 'all' ? sessions : tab === 'upcoming' ? upcomingSessions : completedSessions).map((session: any) => (
                          <SessionRow key={session.id} session={session} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassPanel>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {!loading && sessions.length > 0 && (
          <Card className="rounded-[2rem] border-border dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-nejah-electric" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-2xl bg-green-50 dark:bg-green-950/20">
                  <p className="text-3xl font-bold font-mono text-green-600">{presentCount}</p>
                  <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mt-1">Present</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-red-50 dark:bg-red-950/20">
                  <p className="text-3xl font-bold font-mono text-red-600">{totalAttendance - presentCount}</p>
                  <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mt-1">Absent</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-primary/5">
                  <p className="text-3xl font-bold font-mono text-nejah-electric">{totalAttendance > 0 ? `${Math.round((presentCount / totalAttendance) * 100)}%` : '—'}</p>
                  <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-wider mt-1">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
