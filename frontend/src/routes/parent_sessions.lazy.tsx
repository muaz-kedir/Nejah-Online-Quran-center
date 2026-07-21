/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useMemo } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { ParentPortalLayout } from '@/components/parents/ParentPortalLayout';
import { LanguageProvider } from '@/context/LanguageContext';
import { PageHeader, GlassPanel, BentoStatCard } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
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
  Activity,
  Percent,
  GraduationCap,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { useApiQuery } from "@/hooks/useApiQuery";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute('/parent_sessions')({
  component: ParentSessionsRoute,
});

function ParentSessionsRoute() {
  return (
    <LanguageProvider>
      <ParentSessionsPage />
    </LanguageProvider>
  );
}

function ParentSessionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<string>('all');

  const { data: sessionsData, isLoading: loading } = useApiQuery<any>({
    queryKey: ["parent-sessions"],
    path: `/parent/sessions`,
    refetchInterval: 30_000,
  });

  const sessions = sessionsData?.data || [];

  const { data: unreadData } = useApiQuery<any>({
    queryKey: ["parent-notifications-unread-count"],
    path: `/notifications/unread-count`,
    refetchInterval: 30_000,
  });

  const unreadCount = unreadData?.count ?? 0;

  const fetchSessions = () => {
    queryClient.invalidateQueries({ queryKey: ["parent-sessions"] });
  };

  const children = useMemo(() => {
    const map = new Map();
    sessions.forEach((s: any) => {
      if (s.student?.id) map.set(s.student.id, s.student);
    });
    return Array.from(map.values());
  }, [sessions]);

  const filteredSessions = useMemo(
    () => selectedChild === 'all' ? sessions : sessions.filter((s: any) => s.student?.id === selectedChild),
    [sessions, selectedChild],
  );

  const upcomingSessions = useMemo(
    () => filteredSessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE'),
    [filteredSessions],
  );
  const completedSessions = useMemo(
    () => filteredSessions.filter((s) => s.status === 'COMPLETED'),
    [filteredSessions],
  );

  const presentCount = useMemo(
    () => filteredSessions.reduce((acc, s) => acc + (s.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0), 0),
    [filteredSessions],
  );
  const totalAttendance = useMemo(
    () => filteredSessions.reduce((acc, s) => acc + (s.attendances?.length || 0), 0),
    [filteredSessions],
  );

  const activeSessions = useMemo(() => sessions.filter((s) => s.status === 'LIVE').length, [sessions]);

  const kpiCards = [
    { label: 'Total Sessions', value: filteredSessions.length, icon: <Video className="h-5 w-5" />, sub: `${upcomingSessions.length} upcoming` },
    { label: 'Upcoming Classes', value: upcomingSessions.length, icon: <Calendar className="h-5 w-5" />, highlight: upcomingSessions.length > 0 },
    { label: 'Attendance Rate', value: totalAttendance > 0 ? `${Math.round((presentCount / totalAttendance) * 100)}%` : '—', icon: <Percent className="h-5 w-5" />, progress: totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0 },
    { label: 'Completed', value: completedSessions.length, icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

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

  const SessionRow = ({ session }: { session: any }) => {
    const studentPresent = session.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0;
    const studentTotal = session.attendances?.length || 0;

    return (
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="hover:bg-background/50 dark:hover:bg-nejah-surface/20 transition-all border-b border-border dark:border-nejah-border-blue/20 last:border-0"
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
            {(session.meetingLink || session.zoomJoinUrl) && session.status === 'LIVE' && (
              <Button onClick={(e) => { e.stopPropagation(); window.open(session.meetingLink || session.zoomJoinUrl, '_blank'); }} size="sm" className="rounded-lg h-8 w-8 p-0" variant="outline" title="Join Session">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </td>
      </motion.tr>
    );
  };

  return (
    <ParentPortalLayout activePath="/parent_sessions" unreadNotifications={unreadCount}>
      <div className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12">
        <PageHeader
          eyebrow="Parent Portal"
          title={`My Children's Sessions${activeSessions > 0 ? ' 🔴' : ''}`}
          description={`View all sessions, attendance records, and class details for your children${activeSessions > 0 ? `. ${activeSessions} session${activeSessions > 1 ? 's are' : ' is'} live now!` : '.'}`}
          actions={
            <div className="flex items-center gap-3">
              {children.length > 1 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="h-11 pl-9 pr-4 rounded-xl bg-background border border-border dark:border-white/5 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-nejah-electric/30"
                  >
                    <option value="all">All Children ({sessions.length} sessions)</option>
                    {children.map((child: any) => {
                      const count = sessions.filter((s: any) => s.student?.id === child.id).length;
                      return (
                        <option key={child.id} value={child.id}>
                          {child.fullName} ({count} sessions)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              <Button onClick={fetchSessions} variant="outline" className="gap-2 rounded-xl h-11" disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
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
              <Video className="h-4 w-4" /> All Sessions ({filteredSessions.length})
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
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="h-8 w-8 text-nejah-slate-blue" />
                  </div>
                  <p className="text-sm font-bold text-nejah-slate-blue">No sessions found</p>
                   <p className="text-xs text-nejah-slate-blue mt-1">Your children's sessions will appear here</p>
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
                        {(tab === 'all' ? filteredSessions : tab === 'upcoming' ? upcomingSessions : completedSessions).map((session: any) => (
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

        {!loading && filteredSessions.length > 0 && (
          <Card className="rounded-[2rem] border-border dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-nejah-electric" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {children.length > 1 && selectedChild === 'all' && (
                <div className="border-t border-border dark:border-white/5 pt-6">
                  <h4 className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider mb-4">Per-Child Breakdown</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map((child: any) => {
                      const childSessions = sessions.filter((s: any) => s.student?.id === child.id);
                      const childPresent = childSessions.reduce(
                        (acc, s) => acc + (s.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length || 0), 0
                      );
                      const childTotal = childSessions.reduce((acc, s) => acc + (s.attendances?.length || 0), 0);
                      const rate = childTotal > 0 ? Math.round((childPresent / childTotal) * 100) : 0;
                      return (
                        <div key={child.id} className="p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-nejah-sapphire/10 flex items-center justify-center text-[10px] font-bold text-nejah-sapphire dark:text-nejah-electric">
                              {child.fullName?.charAt(0) || '?'}
                            </div>
                            <p className="text-xs font-bold">{child.fullName}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div>
                              <p className="font-bold text-green-600">{childPresent}</p>
                              <p className="text-nejah-slate-blue uppercase tracking-wider">Present</p>
                            </div>
                            <div>
                              <p className="font-bold text-red-600">{childTotal - childPresent}</p>
                              <p className="text-nejah-slate-blue uppercase tracking-wider">Absent</p>
                            </div>
                            <div>
                              <p className="font-bold text-nejah-electric">{rate}%</p>
                              <p className="text-nejah-slate-blue uppercase tracking-wider">Rate</p>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-nejah-electric rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ParentPortalLayout>
  );
}
