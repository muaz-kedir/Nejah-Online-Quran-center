import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/dashboard/design-system';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly' | 'annual';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
];

export function AdminStudentAttendanceTab({ studentId }: { studentId: string }) {
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<any>(`/students/${studentId}/attendance?period=${period}`);
      setRecords(data.records || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={period === p.id ? 'default' : 'outline'}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : records.length === 0 ? (
        <GlassPanel className="py-12 text-center text-muted-foreground">
          No attendance records for this period.
        </GlassPanel>
      ) : (
        <GlassPanel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4">{r.date || '—'}</td>
                  <td className="py-3 px-4">{r.day}</td>
                  <td className="py-3 px-4">{r.studentName}</td>
                  <td className="py-3 px-4">{r.startTime || '—'}</td>
                  <td className="py-3 px-4">{r.endTime || '—'}</td>
                  <td className="py-3 px-4">
                    {r.sessionDurationMinutes != null ? `${r.sessionDurationMinutes} min` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={cn(
                        r.attendanceStatus === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800',
                      )}
                    >
                      {r.attendanceStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}
