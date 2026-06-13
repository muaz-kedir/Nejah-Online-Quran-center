import { useState, useEffect, useMemo, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Video,
  Search,
  Clock,
  Calendar,
  User,
  ExternalLink,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Play,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const Route = createFileRoute('/live-sessions')({
  component: LiveSessionsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager', 'teacher']),
});

function LiveSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [userRole, setUserRole] = useState('');

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
    fetchData();
    pollRef.current = setInterval(() => fetchData(false), 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const [liveData, sessionsData] = await Promise.all([
        api<any[]>('/live-sessions/live').catch(() => []),
        api<any>('/live-sessions?limit=100').catch(() => ({ data: [] })),
      ]);
      setLiveSessions(Array.isArray(liveData) ? liveData : []);
      setSessions(sessionsData.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewSession = async (id: string) => {
    try {
      const data = await api(`/live-sessions/${id}`);
      setSelectedSession(data);
    } catch {
      toast.error('Failed to load session details');
    }
  };

  const stats = useMemo(() => {
    const live = liveSessions.length;
    const completed = sessions.filter(s => s.status === 'COMPLETED').length;
    const cancelled = sessions.filter(s => s.status === 'CANCELLED').length;
    const scheduled = sessions.filter(s => s.status === 'SCHEDULED').length;
    return { live, completed, cancelled, scheduled, total: sessions.length };
  }, [sessions, liveSessions]);

  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase();
    return sessions.filter(s => {
      const matchesSearch = !search
        || s.classTitle?.toLowerCase().includes(q)
        || s.teacher?.fullName?.toLowerCase().includes(q);
      if (statusFilter === 'all') return matchesSearch;
      return matchesSearch && s.status === statusFilter;
    });
  }, [sessions, search, statusFilter]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'LIVE': return <Badge className="bg-red-500 text-white border-none text-[8px] font-black animate-pulse">Live</Badge>;
      case 'COMPLETED': return <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black">Completed</Badge>;
      case 'CANCELLED': return <Badge className="bg-red-100 text-red-600 border-none text-[8px] font-black">Cancelled</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black">Scheduled</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-nejah-slate-blue mb-1">
              Session Center
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">Live Sessions</h1>
            <p className="text-sm leading-relaxed text-nejah-slate-blue mt-1">
              Monitor and manage all live Zoom sessions across the platform.
            </p>
          </div>
          <Button onClick={() => fetchData(false)} variant="outline" className="gap-2 rounded-xl h-11" disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest">Live Now</p>
            <p className="text-3xl font-extrabold text-red-500 mt-2">{stats.live}</p>
          </Card>
          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest">Today Sessions</p>
            <p className="text-3xl font-extrabold text-foreground mt-2">{stats.total}</p>
          </Card>
          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-extrabold text-green-600 mt-2">{stats.completed}</p>
          </Card>
          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest">Cancelled</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats.cancelled}</p>
          </Card>
        </div>

        {liveSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <h2 className="text-lg font-bold">Active Live Sessions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSessions.map((s: any) => (
                <Card key={s.id} className="glass-panel bg-card dark:bg-nejah-surface border-2 border-red-100 dark:border-red-950/20 rounded-[2rem] p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-red-500 text-white border-none text-[8px] font-black">Live</Badge>
                    <span className="text-[10px] font-bold text-nejah-slate-blue">
                      {s.actualStart ? new Date(s.actualStart).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-nejah-sapphire dark:text-white">{s.schedule?.className || 'Quran Class'}</h3>
                  <div className="bg-background/50 rounded-2xl p-4 my-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-nejah-slate-blue">Teacher</span>
                      <span className="font-bold">{s.teacher?.fullName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-nejah-slate-blue">Present</span>
                      <span className="font-bold text-green-600">{s.attendances?.filter((a: any) => a.attendanceStatus === 'PRESENT').length || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-nejah-slate-blue">Absent</span>
                      <span className="font-bold text-red-500">{s.attendances?.filter((a: any) => a.attendanceStatus === 'ABSENT').length || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleViewSession(s.id)} className="flex-1 bg-nejah-sapphire hover:bg-nejah-azure text-white rounded-xl h-10 text-xs font-bold gap-1">
                      <Eye className="h-3.5 w-3.5" /> View Details
                    </Button>
                    {s.zoomJoinUrl && (
                      <Button onClick={() => window.open(s.zoomJoinUrl, '_blank')} variant="outline" className="h-10 w-10 rounded-xl p-0" title="Join Meeting">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold">All Sessions</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search sessions..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background/50 border-none rounded-xl text-xs w-60" />
              </div>
              <div className="flex gap-1">
                {['all', 'LIVE', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                      statusFilter === s ? "bg-nejah-sapphire text-white" : "bg-background/50 text-nejah-slate-blue hover:bg-muted")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel bg-card dark:bg-nejah-surface rounded-[2rem] border border-border dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border dark:border-white/5">
                    <th className="py-4 px-6 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Class</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Teacher</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Scheduled</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Duration</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-nejah-border-blue">
                  {loading ? Array.from({length: 4}).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={6} className="h-16" /></tr>
                  )) : filteredSessions.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-nejah-slate-blue font-medium italic">No sessions found</td></tr>
                  ) : filteredSessions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-background/50 dark:hover:bg-nejah-surface/20 transition-all cursor-pointer" onClick={() => handleViewSession(s.id)}>
                      <td className="py-4 px-6">
                        <p className="font-bold text-nejah-sapphire dark:text-foreground text-sm">{s.schedule?.className || 'Quran Class'}</p>
                        <p className="text-[10px] text-muted-foreground dark:text-nejah-slate-blue font-bold uppercase mt-0.5">
                          {s.student?.fullName || (s.attendances?.length ? `${s.attendances.length} students` : 'N/A')}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-nejah-slate-blue">{s.teacher?.fullName}</td>
                      <td className="py-4 px-4">
                        <p className="text-xs font-bold">{new Date(s.scheduledStart).toLocaleDateString()}</p>
                        <p className="text-[10px] text-nejah-slate-blue">{new Date(s.scheduledStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      </td>
                      <td className="py-4 px-4 text-xs tabular-nums">
                        {s.durationMinutes ? `${s.durationMinutes} min` : '-'}
                      </td>
                      <td className="py-4 px-4">{statusBadge(s.status)}</td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="sm" className="rounded-lg text-xs font-bold gap-1" onClick={(e) => { e.stopPropagation(); handleViewSession(s.id); }}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {selectedSession && (
          <Dialog open={!!selectedSession} onOpenChange={(o) => !o && setSelectedSession(null)}>
            <DialogContent className="sm:max-w-[700px] dark:bg-nejah-surface dark:border-white/5 rounded-[2.5rem] p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
              <DialogHeader className="border-b border-border pb-4 mb-4">
                <DialogTitle className="text-xl font-bold font-serif text-nejah-sapphire dark:text-white flex items-center gap-2">
                  <Video className="h-5 w-5 text-nejah-electric" />
                  Session Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-background/50 dark:bg-nejah-surface p-5 rounded-3xl border border-border dark:border-white/5">
                  <div>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest">Class</p>
                    <p className="text-sm font-bold mt-1">{selectedSession.schedule?.className || 'Quran Class'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest">Status</p>
                    <p className="text-sm font-bold mt-1">{selectedSession.status}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest">Teacher</p>
                    <p className="text-sm font-bold mt-1">{selectedSession.teacher?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest">Duration</p>
                    <p className="text-sm font-bold mt-1">{selectedSession.durationMinutes || 'N/A'} minutes</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-nejah-slate-blue tracking-wider">Attendance Records</h4>
                  <div className="space-y-2">
                    {selectedSession.attendances?.length > 0 ? selectedSession.attendances.map((a: any) => (
                      <div key={a.id} className="p-4 border border-border dark:border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center font-bold text-xs text-nejah-slate-blue">
                            {a.student?.fullName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{a.student?.fullName || 'Unknown'}</p>
                            <p className="text-[9px] font-bold text-nejah-slate-blue mt-0.5">{a.student?.studentCode || ''}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border-none",
                            a.attendanceStatus === 'PRESENT' ? "bg-primary/15 text-nejah-electric" :
                            a.attendanceStatus === 'LATE' ? "bg-amber-100 text-amber-700" :
                            a.attendanceStatus === 'LEFT_EARLY' ? "bg-blue-100 text-blue-700" :
                            "bg-red-50 text-red-600"
                          )}>
                            {a.attendanceStatus}
                          </Badge>
                          {a.joinTime && (
                            <p className="text-[9px] text-nejah-slate-blue tabular-nums">
                              {new Date(a.joinTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              {a.leaveTime ? ` - ${new Date(a.leaveTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : ''}
                              {a.duration ? ` (${a.duration}m)` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="py-4 text-center text-xs text-nejah-slate-blue italic border border-dashed rounded-2xl">No attendance records</div>
                    )}
                  </div>
                </div>

                {selectedSession.sessionNotes?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-nejah-slate-blue tracking-wider">Session Notes</h4>
                    <div className="space-y-2">
                      {selectedSession.sessionNotes.map((n: any) => (
                        <div key={n.id} className="p-4 border border-border dark:border-white/5 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-3.5 w-3.5 text-nejah-slate-blue" />
                            <span className="text-[10px] font-bold text-nejah-slate-blue">{n.teacher?.fullName}</span>
                            <span className="text-[9px] text-nejah-slate-blue">{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSession.recordingUrl && (
                  <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">Recording Available</p>
                    <a href={selectedSession.recordingUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-bold text-nejah-sapphire hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3.5 w-3.5" /> View Recording
                    </a>
                  </div>
                )}

                {selectedSession.zoomJoinUrl && (
                  <Button onClick={() => window.open(selectedSession.zoomJoinUrl, '_blank')} className="w-full gap-2 rounded-xl">
                    <ExternalLink className="h-4 w-4" /> Join Zoom Meeting
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
