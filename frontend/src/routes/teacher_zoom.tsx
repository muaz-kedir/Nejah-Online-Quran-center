import { useState, useEffect, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Video,
  Clock,
  Calendar,
  Users,
  ExternalLink,
  Play,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquareText,
  ClipboardList,
  Loader2,
  Plus,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export const Route = createFileRoute('/teacher_zoom')({
  component: TeacherZoomPage,
  beforeLoad: () => requireAuth(['teacher']),
});

function TeacherZoomPage() {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [teacherSessions, setTeacherSessions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [upcomingData, sessionsData, analyticsData] = await Promise.all([
        api<any[]>('/live-sessions/upcoming').catch(() => []),
        api<any>('/live-sessions/teacher?limit=50').catch(() => ({ data: [] })),
        api<any>('/zoom-analytics/teacher').catch(() => null),
      ]);
      setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
      setTeacherSessions(Array.isArray(sessionsData?.data) ? sessionsData.data : []);
      setAnalytics(analyticsData);
    } catch { toast.error('Failed to load workspace data'); }
    finally { setLoading(false); }
  };

  const handleStartSession = async (sessionId: string) => {
    setStartingId(sessionId);
    try {
      await api(`/live-sessions/${sessionId}/start`, { method: 'POST' });
      toast.success('Session started! Opening Zoom...');
      const session = upcoming.find((s: any) => s.id === sessionId) || teacherSessions.find((s: any) => s.id === sessionId);
      if (session?.zoomJoinUrl) window.open(session.zoomJoinUrl, '_blank');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start session');
    } finally { setStartingId(null); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'LIVE': return <Badge className="bg-red-500 text-white border-none text-[9px] font-black uppercase tracking-widest animate-pulse">LIVE</Badge>;
      case 'COMPLETED': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none text-[9px] font-black uppercase tracking-widest">Completed</Badge>;
      case 'CANCELLED': return <Badge className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none text-[9px] font-black uppercase tracking-widest">Cancelled</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none text-[9px] font-black uppercase tracking-widest">Scheduled</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 pb-12">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const SessionCard = ({ session, isUpcoming }: { session: any; isUpcoming?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-background/50 border border-border dark:border-white/5 hover:bg-muted/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            session.status === 'LIVE' ? 'bg-red-100 dark:bg-red-900/30' :
            session.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30' :
            'bg-amber-100 dark:bg-amber-900/30',
          )}>
            {session.status === 'LIVE' ? <Video className="h-5 w-5 text-red-500" /> :
             session.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
             <Clock className="h-5 w-5 text-amber-500" />}
          </div>
          <div>
            <p className="text-sm font-bold">{session.schedule?.className || 'Quran Class'}</p>
            <p className="text-[10px] text-nejah-slate-blue font-medium">{session.student?.fullName || 'Group Session'}</p>
          </div>
        </div>
        {statusBadge(session.status)}
      </div>

      <div className="flex items-center gap-4 text-[10px] text-nejah-slate-blue font-bold mb-4">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(session.scheduledStart).toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {session.durationMinutes && <span>{session.durationMinutes} min</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {session.status === 'SCHEDULED' && (
          <Button onClick={() => handleStartSession(session.id)} disabled={startingId === session.id} className="bg-nejah-sapphire hover:bg-nejah-azure text-white rounded-xl h-9 text-xs font-bold gap-1.5">
            {startingId === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Start Session
          </Button>
        )}
        {session.status === 'LIVE' && session.zoomJoinUrl && (
          <Button onClick={() => window.open(session.zoomJoinUrl, '_blank')} className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-9 text-xs font-bold gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Join Zoom
          </Button>
        )}
        <Button onClick={() => navigate({ to: '/live-sessions/$id', params: { id: session.id } })} variant="outline" className="rounded-xl h-9 text-xs font-bold gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" /> Details
        </Button>
      </div>
    </motion.div>
  );

  const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
    <div className="p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-nejah-electric">{icon}</div>
      </div>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Teacher Workspace"
          title="My Zoom Sessions"
          description="Manage your live Zoom sessions, start classes, and review attendance."
        />

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Upcoming" value={upcoming.length} icon={<Clock className="h-4 w-4" />} />
          <StatCard label="Total Sessions" value={analytics?.totalSessions ?? teacherSessions.length} icon={<Video className="h-4 w-4" />} />
          <StatCard label="Attendance Rate" value={analytics?.attendanceRate != null ? `${Math.round(analytics.attendanceRate)}%` : '—'} icon={<Users className="h-4 w-4" />} />
          <StatCard label="Avg Duration" value={analytics?.averageDuration ? `${analytics.averageDuration} min` : '—'} icon={<Clock className="h-4 w-4" />} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-2xl bg-background/50 p-1 border border-border dark:border-white/5">
            <TabsTrigger value="upcoming" className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2">
              <Clock className="h-4 w-4" /> Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2">
              <ClipboardList className="h-4 w-4" /> History ({teacherSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcoming.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-nejah-slate-blue" />
                </div>
                <p className="text-sm font-bold text-nejah-slate-blue">No upcoming sessions</p>
                <p className="text-xs text-nejah-slate-blue mt-1">Your scheduled sessions will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcoming.map((s: any) => <SessionCard key={s.id} session={s} isUpcoming />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {teacherSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-nejah-slate-blue" />
                </div>
                <p className="text-sm font-bold text-nejah-slate-blue">No session history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherSessions.map((s: any) => <SessionCard key={s.id} session={s} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
