import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, Clock, User, BookOpen, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  ongoing: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-gray-50 text-gray-500',
  cancelled: 'bg-red-50 text-red-600',
};

function StudentClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${API}/student/dashboard/classes`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setClasses(Array.isArray(data) ? data : data.classes || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">My Class Schedule</h1>
        </div>

        {classes.length === 0 ? (
          <div className="bg-gray-50/50 rounded-[32px] p-16 text-center border border-gray-100">
            <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-emerald-950 font-serif mb-2">No classes scheduled</h3>
            <p className="text-sm text-gray-400 font-medium">Your class schedule will appear here once assigned.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {classes.map((cls: any) => (
              <div
                key={cls.id}
                className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm border-b-4 border-b-gray-100/50 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-950 font-serif">{cls.name}</h3>
                        <p className="text-xs text-gray-400 font-medium">Class ID: {cls.id?.toString().slice(0, 8)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl">
                        <CalendarDays className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Day</p>
                          <p className="text-sm font-bold text-emerald-950">{cls.day || 'TBD'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl">
                        <Clock className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                          <p className="text-sm font-bold text-emerald-950">{cls.time || cls.startTime || 'TBD'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl">
                        <User className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Teacher</p>
                          <p className="text-sm font-bold text-emerald-950">{cls.teacher?.fullName || cls.teacher || 'TBD'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <Badge
                      className={cn(
                        'border-none font-bold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-full',
                        statusColors[cls.status?.toLowerCase()] || 'bg-gray-50 text-gray-600'
                      )}
                    >
                      {cls.status || 'Scheduled'}
                    </Badge>
                    {cls.room && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" /> Room: {cls.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/student_/classes')({
  component: StudentClasses,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Not authenticated');
      }
      if (role !== 'student') {
        window.location.href = '/dashboard';
        throw new Error('Access denied: Student role required');
      }
    }
  },
});
