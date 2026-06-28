import { useState, useEffect, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, Clock, User, Play, Video, BookOpen, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { joinLiveSessionAsStudent, openZoomMeeting } from '@/lib/live-session';
import { toast } from 'sonner';

function StudentClasses() {
  const [data, setData] = useState<any>({ current: [], upcoming: [], previous: [], liveClass: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchClasses = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setIsPolling(true);
      
      const res = await api('/student/dashboard/classes');
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load classes.');
    } finally {
      if (isInitial) setLoading(false);
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses(true);

    const intervalId = setInterval(() => {
      fetchClasses(false);
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(intervalId);
  }, [fetchClasses]);

  if (loading) return <StudentPageLoader />;

  const joinClass = async (sessionId?: string) => {
    if (!sessionId) {
      toast.error('No live session available');
      return;
    }
    try {
      const result = await joinLiveSessionAsStudent(sessionId);
      openZoomMeeting(result.joinUrl);
      toast.success(
        result.alreadyJoined
          ? 'Rejoined session — attendance already recorded'
          : 'Attendance recorded — opening Zoom',
      );
    } catch (err: any) {
      toast.error(err.message || 'Could not join session. Attendance was not recorded.');
    }
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Present</Badge>;
      case 'Late':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><AlertCircle className="w-3 h-3 mr-1"/> Late</Badge>;
      case 'Absent':
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Absent</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>;
    }
  };

  const ClassCard = ({ cls, showJoin }: { cls: any; showJoin?: boolean }) => {
    const isLive = cls.status === 'live';

    return (
      <div className={cn(
        "bg-card rounded-[24px] p-6 border shadow-sm transition-all duration-300",
        isLive ? "border-red-500/50 shadow-red-500/10" : "border-border hover:shadow-md"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-nejah-sapphire font-serif">{cls.className || cls.name}</h3>
              {isLive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  LIVE NOW
                </span>
              ) : (
                <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider">{cls.status || 'scheduled'}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <CalendarDays className="h-4 w-4 text-nejah-blue" /> {cls.dayOfWeek || cls.day || '—'}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <Clock className="h-4 w-4 text-nejah-blue" /> {cls.time || `${cls.startTime || ''} - ${cls.endTime || ''}`}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4 text-nejah-blue" /> {cls.teacherName || cls.teacher}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showJoin && isLive && (
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-600/20" onClick={() => joinClass(data.liveClass?.id)}>
                <Play className="h-4 w-4 mr-2" /> Enter Class
              </Button>
            )}
            {showJoin && !isLive && (
               <Button size="lg" variant="outline" disabled className="rounded-full font-bold">
                 Waiting for Session...
               </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StudentPortalLayout activePath={studentPaths.classes}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-2">Student Portal</p>
            <h1 className="text-4xl font-extrabold text-nejah-sapphire font-serif tracking-tight">My Classes</h1>
            <p className="text-muted-foreground mt-2">Manage your schedule and access live sessions.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isPolling ? <RefreshCw className="h-4 w-4 animate-spin text-nejah-electric" /> : <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-green-500" /></div>}
            Real-time tracking active
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 flex items-start gap-3 border border-red-100">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Error loading classes</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {data.liveClass && (
          <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-sm font-extrabold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Video className="h-5 w-5" /> Live Now
            </h2>
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-[24px] p-8 shadow-xl shadow-red-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-bold font-serif mb-2">{data.liveClass.classTitle}</h3>
                  <p className="text-red-100 font-medium">
                    {data.liveClass.teacher?.fullName ? `with ${data.liveClass.teacher.fullName}` : 'Your teacher is waiting for you.'}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="bg-white text-red-600 hover:bg-red-50 text-lg rounded-full px-8 h-14 font-bold shadow-lg" 
                  onClick={() => joinClass(data.liveClass?.id)}
                >
                  <Play className="h-5 w-5 mr-2" /> Enter Live Class
                </Button>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-nejah-blue/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-nejah-sapphire" />
              </div>
              <h2 className="text-2xl font-bold text-nejah-sapphire font-serif">Today's Schedule</h2>
            </div>
            {data.current?.length ? (
              <div className="space-y-4">
                {data.current.map((c: any) => <ClassCard key={c.id} cls={c} showJoin />)}
              </div>
            ) : (
              <div className="bg-muted/30 border border-dashed rounded-[24px] p-10 text-center flex flex-col items-center justify-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-nejah-sapphire">No classes today</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2">You don't have any classes scheduled for today. Enjoy your day or review your previous lessons!</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-nejah-blue/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-nejah-sapphire" />
              </div>
              <h2 className="text-2xl font-bold text-nejah-sapphire font-serif">Upcoming Schedule</h2>
            </div>
            {data.upcoming?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.upcoming.map((c: any) => <ClassCard key={c.id} cls={c} />)}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm bg-muted/50 p-6 rounded-2xl border text-center">No upcoming classes scheduled.</p>
            )}
          </section>

          <section>
             <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-nejah-blue/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-nejah-sapphire" />
              </div>
              <h2 className="text-2xl font-bold text-nejah-sapphire font-serif">Class History</h2>
            </div>
            
            {data.previous?.length ? (
              <div className="space-y-4">
                {data.previous.map((c: any) => (
                  <div key={c.id} className="bg-card hover:bg-muted/30 transition-colors rounded-[24px] p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-nejah-sapphire text-lg">
                          {c.classDate ? new Date(c.classDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : '—'}
                        </span>
                        {getAttendanceBadge(c.attendanceStatus)}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm mt-3">
                        <p className="font-medium flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          {c.lessonCovered || 'Quran Class'}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {c.teacherName || '—'}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {c.duration ? `${c.duration} min` : '—'}
                        </p>
                      </div>
                      
                      {c.teacherNotes && (
                        <div className="mt-4 bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-sm text-amber-900/80 italic">
                          "{c.teacherNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/30 border border-dashed rounded-[24px] p-10 text-center">
                <p className="text-muted-foreground">No completed class history yet.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/classes')({
  component: StudentClasses,
  beforeLoad: requireStudentAuth,
});
