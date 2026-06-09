import { memo } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string;
  time: string;
}

const alerts: Alert[] = [
  {
    id: '1',
    type: 'error',
    title: 'Server Maintenance Scheduled',
    description: 'Tomorrow at 03:00 AM UTC. Expect 15 mins downtime.',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'warning',
    title: 'New Teacher Application',
    description: 'Imam Abdullah has submitted credentials for Tajweed.',
    time: '5 hours ago',
  },
  {
    id: '3',
    type: 'success',
    title: 'Monthly Report Ready',
    description: 'September enrollment and progress reports available.',
    time: '1 day ago',
  },
];

const alertConfig = {
  error: {
    dot: 'bg-red-500',
    dotPulse: true,
    title: 'text-gray-900 dark:text-gray-100',
  },
  warning: {
    dot: 'bg-amber-400',
    dotPulse: false,
    title: 'text-gray-900 dark:text-gray-100',
  },
  success: {
    dot: 'bg-emerald-500',
    dotPulse: false,
    title: 'text-gray-900 dark:text-gray-100',
  },
};

export const SystemAlerts = memo(function SystemAlerts() {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.systemAlerts}</h2>
        <span className="ml-auto text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
          {alerts.filter((a) => a.type === 'error').length} Critical
        </span>
      </div>

      {/* Alert list */}
      <div className="p-4 space-y-2">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          return (
            <div
              key={alert.id}
              className={cn(
                'group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
            >
              {/* Status dot */}
              <div className="flex-shrink-0 mt-1">
                <span
                  className={cn(
                    'block w-2.5 h-2.5 rounded-full',
                    config.dot,
                    config.dotPulse && 'animate-pulse'
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold mb-0.5', config.title)}>
                  {alert.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {alert.description}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-medium">
                  {alert.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All */}
      <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => navigate({ to: '/teacher_notifications' })}
          className="w-full py-2.5 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2 group"
        >
          {t.viewAllNotifications}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
});
