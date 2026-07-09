import { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Loader2, Calendar, ClipboardList, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { AdminStudentScheduleTab } from '@/components/admin/AdminStudentScheduleTab';
import { AdminStudentAttendanceTab } from '@/components/admin/AdminStudentAttendanceTab';
import { AdminStudentProgressTab } from '@/components/admin/AdminStudentProgressTab';

type TabId = 'schedule' | 'attendance' | 'progress';

const TABS: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export const Route = createFileRoute('/teachers_/$id/students_/$studentId')({
  component: StudentDetailsPage,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (['schedule', 'attendance', 'progress'].includes(search.tab as string)
      ? search.tab
      : 'schedule') as TabId,
  }),
});

function StudentDetailsPage() {
  const { id: teacherId, studentId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const activeTab: TabId = tab || 'schedule';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [teacher, setTeacher] = useState<{ id: string; fullName: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, teacherData] = await Promise.all([
        api<any>(`/students/${studentId}/management-profile`),
        api<any>(`/teachers/${teacherId}`),
      ]);
      setProfile(prof);
      setTeacher({ id: teacherData.id, fullName: teacherData.fullName });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  const setTab = (t: TabId) => {
    navigate({
      to: '/teachers/$id/students/$studentId',
      params: { id: teacherId, studentId },
      search: { tab: t },
      replace: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/teachers/$id/students" params={{ id: teacherId }}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-serif">Student Details</h1>
            <p className="text-sm text-muted-foreground">Manage schedule, attendance, and progress</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !profile ? (
          <GlassPanel className="py-12 text-center text-muted-foreground">Student not found.</GlassPanel>
        ) : (
          <>
            <GlassPanel className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-semibold text-lg">{profile.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student ID</p>
                  <p className="font-mono font-medium">{profile.studentCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teacher</p>
                  <p className="font-medium">{profile.teacherName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Level</p>
                  <p className="font-medium">{profile.level}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Course</p>
                  <p className="font-medium">{profile.currentCourse}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className="capitalize mt-1">{profile.status}</Badge>
                </div>
              </div>
            </GlassPanel>

            <div className="flex flex-wrap gap-2 border-b pb-2">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeTab === t.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'schedule' && teacher && (
              <AdminStudentScheduleTab studentId={studentId} teacher={teacher} />
            )}
            {activeTab === 'attendance' && <AdminStudentAttendanceTab studentId={studentId} />}
            {activeTab === 'progress' && (
              <AdminStudentProgressTab studentId={studentId} studentName={profile.fullName} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
