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
  FolderOpen,
  Settings,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const dayLabels: Record<string, string> = {
  Sunday: 'S', Monday: 'M', Tuesday: 'T', Wednesday: 'W',
  Thursday: 'T', Friday: 'F', Saturday: 'S',
};

const StudentSidebar = ({
  activePath,
  onOpenSettings,
  onLogout,
  student,
}: {
  activePath: string;
  onOpenSettings: () => void;
  onLogout: () => void;
  student?: any;
}) => {
  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'My Classes', icon: Users, path: '/student/classes' },
    { label: 'My Progress', icon: TrendingUp, path: '/student/progress' },
    { label: 'Homework', icon: ClipboardList, path: '/student/homework' },
    { label: 'Resources', icon: FolderOpen, path: '/student/resources' },
    { label: 'Messages', icon: MessageSquare, path: '/student/messages' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

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

      <div className="px-4 pb-2 space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-500 hover:bg-white hover:text-emerald-700 group"
        >
          <Settings className="h-5 w-5 text-gray-400 group-hover:text-emerald-600" />
          <span className="font-bold text-sm">Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-500 hover:bg-red-50 hover:text-red-600 group"
        >
          <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
          <span className="font-bold text-sm">Logout</span>
        </button>
      </div>

      <div className="p-6">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
            {student?.avatarUrl ? (
              <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sm text-emerald-700">{student?.initials || 'S'}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-gray-800 leading-tight">{student?.name || 'Student'}</p>
            <p className="text-[10px] text-gray-400 font-medium">{student?.level || 'Student'} Program</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Topbar = ({ student }: { student?: any }) => (
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
        <div className="w-full h-full rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center">
          {student?.avatarUrl ? (
            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-xs text-emerald-700">{student?.initials || 'S'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const AttendanceBar = ({ day, height, active }: { day: string; height: string; active?: boolean }) => (
  <div className="flex flex-col items-center gap-4">
    <div className="w-3 h-24 bg-gray-100 rounded-full relative overflow-hidden flex items-end">
      <div className={cn("w-full transition-all duration-500", active ? "bg-emerald-700" : "bg-emerald-700/20")} style={{ height }} />
    </div>
    <span className="text-[10px] font-extrabold text-gray-400">{day}</span>
  </div>
);

function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveClass, setLiveClass] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API}/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }

        const liveRes = await fetch(`${API}/attendance/student/live`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (liveRes.ok) {
          const liveResult = await liveRes.json();
          setLiveClass(liveResult);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPw(true);
    try {
      const token = getToken();
      const response = await fetch(`${API}/users/change-password`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(pwForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setChangePasswordOpen(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
    </div>
  );

  const student = data?.student;

  return (
    <div className="flex h-screen bg-white overflow-hidden text-gray-900 font-sans">
      <StudentSidebar
        activePath="/student/dashboard"
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        student={student}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Topbar student={student} />

        <main className="flex-1 px-10 pb-10 space-y-10">
          {/* Header */}
          <div>
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">
              Assalamu Alaikum, {student?.name?.split(' ')[0] || 'Student'}!
            </p>
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
                    <p className="text-sm text-gray-400 font-medium">{data?.progress?.percentage}% of Quran completed</p>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-800">Rank: {data?.progress?.rank}</span>
                  </div>
                </div>

                <ProgressBar value={data?.progress?.percentage || 0} className="h-3 bg-emerald-100 [&>div]:bg-emerald-800 mb-8 rounded-full" />

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50/50 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-extrabold text-emerald-950 font-serif">{data?.progress?.surahs}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Surahs</p>
                  </div>
                  <div className="bg-gray-50/50 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-extrabold text-emerald-950 font-serif">{data?.progress?.ayahs}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ayat</p>
                  </div>
                  <div className="bg-gray-50/50 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-extrabold text-emerald-950 font-serif">{data?.progress?.weeksActive}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Weeks Active</p>
                  </div>
                </div>
              </div>

              {/* Pending Tasks */}
              {data?.pendingTasks && data.pendingTasks.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold text-emerald-950 font-serif">Pending Tasks</h3>
                    <button className="text-xs font-bold text-emerald-700">View All</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.pendingTasks.map((task: any) => (
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
              )}
            </div>

            {/* Right Column: Class, Attendance, Feedback */}
            <div className="space-y-8">
              
              {/* Upcoming Class / Live Class Card */}
              {liveClass ? (
                <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 border-2 border-red-500 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    Live Now
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Video className="w-48 h-48" />
                  </div>

                  <Badge className="bg-red-500 text-white border-none px-3 py-1 mb-8 uppercase text-[10px] tracking-widest font-black">ACTIVE SESSION</Badge>
                  <h3 className="text-3xl font-extrabold font-serif mb-2 leading-tight">{liveClass.classTitle}</h3>
                  <p className="text-sm text-emerald-300 mb-10 font-bold">with {liveClass.teacher?.fullName}</p>

                  <Button 
                    onClick={() => window.location.href = `/class-session/${liveClass.id}`}
                    className="w-full h-14 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-black gap-3 shadow-xl cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center pl-0.5">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                    Enter Live Class
                  </Button>
                </div>
              ) : data?.upcomingClass ? (
                <div className="bg-emerald-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-10 group-hover:translate-x-8 transition-transform">
                    <div className="w-64 h-64 border-8 border-white rounded-full" />
                  </div>

                  <Badge className="bg-white/10 hover:bg-white/20 text-emerald-200 border-none px-3 py-1 mb-8 uppercase text-[10px] tracking-widest font-bold">Upcoming Next</Badge>
                  <h3 className="text-4xl font-extrabold font-serif mb-2">{data.upcomingClass.name}</h3>
                  <p className="text-sm text-emerald-100 mb-2 font-medium">with {data.upcomingClass.teacher}</p>
                  <p className="text-sm font-bold text-emerald-400 mb-10">{data.upcomingClass.time}</p>

                  <Button 
                    className="w-full h-14 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold gap-3 shadow-xl cursor-pointer"
                    onClick={() => toast.info('No active online meeting started yet. Please wait for your teacher.')}
                  >
                    <div className="w-6 h-6 bg-emerald-950 rounded-full flex items-center justify-center pl-0.5">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                    Join Class
                  </Button>
                </div>
              ) : (
                <div className="bg-emerald-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
                  <Badge className="bg-white/10 hover:bg-white/20 text-emerald-200 border-none px-3 py-1 mb-8 uppercase text-[10px] tracking-widest font-bold">No Upcoming</Badge>
                  <h3 className="text-2xl font-extrabold font-serif mb-2">No classes scheduled</h3>
                  <p className="text-sm text-emerald-100 font-medium">Check back later for your next lesson.</p>
                </div>
              )}

              {/* Attendance Card */}
              <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-10 text-center">Weekly Attendance</h4>
                <div className="flex justify-between px-2">
                  {data?.attendance?.weekly?.length > 0 ? (
                    data.attendance.weekly.map((day: any) => {
                      const shortDay = dayLabels[new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })] || day.date.slice(-2);
                      const pct = day.present ? '85%' : '20%';
                      return (
                        <AttendanceBar
                          key={day.date}
                          day={shortDay}
                          height={day.present ? '85%' : '15%'}
                          active={day.present}
                        />
                      );
                    })
                  ) : (
                    <>
                      <AttendanceBar day="S" height="0%" />
                      <AttendanceBar day="M" height="0%" />
                      <AttendanceBar day="T" height="0%" />
                      <AttendanceBar day="W" height="0%" />
                      <AttendanceBar day="T" height="0%" />
                      <AttendanceBar day="F" height="0%" />
                      <AttendanceBar day="S" height="0%" />
                    </>
                  )}
                </div>
              </div>

              {/* Feedback Card */}
              {data?.feedback ? (
                <div className="relative">
                  <div className="bg-emerald-950/95 rounded-[32px] p-8 text-white shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/20 overflow-hidden flex items-center justify-center">
                        <span className="font-bold text-xs text-white">{data.feedback.teacher?.[0] || 'T'}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Feedback from {data.feedback.teacher}</h4>
                        <p className="text-[10px] text-emerald-400 font-bold">{data.feedback.date}</p>
                      </div>
                    </div>
                    <p className="text-sm italic font-serif leading-relaxed text-emerald-100">
                      "{data.feedback.content}"
                    </p>
                  </div>
                  <div className="absolute -bottom-4 right-10 w-8 h-8 bg-emerald-950/95 transform rotate-45" />
                </div>
              ) : null}
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
                  <h2 className="text-5xl font-arabic text-emerald-900 leading-[1.6]" dir="rtl">
                    {data?.verseOfTheDay?.arabic || 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا'}
                  </h2>
                  <div className="max-w-2xl mx-auto space-y-4 md:pt-4">
                    <p className="text-lg font-medium text-gray-700 italic">
                      "{data?.verseOfTheDay?.translation || 'And whoever fears Allah — He will make for him a way out.'}"
                    </p>
                    <p className="text-xs font-bold text-gray-400">— {data?.verseOfTheDay?.reference || 'Surah At-Talaq (65:2)'}</p>
                  </div>
                </div>
             </div>
          </div>
        </main>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-700" />
              Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <button
              onClick={() => {
                setSettingsOpen(false);
                setChangePasswordOpen(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
            >
              <Lock className="h-5 w-5 text-emerald-700" />
              <div className="text-left">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Change Password</p>
                <p className="text-xs text-gray-400">Update your account password</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={(open) => {
        setChangePasswordOpen(open);
        if (!open) setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[420px] dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-900 dark:text-gray-100 flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-700" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPw" className="dark:text-gray-300">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPw"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPw" className="dark:text-gray-300">New Password</Label>
              <div className="relative">
                <Input
                  id="newPw"
                  type={showNewPw ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 pr-10"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPw" className="dark:text-gray-300">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPw"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 pr-10"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false);
                setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="rounded-xl dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPw}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
            >
              {changingPw ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
