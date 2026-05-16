import { MoreVertical, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  status: 'active' | 'on-leave' | 'offline';
}

const staffMembers: StaffMember[] = [
  {
    id: '1',
    name: 'Dr. Ibrahim Khalil',
    role: 'FIQH & SEERAH',
    initials: 'IK',
    avatarColor: 'from-blue-400 to-blue-600',
    status: 'active',
  },
  {
    id: '2',
    name: 'Ustadha Sarah Ali',
    role: 'QURANIC ARABIC',
    initials: 'SA',
    avatarColor: 'from-purple-400 to-purple-600',
    status: 'active',
  },
  {
    id: '3',
    name: 'Br. Yusuf Mansoor',
    role: 'DIGITAL LITERACY',
    initials: 'YM',
    avatarColor: 'from-amber-400 to-orange-500',
    status: 'on-leave',
  },
];

const statusConfig = {
  active: { dot: 'bg-emerald-500', label: 'Active', pulse: true },
  'on-leave': { dot: 'bg-amber-400', label: 'On Leave', pulse: false },
  offline: { dot: 'bg-gray-400', label: 'Offline', pulse: false },
};

export function StaffOverview() {
  const { t } = useApp();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.staffOverview}</h2>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
          {staffMembers.length} Active
        </span>
      </div>

      {/* Staff List */}
      <div className="p-4 space-y-1">
        {staffMembers.map((staff) => {
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
                    {staff.name}
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
        })}
      </div>

      {/* Manage All Staff */}
      <div className="px-4 pb-4">
        <button className="w-full py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2 group">
          {t.manageAllStaff}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
