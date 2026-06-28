import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/dashboard/design-system';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditScheduleModal } from '@/components/teachers/EditScheduleModal';
import { AssignTemporaryTeacherModal } from '@/components/teachers/AssignTemporaryTeacherModal';

interface Props {
  studentId: string;
  teacher: { id: string; fullName: string };
}

export function AdminStudentScheduleTab({ studentId, teacher }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [tempOpen, setTempOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<any>(`/students/${studentId}/schedule`);
      setItems(data.items || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load schedules');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row: any) => {
    if (row.scheduleType !== 'Permanent') {
      toast.info('Cancel temporary replacements from the replacements module.');
      return;
    }
    if (!confirm('Delete this permanent schedule?')) return;
    try {
      await api(`/schedules/${row.id}`, { method: 'DELETE' });
      toast.success('Schedule deleted');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Could not delete schedule');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            setScheduleToEdit(null);
            setEditOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Permanent Schedule
        </Button>
        <Button size="sm" variant="outline" onClick={() => setTempOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Temporary Schedule
        </Button>
      </div>

      {items.length === 0 ? (
        <GlassPanel className="py-12 text-center text-muted-foreground">
          No schedules yet. Add a permanent or temporary schedule.
        </GlassPanel>
      ) : (
        <GlassPanel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Start</th>
                <th className="py-3 px-4">End</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Teacher</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${row.scheduleType}-${row.id}`} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4">{row.day}</td>
                  <td className="py-3 px-4">{row.startTime}</td>
                  <td className="py-3 px-4">{row.endTime}</td>
                  <td className="py-3 px-4">
                    {row.durationMinutes != null ? `${row.durationMinutes} min` : '—'}
                  </td>
                  <td className="py-3 px-4">{row.teacherName}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{row.scheduleType}</Badge>
                  </td>
                  <td className="py-3 px-4">{row.status}</td>
                  <td className="py-3 px-4 text-right gap-1 flex justify-end">
                    {row.scheduleType === 'Permanent' && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setScheduleToEdit(row.raw);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(row)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}

      <EditScheduleModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          load();
        }}
        teacher={teacher}
        schedule={scheduleToEdit}
        defaultStudentId={studentId}
        studentScheduleApi
      />

      <AssignTemporaryTeacherModal
        open={tempOpen}
        onClose={() => setTempOpen(false)}
        onSuccess={() => {
          setTempOpen(false);
          load();
        }}
        originalTeacherId={teacher.id}
        originalTeacherName={teacher.fullName}
        preselectedStudentIds={[studentId]}
        scopedStudentId={studentId}
      />
    </div>
  );
}
