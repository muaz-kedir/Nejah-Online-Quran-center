import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Video,
  Clock,
  Calendar,
  Users,
  User,
  BookOpen,
  Target,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Timer,
  Activity,
  Loader2,
  ClipboardList,
  Eye,
  MessageSquareText,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Route = createFileRoute('/live-sessions_/$id')({
  component: LiveSessionDetailsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager', 'teacher']),
});

function LiveSessionDetailsPage() {
  return (
    <DashboardLayout>
      <SessionDetails />
    </DashboardLayout>
  );
}

function SessionDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sessionData, attendanceData, notesData] = await Promise.all([
        api<any>(`/live-sessions/${id}`),
        api<any[]>(`/session-attendance/session/${id}`).catch(() => []),
        api<any[]>(`/session-notes/session/${id}`).catch(() => []),
      ]);
      setSession(sessionData);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : attendanceData?.data || []);
      setNotes(Array.isArray(notesData) ? notesData : notesData?.data || []);
    } catch {
      toast.error('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    LIVE: { label: 'Live', color: 'bg-red-500 text-white border-none animate-pulse', icon: Activity },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-none', icon: XCircle },
    SCHEDULED: { label: 'Scheduled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none', icon: Clock },
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-[2rem]" />
            <Skeleton className="h-96 rounded-[2rem]" />
          </div>
          <Skeleton className="h-96 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Session Not Found</h2>
          <p className="text-sm text-nejah-slate-blue">The requested session does not exist or has been deleted.</p>
          <Button onClick={() => navigate({ to: '/live-sessions' })} className="rounded-xl">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[session.status]?.icon || Clock;
  const presentCount = attendance.filter((a: any) => a.attendanceStatus === 'PRESENT' || a.attendanceStatus === 'LATE').length;
  const absentCount = attendance.filter((a: any) => a.attendanceStatus === 'ABSENT').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  const overviewCards = [
    { label: 'Duration', value: session.durationMinutes ? `${session.durationMinutes} min` : '—', icon: Timer },
    { label: 'Present', value: presentCount, icon: Users, sub: `out of ${attendance.length} total` },
    { label: 'Absent', value: absentCount, icon: XCircle },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Target, progress: attendanceRate },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/live-sessions' })}
            className="h-10 w-10 rounded-2xl bg-background/50 border border-border dark:border-white/5 flex items-center justify-center hover:bg-muted transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge className={cn('text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full', statusConfig[session.status]?.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[session.status]?.label}
              </Badge>
              <span className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-wider">
                Session Details
              </span>
            </div>
            <h1 className="text-3xl font-bold text-nejah-sapphire dark:text-foreground">
              {session.schedule?.className || 'Quran Class'}
            </h1>
          </div>
        </div>
        {session.zoomJoinUrl && (
          <Button onClick={() => window.open(session.zoomJoinUrl, '_blank')} className="rounded-xl gap-2" variant="outline">
            <ExternalLink className="h-4 w-4" /> Join Session
          </Button>
        )}
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {overviewCards.map((card) => (
          <motion.div
            key={card.label}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <GlassPanel className="p-5">
              <p className="text-[10px] font-medium uppercase tracking-widest text-nejah-slate-blue">{card.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
              {card.sub && <p className="mt-1 text-xs text-nejah-slate-blue">{card.sub}</p>}
              {card.progress !== undefined && (
                <Progress value={card.progress} className="mt-3 h-1.5" />
              )}
            </GlassPanel>
          </motion.div>
        ))}
      </motion.div>

      <GlassPanel className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full justify-start gap-6 rounded-2xl bg-transparent p-0 h-auto">
              {[
                { value: 'overview', icon: Info, label: 'Overview' },
                { value: 'attendance', icon: ClipboardList, label: 'Attendance', count: attendance.length },
                { value: 'notes', icon: MessageSquareText, label: 'Notes', count: notes.length },
                { value: 'analytics', icon: BarChart3, label: 'Analytics' },
                { value: 'metadata', icon: FileText, label: 'Metadata' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'flex items-center gap-2 px-0 py-3 text-xs font-bold uppercase tracking-wider text-nejah-slate-blue data-[state=active]:text-nejah-electric data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-nejah-electric bg-transparent',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Separator className="mt-0" />

          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-nejah-electric" /> Timings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-nejah-slate-blue font-medium">Scheduled Start</span>
                    <span className="text-xs font-bold tabular-nums">
                      {new Date(session.scheduledStart).toLocaleString(undefined, {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-nejah-slate-blue font-medium">Scheduled End</span>
                    <span className="text-xs font-bold tabular-nums">
                      {session.scheduledEnd
                        ? new Date(session.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-nejah-slate-blue font-medium">Actual Start</span>
                    <span className="text-xs font-bold tabular-nums text-green-600">
                      {session.actualStart
                        ? new Date(session.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Not started'}
                    </span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-nejah-slate-blue font-medium">Actual End</span>
                    <span className="text-xs font-bold tabular-nums">
                      {session.actualEnd
                        ? new Date(session.actualEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-nejah-electric" /> People
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-nejah-sapphire/10 flex items-center justify-center text-sm font-bold text-nejah-sapphire dark:text-nejah-electric">
                      {session.teacher?.fullName?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{session.teacher?.fullName || 'Unknown Teacher'}</p>
                      <p className="text-[10px] text-nejah-slate-blue font-medium">Teacher</p>
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-nejah-sapphire/10 flex items-center justify-center text-sm font-bold text-nejah-sapphire dark:text-nejah-electric">
                      {session.student?.fullName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{session.student?.fullName || 'Group Session'}</p>
                      <p className="text-[10px] text-nejah-slate-blue font-medium">Student</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-nejah-electric" /> Session Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Schedule ID', value: session.scheduleId?.slice(0, 12) || '—' },
                    { label: 'Zoom Meeting ID', value: session.zoomMeetingId ? String(session.zoomMeetingId).slice(0, 12) : '—' },
                    { label: 'Duration (mins)', value: session.durationMinutes || '—' },
                    { label: 'Schedule', value: session.schedule?.scheduleType || '—' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-nejah-slate-blue font-bold uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-bold mt-1 font-mono tabular-nums">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-nejah-electric" />
                Attendance Records ({attendance.length})
              </h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                  Present: {presentCount}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-red-600">
                  Absent: {absentCount}
                </Badge>
              </div>
            </div>

            {attendance.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-nejah-slate-blue" />
                </div>
                <p className="text-sm font-bold text-nejah-slate-blue">No attendance records</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.map((record: any, idx: number) => (
                  <motion.div
                    key={record.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border dark:border-white/5 hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          record.attendanceStatus === 'PRESENT' ? 'bg-green-500' :
                          record.attendanceStatus === 'LATE' ? 'bg-amber-500' :
                          record.attendanceStatus === 'LEFT_EARLY' ? 'bg-blue-500' :
                          'bg-red-500',
                        )}
                      />
                      <div>
                        <p className="text-xs font-bold">{record.student?.fullName || record.studentId?.slice(0, 12) || 'Unknown Student'}</p>
                        <p className="text-[9px] text-nejah-slate-blue font-medium uppercase tracking-wider">
                          {record.student?.studentCode || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <Badge
                          className={cn(
                            'text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border-none',
                            record.attendanceStatus === 'PRESENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            record.attendanceStatus === 'LATE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            record.attendanceStatus === 'LEFT_EARLY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                          )}
                        >
                          {record.attendanceStatus}
                        </Badge>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-[10px] font-bold tabular-nums">
                          {record.durationMinutes ? `${record.durationMinutes}m` : '—'}
                        </p>
                        <p className="text-[8px] text-nejah-slate-blue uppercase tracking-wider font-medium">Duration</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-[10px] font-bold tabular-nums">
                          {record.joinTime
                            ? new Date(record.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
                        <p className="text-[8px] text-nejah-slate-blue uppercase tracking-wider font-medium">Joined</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="p-6 space-y-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-nejah-electric" />
              Teacher Notes ({notes.length})
            </h3>
            {notes.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquareText className="h-6 w-6 text-nejah-slate-blue" />
                </div>
                <p className="text-sm font-bold text-nejah-slate-blue">No notes recorded</p>
                <p className="text-xs text-nejah-slate-blue mt-1">Notes from the teacher will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {notes.map((note: any, idx: number) => (
                  <motion.div
                    key={note.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl bg-background/50 border border-border dark:border-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-nejah-sapphire/10 flex items-center justify-center text-xs font-bold text-nejah-sapphire dark:text-nejah-electric">
                          {note.teacher?.fullName?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{note.teacher?.fullName || 'Teacher'}</p>
                          <p className="text-[9px] text-nejah-slate-blue font-medium tabular-nums">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {note.visibility && (
                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider">
                          {note.visibility}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{note.note}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold font-mono">{presentCount}</p>
                  <p className="text-[10px] text-nejah-slate-blue font-bold uppercase tracking-wider mt-1">Present</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold font-mono">{absentCount}</p>
                  <p className="text-[10px] text-nejah-slate-blue font-bold uppercase tracking-wider mt-1">Absent</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold font-mono">{attendanceRate}%</p>
                  <p className="text-[10px] text-nejah-slate-blue font-bold uppercase tracking-wider mt-1">Attendance Rate</p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Attendance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Present', count: attendance.filter((a: any) => a.attendanceStatus === 'PRESENT').length, color: 'bg-green-500' },
                    { label: 'Late', count: attendance.filter((a: any) => a.attendanceStatus === 'LATE').length, color: 'bg-amber-500' },
                    { label: 'Left Early', count: attendance.filter((a: any) => a.attendanceStatus === 'LEFT_EARLY').length, color: 'bg-blue-500' },
                    { label: 'Absent', count: absentCount, color: 'bg-red-500' },
                  ].map((item) => {
                    const pct = attendance.length > 0 ? (item.count / attendance.length) * 100 : 0;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{item.label}</span>
                          <span className="font-bold tabular-nums">{item.count} ({Math.round(pct)}%)</span>
                        </div>
                        <Progress value={pct} className={cn('h-2', item.color)} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Timer className="h-4 w-4 text-nejah-electric" /> Duration Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendance
                    .filter((a: any) => a.durationMinutes != null)
                    .sort((a: any, b: any) => (b.durationMinutes || 0) - (a.durationMinutes || 0))
                    .slice(0, 10)
                    .map((record: any, idx: number) => (
                      <div key={record.id || idx} className="flex items-center justify-between">
                        <span className="text-xs font-medium">{record.student?.fullName || 'Unknown'}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-nejah-electric rounded-full"
                              style={{ width: `${Math.min(100, ((record.durationMinutes || 0) / 120) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums min-w-[40px] text-right">{record.durationMinutes}m</span>
                        </div>
                      </div>
                    ))}
                  {attendance.filter((a: any) => a.durationMinutes != null).length === 0 && (
                    <p className="text-xs text-nejah-slate-blue text-center py-4">No duration data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="p-6">
            <Card className="rounded-2xl border-border dark:border-white/5 bg-background/50">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-nejah-electric" /> Raw Session Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-background/80 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed text-foreground/80 max-h-[600px] overflow-y-auto">
                  {JSON.stringify(
                    (({ id, status, scheduledStart, scheduledEnd, actualStart, actualEnd, durationMinutes, zoomMeetingId, zoomJoinUrl, scheduleId, studentId, teacherId, createdAt, updatedAt }) => ({
                      id, status, scheduledStart, scheduledEnd, actualStart, actualEnd, durationMinutes, zoomMeetingId, zoomJoinUrl, scheduleId, studentId, teacherId, createdAt, updatedAt,
                    }))(session),
                    null,
                    2,
                  )}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </GlassPanel>
    </div>
  );
}
