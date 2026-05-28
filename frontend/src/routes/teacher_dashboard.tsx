import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  Play, 
  BookOpen, 
  Plus, 
  Clock, 
  MessageSquare,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Settings,
  MoreVertical,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { toast } from 'sonner';

// --- Components ---

const TeacherSidebar = ({ activePath }: { activePath: string }) => {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teachers/dashboard' },
    { label: 'My Students', icon: Users, path: '/teacher/students' },
    { label: 'Schedule', icon: Calendar, path: '/teacher/schedule' },
    { label: 'Resources', icon: BookOpen, path: '/teacher/resources' },
    { label: 'Assessments', icon: ClipboardList, path: '/teacher/assessments' },
  ];

  const bottomItems = [
    { label: 'Settings', icon: Settings, path: '/teacher/settings' },
    { label: 'Support', icon: HelpCircle, path: '/teacher/support' },
  ];

  return (
    <div className="w-64 bg-[#052c22] text-white flex flex-col h-screen fixed inset-y-0 left-0">
      <div className="p-8 pb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#052c22]">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Teacher Suite</h1>
            <p className="text-[10px] text-emerald-400 font-medium tracking-widest mt-1 uppercase">Modern Maqam</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-emerald-900/50 text-white" 
                  : "text-emerald-100/50 hover:bg-emerald-900/30 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-400" : "text-emerald-100/40 group-hover:text-emerald-300")} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 px-4 space-y-1 border-t border-emerald-900/50">
        {bottomItems.map((item) => (
          <button
            key={item.path}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-100/50 hover:bg-emerald-900/30 hover:text-white transition-all"
          >
            <item.icon className="h-5 w-5 text-emerald-100/40" />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Topbar = ({ teacher }: any) => (
  <div className="h-20 flex items-center justify-between px-10 bg-white border-b border-gray-100 sticky top-0 z-10 w-full ml-64 max-w-[calc(100%-256px)]">
    <div className="flex items-center gap-4">
        <div className="p-2 bg-emerald-50 rounded-lg lg:hidden">
            <LayoutDashboard className="h-5 w-5 text-emerald-700" />
        </div>
        <h2 className="text-xl font-bold text-emerald-950 font-serif hidden md:block">Teacher Suite</h2>
    </div>

    <div className="flex-1 max-w-xl mx-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Search students, resources, or notes..." 
          className="pl-12 bg-gray-50 border-none rounded-2xl h-12 w-full focus-visible:ring-emerald-500 text-sm"
        />
      </div>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3 text-right">
        <div>
           <p className="text-sm font-bold text-emerald-950 leading-tight">{teacher?.name || 'Prof. Ibrahim'}</p>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{teacher?.title || 'Senior Tajweed Instructor'}</p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-emerald-100 p-0.5">
          <img src={teacher?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ibrahim"} alt="Profile" className="w-full h-full rounded-full bg-emerald-50" />
        </div>
      </div>
      <div className="w-px h-8 bg-gray-100" />
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-emerald-700 transition-colors">
            <Bell className="h-6 w-6" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
        </button>
        <button className="p-2 text-gray-400 hover:text-emerald-700 transition-colors">
            <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, title, value, subValue, label, color, bgColor }: any) => (
  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-start justify-between">
      <div className={cn("p-4 rounded-2xl", bgColor)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      {subValue && (
        <Badge className={cn("rounded-full border-none px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", subValue.includes('+') ? "bg-emerald-50 text-emerald-600" : (subValue.includes('Next') ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"))}>
          {subValue}
        </Badge>
      )}
    </div>
    <div className="mt-6">
      <h3 className="text-3xl font-extrabold text-emerald-950 font-serif leading-none">{value}</h3>
      <p className="text-sm font-semibold text-gray-400 mt-2">{label}</p>
    </div>
  </div>
);

// --- Main Page ---

function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic time status logic
  const getSessionStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTimeStr > endTime) return 'COMPLETED';
    if (currentTimeStr >= startTime && currentTimeStr <= endTime) return 'LIVE NOW';
    return 'READY TO START';
  };

  const handleLaunchSession = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!scheduleId || scheduleId.startsWith('s') || scheduleId.length < 10) {
        toast.info("Opening simulated online session.");
        window.location.href = `/class-session/demo-session-id`;
        return;
      }
      const response = await fetch(`http://localhost:3000/api/attendance/sessions/by-schedule-today/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const session = await response.json();
        window.location.href = `/class-session/${session.id}`;
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to initialize session');
      }
    } catch (error) {
      toast.error('Network error launching classroom');
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const [dashboardRes, sessionsRes] = await Promise.all([
          fetch('http://localhost:3000/api/teacher/dashboard', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/api/teacher/dashboard/today-sessions', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (dashboardRes.ok) {
          const result = await dashboardRes.json();
          setData(result);
        }
        
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setTodaySessions(sessionsData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    
    // Auto refresh status every minute to keep tags dynamic
    const interval = setInterval(() => {
      setTodaySessions(prev => [...prev]); // Trigger re-render to update statuses
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#052c22]"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] text-gray-900 font-sans">
      <TeacherSidebar activePath="/teacher/dashboard" />

      <div className="flex-1 flex flex-col ml-64">
        <Topbar teacher={data?.teacher} />

        <main className="p-10 space-y-12">
          {/* Dashboard Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Assalamu Alaikum, Teacher</p>
              <h2 className="text-4xl font-extrabold text-emerald-950 font-serif">Dashboard Overview</h2>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="h-12 rounded-xl px-6 border-gray-200 font-bold text-gray-600 gap-2">
                View Schedule
              </Button>
              <Button className="h-12 rounded-xl px-6 bg-[#052c22] hover:bg-[#084133] font-bold gap-2 text-white shadow-xl">
                <Plus className="h-5 w-5" />
                New Lesson Note
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={Users} 
              title="My Students" 
              value={data?.stats?.totalStudents || 24} 
              subValue="+2 this week"
              label="My Students"
              color="text-emerald-700"
              bgColor="bg-emerald-50/50"
            />
            <StatCard 
              icon={Calendar} 
              title="Today's Classes" 
              value={data?.stats?.todayClasses || 6} 
              subValue="Next: 2:00 PM"
              label="Today's Classes"
              color="text-amber-700"
              bgColor="bg-amber-50/50"
            />
            <StatCard 
              icon={Filter} 
              title="Overall Attendance" 
              value={`${data?.stats?.overallAttendance || 98.2}%`} 
              subValue="Average"
              label="Overall Attendance"
              color="text-emerald-600"
              bgColor="bg-emerald-50/50"
            />
            <StatCard 
              icon={ClipboardList} 
              title="Homework Pending" 
              value={data?.stats?.homeworkPending || 12} 
              subValue="Requires Review"
              label="Homework Pending"
              color="text-red-700"
              bgColor="bg-red-50/50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Progress Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-950 font-serif">Active Student Progress</h3>
                <button className="text-xs font-bold text-[#052c22] flex items-center gap-1 hover:underline">
                    View All Students <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm border-b-4 border-b-gray-100/50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/30 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-8 py-5">Student Name</th>
                      <th className="px-8 py-5">Current Surah/Juz</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.studentProgress?.map((student: any) => (
                      <tr key={student.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                 {student.initials}
                              </div>
                              <span className="font-bold text-emerald-950">{student.name}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-semibold text-gray-600">{student.currentSurah}</span>
                        </td>
                        <td className="px-8 py-6">
                           <Badge className={cn(
                             "rounded-full border-none px-3 py-1 text-[8px] font-extrabold uppercase tracking-widest leading-none",
                             student.status === 'EXCEEDING' ? "bg-emerald-50 text-emerald-600" : 
                             (student.status === 'ON TRACK' ? "bg-emerald-50 text-emerald-700/70" : 
                             (student.status === 'NEEDS REVIEW' ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"))
                           )}>
                              {student.status.replace('_', ' ')}
                           </Badge>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-20">
                            <ProgressBar value={student.progress} className={cn("h-1.5", student.status === 'EXCEEDING' ? "bg-emerald-100 [&>div]:bg-emerald-600" : (student.status === 'NEEDS REVIEW' ? "bg-amber-100 [&>div]:bg-amber-600" : "bg-gray-100 [&>div]:bg-gray-400"))} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Teacher Notes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-950 font-serif">Teacher's Notes</h3>
                <button className="p-2 bg-gray-100 rounded-lg text-gray-400 hover:bg-gray-200 transition-all">
                    <Filter className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                {data?.notes?.map((note: any) => (
                   <div key={note.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm border-l-4 relative border-l-gray-300">
                      <div className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full",
                        note.type === 'Class Reminder' ? "bg-emerald-600" : (note.type === 'Observation' ? "bg-amber-500" : "bg-blue-500")
                      )} />
                      <div className="flex items-center justify-between mb-3">
                         <span className={cn(
                           "text-[9px] font-extrabold uppercase tracking-widest",
                           note.type === 'Class Reminder' ? "text-emerald-700" : (note.type === 'Observation' ? "text-amber-600" : "text-blue-600")
                         )}>{note.type}</span>
                         <span className="text-[10px] font-bold text-gray-400">{note.date}</span>
                      </div>
                      <h4 className="text-base font-bold text-emerald-950 font-serif leading-tight mb-3">{note.title}</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">{note.content}</p>
                   </div>
                ))}
                
                <button className="w-full h-16 rounded-[24px] border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-700 transition-all">
                   + Add Personal Reflection
                </button>
                
                <div className="fixed bottom-10 right-10 flex flex-col gap-4">
                     <button className="w-14 h-14 bg-[#052c22] rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform">
                        <Plus className="h-6 w-6" />
                     </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-8">
            <h3 className="text-2xl font-bold text-emerald-950 font-serif">Today's Remaining Sessions</h3>
            
            {todaySessions.length === 0 ? (
               <div className="bg-white rounded-[32px] p-12 border border-gray-100 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                     <Calendar className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-emerald-950 font-serif mb-2">No remaining sessions for today.</h4>
                  <p className="text-gray-400 font-medium">You have completed all your scheduled classes or have a day off.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {todaySessions.map((session: any) => {
                     const dynamicStatus = getSessionStatus(session.startTime, session.endTime);
                     return (
                        <div key={session.scheduleId} className="bg-white rounded-[40px] p-10 overflow-hidden relative group shadow-sm border border-gray-100">
                           <div className="flex items-center gap-3 mb-8">
                              <Clock className="h-5 w-5 text-amber-500" />
                              <span className="text-sm font-bold text-emerald-950">{session.startTime} - {session.endTime}</span>
                           </div>
                           
                           <h4 className="text-4xl font-extrabold text-emerald-950 font-serif mb-2 line-clamp-1">{session.title}</h4>
                           <p className="text-sm text-gray-400 font-semibold mb-10">{session.sessionType}</p>
                           
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-full bg-emerald-900 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                                    {session.studentAvatar}
                                 </div>
                                 <span className="text-xs font-bold text-emerald-950">{session.studentName}</span>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                  <Badge className={cn(
                                     "border-none font-bold text-[9px] uppercase tracking-wider px-3 py-1",
                                     dynamicStatus === 'COMPLETED' ? "bg-gray-100 text-gray-500" :
                                     dynamicStatus === 'LIVE NOW' ? "bg-red-50 text-red-600 animate-pulse" :
                                     "bg-emerald-50 text-emerald-600"
                                  )}>
                                     {dynamicStatus}
                                  </Badge>
                                  <button 
                                    onClick={() => handleLaunchSession(session.scheduleId)}
                                    className="text-sm font-extrabold text-emerald-850 hover:underline cursor-pointer"
                                  >
                                    Open Quran View
                                  </button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/teacher_dashboard')({
  component: TeacherDashboard,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
      if (role !== 'teacher') {
        window.location.href = '/dashboard';
        throw new Error('Access denied: Teacher role required');
      }
    }
  },
});
