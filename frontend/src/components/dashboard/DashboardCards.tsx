import { memo, useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BentoStatCard } from './design-system';

export const DashboardCards = memo(function DashboardCards() {
  const { t } = useApp();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');

        const studentsRes = await fetch('http://localhost:3000/api/students?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentsData = await studentsRes.json();
        const totalStudents = studentsData.meta?.total || 0;

        const teachersRes = await fetch('http://localhost:3000/api/teachers?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teachersData = await teachersRes.json();
        const totalTeachers = teachersData.meta?.total || 0;

        setStats({
          totalStudents,
          totalTeachers,
          activeClasses: Math.max(Math.floor(totalStudents / 10), 1),
          attendanceRate: 94.5,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const display = (v: string | number) => (loading ? '...' : v);

  return (
    <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <BentoStatCard
        label={t.totalStudents}
        value={display(stats.totalStudents.toLocaleString())}
        sub="+12% vs last month"
        icon={<Users className="h-5 w-5" />}
      />
      <BentoStatCard
        label={t.totalTeachers}
        value={display(stats.totalTeachers)}
        sub="Full Capacity"
        icon={<GraduationCap className="h-5 w-5" />}
      />
      <BentoStatCard
        label={t.activeClasses}
        value={display(stats.activeClasses)}
        sub="14 Live Now"
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
