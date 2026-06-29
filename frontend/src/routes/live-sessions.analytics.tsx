import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel, BentoStatCard } from '@/components/dashboard/design-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Users,
  Target,
  Activity,
  Award,
  Loader2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export const Route = createFileRoute('/live-sessions/analytics')({
  component: SessionAnalyticsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager']),
});

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
  },
};

function SessionAnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, ov, mon] = await Promise.all([
        api<any>('/zoom-analytics/dashboard').catch(() => null),
        api<any>('/zoom-analytics/overview').catch(() => null),
        api<any>('/zoom-analytics/monthly').catch(() => null),
      ]);
      setDashboard(dash);
      setOverview(ov);
      setMonthly(mon);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const sessionsByDay: Array<{
    day: string;
    date: string;
    total: number;
    completed: number;
    cancelled: number;
    avgDuration: number;
    maxDuration: number;
  }> = monthly?.sessionsByDay ?? [];

  const formatDayLabel = (raw: string, short = false) => {
    if (!raw) return '';
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(
        'en',
        short
          ? { weekday: 'short' }
          : { weekday: 'short', month: 'short', day: 'numeric' },
      );
    }
    return raw;
  };

  const attendanceTrend = sessionsByDay.map((d) => ({
    day: formatDayLabel(d.day),
    completed: d.completed || 0,
    cancelled: d.cancelled || 0,
    total: d.total || 0,
  }));

  const durationData = sessionsByDay.map((d) => ({
    day: formatDayLabel(d.day, true),
    avgDuration: d.avgDuration || 0,
    maxDuration: d.maxDuration || 0,
  }));

  const statusDistribution = [
    { name: 'Completed', value: dashboard?.completedSessions ?? overview?.completedSessions ?? 0 },
    { name: 'Cancelled', value: dashboard?.cancelledSessions ?? overview?.cancelledSessions ?? 0 },
    { name: 'Live', value: dashboard?.liveSessions ?? overview?.liveSessions ?? 0 },
    { name: 'Scheduled', value: overview?.scheduledSessions ?? 0 },
  ];

  const completionPct = dashboard?.completionRate ?? overview?.completionRate ?? 0;
  const teacherUtilization =
    completionPct > 0
      ? [
          { name: 'Utilized', value: Math.round(completionPct) },
          { name: 'Available', value: 100 - Math.round(completionPct) },
        ]
      : [];

  const attendancePct = dashboard?.attendanceRate ?? 0;
  const studentEngagement =
    attendancePct > 0
      ? [
          { name: 'Present', value: Math.round(attendancePct) },
          { name: 'Absent', value: 100 - Math.round(attendancePct) },
        ]
      : [];

  const kpis = [
    {
      label: 'Total Sessions',
      value: dashboard?.totalSessions ?? 0,
      icon: <Activity className="h-5 w-5" />,
      sub: `${dashboard?.completedSessions ?? 0} completed`,
    },
    {
      label: 'Attendance Rate',
      value: attendancePct != null ? `${Math.round(attendancePct)}%` : '—',
      icon: <Target className="h-5 w-5" />,
      progress: attendancePct,
    },
    {
      label: 'Avg Duration',
      value: dashboard?.averageSessionDuration ? `${dashboard.averageSessionDuration} min` : '—',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      label: 'Active Teachers',
      value: dashboard?.totalTeachers ?? 0,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Completion Rate',
      value: completionPct != null ? `${Math.round(completionPct)}%` : '—',
      icon: <Award className="h-5 w-5" />,
      progress: completionPct,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          eyebrow="Analytics"
          title="Session Analytics"
          description="Performance metrics and trends for all class sessions across the platform."
          actions={
            <button
              onClick={fetchAll}
              disabled={loading}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-border dark:border-white/5 text-xs font-bold hover:bg-muted transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </button>
          }
        />

        {loading ? (
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          >
            {kpis.map((kpi) => (
              <motion.div
                key={kpi.label}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              >
                <BentoStatCard
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  sub={kpi.sub}
                  progress={kpi.progress}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="rounded-2xl bg-background/50 p-1 border border-border dark:border-white/5 mb-6">
            {[
              { value: 'trends', icon: TrendingUp, label: 'Trends' },
              { value: 'completion', icon: Award, label: 'Completion' },
              { value: 'duration', icon: Clock, label: 'Duration' },
              { value: 'teachers', icon: Users, label: 'Teachers' },
              { value: 'engagement', icon: Target, label: 'Engagement' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl data-[state=active]:bg-nejah-sapphire data-[state=active]:text-white text-xs font-bold gap-2 px-4 py-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="trends">
            <Card className="rounded-[2rem] border-border dark:border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-nejah-electric" />
                  Session Completion Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[350px] rounded-2xl" />
                ) : (
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer>
                      <AreaChart
                        data={
                          attendanceTrend.length > 0
                            ? attendanceTrend
                            : [{ day: 'No data', completed: 0, cancelled: 0, total: 0 }]
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip {...tooltipStyle} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="cancelled"
                          stroke="#ef4444"
                          fill="#ef4444"
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completion">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-[2rem] border-border dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-nejah-electric" />
                    Sessions by Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[350px] rounded-2xl" />
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer>
                        <BarChart
                          data={
                            attendanceTrend.length > 0
                              ? attendanceTrend
                              : [{ day: 'No data', total: 0, completed: 0, cancelled: 0 }]
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip {...tooltipStyle} />
                          <Legend />
                          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                          <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-border dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-nejah-electric" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  {loading ? (
                    <Skeleton className="h-[350px] w-full rounded-2xl" />
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {statusDistribution.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip {...tooltipStyle} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="duration">
            <Card className="rounded-[2rem] border-border dark:border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-nejah-electric" />
                  Session Duration Trends (minutes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[350px] rounded-2xl" />
                ) : (
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer>
                      <LineChart
                        data={
                          durationData.length > 0
                            ? durationData
                            : [{ day: 'No data', avgDuration: 0, maxDuration: 0 }]
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip {...tooltipStyle} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="avgDuration"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          name="Avg Duration"
                        />
                        <Line
                          type="monotone"
                          dataKey="maxDuration"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          name="Max Duration"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-[2rem] border-border dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-nejah-electric" />
                    Teacher Utilization Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  {loading ? (
                    <Skeleton className="h-[350px] w-full rounded-2xl" />
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={teacherUtilization.length > 0 ? teacherUtilization : [{ name: 'No Data', value: 100 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {(teacherUtilization.length > 0 ? teacherUtilization : [{ name: 'No Data', value: 100 }]).map(
                              (_, idx) => (
                                <Cell key={idx} fill={idx === 0 ? '#10b981' : '#94a3b8'} />
                              ),
                            )}
                          </Pie>
                          <Tooltip {...tooltipStyle} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-border dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Teacher Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <Skeleton className="h-[300px] rounded-2xl" />
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Total Teachers
                        </span>
                        <span className="text-2xl font-bold font-mono">{dashboard?.totalTeachers ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Active Sessions
                        </span>
                        <span className="text-2xl font-bold font-mono">{dashboard?.liveSessions ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Avg Sessions/Teacher
                        </span>
                        <span className="text-2xl font-bold font-mono">
                          {dashboard?.totalTeachers && dashboard?.totalSessions
                            ? (dashboard.totalSessions / dashboard.totalTeachers).toFixed(1)
                            : '—'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Utilization
                        </span>
                        <div className="h-4 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-nejah-electric transition-all duration-500"
                            style={{ width: `${Math.min(100, completionPct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums">{Math.round(completionPct)}%</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-[2rem] border-border dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-nejah-electric" />
                    Attendance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  {loading ? (
                    <Skeleton className="h-[350px] w-full rounded-2xl" />
                  ) : (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={studentEngagement.length > 0 ? studentEngagement : [{ name: 'No Data', value: 100 }]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {(studentEngagement.length > 0 ? studentEngagement : [{ name: 'No Data', value: 100 }]).map(
                              (_, idx) => (
                                <Cell key={idx} fill={idx === 0 ? '#10b981' : '#ef4444'} />
                              ),
                            )}
                          </Pie>
                          <Tooltip {...tooltipStyle} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-border dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <Skeleton className="h-[300px] rounded-2xl" />
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Total Students
                        </span>
                        <span className="text-2xl font-bold font-mono">{dashboard?.totalStudents ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Attendance Rate
                        </span>
                        <span className="text-2xl font-bold font-mono">
                          {attendancePct != null ? `${Math.round(attendancePct)}%` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Avg Session Duration
                        </span>
                        <span className="text-2xl font-bold font-mono">
                          {dashboard?.averageSessionDuration ? `${dashboard.averageSessionDuration} min` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-background/50">
                        <span className="text-xs font-bold text-nejah-slate-blue uppercase tracking-wider">
                          Missed Sessions
                        </span>
                        <span className="text-2xl font-bold font-mono text-red-500">
                          {dashboard?.cancelledSessions ?? 0}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
