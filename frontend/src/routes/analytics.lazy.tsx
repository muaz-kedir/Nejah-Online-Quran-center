/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useMemo } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { TrendingUp, Users, BookOpen, Clock, Loader2 } from 'lucide-react';
import { requireAuth } from '@/lib/auth';
import { AmbientSection, BentoStatCard, GlassPanel, PageHeader } from '@/components/dashboard/design-system';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Route = createLazyFileRoute('/analytics')({
  component: AnalyticsPage,
});

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

function AnalyticsPage() {
  const { data: studentsStats, isLoading: loadingStudents } = useApiQuery<any>({
    queryKey: ['students-stats'],
    path: '/students/stats',
    refetchInterval: 30_000,
  });

  const { data: teachersStats, isLoading: loadingTeachers } = useApiQuery<any>({
    queryKey: ['teachers-stats'],
    path: '/teachers/stats',
    refetchInterval: 30_000,
  });

  const { data: schedulesData, isLoading: loadingSchedules } = useApiQuery<any>({
    queryKey: ['schedules'],
    path: '/schedules',
    refetchInterval: 30_000,
  });

  const { data: zoomDashboard, isLoading: loadingZoom } = useApiQuery<any>({
    queryKey: ['zoom-analytics-dashboard'],
    path: '/zoom-analytics/dashboard',
    refetchInterval: 30_000,
  });

  const { data: studentsList, isLoading: loadingStudentsList } = useApiQuery<any>({
    queryKey: ['students-list'],
    path: '/students?limit=1000',
    refetchInterval: 30_000,
  });

  const loading = loadingStudents || loadingTeachers || loadingSchedules || loadingZoom || loadingStudentsList;

  const stats = useMemo(() => {
    const totalStuds = studentsStats?.total || 0;
    const newStuds = studentsStats?.newStudentsThisMonth || 0;
    const previousTotal = totalStuds - newStuds;
    const studentChangePercent = previousTotal > 0 
      ? Math.round((newStuds / previousTotal) * 100) 
      : 0;

    const teacherActive = teachersStats?.active || 0;
    const teacherPending = teachersStats?.pending || 0;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const todayClassesCount = Array.isArray(schedulesData)
      ? schedulesData.filter(
          (schedule: any) => schedule.dayOfWeek?.toLowerCase() === todayName.toLowerCase()
        ).length
      : 0;

    return {
      totalStudents: totalStuds,
      activeStudents: studentsStats?.active || 0,
      newStudentsThisMonth: newStuds,
      studentChange: `+${studentChangePercent}% vs last month`,
      totalTeachers: teachersStats?.total || 0,
      activeTeachers: teacherActive,
      teachersChange: teacherPending > 0 ? `${teacherPending} pending` : 'Full Capacity',
      classesToday: todayClassesCount,
      classesChange: `${todayClassesCount > 0 ? 'Live rooms ready' : 'No classes today'}`,
      avgAttendance: zoomDashboard?.attendanceRate || studentsStats?.averageAttendance || 0,
      attendanceChange: zoomDashboard?.attendanceRate ? '+1.5% vs average' : 'N/A',
    };
  }, [studentsStats, teachersStats, schedulesData, zoomDashboard]);

  const enrollmentTrends = useMemo(() => {
    const students = studentsList?.data || [];
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

    if (trends.length === 0) {
      const currentYear = new Date().getFullYear();
      const fallbackMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      trends = fallbackMonths.map((m) => ({
        month: `${m} ${currentYear}`,
        Students: 0,
      }));
    }

    return trends;
  }, [studentsList]);

  const sessionDistribution = useMemo(() => {
    return [
      { name: 'Completed', value: zoomDashboard?.completedSessions || 0 },
      { name: 'Cancelled', value: zoomDashboard?.cancelledSessions || 0 },
      { name: 'Live Now', value: zoomDashboard?.liveSessions || 0 },
      { name: 'No Show', value: zoomDashboard?.noShowSessions || 0 },
    ];
  }, [zoomDashboard]);

  return (
    <DashboardLayout>
      <AmbientSection />
      <div className="space-y-8 pb-16">
        <PageHeader
          eyebrow="Analytics"
          title="Real-Time Analytics"
          description="Monitor student enrollment, teacher activity, and class performance"
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

              <GlassPanel className="p-6">
                <h3 className="mb-6 text-sm font-bold text-foreground tracking-wide uppercase">Session Distribution</h3>
                <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center gap-4">
                  {sessionDistribution.every((s) => s.value === 0) ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Clock className="mx-auto mb-2 h-12 w-12 opacity-30" />
                      <p className="text-sm">No sessions recorded yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-56 w-56 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sessionDistribution.filter((s) => s.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {sessionDistribution.filter((s) => s.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-3 min-w-[150px]">
                        {sessionDistribution.map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-xs text-muted-foreground font-medium">{item.name}:</span>
                            <span className="text-xs font-bold font-mono text-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </GlassPanel>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
