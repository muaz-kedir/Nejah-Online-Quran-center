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

interface TeacherStudentProgressPanelProps {
  studentId: string;
  studentName?: string;
}

export function TeacherStudentProgressPanel({ studentId, studentName }: TeacherStudentProgressPanelProps) {
  const [progress, setProgress] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [logForm, setLogForm] = useState({ lastStudiedSurah: '', lastStudiedAyah: '' });
  const [feedbackContent, setFeedbackContent] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prog, fb] = await Promise.all([
        api<any>(`/progress/student/${studentId}`),
        api<any[]>(`/progress/student/${studentId}/feedback`).catch(() => []),
      ]);
      setProgress(prog);
      setFeedbacks(Array.isArray(fb) ? fb : []);
    } catch {
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (logForm.lastStudiedSurah) body.lastStudiedSurah = logForm.lastStudiedSurah;
      if (logForm.lastStudiedAyah) body.lastStudiedAyah = parseInt(logForm.lastStudiedAyah, 10);

      await api(`/progress/student/${studentId}/log`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast.success('Daily progress logged');
      setShowLog(false);
      setLogForm({ lastStudiedSurah: '', lastStudiedAyah: '' });
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
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setLogForm({
                  lastStudiedSurah: progress?.lastStudiedSurah || '',
                  lastStudiedAyah: String(progress?.lastStudiedAyah || ''),
                });
                setShowLog(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Log Daily Progress
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowFeedback(true)}>
              <MessageSquare className="h-3 w-3 mr-1" /> Add Feedback
            </Button>
            {feedbacks.length > 0 && (
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
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
              <p className="text-xs text-gray-400 font-bold uppercase">Last Ayah</p>
              <p className="font-bold text-emerald-950 dark:text-gray-100">{progress?.lastStudiedAyah || '—'}</p>
            </div>
          </div>
        </div>
      </div>

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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Log Daily Progress{studentName ? ` — ${studentName}` : ''}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogProgress}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="surah">Last Studied Surah</Label>
                <Input
                  id="surah"
                  value={logForm.lastStudiedSurah}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedSurah: e.target.value })}
                  placeholder="e.g. Surah Al-Fatiha"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ayah">Last Studied Ayah</Label>
                <Input
                  id="ayah"
                  type="number"
                  min={1}
                  value={logForm.lastStudiedAyah}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedAyah: e.target.value })}
                  placeholder="e.g. 7"
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Feedback History</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-80 overflow-y-auto space-y-4">
            {feedbacks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No feedback yet</p>
            ) : (
              feedbacks.map((fb) => (
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
              ))
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
