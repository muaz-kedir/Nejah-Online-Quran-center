/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import { toast } from 'sonner';
import { useApiQuery } from '@/hooks/useApiQuery';

export const Route = createLazyFileRoute('/student_/homework')({
  component: StudentHomework,
});

function StudentHomework() {
  const queryClient = useQueryClient();
  const { data: homeworks = [], isLoading: loading } = useApiQuery<any[]>({
    queryKey: ['student-homework'],
    path: '/student/dashboard/homework',
    refetchInterval: 30_000,
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const submit = async (id: string) => {
    setSubmitting(id);
    try {
      await api(`/student/dashboard/homework/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submissionNotes: notes[id] || '' }),
      });
      toast.success('Homework submitted');
      queryClient.invalidateQueries({ queryKey: ['student-homework'] });
    } catch (e: any) {
      toast.error(e.message || 'Submit failed');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <StudentPageLoader />;

  return (
    <StudentPortalLayout activePath={studentPaths.homework}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-4xl">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-nejah-sapphire text-foreground font-serif">Homework</h1>
        </div>

        {homeworks.length === 0 ? (
          <div className="bg-muted rounded-[32px] p-16 text-center border">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No homework assigned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {homeworks.map((hw) => {
              const isOpen = expanded === hw.id;
              const status = hw.status || 'Pending';
              return (
                <div key={hw.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <button
                    type="button"
                    className="w-full p-6 text-left flex items-start justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : hw.id)}
                  >
                    <div>
                      <h3 className="font-bold text-lg text-nejah-sapphire text-foreground">{hw.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Teacher: {hw.teacher}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
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
                    <div className="px-6 pb-6 border-t bg-muted/30">
                      <p className="text-sm text-muted-foreground mt-4 whitespace-pre-wrap">{hw.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
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
                            className="bg-primary"
                            disabled={submitting === hw.id}
                            onClick={() => submit(hw.id)}
                          >
                            {submitting === hw.id ? 'Submitting...' : 'Mark as Submitted'}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-primary font-medium mt-4">Submitted / reviewed</p>
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
