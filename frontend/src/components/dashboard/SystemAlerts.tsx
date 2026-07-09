import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, Megaphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { GlassPanel, PanelHeader, SilverDivider } from './design-system';
import { apiUrl, apiHeaders } from "@/lib/api";

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string;
  time: string;
}

const alertConfig = {
  error: { dot: 'bg-red-500', dotPulse: true },
  warning: { dot: 'bg-amber-400', dotPulse: false },
  success: { dot: 'bg-primary', dotPulse: false },
};

function mapChannelToType(channel: string): 'error' | 'warning' | 'success' {
  if (!channel) return 'success';
  const c = channel.toUpperCase();
  if (c.includes('ERROR') || c.includes('ALERT') || c.includes('MAINTENANCE')) return 'error';
  if (c.includes('WARNING') || c.includes('REMINDER') || c.includes('ANNOUNCEMENT')) return 'warning';
  return 'success';
}

function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export const SystemAlerts = memo(function SystemAlerts() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/notifications?limit=5'), { headers: apiHeaders() });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];
      const mapped: Alert[] = items.map((n: any) => ({
        id: n.id,
        type: mapChannelToType(n.channel || n.type),
        title: n.title,
        description: n.content || '',
        time: formatRelativeTime(n.createdAt),
      }));
      setAlerts(mapped);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    intervalRef.current = setInterval(fetchAlerts, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAlerts]);

  const criticalCount = alerts.filter((a) => a.type === 'error').length;

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
          <Megaphone className="h-4 w-4 text-amber-500" />
        </div>
        <h2 className="text-sm font-medium tracking-tight text-foreground">{t.systemAlerts}</h2>
        {criticalCount > 0 && (
          <span className="badge-live-pulse ml-auto">
            {criticalCount} Critical
          </span>
        )}
      </div>
      <SilverDivider />

      <div className="space-y-2 p-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-nejah-slate-blue">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-sm text-nejah-slate-blue">No alerts at this time</div>
        ) : (
          alerts.map((alert) => {
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
          })
        )}
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
