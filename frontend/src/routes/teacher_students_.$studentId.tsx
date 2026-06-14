import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
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
    <TeacherLayout>
      <TeacherStudentDetailContent />
    </TeacherLayout>
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nejah-border-blue" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-lg mx-auto bg-card dark:bg-nejah-surface rounded-2xl p-8 text-center border border-border dark:border-nejah-border-blue">
        <p className="text-red-600 mb-4">{error || 'Student not found'}</p>
        <Link to="/teacher_students" className="text-sm font-bold text-primary hover:underline">
          Back to Students Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/teacher_students"
        className="inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-nejah-sapphire uppercase tracking-widest"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Students Directory
      </Link>

      <div className="bg-card dark:bg-nejah-surface rounded-3xl border border-border dark:border-nejah-border-blue p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface dark:to-nejah-surface flex items-center justify-center font-bold text-2xl text-nejah-sapphire text-nejah-electric shrink-0">
            {student.fullName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-nejah-sapphire text-foreground font-serif">
                {student.fullName}
              </h1>
              {student.isTemporaryAssignment && (
                <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] uppercase">
                  Temporary Assignment
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" /> {student.email || '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric px-3 py-1">
              {student.level || '—'}
            </Badge>
            <Badge
              className={cn(
                'px-3 py-1',
                student.status === 'active'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {student.status || '—'}
            </Badge>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border dark:border-nejah-border-blue">
          <div className="flex items-center gap-3 max-w-xs">
            <span className="text-xs font-bold text-muted-foreground uppercase">Attendance</span>
            <div className="flex-1 bg-muted dark:bg-nejah-surface h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${student.attendanceRate || 0}%` }}
              />
            </div>
            <span className="text-sm font-bold text-nejah-sapphire">{student.attendanceRate ?? 0}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div
          role="tablist"
          className="inline-flex flex-wrap gap-1 bg-card dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl p-1"
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
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-nejah-surface',
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
            className="bg-card dark:bg-nejah-surface rounded-2xl border border-border dark:border-nejah-border-blue p-6"
          >
            <h2 className="text-lg font-bold text-nejah-sapphire text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Student Profile
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Full Name</dt>
                <dd className="font-medium text-nejah-sapphire text-foreground mt-1">{student.fullName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Email</dt>
                <dd className="font-medium mt-1">{student.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Gender</dt>
                <dd className="font-medium mt-1">
                  {student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Quran Level</dt>
                <dd className="font-medium mt-1">{student.level || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Status</dt>
                <dd className="font-medium mt-1 capitalize">{student.status || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Student Code</dt>
                <dd className="font-medium mt-1">{student.studentCode || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Parent</dt>
                <dd className="font-medium mt-1">{student.parent?.fullName || student.parentName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Parent Phone</dt>
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
