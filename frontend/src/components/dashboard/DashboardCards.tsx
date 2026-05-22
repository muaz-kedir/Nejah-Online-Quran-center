import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon: React.ReactNode;
  trend?: string;
  accent: string;
  variant?: 'default' | 'dark';
}

function StatCard({
  title,
  value,
  subtitle,
  subtitleColor,
  icon,
  trend,
  accent,
  variant = 'default',
}: StatCardProps) {
  if (variant === 'dark') {
    return (
      <div className="relative rounded-2xl bg-emerald-900 dark:bg-emerald-950 p-6 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
        {/* Background decorative circle */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-800/50 dark:bg-emerald-900/60 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute right-4 top-4 w-16 h-16 rounded-full bg-emerald-800/30 dark:bg-emerald-900/40" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>
            {/* Circular progress indicator */}
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 24 * 0.945} ${2 * Math.PI * 24}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-emerald-300">✓</span>
              </div>
            </div>
          </div>

          <h3 className="text-4xl font-bold text-white mb-1">{value}</h3>
          <p className="text-sm text-emerald-300 uppercase tracking-wider font-medium">{title}</p>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full bg-emerald-800/60">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300" style={{ width: '94.5%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 group border border-gray-100 dark:border-gray-700',
        'relative overflow-hidden'
      )}
    >
      {/* Top accent line */}
      <div className={cn('absolute top-0 left-0 w-full h-1 rounded-t-2xl', accent)} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          {trend && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
          {subtitle && !trend && (
            <p className={cn('text-xs font-semibold mb-2', subtitleColor || 'text-gray-400 dark:text-gray-500')}>
              {subtitle}
            </p>
          )}
          <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {value}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
            {title}
          </p>
          {subtitle && trend && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardCards() {
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
        
        // Fetch students count
        const studentsRes = await fetch('http://localhost:3000/api/students?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const studentsData = await studentsRes.json();
        const totalStudents = studentsData.meta?.total || 0;

        // Fetch teachers count
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <StatCard
        title={t.totalStudents}
        value={loading ? '...' : stats.totalStudents.toLocaleString()}
        trend="+12% vs last month"
        icon={
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        }
        accent="bg-blue-500"
      />
      <StatCard
        title={t.totalTeachers}
        value={loading ? '...' : stats.totalTeachers}
        subtitle="Full Capacity"
        subtitleColor="text-gray-400 dark:text-gray-500"
        icon={
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        }
        accent="bg-green-500"
      />
      <StatCard
        title={t.activeClasses}
        value={loading ? '...' : stats.activeClasses}
        subtitle="14 Live Now"
        subtitleColor="text-orange-500 dark:text-orange-400 font-semibold"
        icon={
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        }
        accent="bg-orange-500"
      />
      <StatCard
        title={t.attendanceRate}
        value={loading ? '...' : `${stats.attendanceRate}%`}
        variant="dark"
        icon={<TrendingUp className="h-6 w-6 text-emerald-300" />}
        accent=""
      />
    </div>
  );
}
