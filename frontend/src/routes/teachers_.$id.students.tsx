import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Eye, Loader2, Users, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { EditScheduleModal } from '@/components/teachers/EditScheduleModal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const getTodayName = () => DAYS[new Date().getDay()];

export const Route = createFileRoute('/teachers_/$id/students')({
  component: AssignedStudentsPage,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
});

function AssignedStudentsPage() {
  const { id: teacherId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);

  // Schedule Modal State
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null);
  const [scheduleStudentId, setScheduleStudentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsData, unassignedData] = await Promise.all([
        api<any>(`/teachers/${teacherId}/students`),
        api<any>(`/students/unassigned`).catch(() => []),
      ]);
      setTeacherName(studentsData.teacher?.fullName || 'Teacher');
      setTeacher({ id: teacherId, fullName: studentsData.teacher?.fullName || 'Teacher', students: studentsData.students || [] });
      setStudents(studentsData.students || []);
      setUnassignedStudents(Array.isArray(unassignedData) ? unassignedData : []);
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
                    <th className="py-3 px-4 font-semibold">Level</th>
                    <th className="py-3 px-4 font-semibold">Lesson</th>
                    <th className="py-3 px-4 font-semibold">Attendance</th>
                    <th className="py-3 px-4 font-semibold">Progress</th>
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
                      <td className="py-3 px-4 max-w-[180px] truncate">{s.currentLesson}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-muted dark:bg-nejah-surface rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                s.attendanceRate < 50 ? 'bg-red-500' : 'bg-primary',
                              )}
                              style={{ width: `${s.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground min-w-[32px] text-right">
                            {s.attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-muted dark:bg-nejah-surface rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 h-full rounded-full"
                              style={{ width: `${s.progressRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground min-w-[32px] text-right">
                            {s.progressRate}%
                          </span>
                        </div>
                      </td>
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
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {s.assignedDate
                          ? new Date(s.assignedDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs"
                            onClick={() => {
                              setScheduleStudentId(s.id);
                              setScheduleToEdit(null);
                              setIsEditScheduleOpen(true);
                            }}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Schedule
                          </Button>
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
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>

      <EditScheduleModal
        open={isEditScheduleOpen}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setScheduleToEdit(null);
          setScheduleStudentId(null);
        }}
        onSuccess={() => {
          setIsEditScheduleOpen(false);
          setScheduleToEdit(null);
          setScheduleStudentId(null);
          load();
        }}
        teacher={teacher}
        schedule={scheduleToEdit}
        defaultDay={getTodayName()}
        defaultStudentId={scheduleStudentId || undefined}
        unassignedStudents={unassignedStudents}
      />
    </DashboardLayout>
  );
}
