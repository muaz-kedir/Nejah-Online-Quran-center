import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress as ProgressBar } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BookOpen, Award, TrendingUp, Star, MessageSquare, Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { SurahSelect } from '@/components/progress/SurahSelect';
import { getSurahByNumber, TOTAL_MUSHAF_PAGES } from '@/lib/quran-surahs';

interface TeacherStudentProgressPanelProps {
  studentId: string;
  studentName?: string;
}

interface LogFormState {
  surahNumber: number | undefined;
  lastStudiedPage: string;
  lastStudiedAyah: string;
}

const emptyLogForm = (): LogFormState => ({
  surahNumber: undefined,
  lastStudiedPage: '',
  lastStudiedAyah: '',
});

export function TeacherStudentProgressPanel({ studentId, studentName }: TeacherStudentProgressPanelProps) {
  const [progress, setProgress] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [logForm, setLogForm] = useState<LogFormState>(emptyLogForm());
  const [feedbackContent, setFeedbackContent] = useState('');

  const selectedSurah = logForm.surahNumber ? getSurahByNumber(logForm.surahNumber) : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prog, fb, logs] = await Promise.all([
        api<any>(`/progress/student/${studentId}`),
        api<any[]>(`/progress/student/${studentId}/feedback`).catch(() => []),
        api<any[]>(`/progress/student/${studentId}/logs?limit=20`).catch(() => []),
      ]);
      setProgress(prog);
      setFeedbacks(Array.isArray(fb) ? fb : []);
      setDailyLogs(Array.isArray(logs) ? logs : []);
    } catch {
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openLogDialog = () => {
    setLogForm({
      surahNumber: progress?.surahNumber || undefined,
      lastStudiedPage: progress?.lastStudiedPage ? String(progress.lastStudiedPage) : '',
      lastStudiedAyah: progress?.lastStudiedAyah ? String(progress.lastStudiedAyah) : '',
    });
    setShowLog(true);
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.surahNumber) {
      toast.error('Please select a surah');
      return;
    }
    if (!logForm.lastStudiedPage || !logForm.lastStudiedAyah) {
      toast.error('Please enter page and ayah');
      return;
    }

    setLogLoading(true);
    try {
      const surah = getSurahByNumber(logForm.surahNumber);
      await api(`/progress/student/${studentId}/log`, {
        method: 'PATCH',
        body: JSON.stringify({
          surahNumber: logForm.surahNumber,
          lastStudiedPage: parseInt(logForm.lastStudiedPage, 10),
          lastStudiedAyah: parseInt(logForm.lastStudiedAyah, 10),
        }),
      });
      toast.success(`Daily progress logged for ${surah?.englishName || 'surah'}`);
      setShowLog(false);
      setLogForm(emptyLogForm());
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log progress');
    } finally {
      setLogLoading(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;
    setFeedbackLoading(true);
    try {
      await api(`/progress/student/${studentId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ content: feedbackContent }),
      });
      toast.success('Feedback added');
      setShowFeedback(false);
      setFeedbackContent('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    const map: Record<string, string> = {
      Beginner: 'bg-blue-100 text-blue-700',
      Intermediate: 'bg-amber-100 text-amber-700',
      Advanced: 'bg-purple-100 text-purple-700',
      Expert: 'bg-emerald-100 text-emerald-700',
    };
    return map[rank] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 dark:text-gray-100">Quran Progress</h3>
              <Badge className={getRankColor(progress?.rank || 'Beginner')}>{progress?.rank || 'Beginner'}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={openLogDialog}>
              <Plus className="h-3 w-3 mr-1" /> Log Daily Progress
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowFeedback(true)}>
              <MessageSquare className="h-3 w-3 mr-1" /> Add Feedback
            </Button>
            {(dailyLogs.length > 0 || feedbacks.length > 0) && (
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
                <History className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Memorization Progress
            </span>
            <span className="font-bold text-emerald-600">{progress?.progressPercentage || 0}%</span>
          </div>
          <ProgressBar value={progress?.progressPercentage || 0} className="h-2" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
              <Award className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
              <p className="text-xs text-gray-400 font-bold uppercase">Surahs</p>
              <p className="font-bold text-emerald-950 dark:text-gray-100">{progress?.surahsCount || 0}/114</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
              <Star className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
              <p className="text-xs text-gray-400 font-bold uppercase">Ayahs</p>
              <p className="font-bold text-emerald-950 dark:text-gray-100">{progress?.ayahsCount || 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Last Surah</p>
              <p className="font-bold text-emerald-950 dark:text-gray-100 text-sm mt-1 truncate">
                {progress?.lastStudiedSurah || '—'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Last Page</p>
              <p className="font-bold text-emerald-950 dark:text-gray-100">{progress?.lastStudiedPage || '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase">Last Ayah</p>
              <p className="font-bold text-emerald-950 dark:text-gray-100">{progress?.lastStudiedAyah || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {dailyLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="text-sm font-bold text-emerald-950 dark:text-gray-100 mb-4">Daily Log History</h4>
          <div className="space-y-3">
            {dailyLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-emerald-800">{log.surahName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {log.lastStudiedPage}, Ayah {log.lastStudiedAyah}
                  {log.teacher?.fullName ? ` · ${log.teacher.fullName}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedbacks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="text-sm font-bold text-emerald-950 dark:text-gray-100 mb-4">Recent Feedback</h4>
          <div className="space-y-3">
            {feedbacks.slice(0, 3).map((fb) => (
              <div key={fb.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-emerald-700">
                    {fb.teacher?.fullName || 'Teacher'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{fb.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showLog} onOpenChange={setShowLog}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Log Daily Progress{studentName ? ` — ${studentName}` : ''}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogProgress}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Surah</Label>
                <SurahSelect
                  value={logForm.surahNumber}
                  onChange={(surahNumber) => setLogForm({ ...logForm, surahNumber })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="page">Mushaf Page (1–{TOTAL_MUSHAF_PAGES})</Label>
                <Input
                  id="page"
                  type="number"
                  min={1}
                  max={TOTAL_MUSHAF_PAGES}
                  value={logForm.lastStudiedPage}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedPage: e.target.value })}
                  placeholder="e.g. 5"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ayah">
                  Ayah
                  {selectedSurah ? ` (max ${selectedSurah.totalAyahs} for ${selectedSurah.englishName})` : ''}
                </Label>
                <Input
                  id="ayah"
                  type="number"
                  min={1}
                  max={selectedSurah?.totalAyahs || 286}
                  value={logForm.lastStudiedAyah}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedAyah: e.target.value })}
                  placeholder="e.g. 7"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLog(false)}>Cancel</Button>
              <Button type="submit" disabled={logLoading} className="bg-emerald-900 hover:bg-emerald-800">
                {logLoading ? 'Saving...' : 'Save Progress'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Feedback{studentName ? ` — ${studentName}` : ''}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFeedback}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback Notes</Label>
                <Textarea
                  id="feedback"
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Write your feedback about the student's progress..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowFeedback(false)}>Cancel</Button>
              <Button type="submit" disabled={feedbackLoading} className="bg-emerald-900 hover:bg-emerald-800">
                {feedbackLoading ? 'Sending...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Progress History</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto space-y-4">
            {dailyLogs.length === 0 && feedbacks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No history yet</p>
            ) : (
              <>
                {dailyLogs.map((log) => (
                  <div key={log.id} className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-800 uppercase">Daily Log</span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-emerald-950">{log.surahName}</p>
                    <p className="text-sm text-gray-600">
                      Page {log.lastStudiedPage}, Ayah {log.lastStudiedAyah}
                      {log.teacher?.fullName ? ` · ${log.teacher.fullName}` : ''}
                    </p>
                  </div>
                ))}
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-700">
                        {fb.teacher?.fullName || 'Teacher'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{fb.content}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
