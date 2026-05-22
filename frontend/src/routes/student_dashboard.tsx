import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  Play, 
  BookOpen, 
  Brain, 
  Clock, 
  MessageSquare,
  LayoutDashboard,
  Users,
  TrendingUp,
  ClipboardList,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';

// --- Components ---

const StudentSidebar = ({ activePath }: { activePath: string }) => {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'My Classes', icon: Users, path: '/student/classes' },
    { label: 'My Progress', icon: TrendingUp, path: '/student/progress' },
    { label: 'Homework', icon: ClipboardList, path: '/student/homework' },
    { label: 'Resources', icon: FolderOpen, path: '/student/resources' },
    { label: 'Messages', icon: MessageSquare, path: '/student/messages' },
  ];

  return (
    <div className="w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col h-screen">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">N</div>
          <div>
            <h1 className="font-extrabold text-emerald-900 tracking-tight leading-none text-lg">Nejah</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Student Portal</p>
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
                  ? "bg-white text-emerald-900 shadow-sm border-l-4 border-emerald-700" 
                  : "text-gray-500 hover:bg-white hover:text-emerald-700"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-700" : "text-gray-400 group-hover:text-emerald-600")} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zaid" alt="Avatar" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-gray-800 leading-tight">Zaid Al-Mansour</p>
            <p className="text-[10px] text-gray-400 font-medium">Hifz Program</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Topbar = () => (
  <div className="h-20 flex items-center justify-between px-10">
    <div className="relative w-96">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input 
        placeholder="Search lessons, resources..." 
        className="pl-12 bg-gray-100 border-none rounded-2xl h-11 focus-visible:ring-emerald-500"
      />
    </div>
    <div className="flex items-center gap-6">
      <button className="relative p-2 text-gray-400 hover:text-emerald-700 transition-colors">
        <Bell className="h-6 w-6" />
        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">3</span>
      </button>
      <button className="p-2 text-gray-400 hover:text-emerald-700 transition-colors">
        <HelpCircle className="h-6 w-6" />
      </button>
      <div className="w-px h-8 bg-gray-200" />
      <div className="w-10 h-10 rounded-full border-2 border-emerald-700 p-0.5">
        <div className="w-full h-full rounded-full bg-emerald-100 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zaid" alt="User Profile" />
        </div>
      </div>
    </div>
  </div>
);

const AttendanceBar = ({ day, height, active }: { day: string, height: string, active?: boolean }) => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-3 h-24 bg-gray-100 rounded-full relative overflow-hidden flex items-end">
      <div className={cn("w-full transition-all duration-500", active ? "bg-emerald-700" : "bg-emerald-700/20")} style={{ height }} />
    </div>
    <span className="text-[10px] font-extrabold text-gray-400">{day}</span>
  </div>
);

// --- Main Page ---

function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden text-gray-900 font-sans">
      <StudentSidebar activePath="/student/dashboard" />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar />

        <main className="flex-1 px-10 pb-10 space-y-10">
          {/* Header */}
          <div>
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">Assalamu Alaikum, {data?.student?.fullName.split(' ')[0]}!</p>
            <h2 className="text-4xl font-extrabold text-emerald-950 font-serif">Ready for your lesson today?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Progress and Tasks */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Progress Card */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm border-b-4 border-b-gray-100/50">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-900 font-serif">Current Hifz Progress</h3>
                    <p className="text-sm text-gray-400 font-medium">{data?.progress?.percentage}% of Juz 30 completed</p>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-800">Rank: {data?.progress?.rank}</span>
                  </div>
                </div>

                <div className="flex gap-1 mb-10">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={cn("h-2.5 flex-1 rounded-full", i < 4 ? "bg-emerald-800" : "bg-emerald-100")} />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50/50 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-extrabold text-emerald-950 font-serif">{data?.progress?.surahs}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Surahs</p>
                  </div>
                  <div className="bg-gray-50/50 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-extrabold text-emerald-950 font-serif">{data?.progress?.ayahs}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ayahs</p>
                  </div>
                  <div className="bg-gray-50/50 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-extrabold text-emerald-950 font-serif">{data?.progress?.weeksActive}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Weeks Active</p>
                  </div>
                </div>
              </div>

              {/* Pending Tasks */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-emerald-950 font-serif">Pending Tasks</h3>
                  <button className="text-xs font-bold text-emerald-700">View All</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.pendingTasks?.map((task: any) => (
                    <div key={task.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm group hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn("p-2 rounded-lg", task.icon === 'book' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                          {task.icon === 'book' ? <BookOpen className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
                        </div>
                        <Badge className="bg-red-50 text-red-600 border-none font-bold text-[9px] uppercase tracking-wider px-2.5">{task.dueDate}</Badge>
                      </div>
                      <h4 className="font-extrabold text-lg text-emerald-950 font-serif mb-2">{task.title}</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">{task.description}</p>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Difficulty: <span className="text-gray-600">{task.difficulty}</span></span>
                        <ChevronRight className="h-4 w-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Class, Attendance, Feedback */}
            <div className="space-y-8">
              
              {/* Upcoming Class Card */}
              <div className="bg-emerald-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-10 group-hover:translate-x-8 transition-transform">
                  <div className="w-64 h-64 border-8 border-white rounded-full" />
                </div>

                <Badge className="bg-white/10 hover:bg-white/20 text-emerald-200 border-none px-3 py-1 mb-8 uppercase text-[10px] tracking-widest font-bold">Upcoming Next</Badge>
                <h3 className="text-4xl font-extrabold font-serif mb-2">{data?.upcomingClass?.name}</h3>
                <p className="text-sm text-emerald-100 mb-2 font-medium">with {data?.upcomingClass?.teacher}</p>
                <p className="text-sm font-bold text-emerald-400 mb-10">{data?.upcomingClass?.time}</p>

                <Button className="w-full h-14 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold gap-3 shadow-xl">
                  <div className="w-6 h-6 bg-emerald-950 rounded-full flex items-center justify-center pl-0.5">
                    <Play className="h-3 w-3 text-white fill-white" />
                  </div>
                  Join Class
                </Button>
              </div>

              {/* Attendance Card */}
              <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-10 text-center">Weekly Attendance</h4>
                <div className="flex justify-between px-2">
                  <AttendanceBar day="S" height="40%" />
                  <AttendanceBar day="M" height="90%" active />
                  <AttendanceBar day="T" height="0%" />
                  <AttendanceBar day="W" height="85%" active />
                  <AttendanceBar day="T" height="95%" active />
                  <AttendanceBar day="F" height="0%" />
                  <AttendanceBar day="S" height="70%" active />
                </div>
              </div>

              {/* Feedback Card */}
              <div className="relative">
                <div className="bg-emerald-950/95 rounded-[32px] p-8 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/20 overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mariam" alt="Teacher" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Feedback from {data?.feedback?.teacher}</h4>
                      <p className="text-[10px] text-emerald-400 font-bold">{data?.feedback?.date}</p>
                    </div>
                  </div>
                  <p className="text-sm italic font-serif leading-relaxed text-emerald-100">
                    "{data?.feedback?.content}"
                  </p>
                </div>
                {/* Speech Bubble Tail */}
                <div className="absolute -bottom-4 right-10 w-8 h-8 bg-emerald-950/95 transform rotate-45" />
              </div>
            </div>
          </div>

          {/* Verse of the Day */}
          <div className="bg-gray-50/30 rounded-[48px] py-20 px-10 text-center space-y-10 relative overflow-hidden">
             <div className="flex justify-center">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm border border-amber-100">
                  <BookOpen className="h-8 w-8" />
                </div>
             </div>
             
             <div className="space-y-4">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.3em]">Verse of the day</p>
                <div className="space-y-8">
                  <h2 className="text-5xl font-arabic text-emerald-900 leading-[1.6]" dir="rtl">{data?.verseOfTheDay?.arabic}</h2>
                  <div className="max-w-2xl mx-auto space-y-4 md:pt-4">
                    <p className="text-lg font-medium text-gray-700 italic">“{data?.verseOfTheDay?.translation}”</p>
                    <p className="text-xs font-bold text-gray-400">— {data?.verseOfTheDay?.reference}</p>
                  </div>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/student_dashboard')({
  component: StudentDashboard,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
      if (role !== 'student') {
        window.location.href = '/dashboard';
        throw new Error('Access denied: Student role required');
      }
    }
  },
});
