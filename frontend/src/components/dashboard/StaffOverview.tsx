import { MoreVertical, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { memo, useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface StaffMember {
  id: string;
  fullName: string;
  role: string;
  initials: string;
  avatarColor: string;
  status: 'active' | 'on-leave' | 'offline';
  specialization: string;
}

const avatarColors = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-green-400 to-green-600',
  'from-indigo-400 to-indigo-600',
];

const statusConfig = {
  active: { dot: 'bg-emerald-500', label: 'Active', pulse: true },
  'on-leave': { dot: 'bg-amber-400', label: 'On Leave', pulse: false },
  offline: { dot: 'bg-gray-400', label: 'Offline', pulse: false },
};

export const StaffOverview = memo(function StaffOverview() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/teachers?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        
        if (data && Array.isArray(data.data)) {
          const formattedTeachers = data.data.map((teacher: any, index: number) => ({
            id: teacher.id,
            fullName: teacher.fullName,
            role: (teacher.specialization || 'Islamic Studies').toUpperCase(),
            initials: teacher.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            avatarColor: avatarColors[index % avatarColors.length],
            specialization: teacher.specialization || 'Islamic Studies',
            status: (teacher.status === 'active' ? 'active' : teacher.status === 'on leave' ? 'on-leave' : 'offline') as 'active' | 'on-leave' | 'offline',
          }));
          setTeachers(formattedTeachers);
        }
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.staffOverview}</h2>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
          {teachers.length} Active
        </span>
      </div>

      {/* Staff List */}
      <div className="p-4 space-y-1">
        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No teachers registered yet</div>
        ) : (
          teachers.map((staff) => {
            const status = statusConfig[staff.status];
            return (
              <div
                key={staff.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl transition-all duration-200 group',
                  'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-sm',
                        staff.avatarColor
                      )}
                    >
                      {staff.initials}
                    </div>
                    {/* Status dot */}
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                        status.dot,
                        status.pulse && 'animate-pulse'
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {staff.fullName}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                      {staff.role}
                    </p>
                  </div>
                </div>

                {/* Options button */}
                <button className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Manage All Staff */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate({ to: '/teachers' })}
          className="w-full py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2 group"
        >
          {t.manageAllStaff}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
});
