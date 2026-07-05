import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/dashboard/design-system';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';
import { TeacherStudentProgressPanel } from '@/components/teachers/TeacherStudentProgressPanel';

function TrackSpecificSummary({ trackSpecific }: { trackSpecific: any }) {
  if (!trackSpecific?.type) return null;

  const type = trackSpecific.type;

  if (type === 'qaidah') {
    return (
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Completed topics</p>
          <p className="font-semibold">{trackSpecific.completedTopics ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total topics</p>
          <p className="font-semibold">{trackSpecific.totalTopics ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current topic</p>
          <p className="font-semibold">{trackSpecific.currentTopic || '—'}</p>
        </div>
      </div>
    );
  }

  if (type === 'quran_reading') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Surah</p>
          <p className="font-semibold">{trackSpecific.surah || '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ayah</p>
          <p className="font-semibold">{trackSpecific.ayah ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Page</p>
          <p className="font-semibold">{trackSpecific.page ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Surahs completed</p>
          <p className="font-semibold">{trackSpecific.surahsCompleted ?? 0}</p>
        </div>
      </div>
    );
  }

  if (type === 'tajweed') {
    return (
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Topics completed</p>
          <p className="font-semibold">{trackSpecific.topicsCompleted ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Remaining</p>
          <p className="font-semibold">{trackSpecific.remaining ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Evaluation score</p>
          <p className="font-semibold">{trackSpecific.evaluationScore ?? 0}%</p>
        </div>
      </div>
    );
  }

  if (type === 'hifz') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Memorized surahs</p>
          <p className="font-semibold">{trackSpecific.memorizedSurahs ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Memorized ayahs</p>
          <p className="font-semibold">{trackSpecific.memorizedAyahs ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last surah</p>
          <p className="font-semibold">{trackSpecific.lastSurah || '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Memorization</p>
          <p className="font-semibold">{trackSpecific.memorizationPercentage ?? 0}%</p>
        </div>
      </div>
    );
  }

  return null;
}

export function AdminStudentProgressTab({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<any>(`/students/${studentId}/progress`);
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <GlassPanel className="py-12 text-center text-muted-foreground">
        Could not load progress data.
      </GlassPanel>
    );
  }

  const ctx = summary.learningContext;
  const pct = summary.progressPercentage ?? 0;
  const feedback = summary.teacherFeedback || [];

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          <BookOpen className="h-4 w-4" /> Student Information
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Level</p>
            <p className="font-semibold">{summary.student?.level}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Lesson</p>
            <p className="font-semibold">
              {ctx?.currentTopic?.label || ctx?.suggestedTopic?.label || '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Progress</p>
            <p className="font-semibold">{pct}%</p>
            <ProgressBar value={pct} className="mt-2 h-2" />
          </div>
          <div>
            <p className="text-muted-foreground">Completed / Remaining</p>
            <p className="font-semibold">
              {summary.completedLessons?.length ?? 0} / {summary.remainingLessons?.length ?? 0}
            </p>
          </div>
        </div>
      </GlassPanel>

      {summary.trackSpecific && (
        <GlassPanel className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" /> Level Progress
          </div>
          <TrackSpecificSummary trackSpecific={summary.trackSpecific} />
        </GlassPanel>
      )}

      {summary.latestEvaluation?.notes && (
        <GlassPanel className="p-4 text-sm">
          <p className="font-medium mb-1">Latest Evaluation</p>
          <p className="text-muted-foreground">{summary.latestEvaluation.notes}</p>
          {summary.latestEvaluation.createdAt && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(summary.latestEvaluation.createdAt).toLocaleString()}
            </p>
          )}
        </GlassPanel>
      )}

      {feedback.length > 0 && (
        <GlassPanel className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <MessageSquare className="h-4 w-4" /> Teacher Feedback
          </div>
          <ul className="space-y-3">
            {feedback.slice(0, 5).map((f: any) => (
              <li key={f.id} className="rounded-lg border p-3 text-sm">
                <p>{f.content || f.feedback || f.notes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {f.teacher?.fullName ? `${f.teacher.fullName} · ` : ''}
                  {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}
                </p>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {summary.progressTimeline?.length > 0 && (
        <GlassPanel className="p-6 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Progress Timeline
          </p>
          <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {summary.progressTimeline.map((log: any) => (
              <li key={log.id} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                <span>{log.notes || log.topicLabel || log.action || 'Progress update'}</span>
                <span className="text-muted-foreground shrink-0">
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}
                </span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      <TeacherStudentProgressPanel studentId={studentId} studentName={studentName} />
    </div>
  );
}
