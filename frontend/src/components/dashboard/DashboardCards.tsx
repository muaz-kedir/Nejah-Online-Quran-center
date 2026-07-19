import { memo, useMemo } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BentoStatCard } from './design-system';
import { useApiQuery } from '@/hooks/useApiQuery';

export const DashboardCards = memo(function DashboardCards() {
  const { t } = useApp();

  const studentsQuery = useApiQuery<{ meta: { total: number } }>({
    queryKey: ['dashboard', 'students-count'],
    path: '/students?limit=1',
    refetchInterval: 30_000,
  });

  const teachersQuery = useApiQuery<{ meta: { total: number } }>({
    queryKey: ['dashboard', 'teachers-count'],
    path: '/teachers?limit=1',
    refetchInterval: 30_000,
  });

  const statsQuery = useApiQuery<{ live: number; completed: number }>({
    queryKey: ['dashboard', 'live-stats'],
    path: '/live-sessions/stats',
    refetchInterval: 30_000,
  });

  const analyticsQuery = useApiQuery<{
    liveSessions: number;
    attendanceRate: number;
    averageSessionDuration: number;
    completedSessions: number;
  }>({
    queryKey: ['dashboard', 'zoom-analytics'],
    path: '/zoom-analytics/dashboard',
    refetchInterval: 30_000,
  });

  const isLoading = studentsQuery.isLoading || teachersQuery.isLoading || statsQuery.isLoading || analyticsQuery.isLoading;

  const stats = useMemo(() => {
    const totalStudents = studentsQuery.data?.meta?.total || 0;
    const totalTeachers = teachersQuery.data?.meta?.total || 0;
    let activeClasses = statsQuery.data?.live || 0;
    const attendanceRate = analyticsQuery.data?.attendanceRate ?? 0;
    const avgSessionDuration = analyticsQuery.data?.averageSessionDuration || 0;
    let completedSessions = statsQuery.data?.completed || 0;

    activeClasses = activeClasses || analyticsQuery.data?.liveSessions || 0;
    completedSessions = completedSessions || analyticsQuery.data?.completedSessions || 0;

    return { totalStudents, totalTeachers, activeClasses, attendanceRate, avgSessionDuration, completedSessions };
  }, [studentsQuery.data, teachersQuery.data, statsQuery.data, analyticsQuery.data]);

  const display = (v: string | number) => (isLoading ? '...' : v);

  return (
    <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <BentoStatCard
        label={t.totalStudents}
        value={display(stats.totalStudents.toLocaleString())}
        icon={<Users className="h-5 w-5" />}
      />
      <BentoStatCard
        label={t.totalTeachers}
        value={display(stats.totalTeachers)}
        icon={<GraduationCap className="h-5 w-5" />}
      />
      <BentoStatCard
        label="Active Sessions"
        value={display(stats.activeClasses)}
        icon={<BookOpen className="h-5 w-5" />}
        highlight
      />
      <BentoStatCard
        label={t.attendanceRate}
        value={display(`${stats.attendanceRate}%`)}
        icon={<TrendingUp className="h-5 w-5" />}
        progress={stats.attendanceRate}
        highlight
      />
    </div>
  );
});
