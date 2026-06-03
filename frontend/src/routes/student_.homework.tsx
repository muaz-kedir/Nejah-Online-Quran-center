import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { toast } from 'sonner';

const statusStyle: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Late: 'bg-red-50 text-red-600',
};

function StudentHomework() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const load = () =>
    api<any[]>('/student/dashboard/homework')
      .then((d) => setHomeworks(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const submit = async (id: string) => {
    setSubmitting(id);
    try {
      await api(`/student/dashboard/homework/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submissionNotes: notes[id] || '' }),
      });
      toast.success('Homework submitted');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Submit failed');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.homework}>
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">Homework</h1>
        </div>

        {homeworks.length === 0 ? (
          <div className="bg-gray-50 rounded-[32px] p-16 text-center border">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No homework assigned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {homeworks.map((hw) => {
              const isOpen = expanded === hw.id;
              const status = hw.status || 'Pending';
              return (
                <div key={hw.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    className="w-full p-6 text-left flex items-start justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : hw.id)}
                  >
                    <div>
                      <h3 className="font-bold text-lg text-emerald-950">{hw.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">Teacher: {hw.teacher}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <CalendarDays className="h-3 w-3" />
                        Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn('border-none text-[10px] uppercase font-bold', statusStyle[status] || statusStyle.Pending)}>
                        {status}
                      </Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 border-t bg-gray-50/30">
                      <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{hw.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Assigned: {hw.assignedDate ? new Date(hw.assignedDate).toLocaleDateString() : '—'}
                      </p>
                      {status === 'Pending' || status === 'Late' ? (
                        <div className="mt-4 space-y-3">
                          <Textarea
                            placeholder="Submission notes (optional)"
                            value={notes[hw.id] || ''}
                            onChange={(e) => setNotes({ ...notes, [hw.id]: e.target.value })}
                          />
                          <Button
                            className="bg-emerald-700"
                            disabled={submitting === hw.id}
                            onClick={() => submit(hw.id)}
                          >
                            {submitting === hw.id ? 'Submitting...' : 'Mark as Submitted'}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-emerald-700 font-medium mt-4">Submitted / reviewed</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/homework')({
  component: StudentHomework,
  beforeLoad: requireStudentAuth,
});
