import { API_BASE, apiUrl } from "@/lib/api";
import { MoreVertical, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { memo, useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { GlassPanel, PanelHeader } from './design-system';

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
  'from-nejah-sapphire to-nejah-electric',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-teal-500 to-nejah-azure',
  'from-indigo-500 to-blue-600',
];

const statusConfig = {
  active: { dot: 'bg-primary', label: 'Active', pulse: true },
  'on-leave': { dot: 'bg-amber-400', label: 'On Leave', pulse: false },
  offline: { dot: 'bg-nejah-slate-blue', label: 'Offline', pulse: false },
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
        const response = await fetch(apiUrl(`/teachers?limit=5`), {
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
    <GlassPanel className="overflow-hidden">
      <PanelHeader
        title={t.staffOverview}
        action={
          <span className="rounded-full border border-nejah-electric/20 bg-primary/10 px-2.5 py-1 font-mono text-xs text-nejah-electric">
            {teachers.length} Active
          </span>
        }
      />

      <div className="space-y-1 p-4">
        {loading ? (
          <div className="py-8 text-center text-nejah-slate-blue">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="py-8 text-center text-nejah-slate-blue">No teachers registered yet</div>
        ) : (
          teachers.map((staff) => {
            const status = statusConfig[staff.status];
            return (
              <div
                key={staff.id}
                className="group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.03] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm',
                        staff.avatarColor,
                      )}
                    >
                      {staff.initials}
                    </div>
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                        status.dot,
                        status.pulse && 'animate-pulse electric-ring',
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground transition-colors group-hover:text-nejah-electric">
                      {staff.fullName}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-nejah-slate-blue">
                      {staff.role}
                    </p>
                  </div>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-nejah-slate-blue opacity-0 transition-opacity hover:bg-primary/10 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => navigate({ to: '/teachers' })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-nejah-electric/30 py-2.5 text-xs font-bold uppercase tracking-wider text-nejah-electric transition-colors hover:bg-primary/10 group"
        >
          {t.manageAllStaff}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </GlassPanel>
  );
});
