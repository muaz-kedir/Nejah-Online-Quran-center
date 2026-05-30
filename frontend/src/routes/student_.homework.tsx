import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, CalendarDays, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const statusConfig: Record<string, { class: string; label: string }> = {
  pending: { class: 'bg-amber-50 text-amber-700', label: 'Pending' },
  completed: { class: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
  overdue: { class: 'bg-red-50 text-red-600', label: 'Overdue' },
};

function StudentHomework() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${API}/student/dashboard/homework`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHomeworks(Array.isArray(data) ? data : data.homeworks || data.assignments || []);
        }
      } catch (err) {
        console.error('Failed to fetch homework', err);
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
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1.5">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">Homework</h1>
        </div>

        {homeworks.length === 0 ? (
          <div className="bg-gray-50/50 rounded-[32px] p-16 text-center border border-gray-100">
            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-emerald-950 font-serif mb-2">No homework assigned</h3>
            <p className="text-sm text-gray-400 font-medium">You're all caught up! Check back later for new assignments.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {homeworks.map((hw: any) => {
              const status = (hw.status || 'pending').toLowerCase();
              const cfg = statusConfig[status] || statusConfig.pending;

              return (
                <div
                  key={hw.id}
                  className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm border-b-4 border-b-gray-100/50 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-emerald-950 font-serif">{hw.title}</h3>
                          {hw.subject && (
                            <p className="text-xs text-gray-400 font-medium">{hw.subject}</p>
                          )}
                        </div>
                      </div>

                      {hw.description && (
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{hw.description}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50/50 px-4 py-2 rounded-xl">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span className="text-xs font-bold text-emerald-950">
                            Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                          </span>
                        </div>
                        <Badge className={cn('border-none font-bold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-full', cfg.class)}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/student_/homework')({
  component: StudentHomework,
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
