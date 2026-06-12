import { memo } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { GlassPanel, PanelHeader, SilverDivider } from './design-system';

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
  error: { dot: 'bg-red-500', dotPulse: true },
  warning: { dot: 'bg-amber-400', dotPulse: false },
  success: { dot: 'bg-primary', dotPulse: false },
};

export const SystemAlerts = memo(function SystemAlerts() {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
          <Megaphone className="h-4 w-4 text-amber-500" />
        </div>
        <h2 className="text-sm font-medium tracking-tight text-foreground">{t.systemAlerts}</h2>
        <span className="badge-live-pulse ml-auto">
          {alerts.filter((a) => a.type === 'error').length} Critical
        </span>
      </div>
      <SilverDivider />

      <div className="space-y-2 p-4">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          return (
            <div
              key={alert.id}
              className="group flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.03]"
            >
              <div className="mt-1 flex-shrink-0">
                <span
                  className={cn(
                    'block h-2.5 w-2.5 rounded-full',
                    config.dot,
                    config.dotPulse && 'animate-pulse',
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs leading-relaxed text-nejah-slate-blue">{alert.description}</p>
                <p className="mt-1.5 font-mono text-[10px] text-nejah-slate-blue">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      <SilverDivider />
      <div className="px-4 py-4">
        <button
          onClick={() => navigate({ to: '/teacher_notifications' })}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-nejah-electric transition-colors hover:bg-primary/10 group"
        >
          {t.viewAllNotifications}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </GlassPanel>
  );
});
