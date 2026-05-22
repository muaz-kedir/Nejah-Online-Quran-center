import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ChevronRight, 
  BookOpen, 
  Users, 
  Clock, 
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  Mic,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';

// --- Components ---

const ParentSidebar = ({ activePath }: { activePath: string }) => {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent/dashboard' },
    { label: 'My Children', icon: Users, path: '/parent/children' },
    { label: 'Quran Progress', icon: BookOpen, path: '/parent/quran' },
    { label: 'Attendance', icon: Calendar, path: '/parent/attendance' },
    { label: 'Homework', icon: ClipboardList, path: '/parent/homework' },
    { label: 'Exams & Results', icon: FileText, path: '/parent/exams' },
    { label: 'Class Schedule', icon: Clock, path: '/parent/schedule' },
    { label: 'Recitation Audio', icon: Mic, path: '/parent/recitations' },
  ];

  const bottomItems = [
    { label: 'Messages / Chat', icon: MessageSquare, path: '/parent/messages' },
    { label: 'Profile Settings', icon: Settings, path: '/parent/settings' },
    { label: 'Logout', icon: LogOut, path: '/logout', className: 'text-red-400' },
  ];

  return (
    <div className="w-72 bg-[#084133] text-white flex flex-col h-screen fixed inset-y-0 left-0 shadow-2xl">
      <div className="p-10 pb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#084133] shadow-lg shadow-black/20">
             <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-none tracking-tight">Nejah Online</h1>
            <p className="text-[10px] text-emerald-300 font-bold tracking-[0.2em] mt-1.5 uppercase">Islamic Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-white/10 text-white shadow-inner" 
                  : "text-emerald-100/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-300" : "text-emerald-100/30 group-hover:text-emerald-300")} />
              <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
              {isActive && <div className="absolute left-0 w-1 h-6 bg-emerald-400 rounded-r-full" />}
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto space-y-1">
        {bottomItems.map((item: any) => (
          <button
            key={item.path}
            className={cn(
                "w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300",
                item.className || "text-emerald-100/50 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5 opacity-40" />
            <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Topbar = ({ parent }: any) => {
  const [lang, setLang] = useState('English');
  
  return (
    <div className="h-24 flex items-center justify-between px-12 bg-white/80 backdrop-blur-md sticky top-0 z-20 w-full ml-72 max-w-[calc(100%-288px)]">
      <div className="flex items-center gap-6">
          <h2 className="text-2xl font-black text-[#084133] font-serif">Parent Portal</h2>
          
          <div className="hidden lg:flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                placeholder="Search curriculum, teachers..." 
                className="pl-12 bg-transparent border-none w-80 h-10 text-xs focus-visible:ring-0"
                />
            </div>
          </div>
      </div>

      <div className="flex items-center gap-10">
        {/* Language Switcher */}
        <div className="flex items-center gap-4 bg-gray-50/50 px-5 py-2 rounded-2xl border border-gray-100">
            {['English', 'Amharic', 'Oromo'].map((l) => (
                <button 
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-widest transition-all",
                        lang === l ? "text-[#084133] underline underline-offset-4 decoration-2" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    {l}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-4">
            <button className="relative p-2.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#084133] transition-all hover:shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
            </button>
            <button className="relative p-2.5 bg-gray-50 rounded-2xl text-gray-400 hover:text-[#084133] transition-all hover:shadow-sm">
                <MessageSquare className="h-5 w-5" />
            </button>
        </div>

        <div className="w-px h-10 bg-gray-100" />

        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="text-right">
             <p className="text-sm font-black text-[#084133] leading-none group-hover:text-emerald-600 transition-colors">{parent?.name || 'Ahmed Al-Mansour'}</p>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Primary Guardian</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-50 shadow-md transform group-hover:scale-105 transition-transform">
            <img src={parent?.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed"} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, value, label, subValue, trend, color }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-[0.03] transform translate-x-8 -translate-y-8 rounded-full", color || 'bg-emerald-900')} />
    
    <div className="flex items-start justify-between mb-8">
      <div className={cn("p-4 rounded-2xl", color ? `bg-${color}/10 text-${color}` : "bg-emerald-50 text-emerald-700")}>
        <Icon className="h-6 w-6" />
      </div>
      {trend && (
        <Badge variant="outline" className="rounded-full border-none px-3 py-1 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase">
          {trend}
        </Badge>
      )}
    </div>
    
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</p>
      <h3 className="text-4xl font-black text-emerald-950 font-serif leading-none pt-2">{value}</h3>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color ? `bg-${color}` : "bg-emerald-800")} style={{ width: '60%' }} />
      </div>
    </div>
  </div>
);

const ChildCard = ({ child }: any) => (
  <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col h-full">
    <div className={cn(
        "absolute top-0 left-0 w-full h-2.5",
        child.name.includes('Lina') ? "bg-amber-400" : "bg-emerald-700"
    )} />
    
    <div className="flex items-center justify-between mb-8">
        <Badge className={cn(
            "rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest",
            child.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
        )}>
            {child.status}
        </Badge>
        <button className="text-gray-300 hover:text-emerald-600"><ChevronRight className="h-5 w-5" /></button>
    </div>

    <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-gray-50 shadow-lg group-hover:scale-105 transition-transform duration-500">
            <img src={child.photo} alt={child.name} className="w-full h-full object-cover" />
        </div>
        <div>
            <h4 className="text-2xl font-black text-emerald-950 font-serif">{child.name}</h4>
            <p className="text-xs font-bold text-gray-400 mt-1 flex items-center justify-center gap-2">
                <BookOpen className="h-3 w-3" />
                Level: {child.level}
            </p>
        </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-auto">
        <div className="bg-gray-50 p-5 rounded-[24px] text-center border border-gray-100 shadow-inner group-hover:bg-emerald-50 transition-colors">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teacher</p>
            <p className="text-sm font-black text-[#084133] leading-tight truncate">{child.teacher}</p>
        </div>
        <div className="bg-gray-50 p-5 rounded-[24px] text-center border border-gray-100 shadow-inner group-hover:bg-blue-50 transition-colors">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Memorization</p>
            <p className="text-sm font-black text-[#084133]">{child.memorization}%</p>
        </div>
    </div>

    <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
        <div className="space-y-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Milestone</p>
            <p className="text-xs font-bold text-[#084133]">{child.currentSurah}</p>
        </div>
        <div className="text-right">
             <p className="text-[18px] font-black text-[#084133] leading-none mb-1">{child.attendance}%</p>
             <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Attendance</p>
        </div>
    </div>
  </div>
);

// --- Main Page ---

function ParentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/parent/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch parent dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-xl h-16 w-16 border-t-4 border-b-4 border-[#084133]"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] text-gray-900 font-sans selection:bg-emerald-100">
      <ParentSidebar activePath="/parent/dashboard" />

      <div className="flex-1 flex flex-col ml-72">
        <Topbar parent={data?.parent} />

        <main className="p-12 space-y-12">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
             <StatCard icon={Users} value={data?.stats?.totalChildren || 2} label="Total Children" trend="+0%" />
             <StatCard icon={BookOpen} value={data?.stats?.activeClasses || 4} label="Active Classes" trend="+1 New" color="emerald-600" />
             <StatCard icon={Calendar} value={`${data?.stats?.attendanceRate || 98}%`} label="Attendance %" trend="Stable" color="blue-600" />
             <StatCard icon={Award} value={`${data?.stats?.memorizationProgress || 75}%`} label="Memorization" trend="Top 10%" color="amber-600" />
             <StatCard icon={ClipboardList} value={data?.stats?.pendingHomework || 2} label="Pending HW" trend="Due Today" color="red-600" />
             <StatCard icon={FileText} value={data?.stats?.upcomingExams || 1} label="Next Exam" trend="In 3 Days" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Main Content Area */}
            <div className="xl:col-span-9 space-y-12">
              
              {/* Children Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-[#084133] font-serif tracking-tight">My Children</h3>
                  <button className="text-sm font-black text-[#084133] flex items-center gap-2 hover:underline underline-offset-4 decoration-2">
                    View All Details <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data?.children?.map((child: any) => (
                    <ChildCard key={child.id} child={child} />
                  )) || [
                    { id: '1', name: 'Zaid Al-Mansour', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zaid', level: 'Juz 30 (Amma)', teacher: 'Sheikh Abdullah', attendance: 99, memorization: 85, status: 'ACTIVE', currentSurah: 'Surah Al-Baqarah' },
                    { id: '2', name: 'Lina Al-Mansour', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina', level: 'Juz 1 (Beginner)', teacher: 'Ustadha Maryam', attendance: 96, memorization: 62, status: 'ACTIVE', currentSurah: 'Surah Al-Fatiha' }
                  ].map((child) => <ChildCard key={child.id} child={child} />)}
                </div>
              </section>

              {/* Progress Detail Section */}
              <section className="bg-white rounded-[48px] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <BookOpen className="w-64 h-64 text-[#084133]" />
                 </div>

                 <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
                    <div className="space-y-4">
                        <h3 className="text-4xl font-black text-[#084133] font-serif leading-tight">Zaid’s Quran<br />Progress</h3>
                        <p className="text-sm text-gray-400 font-bold max-w-sm">Detailed breakdown of current memorization goal and teacher feedback.</p>
                        
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-fit">
                            {['Memorization', 'Tajweed', 'Revision'].map((t) => (
                                <button key={t} className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    t === 'Memorization' ? "bg-white text-[#084133] shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}>{t}</button>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex items-center justify-center w-56 h-56">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-5xl font-black text-[#084133] font-serif leading-none">75%</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Juz 30<br />Completed</span>
                        </div>
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="112" cy="112" r="95" className="stroke-gray-100 stroke-[18] fill-none" />
                            <circle cx="112" cy="112" r="95" className="stroke-[#084133] stroke-[18] fill-none" strokeDasharray="596" strokeDashoffset={596 - (596 * 0.75)} strokeLinecap="round" />
                        </svg>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 space-y-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recently Memorized Surahs</p>
                        <div className="flex flex-wrap gap-3">
                            {['Surah Al-Buruj', 'Surah Al-Inshiqaq', 'Surah Al-Mutaffifin'].map((s) => (
                                <Badge key={s} className="px-6 py-3 rounded-2xl bg-emerald-50 text-[#084133] border-none font-bold text-xs shadow-sm">{s}</Badge>
                            ))}
                        </div>
                        <div className="bg-[#f0f9f1] p-8 rounded-[32px] border border-emerald-100/50 space-y-4">
                            <div className="flex items-center gap-3">
                                <Award className="h-5 w-5 text-emerald-700" />
                                <span className="text-sm font-black text-[#084133]">Teacher's Remarks</span>
                            </div>
                            <p className="text-sm italic font-medium leading-relaxed text-emerald-900/80">
                                "Zaid shows excellent focus on Tajweed and Makhraj. His pace of memorization has increased significantly this month. Keep encouraging the daily revision at home."
                            </p>
                        </div>
                    </div>
                 </div>
              </section>
            </div>

            {/* Sidebar Widgets (Activities & Schedule) */}
            <div className="xl:col-span-3 space-y-10">
              
              {/* Recent Activities */}
              <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm overflow-hidden">
                <h3 className="text-xl font-black text-[#084133] font-serif mb-8 flex items-center justify-between">
                    Recent Activities
                </h3>
                
                <div className="space-y-8">
                    {data?.activities?.map((activity: any) => (
                       <div key={activity.id} className="flex gap-4 group">
                          <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                              activity.type === 'Message' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}>
                             {activity.type === 'Message' ? <MessageSquare className="h-5 w-5" /> : (activity.type === 'Result' ? < Award className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />)}
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-sm font-black text-emerald-950 leading-tight group-hover:text-emerald-600 transition-colors">{activity.title}</h4>
                             <p className="text-[11px] text-gray-500 font-medium leading-tight">{activity.content}</p>
                             <p className="text-[9px] font-bold text-[#084133] uppercase tracking-widest pt-1">{new Date(activity.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                    )) || [
                        { id: '1', title: 'New Lesson Completed', content: 'Zaid finished Surah Al-Buruj', date: 'May 12, 10:30 AM', type: 'Class' },
                        { id: '2', title: 'New Message', content: 'Sheikh Abdullah sent a progress report', date: 'Yesterday', type: 'Message' },
                        { id: '3', title: 'Fee Reminder', content: 'Tuition fees for June are due', date: '2 days ago', type: 'Billing' }
                    ].map(a => (
                        <div key={a.id} className="flex gap-4 group">
                           <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all">
                                {a.type === 'Message' ? <MessageSquare className="h-5 w-5" /> : (a.type === 'Class' ? <BookOpen className="h-5 w-5" /> : <Clock className="h-5 w-5" />)}
                           </div>
                           <div className="space-y-1">
                                <h4 className="text-sm font-black text-emerald-950 leading-tight group-hover:text-emerald-600 transition-colors">{a.title}</h4>
                                <p className="text-[11px] text-gray-500 font-medium leading-tight">{a.content}</p>
                                <p className="text-[9px] font-bold text-[#084133] uppercase tracking-widest pt-1">{a.date}</p>
                           </div>
                        </div>
                    ))}
                </div>

                <Button variant="ghost" className="w-full mt-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-[#084133] font-black text-xs h-14">
                    View Activity Log
                </Button>
              </section>

              {/* Today's Schedule Card */}
              <section className="bg-[#084133] rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none transform translate-x-10 -translate-y-10 group-hover:translate-x-8 transition-transform duration-1000">
                    <Clock className="w-48 h-48" />
                 </div>
                 
                 <h3 className="text-2xl font-black font-serif mb-8 relative z-10">Today's Schedule</h3>
                 
                 <div className="space-y-4 relative z-10">
                    {data?.schedules?.map((session: any) => (
                       <div key={session.id} className="bg-white/10 p-6 rounded-[32px] border border-white/5 backdrop-blur-sm group/item">
                          <div className="flex items-center justify-between mb-4">
                             <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none">{session.childName} - {session.className}</p>
                                <h4 className="text-sm font-black text-white group-hover/item:text-emerald-300 transition-colors">{session.teacher}</h4>
                             </div>
                             <Badge className="bg-emerald-900/50 text-emerald-100 rounded-xl px-3 py-1.5 border-none font-bold text-[10px] tabular-nums">{session.time}</Badge>
                          </div>
                       </div>
                    ))}
                    
                    <button className="w-full mt-6 py-6 rounded-[32px] bg-amber-600 hover:bg-amber-700 text-[#084133] font-black text-sm transition-all shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95">
                        Join Classes Now
                    </button>
                    
                    <button className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all">
                        <PlusIcon className="h-6 w-6" />
                    </button>
                 </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
)

export const Route = createFileRoute('/parent_dashboard')({
  component: ParentDashboard,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
      if (role !== 'parent') {
        window.location.href = '/dashboard';
        throw new Error('Access denied: Parent role required');
      }
    }
  },
});
