import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ChevronLeft, User, Mail, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TeacherStudentHomeworkPanel } from '@/components/teachers/TeacherStudentHomeworkPanel';
import { TeacherStudentProgressPanel } from '@/components/teachers/TeacherStudentProgressPanel';
import { toast } from 'sonner';

type TabValue = 'overview' | 'homework' | 'progress';

const TAB_ITEMS: { id: TabValue; label: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'homework', label: 'Homework', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export const Route = createFileRoute('/teacher_students_/$studentId')({
  component: TeacherStudentDetailPage,
  beforeLoad: () => requireAuth(['teacher']),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (['overview', 'homework', 'progress'].includes(search.tab as string)
      ? search.tab
      : 'overview') as TabValue,
  }),
});

function TeacherStudentDetailPage() {
  return (
    <DashboardLayout>
      <TeacherStudentDetailContent />
    </DashboardLayout>
  );
}

function TeacherStudentDetailContent() {
  const { studentId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab: TabValue = tab || 'overview';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<any>(`/teachers/students/${studentId}`);
        if (!cancelled) setStudent(data);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load student');
          toast.error(err.message || 'You do not have access to this student');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const setTab = (next: TabValue) => {
    navigate({
      to: '/teacher_students/$studentId',
      params: { studentId },
      search: { tab: next },
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-900" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
        <p className="text-red-600 mb-4">{error || 'Student not found'}</p>
        <Link to="/teacher_students" className="text-sm font-bold text-emerald-700 hover:underline">
          Back to Students Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/teacher_students"
        className="inline-flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-emerald-800 uppercase tracking-widest"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Students Directory
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center font-bold text-2xl text-emerald-800 dark:text-emerald-300 shrink-0">
            {student.fullName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 dark:text-gray-100 font-serif">
                {student.fullName}
              </h1>
              {student.isTemporaryAssignment && (
                <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] uppercase">
                  Temporary Assignment
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="h-4 w-4" /> {student.email || '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1">
              {student.level || '—'}
            </Badge>
            <Badge
              className={cn(
                'px-3 py-1',
                student.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-600',
              )}
            >
              {student.status || '—'}
            </Badge>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 max-w-xs">
            <span className="text-xs font-bold text-gray-400 uppercase">Attendance</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${student.attendanceRate || 0}%` }}
              />
            </div>
            <span className="text-sm font-bold text-emerald-800">{student.attendanceRate ?? 0}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div
          role="tablist"
          className="inline-flex flex-wrap gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-1"
        >
          {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setTab(id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'bg-emerald-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div
            role="tabpanel"
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
          >
            <h2 className="text-lg font-bold text-emerald-950 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" /> Student Profile
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Full Name</dt>
                <dd className="font-medium text-emerald-950 dark:text-gray-100 mt-1">{student.fullName || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Email</dt>
                <dd className="font-medium mt-1">{student.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gender</dt>
                <dd className="font-medium mt-1">
                  {student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Quran Level</dt>
                <dd className="font-medium mt-1">{student.level || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Status</dt>
                <dd className="font-medium mt-1 capitalize">{student.status || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Student Code</dt>
                <dd className="font-medium mt-1">{student.studentCode || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Parent</dt>
                <dd className="font-medium mt-1">{student.parent?.fullName || student.parentName || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wider">Parent Phone</dt>
                <dd className="font-medium mt-1">{student.parent?.phone || '—'}</dd>
              </div>
              {student.temporaryReplacement && (
                <div className="md:col-span-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100">
                  <dt className="text-amber-800 text-xs font-bold uppercase">Temporary Replacement</dt>
                  <dd className="text-sm text-amber-900 mt-1">
                    Covering for {student.temporaryReplacement?.originalTeacher?.fullName || 'original teacher'}{' '}
                    until {student.temporaryReplacement?.endDate}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {activeTab === 'homework' && (
          <div role="tabpanel">
            <TeacherStudentHomeworkPanel studentId={studentId} />
          </div>
        )}

        {activeTab === 'progress' && (
          <div role="tabpanel">
            <TeacherStudentProgressPanel studentId={studentId} studentName={student.fullName} />
          </div>
        )}
      </div>
    </div>
  );
}
