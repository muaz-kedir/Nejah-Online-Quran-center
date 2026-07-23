import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { TrendingUp, Users, BookOpen, Clock, Loader2 } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { AmbientSection, BentoStatCard, GlassPanel, PageHeader } from '@/components/dashboard/design-system';
import { api } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
  beforeLoad: () => requireAuth(['super_admin']),
});

function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    newStudentsThisMonth: 0,
    studentChange: '+0% vs last month',
    totalTeachers: 0,
    activeTeachers: 0,
    teachersChange: 'Full Capacity',
    classesToday: 0,
    classesChange: 'No classes today',
    avgAttendance: 0,
    attendanceChange: 'N/A',
  });

  const [enrollmentTrends, setEnrollmentTrends] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        const [
          studentsStats,
          teachersStats,
          schedulesData,
          studentsList,
        ] = await Promise.all([
          api('/students/stats').catch(() => ({ total: 0, active: 0, newStudentsThisMonth: 0, averageAttendance: 0 })),
          api('/teachers/stats').catch(() => ({ total: 0, active: 0, pending: 0 })),
          api('/schedules').catch(() => []),
          api('/students?limit=1000').catch(() => ({ data: [] })),
        ]);

        // 1. Calculate classes today
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];
        const todayClassesCount = Array.isArray(schedulesData)
          ? schedulesData.filter(
              (schedule: any) => schedule.dayOfWeek?.toLowerCase() === todayName.toLowerCase()
            ).length
          : 0;

        // 2. Format students enrollment monthly trend
        const students = studentsList.data || [];
        const monthlyCounts: Record<string, number> = {};
        
        students.forEach((student: any) => {
          if (!student.createdAt) return;
          const date = new Date(student.createdAt);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const key = `${year}-${month}`;
          monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
        });

        const sortedKeys = Object.keys(monthlyCounts).sort();
        let trends = sortedKeys.map((key) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthLabel = date.toLocaleString('default', { month: 'short' });
          return {
            month: `${monthLabel} ${year}`,
            Students: monthlyCounts[key],
          };
        });

        // Fallback for trends if empty
        if (trends.length === 0) {
          const currentYear = new Date().getFullYear();
          const fallbackMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          trends = fallbackMonths.map((m) => ({
            month: `${m} ${currentYear}`,
            Students: 0,
          }));
        }

        // 3. Session distribution from Zoom analytics removed — manual meeting links
        // 4. Calculate enrollment and metrics changes/trends
        const totalStuds = studentsStats.total || 0;
        const newStuds = studentsStats.newStudentsThisMonth || 0;
        const previousTotal = totalStuds - newStuds;
        const studentChangePercent = previousTotal > 0 
          ? Math.round((newStuds / previousTotal) * 100) 
          : 0;

        const teacherActive = teachersStats.active || 0;
        const teacherPending = teachersStats.pending || 0;

        setStats({
          totalStudents: totalStuds,
          activeStudents: studentsStats.active || 0,
          newStudentsThisMonth: newStuds,
          studentChange: `+${studentChangePercent}% vs last month`,
          totalTeachers: teachersStats.total || 0,
          activeTeachers: teacherActive,
          teachersChange: teacherPending > 0 ? `${teacherPending} pending` : 'Full Capacity',
          classesToday: todayClassesCount,
          classesChange: `${todayClassesCount > 0 ? 'Live rooms ready' : 'No classes today'}`,
          avgAttendance: studentsStats.averageAttendance || 0,
          attendanceChange: 'N/A',
        });

        setEnrollmentTrends(trends);
        // Session distribution from Zoom analytics removed
      } catch (error) {
        console.error('Error loading dashboard analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <DashboardLayout>
      <AmbientSection>
        <Breadcrumbs />
        <PageHeader
          eyebrow="Insights"
          title="Analytics"
          description="Platform-wide performance metrics and insights"
        />

        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center text-muted-foreground flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-nejah-electric" />
              <p className="text-sm font-semibold">Loading real-time analytics...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <BentoStatCard
                label="Total Students"
                value={stats.totalStudents.toLocaleString()}
                sub={stats.studentChange}
                icon={<Users className="h-5 w-5" />}
              />
              <BentoStatCard
                label="Active Teachers"
                value={stats.activeTeachers.toString()}
                sub={stats.teachersChange}
                icon={<BookOpen className="h-5 w-5" />}
              />
              <BentoStatCard
                label="Classes Today"
                value={stats.classesToday.toString()}
                sub={stats.classesChange}
                icon={<Clock className="h-5 w-5" />}
              />
              <BentoStatCard
                label="Avg. Attendance"
                value={`${stats.avgAttendance}%`}
                sub={stats.attendanceChange}
                icon={<TrendingUp className="h-5 w-5" />}
                progress={stats.avgAttendance}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <GlassPanel className="p-6">
                <h3 className="mb-6 text-sm font-bold text-foreground tracking-wide uppercase">Monthly Enrollment Trends</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enrollmentTrends}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Students"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorStudents)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassPanel>

              {/* Zoom Sessions Distribution section removed — manual meeting links
              <GlassPanel className="p-6">
                ...
              </GlassPanel>
              */}
            </div>
          </>
        )}
      </AmbientSection>
    </DashboardLayout>
  );
}
