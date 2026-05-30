import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Clock, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/schedules')({
  component: SchedulesPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

const DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/schedules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.data || data || []);
      }
    } catch (error) {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const filtered = useMemo(() =>
    schedules.filter((s: any) =>
      s.className?.toLowerCase().includes(search.toLowerCase())
    ),
    [schedules, search]
  );

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Schedules</h1>
          <p className="text-gray-600 mt-1">Manage teaching schedules and class times</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" /> Add Schedule
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search schedules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Class</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Teacher</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Student</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Day</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Time</th>
              <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No schedules found</td></tr>
            ) : (
              filtered.map((s: any) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-gray-900">{s.className}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{s.teacher?.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{s.student?.fullName || 'N/A'}</td>
                  <td className="p-4">
                    <Badge className="bg-blue-100 text-blue-700">
                      {DAYS[s.dayOfWeek] || s.dayOfWeek}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {s.startTimeString || s.startTime} - {s.endTimeString || s.endTime}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={s.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {s.status || 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm">Edit</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
