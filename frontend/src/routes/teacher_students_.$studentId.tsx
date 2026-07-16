import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ChevronLeft, User, BookOpen, ClipboardList, TrendingUp, Video, Loader2, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TeacherStudentHomeworkPanel } from '@/components/teachers/TeacherStudentHomeworkPanel';
import { TeacherStudentProgressPanel } from '@/components/teachers/TeacherStudentProgressPanel';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
  const [zoomConnected, setZoomConnected] = useState<boolean | null>(null);

  const activeTab: TabValue = tab || 'overview';
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionStart, setSessionStart] = useState(new Date().toISOString().slice(0, 16));
  const [sessionNotes, setSessionNotes] = useState('');
  const [schedulingSession, setSchedulingSession] = useState(false);

  const handleScheduleSession = async () => {
    setSchedulingSession(true);
    try {
      const startDate = new Date(sessionStart);
      await api('/live-sessions/with-zoom', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          scheduledStart: startDate.toISOString(),
          notes: sessionNotes || undefined,
        }),
      });
      toast.success('Zoom session created! Student has been notified.');
      setShowSessionModal(false);
      setSessionNotes('');
      setSessionStart(new Date().toISOString().slice(0, 16));
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session');
    } finally {
      setSchedulingSession(false);
    }
  };

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

    api<{ connected: boolean }>('/zoom/oauth/status')
      .then((res) => { if (!cancelled) setZoomConnected(res.connected); })
      .catch(() => { if (!cancelled) setZoomConnected(false); });

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
        className="inline-flex items-center gap-1.5 text-xs font-black text-muted-foreground hover:text-nejah-sapphire dark:hover:text-nejah-electric uppercase tracking-widest"
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
            <span className="text-sm font-bold text-nejah-sapphire text-foreground">{student.attendanceRate ?? 0}%</span>
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
          <div className="space-y-6">
            <div className="bg-card dark:bg-nejah-surface rounded-2xl border border-border dark:border-nejah-border-blue p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-nejah-sapphire text-foreground flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" /> Quick Actions
                </h2>
              </div>
              <button
                  onClick={() => setShowSessionModal(true)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-nejah-sapphire/10 to-nejah-azure/5 dark:from-nejah-sapphire/20 dark:to-nejah-azure/10 border border-nejah-sapphire/20 hover:border-nejah-sapphire/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-nejah-sapphire/20 flex items-center justify-center">
                      <Video className="h-5 w-5 text-nejah-sapphire text-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-nejah-sapphire text-foreground">Start a Session</p>
                      <p className="text-[10px] text-nejah-slate-blue font-medium">
                        Schedule a live session — student will be notified in real-time
                      </p>
                    </div>
                  </div>
                  <Sparkles className="h-5 w-5 text-nejah-sapphire text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

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

      {/* Schedule Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card dark:bg-nejah-surface rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border dark:border-white/5"
          >
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border dark:border-white/5">
              <div>
                <h3 className="text-xl font-bold font-serif">Start Session</h3>
                <p className="text-xs text-nejah-slate-blue font-medium mt-0.5">
                  A meeting will be created and {student?.fullName || 'the student'} will be notified.
                </p>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                  Student
                </Label>
                <div className="h-12 px-4 rounded-xl border border-border dark:border-white/10 bg-background text-sm font-medium flex items-center">
                  {student?.fullName || studentId}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                  Start Date & Time <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="datetime-local"
                    value={sessionStart}
                    onChange={(e) => setSessionStart(e.target.value)}
                    className="flex-1 h-12 px-4 rounded-xl border border-border dark:border-white/10 bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-nejah-electric"
                  />
                  <button
                    type="button"
                    onClick={() => setSessionStart(new Date().toISOString().slice(0, 16))}
                    className="h-12 px-4 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 transition-colors border border-border dark:border-white/10"
                  >
                    Now
                  </button>
                </div>
                <p className="text-[10px] text-nejah-slate-blue font-medium mt-1">
                  Duration is auto-set to 60 minutes. Ends when you click "End Session".
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                  Notes (optional)
                </Label>
                <Textarea
                  placeholder="Focus area, surah revision, etc."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="rounded-xl border-border dark:border-white/10 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-8 pb-8 border-t border-border dark:border-white/5 pt-6">
              <button
                onClick={() => setShowSessionModal(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <Button
                onClick={handleScheduleSession}
                disabled={schedulingSession}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-nejah-sapphire hover:bg-nejah-azure text-white gap-2"
              >
                {schedulingSession ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {schedulingSession ? 'Creating...' : 'Create & Notify Student'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
