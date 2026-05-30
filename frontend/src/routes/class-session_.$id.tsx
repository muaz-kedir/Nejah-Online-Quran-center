import { useState, useEffect, useRef } from 'react';
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { 
  Clock, 
  Video, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  UserCheck, 
  Award, 
  ExternalLink,
  BookOpen,
  Calendar,
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/class-session_/$id')({
  component: ClassSessionPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'teacher']),
});

function ClassSessionPage() {
  const { id } = useParams({ from: '/class-session_/$id' });
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('student');
  const [userId, setUserId] = useState('');
  const [studentId, setStudentId] = useState('');
  
  // Heartbeat/refresh interval for real-time updates
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSessionDetails = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/attendance/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        if (data.meetingLink) {
          setMeetingLink(data.meetingLink);
        }
      } else {
        toast.error('Failed to load session details');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error loading session');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserRole(localStorage.getItem('userRole') || 'student');
      setUserId(localStorage.getItem('userId') || '');
      // Try to find if user has linked student profile
      const storedStudentId = localStorage.getItem('studentId');
      if (storedStudentId) {
        setStudentId(storedStudentId);
      } else {
        // Fallback: fetch student profile if student role
        const getStudentProfile = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/users/profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.student?.id) {
                setStudentId(data.student.id);
                localStorage.setItem('studentId', data.student.id);
              }
            }
          } catch (e) {
            console.error('Failed to get student profile', e);
          }
        };
        if (localStorage.getItem('userRole') === 'student') {
          getStudentProfile();
        }
      }
    }

    fetchSessionDetails();

    pollIntervalRef.current = setInterval(() => {
      fetchSessionDetails(false);
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  const handleStartMeeting = async () => {
    if (!meetingLink.trim()) {
      toast.error('Please enter a valid Zoom or Google Meet link');
      return;
    }
    if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
      toast.error('Link must start with http:// or https://');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/attendance/sessions/start-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classSessionId: id,
          meetingLink: meetingLink.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Online session is now LIVE! Notifications sent to students & parents.');
        fetchSessionDetails();
      } else {
        const errData = await response.json();
        toast.error(errData.message || 'Failed to start meeting');
      }
    } catch (error) {
      toast.error('Network error starting meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndMeeting = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/attendance/sessions/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classSessionId: id,
          notes: 'Class session completed successfully.',
        }),
      });

      if (response.ok) {
        toast.success('Class session ended and final attendance saved.');
        fetchSessionDetails();
        setTimeout(() => {
          window.location.href = userRole === 'teacher' ? '/teacher_dashboard' : '/dashboard';
        }, 1500);
      } else {
        toast.error('Failed to end meeting');
      }
    } catch (error) {
      toast.error('Network error ending meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!studentId && userRole === 'student') {
      toast.error('No linked student profile found. Attendance cannot be auto-marked.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // 1. Log join event in database
      const response = await fetch('http://localhost:3000/api/attendance/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classSessionId: id,
          studentId: studentId,
          action: 'join',
        }),
      });

      if (response.ok) {
        toast.success('Your attendance has been automatically recorded as PRESENT/LATE!');
        // 2. Open meeting in a new tab
        window.open(meetingLink, '_blank');
        fetchSessionDetails(false);
      } else {
        toast.error('Failed to record joining log. Connecting to class anyway...');
        window.open(meetingLink, '_blank');
      }
    } catch (error) {
      window.open(meetingLink, '_blank');
    }
  };

  const handleLeaveMeeting = async () => {
    if (!studentId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/attendance/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classSessionId: id,
          studentId: studentId,
          action: 'leave',
        }),
      });

      if (response.ok) {
        toast.success('Left session. Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/student_dashboard';
        }, 1000);
      } else {
        window.location.href = '/student_dashboard';
      }
    } catch (error) {
      window.location.href = '/student_dashboard';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] items-center justify-center bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
            <p className="text-sm font-bold text-gray-500 font-serif">Connecting to Quranic Classroom...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="bg-white dark:bg-gray-900 p-12 rounded-[32px] text-center border border-gray-100 dark:border-gray-800 shadow-sm max-w-lg mx-auto">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-emerald-950 dark:text-gray-100 font-serif mb-2">Class Session Not Found</h2>
          <p className="text-sm text-gray-400 mb-6">The requested class session ID does not exist or has been deleted.</p>
          <Button onClick={() => window.location.href = '/dashboard'} className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl">
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return <Badge className="bg-red-500 text-white animate-pulse border-none px-3.5 py-1 text-[10px] font-black tracking-widest uppercase">LIVE NOW</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-150 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">COMPLETED</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none px-3 py-1 text-[10px] font-black tracking-widest uppercase">SCHEDULED</Badge>;
    }
  };

  const myAttendance = session.studentAttendances?.find((a: any) => a.studentId === studentId);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Back Link */}
        <div>
          <button
            onClick={() => {
              if (userRole === 'teacher') window.location.href = '/teacher_dashboard';
              else if (userRole === 'student') window.location.href = '/student_dashboard';
              else window.location.href = '/dashboard';
            }}
            className="flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-emerald-800 uppercase tracking-widest transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>

        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#052c22] via-[#094d3c] to-[#0e6b54] text-white p-10 shadow-2xl border border-emerald-900/20">
          <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getStatusBadge(session.status)}
                <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-[0.2em]">{session.quranLevel} Level</span>
              </div>
              <h1 className="text-4xl font-extrabold font-serif tracking-tight drop-shadow-md">{session.classTitle}</h1>
              <p className="text-emerald-100/90 text-sm max-w-xl flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>Subject: <strong>{session.subject}</strong></span>
                <span className="opacity-40">|</span>
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>{new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 space-y-3 min-w-[240px]">
              <div className="flex items-center gap-3 text-xs text-emerald-200 uppercase font-black tracking-widest">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Class Timings</span>
              </div>
              <div className="text-2xl font-black font-serif text-white tabular-nums">
                {session.scheduledStartTime} - {session.scheduledEndTime}
              </div>
              <div className="text-[10px] text-emerald-300/80 font-bold uppercase">
                Teacher: {session.teacher?.fullName || 'Assigned Instructor'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Meeting Link / Controls */}
          <div className="lg:col-span-8 space-y-8">
            
            {session.status === 'SCHEDULED' && (
              <Card className="rounded-[2.5rem] border-gray-100 dark:border-gray-800 shadow-sm p-8 bg-white dark:bg-gray-900">
                <CardHeader className="p-0 mb-6">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
                    <Video className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold font-serif text-emerald-950 dark:text-gray-100">Start the Online Meeting</CardTitle>
                  <CardDescription className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">For Teacher Only</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  {userRole === 'teacher' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        To initialize this class session, paste your Google Meet or Zoom invite link below and click "Start Meeting". This will automatically notify the assigned student, their parent, and admins.
                      </p>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meeting Connection URL</label>
                        <Input
                          placeholder="https://meet.google.com/abc-defg-hij  OR  https://zoom.us/j/..."
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                          className="h-12 bg-gray-50 border-none rounded-xl text-sm"
                        />
                      </div>
                      <Button
                        onClick={handleStartMeeting}
                        disabled={isSubmitting}
                        className="w-full h-12 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-sm font-extrabold gap-2 shadow-lg"
                      >
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        {isSubmitting ? 'Initializing Meeting...' : 'Start Meeting & Mark Present'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 flex items-start gap-4">
                      <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Waiting for Instructor</h4>
                        <p className="text-xs text-amber-800/80 dark:text-gray-400 leading-relaxed">
                          Assalamu Alaikum. This Quran class session is scheduled but the meeting has not been started yet. You will see a "Join Meeting" option here as soon as your teacher launches the class. Keep this tab open.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {session.status === 'LIVE' && (
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-8 relative">
                <div className="absolute right-4 bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <CardContent className="p-0 space-y-6 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-ping absolute top-8 right-8 opacity-20" />
                  <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-lg border border-white/5 mb-2">
                    <Video className="h-10 w-10 text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <Badge className="bg-red-500 text-white border-none font-bold uppercase tracking-widest text-[9px]">Class is Live</Badge>
                    <h2 className="text-3xl font-extrabold font-serif">Virtual Classroom Active</h2>
                    <p className="text-emerald-100/70 text-xs max-w-md leading-relaxed">
                      Teacher started this session. All attendance logs are updated automatically upon joining and leaving.
                    </p>
                  </div>

                  {userRole === 'teacher' ? (
                    <div className="w-full pt-4 space-y-4">
                      <div className="flex gap-2 w-full max-w-md mx-auto">
                        <Input 
                          readOnly 
                          value={meetingLink} 
                          className="h-11 bg-white/10 border-white/10 text-white text-xs text-center rounded-xl"
                        />
                        <Button 
                          onClick={() => window.open(meetingLink, '_blank')}
                          className="h-11 bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold rounded-xl shrink-0 px-4"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="pt-2">
                        <Button
                          onClick={handleEndMeeting}
                          disabled={isSubmitting}
                          className="bg-red-650 hover:bg-red-750 text-white border-none rounded-xl px-8 h-12 text-sm font-extrabold gap-2 shadow-xl"
                        >
                          <LogOut className="h-4 w-4" />
                          {isSubmitting ? 'Ending Meeting...' : 'End Class & Save Attendance'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full pt-4 space-y-4 max-w-sm">
                      {myAttendance?.joinTime ? (
                        <div className="space-y-4">
                          <div className="bg-white/10 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-left">
                            <div>
                              <p className="text-[9px] font-bold uppercase text-emerald-300">Your Attendance</p>
                              <p className="text-sm font-bold">{myAttendance.attendanceStatus}</p>
                            </div>
                            <span className="text-[10px] text-emerald-200 tabular-nums">Joined: {new Date(myAttendance.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => window.open(meetingLink, '_blank')}
                              className="flex-1 h-12 bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold rounded-xl"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" /> Re-Join Call
                            </Button>
                            <Button 
                              onClick={handleLeaveMeeting}
                              className="h-12 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl px-6"
                            >
                              Exit Class
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={handleJoinMeeting}
                          className="w-full h-14 bg-white hover:bg-emerald-50 text-[#052c22] font-black rounded-2xl text-base shadow-xl gap-3"
                        >
                          <PlayIcon className="h-5 w-5 fill-[#052c22] text-[#052c22]" />
                          Join Meeting Now
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {session.status === 'COMPLETED' && (
              <Card className="rounded-[2.5rem] border-gray-100 dark:border-gray-800 shadow-sm p-8 bg-white dark:bg-gray-900">
                <CardContent className="p-0 space-y-8 text-center">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-[1.5rem] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-serif text-emerald-950 dark:text-gray-100">Session Completed</h2>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                      All attendance metrics, participation times, and notes have been logged and synced to parent & admin portals.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto border-t border-b border-gray-100 dark:border-gray-800 py-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">Actual Date</p>
                      <p className="text-base font-extrabold text-emerald-900 dark:text-emerald-400 mt-1">{new Date(session.sessionDate).toLocaleDateString([], {month:'short', day:'numeric'})}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">Start Time</p>
                      <p className="text-base font-extrabold text-[#052c22] dark:text-emerald-400 mt-1 tabular-nums">
                        {session.actualStartTime ? new Date(session.actualStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">End Time</p>
                      <p className="text-base font-extrabold text-[#052c22] dark:text-emerald-400 mt-1 tabular-nums">
                        {session.actualEndTime ? new Date(session.actualEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">Teacher Duration</p>
                      <p className="text-base font-extrabold text-amber-600 mt-1">{session.teacherDuration || 0} Mins</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      if (userRole === 'teacher') window.location.href = '/teacher_dashboard';
                      else if (userRole === 'student') window.location.href = '/student_dashboard';
                      else window.location.href = '/dashboard';
                    }} 
                    className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl h-11 px-8 font-bold"
                  >
                    Go Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Attendance / Joined Students Roster */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[2.5rem] border-gray-100 dark:border-gray-800 shadow-sm p-6 bg-white dark:bg-gray-900 h-full">
              <CardHeader className="p-0 border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                <CardTitle className="text-lg font-bold font-serif text-emerald-950 dark:text-gray-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-700" />
                  Assigned Students ({session.studentAttendances?.length || 0})
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-gray-450 dark:text-gray-500 tracking-wider">Attendance Logs</CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {!session.studentAttendances || session.studentAttendances.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 font-medium italic">No students assigned to this class.</div>
                ) : (
                  session.studentAttendances.map((record: any) => {
                    const student = record.student || {};
                    const isJoined = !!record.joinTime;
                    
                    return (
                      <div 
                        key={record.id} 
                        className={cn(
                          "p-4 rounded-2xl border flex items-center justify-between transition-colors",
                          isJoined 
                            ? "bg-emerald-50/20 border-emerald-100/50" 
                            : "bg-gray-50/40 border-gray-100 dark:bg-gray-950/20 dark:border-gray-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-800 text-xs shrink-0">
                            {student.fullName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-950 dark:text-gray-200">{student.fullName}</p>
                            <p className="text-[9px] font-bold text-gray-450 dark:text-gray-550 uppercase tracking-widest mt-0.5">ID: {student.studentCode || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge className={cn(
                            "text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border-none",
                            record.attendanceStatus === 'PRESENT' ? "bg-emerald-100 text-emerald-700" :
                            record.attendanceStatus === 'LATE' ? "bg-amber-100 text-amber-700" :
                            record.attendanceStatus === 'LEFT_EARLY' ? "bg-blue-150 text-blue-700" :
                            "bg-red-50 text-red-600"
                          )}>
                            {record.attendanceStatus}
                          </Badge>
                          
                          {isJoined && (
                            <p className="text-[9px] text-gray-400 font-bold tabular-nums mt-1.5">
                              Duration: {record.durationMinutes || 0} mins
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
