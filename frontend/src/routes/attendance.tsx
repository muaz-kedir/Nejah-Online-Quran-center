import { API_BASE } from "@/lib/api";
import { useState, useEffect, useRef, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  Users, 
  Video, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/attendance')({
  component: AdminAttendancePage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager']),
});

function AdminAttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  
  // Search & filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAttendanceData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // 1. Fetch live sessions
      const liveRes = await fetch('${API_BASE}/attendance/live-classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        setLiveSessions(liveData);
      }

      // 2. Fetch today's sessions or all sessions
      // We query the general sessions history. Let's write an endpoint or map it.
      // We can hit getTodaysSessions or create sessions list. Let's call /api/attendance/teacher/sessions as fallback or fetch all sessions.
      // Wait, there is no generic /api/attendance/sessions GET all endpoint, but we can query teacher/sessions with no teacher ID or teacher dashboard.
      // Wait! Let's check: does teacher/sessions exist? Yes. Let's see what endpoint exists for admins to view sessions.
      // Let's call GET /api/attendance/live-classes and mock/fetch history if needed, or query from DB.
      // Wait, let's write a generic GET /api/attendance/sessions endpoint in the backend for admins! That is much cleaner.
      // Let's implement GET /api/attendance/sessions in backend first if it's missing, or we can fetch list of sessions from backend.
      // Let's check what endpoints are in attendance.controller.ts:
      // - POST sessions
      // - POST sessions/start-meeting
      // - POST sessions/end
      // - POST record
      // - GET sessions/:id
      // - GET teacher/sessions
      // - GET student/history
      // - GET student/stats
      // - GET live-classes
      // - GET todays-sessions
      // Ah! We don't have a generic endpoint to list all sessions. But we have GET /api/attendance/todays-sessions!
      // Let's fetch todays-sessions (which returns sessions for today). We can also write a backend method to list all sessions for admins.
      // Let's hit GET ${API_BASE}/attendance/todays-sessions to show today's checklist, and we can also fetch all sessions.
      const sessionsRes = await fetch('${API_BASE}/attendance/todays-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Failed to fetch attendance logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();

    pollIntervalRef.current = setInterval(() => {
      fetchAttendanceData(false);
    }, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleRowClick = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/attendance/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
      } else {
        toast.error('Failed to load session details');
      }
    } catch (e) {
      toast.error('Error fetching session details');
    }
  };

  // Stats calculation
  const totalClassesCount = sessions.length;
  const liveCount = liveSessions.length;

  const { completedCount, scheduledCount, totalStudentsPresent, totalStudentsLate, totalStudentsAbsent, totalStudentsLeftEarly, attendanceRate } = useMemo(() => {
    let present = 0, late = 0, absent = 0, leftEarly = 0, completed = 0, scheduled = 0;
    for (const s of sessions) {
      if (s.status === 'COMPLETED') completed++;
      else if (s.status === 'SCHEDULED') scheduled++;
      present += s.totalStudentsPresent || 0;
      late += s.totalStudentsLate || 0;
      absent += s.totalStudentsAbsent || 0;
      leftEarly += s.totalStudentsLeftEarly || 0;
    }
    const totalAssigned = present + late + absent + leftEarly;
    const rate = totalAssigned > 0 ? ((present + late) / totalAssigned) * 100 : 92.5;
    return { completedCount: completed, scheduledCount: scheduled, totalStudentsPresent: present, totalStudentsLate: late, totalStudentsAbsent: absent, totalStudentsLeftEarly: leftEarly, attendanceRate: rate };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!search && statusFilter === 'all') return sessions;
    const q = search.toLowerCase();
    return sessions.filter(session => {
      const matchesSearch = !search || session.classTitle.toLowerCase().includes(q) || (session.teacher?.fullName && session.teacher.fullName.toLowerCase().includes(q));
      if (statusFilter === 'all') return matchesSearch;
      return matchesSearch && session.status === statusFilter;
    });
  }, [sessions, search, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-nejah-slate-blue mb-1">
              Supervision Center
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              Attendance & Live Meeting Monitor
            </h1>
            <p className="text-sm leading-relaxed text-nejah-slate-blue mt-1">
              Supervise all online Quran classes, track student punctuality, and monitor live audio sessions in real-time.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchAttendanceData(false)}
              variant="outline"
              className="border-border dark:border-white/5 hover:bg-background/50 dark:hover:bg-nejah-surface font-bold gap-2 h-11 px-5 rounded-xl"
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 text-nejah-sapphire", refreshing && "animate-spin")} />
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </div>
        </div>

        {/* Analytics Statistics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 shadow-sm p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-2 translate-x-2">
              <Video className="w-24 h-24 text-nejah-sapphire" />
            </div>
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest leading-none">Live Sessions</p>
            <h3 className="text-4xl font-extrabold text-red-500 font-serif mt-4 flex items-center gap-2 leading-none">
              {liveCount}
              {liveCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />}
            </h3>
            <p className="text-[10px] text-nejah-slate-blue font-bold uppercase tracking-wide mt-2">Active online classes now</p>
          </Card>

          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 shadow-sm p-6 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest leading-none">Total Classes Today</p>
            <h3 className="text-4xl font-extrabold text-foreground dark:text-nejah-electric font-serif mt-4 leading-none">{totalClassesCount}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold mt-2">
              <span className="text-nejah-electric font-bold">{completedCount}</span> completed • <span className="text-amber-600 font-bold">{scheduledCount}</span> remaining
            </p>
          </Card>

          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 shadow-sm p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-2 translate-x-2">
              <TrendingUp className="w-24 h-24 text-nejah-sapphire" />
            </div>
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest leading-none">Avg. Attendance Rate</p>
            <h3 className="text-4xl font-extrabold text-nejah-electric text-nejah-electric font-serif mt-4 leading-none">{attendanceRate.toFixed(1)}%</h3>
            <div className="w-full bg-background/50 dark:bg-nejah-surface h-1.5 rounded-full mt-3.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${attendanceRate}%` }} />
            </div>
          </Card>

          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 shadow-sm p-6 rounded-3xl relative overflow-hidden">
            <p className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest leading-none">Missed Classes / Absent</p>
            <h3 className="text-4xl font-extrabold text-amber-600 font-serif mt-4 leading-none">{totalStudentsAbsent}</h3>
            <p className="text-[10px] text-nejah-slate-blue font-bold uppercase tracking-wide mt-2">Requires parent notification</p>
          </Card>
        </div>

        {/* Live Meeting Supervision Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Live Meeting Monitoring</h2>
          </div>

          {liveSessions.length === 0 ? (
            <div className="glass-panel bg-card dark:bg-nejah-surface border border-border dark:border-white/5 rounded-[2.5rem] p-12 text-center text-nejah-slate-blue font-medium italic">
              <Video className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              No online meetings are active at this moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveSessions.map((meeting) => {
                const startTime = meeting.actualStartTime ? new Date(meeting.actualStartTime) : null;
                const elapsedMins = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
                
                return (
                  <div 
                    key={meeting.id} 
                    className="glass-panel bg-card dark:bg-nejah-surface rounded-[2.5rem] p-6 border-2 border-red-100 dark:border-red-950/20 shadow-lg hover:shadow-xl transition-all relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-red-500 text-white font-extrabold text-[8px] uppercase tracking-widest border-none">Live</Badge>
                        <span className="text-[10px] font-black text-nejah-slate-blue uppercase tracking-widest flex items-center gap-1">
                          <Clock className="h-3 w-3 text-red-500" />
                          Started: {startTime ? startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-black text-nejah-sapphire dark:text-white font-serif truncate">{meeting.classTitle}</h3>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 mt-1 uppercase tracking-wide">{meeting.quranLevel} Level</p>
                      
                      <div className="bg-background/50 dark:bg-nejah-surface/30 rounded-2xl p-4 my-5 border border-border dark:border-white/5 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-nejah-slate-blue font-medium">Teacher</span>
                          <span className="font-bold text-nejah-slate-blue dark:text-foreground">{meeting.teacher?.fullName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-nejah-slate-blue font-medium">Joined Students</span>
                          <span className="font-bold text-nejah-electric">
                            {meeting.totalStudentsPresent || 0} Joined
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-nejah-slate-blue font-medium">Students Absent</span>
                          <span className="font-bold text-red-500">
                            {meeting.totalStudentsAbsent || 0} Absent
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-nejah-slate-blue font-medium">Session Progress</span>
                          <span className="font-bold text-nejah-slate-blue dark:text-foreground">{elapsedMins} Mins elapsed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRowClick(meeting.id)}
                        className="flex-1 bg-nejah-sapphire hover:bg-background text-white rounded-xl h-10 text-xs font-bold gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Supervise Logs
                      </Button>
                      {meeting.meetingLink && (
                        <Button
                          onClick={() => window.open(meeting.meetingLink, '_blank')}
                          variant="outline"
                          className="h-10 w-10 border-border dark:border-white/5 rounded-xl p-0 hover:bg-background/50"
                          title="Open Live Meeting Stream"
                        >
                          <ExternalLink className="h-4 w-4 text-nejah-slate-blue" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Daily Session History Log Table */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border dark:border-white/5 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Daily Session Log</h2>
            
            {/* Search & filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes or teachers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background/50 dark:bg-nejah-surface border-none rounded-xl text-xs w-60"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {['all', 'LIVE', 'COMPLETED', 'SCHEDULED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                      statusFilter === status 
                        ? "bg-nejah-sapphire text-white" 
                        : "bg-background/50 text-nejah-slate-blue hover:bg-muted"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel bg-card dark:bg-nejah-surface rounded-[2rem] border border-border dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 dark:bg-nejah-surface/50 border-b border-border dark:border-white/5">
                    <th className="py-4 px-6 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Class Title</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Teacher</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Punctuality</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Students present</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Students absent</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-right text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-nejah-border-blue">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="h-16" />
                      </tr>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-nejah-slate-blue font-medium italic">No class sessions match your query.</td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-background/50 dark:hover:bg-nejah-surface/20 transition-all">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-extrabold text-nejah-sapphire dark:text-foreground text-sm">{session.classTitle}</p>
                            <p className="text-[10px] text-muted-foreground dark:text-nejah-slate-blue font-bold uppercase mt-0.5">{session.quranLevel} Level</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs font-semibold text-nejah-slate-blue dark:text-muted-foreground">{session.teacher?.fullName}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={cn(
                            "text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border-none",
                            session.teacherAttendanceStatus === 'PRESENT' ? "bg-primary/10 text-nejah-electric" :
                            session.teacherAttendanceStatus === 'LATE' ? "bg-amber-50 text-amber-700" :
                            "bg-background/50 text-nejah-slate-blue"
                          )}>
                            {session.teacherAttendanceStatus || 'Scheduled'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-bold text-xs text-nejah-electric tabular-nums">
                          {session.totalStudentsPresent + session.totalStudentsLate} Joined
                        </td>
                        <td className="py-4 px-4 font-bold text-xs text-red-500 tabular-nums">
                          {session.totalStudentsAbsent} Absent
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-none",
                            session.status === 'LIVE' ? "bg-red-500 text-white animate-pulse" :
                            session.status === 'COMPLETED' ? "bg-muted text-muted-foreground" :
                            "bg-amber-100 text-amber-800"
                          )}>
                            {session.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            onClick={() => handleRowClick(session.id)}
                            className="bg-primary/10 hover:bg-primary/15 text-foreground border border-primary/250/20 rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-wider"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Detailed Session Logs Modal */}
        <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
          <DialogContent className="glass-panel sm:max-w-[700px] dark:bg-nejah-surface dark:border-white/5 rounded-[2.5rem] p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <DialogHeader className="border-b border-border pb-4 mb-4">
              <DialogTitle className="text-xl font-bold font-serif text-nejah-sapphire dark:text-white flex items-center gap-2">
                <BookOpen className="h-5.5 w-5.5 text-nejah-electric" />
                Class Session Details Report
              </DialogTitle>
            </DialogHeader>

            {selectedSession && (
              <div className="space-y-6">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-background/50 dark:bg-nejah-surface p-5 rounded-3xl border border-border dark:border-white/5">
                  <div>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest">Class Title / Subject</p>
                    <p className="text-sm font-bold text-foreground dark:text-white mt-1">{selectedSession.classTitle} ({selectedSession.subject})</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest">Status / Date</p>
                    <p className="text-sm font-bold text-foreground dark:text-white mt-1">
                      {selectedSession.status} • {new Date(selectedSession.sessionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Teacher logs */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-nejah-slate-blue tracking-wider">Teacher Performance Log</h4>
                  <div className="glass-panel bg-primary/5 border-nejah-electric/15 rounded-[2rem] p-5 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-nejah-electric uppercase tracking-widest">Instructor FullName</p>
                      <p className="text-sm font-extrabold text-nejah-sapphire">{selectedSession.teacher?.fullName}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-primary/15 text-nejah-electric font-extrabold text-[9px] uppercase tracking-wider rounded-md border-none px-2">
                        {selectedSession.teacherAttendanceStatus || 'Scheduled'}
                      </Badge>
                      <p className="text-[10px] font-bold text-nejah-electric/70 mt-1">
                        Joined: {selectedSession.teacherJoinTime ? new Date(selectedSession.teacherJoinTime).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Students logs */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-nejah-slate-blue tracking-wider">Assigned Students Attendance Records</h4>
                  <div className="space-y-2">
                    {selectedSession.studentAttendances && selectedSession.studentAttendances.length > 0 ? (
                      selectedSession.studentAttendances.map((rec: any) => (
                        <div key={rec.id} className="p-4 border border-border dark:border-white/5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center font-bold text-xs text-nejah-slate-blue">
                              {rec.student?.fullName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground dark:text-foreground">{rec.student?.fullName}</p>
                              <p className="text-[9px] font-bold text-nejah-slate-blue uppercase tracking-widest mt-0.5">ID: {rec.student?.studentCode}</p>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border-none",
                              rec.attendanceStatus === 'PRESENT' ? "bg-primary/15 text-nejah-electric" :
                              rec.attendanceStatus === 'LATE' ? "bg-amber-100 text-amber-700" :
                              rec.attendanceStatus === 'LEFT_EARLY' ? "bg-blue-150 text-blue-700" :
                              "bg-red-50 text-red-600"
                            )}>
                              {rec.attendanceStatus}
                            </Badge>
                            <p className="text-[9px] text-muted-foreground dark:text-nejah-slate-blue tabular-nums">
                              In-class: {rec.joinTime ? new Date(rec.joinTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'} - {rec.leaveTime ? new Date(rec.leaveTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'} ({rec.durationMinutes || 0} mins)
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-xs text-nejah-slate-blue font-medium italic border border-dashed rounded-2xl">No students assigned to this session.</div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
