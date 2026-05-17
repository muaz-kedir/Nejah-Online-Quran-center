import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentStudentsTable } from '@/components/dashboard/RecentStudentsTable';
import { StaffOverview } from '@/components/dashboard/StaffOverview';
import { TodaysClasses } from '@/components/dashboard/TodaysClasses';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';
import { createFileRoute } from '@tanstack/react-router';
import { useApp } from '@/context/AppContext';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function TeacherDashboardContent({ userName }: { userName: string }) {
  const [stats, setStats] = useState({
    totalStudents: 14,
    todayClassesCount: 4,
    attendanceRate: 98.2,
    homeworkPending: 5,
  });
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeacherStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch stats from custom endpoint
      const response = await fetch('http://localhost:3000/api/teachers/my-dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }

      // Fetch teacher's detail to get students list
      // 1. Get current logged in user details to find teacher id
      const meRes = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        
        // 2. Fetch all teachers to match this userId or use profile endpoint
        const teachersRes = await fetch('http://localhost:3000/api/teachers?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teachersData = await teachersRes.json();
        if (teachersData && Array.isArray(teachersData.data)) {
          const matched = teachersData.data.find((t: any) => t.userId === me.id);
          if (matched) {
            setMyStudents(matched.students || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load teacher dashboard details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const todaySessions = [
    { id: 1, time: '09:00 AM - 10:00 AM', student: 'Omar Al-Fayid', level: 'Intermediate', topic: 'Juz 30 (Al-Naba)' },
    { id: 2, time: '10:30 AM - 11:30 AM', student: 'Fatima Zohra', level: 'Hifz', topic: 'Juz 29 (Al-Mulk)' },
    { id: 3, time: '02:00 PM - 03:00 PM', student: 'Suleiman Yusuf', level: 'Beginner', topic: 'Tajwid Fundamentals' },
    { id: 4, time: '04:00 PM - 05:00 PM', student: 'Aisha Mahmood', level: 'Advanced', topic: 'Juz 15 Revision' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1.5">
          Faculty Console
        </p>
        <h1 className="text-3xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">
          Assalamu Alaykum, <span className="text-emerald-700 dark:text-emerald-400">{userName}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl text-sm mt-1">
          Welcome back to your dashboard. Prepare for today's spiritual learning journeys and review assigned student progress.
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">Total Students</p>
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mt-2 font-serif">{stats.totalStudents}</h2>
          <div className="absolute top-4 right-4">
            <Users className="h-9 w-9 text-emerald-50 dark:text-emerald-950/20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">Today's Classes</p>
          <h2 className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2 font-serif">{stats.todayClassesCount}</h2>
          <div className="absolute top-4 right-4">
            <Calendar className="h-9 w-9 text-emerald-50 dark:text-emerald-950/20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">Attendance Summary</p>
          <h2 className="text-3xl font-extrabold text-amber-600 dark:text-amber-500 mt-2 font-serif">{stats.attendanceRate}%</h2>
          <div className="absolute top-4 right-4">
            <CheckCircle className="h-9 w-9 text-amber-50 dark:text-amber-950/20" />
          </div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm relative overflow-hidden group">
          <p className="text-[9px] font-bold tracking-widest uppercase text-emerald-800 dark:text-emerald-400">Homework Pending</p>
          <h2 className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-2 font-serif">{stats.homeworkPending}</h2>
          <div className="absolute top-4 right-4">
            <AlertCircle className="h-9 w-9 text-emerald-100/60 dark:text-emerald-900/40" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Students Roster */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-700" />
                Your Student Roster
              </h2>
              <Badge className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 rounded-full font-bold">
                {myStudents.length} Active
              </Badge>
            </div>

            {myStudents.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-serif font-medium">
                No active students assigned to your classes yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-100 dark:border-gray-700 pb-2">
                      <th className="py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                      <th className="py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Level</th>
                      <th className="py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {myStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-850 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                              {student.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{student.fullName}</p>
                              <p className="text-[9px] text-gray-450 dark:text-gray-500 font-semibold">{student.gender}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-full font-bold text-[9px] px-2 py-0.5">
                            {student.level || 'Beginner'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            {student.attendanceRate ? `${student.attendanceRate}%` : '95.0%'} Attendance
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Today's Classes / Schedule List */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 font-serif flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <Clock className="h-5 w-5 text-emerald-700" />
              Today's Session Schedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todaySessions.map((session) => (
                <div key={session.id} className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 dark:bg-gray-900/40 dark:border-gray-800 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{session.time}</span>
                      <Badge className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 text-[9px] font-bold rounded-lg">{session.level}</Badge>
                    </div>
                    <h3 className="font-extrabold text-sm text-gray-800 dark:text-gray-250 font-serif">{session.student}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">Topic: {session.topic}</p>
                  </div>
                  <button className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mt-4 flex items-center gap-1 group hover:text-emerald-700">
                    Launch Virtual Classroom <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column / Performance Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
              <Award className="h-44 w-44" />
            </div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-300 mb-1">Pedagogical Level</p>
            <h2 className="text-2xl font-bold font-serif leading-tight">Advanced Syllabus Accredited</h2>
            <p className="text-xs text-emerald-100/70 mt-3 leading-relaxed">
              Your qualification status is verified. You are authorized to instruct general Quranic studies, Advanced Hifz, and Tajwid sciences.
            </p>
            <div className="mt-5 p-3.5 bg-white/10 rounded-2xl flex items-center gap-3 border border-white/10">
              <Flame className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Teaching Streak</p>
                <p className="text-xs font-semibold text-white">18 days active teaching</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-emerald-950 dark:text-gray-100 font-serif border-b border-gray-100 dark:border-gray-700 pb-2">
              Qualitative Standards
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Instruction Clarity</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">9.8/10</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Punctuality Score</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">9.9/10</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Feedback Compliance</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">100%</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30">
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-500 font-serif">Quick Guidelines</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Please remember to upload student progress logs, current Surah/Verse milestone details, and attendance ratings immediately after each class.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { t } = useApp();
  const [userName, setUserName] = useState('Administrator');
  const [userRole, setUserRole] = useState('super_admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || 'Administrator');
      setUserRole(localStorage.getItem('userRole') || 'super_admin');
    }
  }, []);

  const getRoleTitle = (role: string) => {
    const titles: Record<string, string> = {
      super_admin: 'Super Administrator',
      admin: 'Administrator',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
    };
    return titles[role] || 'User';
  };

  // Dedicate view for Teacher Role
  if (userRole === 'teacher') {
    return <TeacherDashboardContent userName={userName} />;
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 font-semibold">
          {t.managementOverview}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t.greeting},{' '}
          <span className="text-emerald-700 dark:text-emerald-400">{getRoleTitle(userRole)}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl">
          {t.welcomeMessage}
        </p>
      </div>

      {/* Analytics Cards */}
      <DashboardCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <RecentStudentsTable />
          <TodaysClasses />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <StaffOverview />
          <SystemAlerts />
        </div>
      </div>
    </>
  );
}

function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
    }
  },
});
