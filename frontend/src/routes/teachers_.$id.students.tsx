import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Eye, Loader2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/teachers_/$id/students')({
  component: AssignedStudentsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'qirat_manager']),
});

function AssignedStudentsPage() {
  const { id: teacherId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<any>(`/teachers/${teacherId}/students`);
      setTeacherName(data.teacher?.fullName || 'Teacher');
      setStudents(data.students || []);
    } catch (e: any) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/teachers/$id/profile" params={{ id: teacherId }}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader
            title="Assigned Students"
            description={`Students assigned to ${teacherName}`}
            icon={Users}
          />
        </div>

        <GlassPanel className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No assigned students</p>
              <p className="text-sm mt-1">Assign students from the teacher profile or student management.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold">Current Learning Level</th>
                    <th className="py-3 px-4 font-semibold">Current Lesson</th>
                    <th className="py-3 px-4 font-semibold">Country</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Assigned Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4 font-semibold text-foreground">{s.fullName}</td>
                      <td className="py-3 px-4 font-mono text-xs">{s.studentCode}</td>
                      <td className="py-3 px-4">{s.level}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{s.currentLesson}</td>
                      <td className="py-3 px-4">{s.country}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={cn(
                            'capitalize',
                            s.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {s.assignedDate
                          ? new Date(s.assignedDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            navigate({
                              to: '/teachers/$id/students/$studentId',
                              params: { id: teacherId, studentId: s.id },
                              search: { tab: 'schedule' },
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </DashboardLayout>
  );
}
