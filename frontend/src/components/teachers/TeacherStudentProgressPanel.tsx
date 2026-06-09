import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress as ProgressBar } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { BookOpen, Award, TrendingUp, Star, MessageSquare, Plus, History, Play, Pause, Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { SurahSelect } from '@/components/progress/SurahSelect';
import { TopicSelect, type TopicOption } from '@/components/progress/TopicSelect';
import { LearningPathCard, type LearningPathData } from '@/components/progress/LearningPathCard';
import { getSurahByNumber, TOTAL_MUSHAF_PAGES } from '@/lib/quran-surahs';

type LearningTrack = 'qaidah' | 'quran_reading' | 'tajweed' | 'hifz';

interface LearningContext {
  learningTrack: LearningTrack;
  learningTrackLabel: string;
  studentLevel: string;
  topics: TopicOption[];
  completedTopicIds: string[];
  currentTopic: TopicOption | null;
  suggestedTopic: TopicOption | null;
  progressSummary: {
    completed: number;
    total: number;
    remaining: number;
    percentage: number;
  };
  promotionStatus?: string;
  progressionPaused?: boolean;
  lastPosition: {
    surahNumber?: number;
    lastStudiedSurah?: string;
    lastStudiedPage?: number;
    lastStudiedAyah?: number;
    currentTopicId?: string;
  };
  progress: {
    progressPercentage: number;
    rank: string;
    surahsCount: number;
    ayahsCount: number;
  };
}

interface TeacherStudentProgressPanelProps {
  studentId: string;
  studentName?: string;
}

interface LogFormState {
  topicId: string;
  surahNumber: number | undefined;
  lastStudiedPage: string;
  startAyah: string;
  endAyah: string;
  memorizationStatus: string;
  revisionStatus: string;
  notes: string;
  isReview: boolean;
}

const emptyLogForm = (): LogFormState => ({
  topicId: '',
  surahNumber: undefined,
  lastStudiedPage: '',
  startAyah: '',
  endAyah: '',
  memorizationStatus: 'new',
  revisionStatus: 'not_started',
  notes: '',
  isReview: false,
});

function formatLogEntry(log: any): { title: string; detail: string } {
  if (log.topicName) {
    const ar = log.topicNameAr ? ` (${log.topicNameAr})` : '';
    return {
      title: log.topicName + ar,
      detail: [
        log.completionStatus ? `Status: ${log.completionStatus}` : null,
        log.isReview ? 'Review session' : null,
        log.notes || null,
        log.teacher?.fullName ? `Teacher: ${log.teacher.fullName}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }

  const ayahRange =
    log.startAyah && log.endAyah && log.startAyah !== log.endAyah
      ? `Ayah ${log.startAyah}–${log.endAyah}`
      : `Ayah ${log.lastStudiedAyah || log.endAyah || '—'}`;

  const parts = [
    log.lastStudiedPage ? `Page ${log.lastStudiedPage}` : null,
    ayahRange,
    log.memorizationStatus ? `Memorization: ${log.memorizationStatus}` : null,
    log.revisionStatus ? `Revision: ${log.revisionStatus}` : null,
    log.notes || null,
    log.teacher?.fullName ? log.teacher.fullName : null,
  ].filter(Boolean);

  return {
    title: log.surahName || 'Quran lesson',
    detail: parts.join(' · '),
  };
}

export function TeacherStudentProgressPanel({ studentId, studentName }: TeacherStudentProgressPanelProps) {
  const [context, setContext] = useState<LearningContext | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [promoting, setPromoting] = useState(false);
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
  
  // Session tracking for Quran reading level
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionProgress, setSessionProgress] = useState(0);
  const sessionRef = useRef<NodeJS.Timeout | null>(null);

  const track = context?.learningTrack || 'quran_reading';
  const selectedSurah = logForm.surahNumber ? getSurahByNumber(logForm.surahNumber) : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ctx, fb, logs, path] = await Promise.all([
        api<LearningContext>(`/progress/student/${studentId}/learning-context`),
        api<any[]>(`/progress/student/${studentId}/feedback`).catch(() => []),
        api<any[]>(`/progress/student/${studentId}/logs?limit=50`).catch(() => []),
        api<LearningPathData>(`/progress/student/${studentId}/learning-path`).catch(() => null),
      ]);
      setContext(ctx);
      setLearningPath(path);
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

  // Session timer effect
  useEffect(() => {
    if (sessionActive) {
      sessionRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
        
        // Progress increase calculation: 
        // For quran_reading track, assume 15 minutes for full surah = 100% progress
        // So 1 minute = ~0.67% progress
        const progressPerSecond = 0.67 / 60; // ~0.67% per minute
        setSessionProgress((prev) => Math.min(prev + progressPerSecond, 100));
      }, 1000);
    } else {
      if (sessionRef.current) {
        clearInterval(sessionRef.current);
        sessionRef.current = null;
      }
    }
    return () => {
      if (sessionRef.current) {
        clearInterval(sessionRef.current);
      }
    };
  }, [sessionActive]);

  const openLogDialog = () => {
    const lp = context?.lastPosition;
    const suggested = context?.suggestedTopic?.id || context?.currentTopic?.id || '';

    setLogForm({
      topicId: suggested,
      surahNumber: lp?.surahNumber || undefined,
      lastStudiedPage: lp?.lastStudiedPage ? String(lp.lastStudiedPage) : '',
      startAyah: lp?.lastStudiedAyah ? String(lp.lastStudiedAyah) : '',
      endAyah: lp?.lastStudiedAyah ? String(lp.lastStudiedAyah) : '',
      memorizationStatus: 'new',
      revisionStatus: 'not_started',
      notes: '',
      isReview: false,
    });
    setShowLog(true);
  };

  const buildLogPayload = () => {
    const base = {
      notes: logForm.notes || undefined,
      isReview: logForm.isReview,
      completionStatus: logForm.isReview ? 'review' : 'completed',
    };

    if (track === 'qaidah' || track === 'tajweed') {
      return { ...base, topicId: logForm.topicId };
    }

    if (track === 'quran_reading') {
      return {
        ...base,
        surahNumber: logForm.surahNumber,
        lastStudiedPage: parseInt(logForm.lastStudiedPage, 10),
        startAyah: parseInt(logForm.startAyah, 10),
        lastStudiedAyah: parseInt(logForm.endAyah, 10),
        endAyah: parseInt(logForm.endAyah, 10),
      };
    }

    return {
      ...base,
      surahNumber: logForm.surahNumber,
      startAyah: parseInt(logForm.startAyah, 10),
      lastStudiedAyah: parseInt(logForm.endAyah, 10),
      endAyah: parseInt(logForm.endAyah, 10),
      memorizationStatus: logForm.memorizationStatus,
      revisionStatus: logForm.revisionStatus,
    };
  };

  const startSession = () => {
    setSessionActive(true);
    setSessionProgress(0);
    setSessionTime(0);
  };

  const pauseSession = () => {
    setSessionActive(false);
  };

  const resetSession = () => {
    setSessionActive(false);
    setSessionProgress(0);
    setSessionTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();

    // For quran_reading track, use session progress for final calculation
    if (track === 'quran_reading' && sessionActive) {
      // Calculate final progress based on time spent
      const finalProgress = sessionProgress;
      
      // Add session metadata to notes
      const timeSpent = formatTime(sessionTime);
      setLogForm({
        ...logForm,
        notes: `${logForm.notes}\n\nSession Duration: ${timeSpent}\nEstimated Progress: ${finalProgress.toFixed(1)}%`
      });
      
      // Reset session after logging
      resetSession();
    }

    if ((track === 'qaidah' || track === 'tajweed') && !logForm.topicId) {
      toast.error('Please select a topic');
      return;
    }

    if ((track === 'quran_reading' || track === 'hifz') && !logForm.surahNumber) {
      toast.error('Please select a surah');
      return;
    }

    if (track === 'quran_reading') {
      if (!logForm.lastStudiedPage || !logForm.startAyah || !logForm.endAyah) {
        toast.error('Please enter page and ayah range');
        return;
      }
    }

    if (track === 'hifz') {
      if (!logForm.startAyah || !logForm.endAyah) {
        toast.error('Please enter starting and ending ayah');
        return;
      }
    }

    setLogLoading(true);
    try {
      await api(`/progress/student/${studentId}/log`, {
        method: 'PATCH',
        body: JSON.stringify(buildLogPayload()),
      });
      toast.success('Daily progress logged');
      setShowLog(false);
      setLogForm(emptyLogForm());
      fetchData();
      resetSession(); // Reset session after logging
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

  const handleRecommendPromotion = async () => {
    setPromoting(true);
    try {
      await api(`/progress/student/${studentId}/recommend-promotion`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teacher evaluation passed' }),
      });
      toast.success('Student promoted to the next level');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to promote student');
    } finally {
      setPromoting(false);
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

  const progressPct = context?.progressSummary?.percentage ?? context?.progress?.progressPercentage ?? 0;
  const rank = context?.progress?.rank || 'Beginner';

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      {learningPath && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <LearningPathCard path={learningPath} compact />
        </div>
      )}

      {context?.promotionStatus === 'ready' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              {studentName || 'This student'} completed all {context.learningTrackLabel} topics
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Pass the evaluation to promote them to the next level.
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
            disabled={promoting}
            onClick={handleRecommendPromotion}
          >
            <Award className="h-3 w-3 mr-1" />
            {promoting ? 'Promoting...' : 'Pass Evaluation & Promote'}
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950 dark:text-gray-100">
                {context?.learningTrackLabel || 'Learning Progress'}
              </h3>
              <div className="flex gap-2 mt-1">
                <Badge className={getRankColor(rank)}>{rank}</Badge>
                {context?.studentLevel ? (
                  <Badge variant="outline">{context.studentLevel}</Badge>
                ) : null}
              </div>
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
              <TrendingUp className="h-4 w-4" /> Progress
            </span>
            <span className="font-bold text-emerald-600">{progressPct}%</span>
          </div>
          <ProgressBar value={progressPct} className="h-2" />

          {track === 'qaidah' || track === 'tajweed' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Award className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs text-gray-400 font-bold uppercase">Completed</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100">
                  {context?.progressSummary.completed || 0}/{context?.progressSummary.total || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Star className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs text-gray-400 font-bold uppercase">Remaining</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100">
                  {context?.progressSummary.remaining || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 col-span-2 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase">Current Topic</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100 text-sm mt-1 truncate">
                  {context?.currentTopic?.nameEn || context?.suggestedTopic?.nameEn || '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Award className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs text-gray-400 font-bold uppercase">Surahs</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100">
                  {context?.completedTopicIds?.filter((id) => id.startsWith('surah-')).length ?? 0}/114
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Star className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs text-gray-400 font-bold uppercase">Ayahs</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100">
                  {context?.progress?.ayahsCount || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase">Last Surah</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100 text-sm mt-1 truncate">
                  {context?.lastPosition?.lastStudiedSurah || '—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase">Last Page</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100">
                  {context?.lastPosition?.lastStudiedPage || '—'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase">Last Ayah</p>
                <p className="font-bold text-emerald-950 dark:text-gray-100">
                  {context?.lastPosition?.lastStudiedAyah || '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Timer for Quran Reading Level */}
      {track === 'quran_reading' && (
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl border border-emerald-800 dark:border-emerald-900 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center">
                {sessionActive ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg">Session Timer</h4>
                <p className="text-xs text-emerald-200">
                  Track time and auto-increase progress
                </p>
              </div>
            </div>
            <div className="text-3xl font-mono font-bold tabular-nums">
              {formatTime(sessionTime)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-950/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-300">Progress</span>
                <span className="text-sm font-bold">{sessionProgress.toFixed(1)}%</span>
              </div>
              <ProgressBar value={sessionProgress} className="h-1.5 bg-emerald-800" />
            </div>
            <div className="bg-emerald-950/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-300">Session Status</span>
                <span className={cn(
                  "text-xs font-bold px-2 py-1 rounded-lg",
                  sessionActive 
                    ? "bg-emerald-500 text-white" 
                    : "bg-gray-500 dark:bg-gray-600 text-white"
                )}>
                  {sessionActive ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!sessionActive ? (
              <Button 
                onClick={startSession} 
                className="flex-1 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-xl"
              >
                <Play className="h-4 w-4 mr-2" /> Start Session
              </Button>
            ) : (
              <Button 
                onClick={pauseSession} 
                className="flex-1 bg-amber-500 text-white hover:bg-amber-600 font-bold rounded-xl"
              >
                <Pause className="h-4 w-4 mr-2" /> Pause Session
              </Button>
            )}
            {sessionTime > 0 && (
              <Button 
                onClick={resetSession} 
                variant="outline"
                className="border-emerald-700 text-emerald-300 hover:bg-emerald-900 rounded-xl"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {dailyLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="text-sm font-bold text-emerald-950 dark:text-gray-100 mb-4">Daily Log History</h4>
          <div className="space-y-3">
            {dailyLogs.slice(0, 5).map((log) => {
              const entry = formatLogEntry(log);
              return (
                <div
                  key={log.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-emerald-800">{entry.title}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{entry.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {feedbacks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h4 className="text-sm font-bold text-emerald-950 dark:text-gray-100 mb-4">Recent Feedback</h4>
          <div className="space-y-3">
            {feedbacks.slice(0, 3).map((fb) => (
              <div
                key={fb.id}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
              >
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Log Daily Progress{studentName ? ` — ${studentName}` : ''}
            </DialogTitle>
            <DialogDescription>
              {context?.learningTrackLabel} · Auto-selected based on student program
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogProgress}>
            <div className="grid gap-4 py-4">
              {(track === 'qaidah' || track === 'tajweed') && (
                <>
                  {context?.suggestedTopic && !logForm.isReview ? (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-3 py-2 text-sm text-emerald-800">
                      Suggested next lesson: <strong>{context.suggestedTopic.nameEn}</strong>
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Label>Topic</Label>
                    <TopicSelect
                      topics={context?.topics || []}
                      value={logForm.topicId}
                      onChange={(topicId) => setLogForm({ ...logForm, topicId })}
                      allowCompleted={logForm.isReview}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isReview"
                      checked={logForm.isReview}
                      onCheckedChange={(checked) =>
                        setLogForm({ ...logForm, isReview: checked === true })
                      }
                    />
                    <Label htmlFor="isReview" className="font-normal cursor-pointer">
                      Review session (allow selecting completed topics)
                    </Label>
                  </div>
                </>
              )}

              {(track === 'quran_reading' || track === 'hifz') && (
                <>
                  <div className="grid gap-2">
                    <Label>Surah</Label>
                    <SurahSelect
                      value={logForm.surahNumber}
                      onChange={(surahNumber) => setLogForm({ ...logForm, surahNumber })}
                      completedSurahs={context?.completedTopicIds
                        .filter(id => id.startsWith('surah-'))
                        .map(id => parseInt(id.replace('surah-', ''))) || []}
                    />
                  </div>
                  {track === 'quran_reading' && (
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
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="startAyah">
                        Starting Ayah
                        {selectedSurah ? ` (1–${selectedSurah.totalAyahs})` : ''}
                      </Label>
                      <Input
                        id="startAyah"
                        type="number"
                        min={1}
                        max={selectedSurah?.totalAyahs || 286}
                        value={logForm.startAyah}
                        onChange={(e) => setLogForm({ ...logForm, startAyah: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endAyah">Ending Ayah</Label>
                      <Input
                        id="endAyah"
                        type="number"
                        min={1}
                        max={selectedSurah?.totalAyahs || 286}
                        value={logForm.endAyah}
                        onChange={(e) => setLogForm({ ...logForm, endAyah: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {track === 'hifz' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Memorization Status</Label>
                    <Select
                      value={logForm.memorizationStatus}
                      onValueChange={(v) => setLogForm({ ...logForm, memorizationStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New memorization</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="memorized">Memorized</SelectItem>
                        <SelectItem value="needs_review">Needs review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Revision Status</Label>
                    <Select
                      value={logForm.revisionStatus}
                      onValueChange={(v) => setLogForm({ ...logForm, revisionStatus: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not started</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Lesson notes, observations..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLog(false)}>
                Cancel
              </Button>
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
            <DialogDescription>Share notes about the student's performance.</DialogDescription>
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
              <Button type="button" variant="outline" onClick={() => setShowFeedback(false)}>
                Cancel
              </Button>
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
            <DialogDescription>All logged lessons and feedback for this student.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto space-y-4">
            {dailyLogs.length === 0 && feedbacks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No history yet</p>
            ) : (
              <>
                {dailyLogs.map((log) => {
                  const entry = formatLogEntry(log);
                  return (
                    <div
                      key={log.id}
                      className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-800 uppercase">Daily Log</span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-emerald-950">{entry.title}</p>
                      <p className="text-sm text-gray-600">{entry.detail}</p>
                    </div>
                  );
                })}
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700"
                  >
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
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
