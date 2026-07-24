import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export interface LearningPathStage {
  level: string;
  learningTrack: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  startedAt: string | null;
  completedAt: string | null;
  progressPercentage: number;
}

export interface LearningPathData {
  currentLevel: string;
  currentTrack: string;
  progressionPaused: boolean;
  promotionStatus: string;
  stages: LearningPathStage[];
}

function formatMonthYear(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export function useLearningPath(studentId?: string | null) {
  const [path, setPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<LearningPathData>(`/progress/student/${studentId}/learning-path`)
      .then(setPath)
      .catch(() => setPath(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  return { path, loading };
}

interface LearningPathCardProps {
  path: LearningPathData | null;
  compact?: boolean;
  className?: string;
}

/**
 * Learning journey stepper: Qaidah Nooraniyah → Quran Reading → Tajweed → Hifz.
 * Shows completed levels (with date ranges), the current level (with %), and
 * upcoming levels.
 */
export function LearningPathCard({ path, compact = false, className }: LearningPathCardProps) {
  if (!path?.stages?.length) return null;

  return (
    <div className={cn('w-full', className)}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Learning Path</h3>
          {path.progressionPaused && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <Pause className="h-3 w-3" /> Progression paused
            </span>
          )}
        </div>
      )}
      <div className="flex items-start">
        {path.stages.map((stage, idx) => {
          const isLast = idx === path.stages.length - 1;
          return (
            <div key={stage.level} className={cn('flex items-start', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center text-center" style={{ minWidth: compact ? 64 : 90 }}>
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center border-2',
                    compact ? 'w-8 h-8' : 'w-10 h-10',
                    stage.status === 'completed' &&
                      'bg-primary border-primary/600 text-white',
                    stage.status === 'current' &&
                      'bg-card dark:bg-nejah-surface border-primary/600 text-primary ring-4 ring-primary/100 dark:ring-primary/900',
                    stage.status === 'upcoming' &&
                      'bg-muted dark:bg-nejah-surface border-border dark:border-nejah-border-blue text-muted-foreground',
                  )}
                >
                  {stage.status === 'completed' ? (
                    <CheckCircle2 className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
                  ) : stage.status === 'current' ? (
                    <span className={cn('font-extrabold', compact ? 'text-[9px]' : 'text-[10px]')}>
                      {Math.round(stage.progressPercentage)}%
                    </span>
                  ) : (
                    <Lock className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                  )}
                </div>
                <p
                  className={cn(
                    'font-bold mt-2 leading-tight',
                    compact ? 'text-[10px]' : 'text-xs',
                    stage.status === 'current'
                      ? 'text-nejah-electric'
                      : stage.status === 'completed'
                        ? 'text-foreground dark:text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {stage.label}
                </p>
                {!compact && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {stage.status === 'completed' &&
                      `${formatMonthYear(stage.startedAt)} – ${formatMonthYear(stage.completedAt)}`}
                    {stage.status === 'current' &&
                      (stage.startedAt ? `Since ${formatMonthYear(stage.startedAt)}` : 'In progress')}
                    {stage.status === 'upcoming' && 'Upcoming'}
                  </p>
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 rounded-full',
                    compact ? 'mt-4' : 'mt-5',
                    stage.status === 'completed' ? 'bg-primary/100' : 'bg-muted dark:bg-nejah-surface',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface LevelHistoryEntry {
  id: string;
  level: string;
  learningTrack: string;
  startedAt: string | null;
  completedAt: string | null;
  status: string;
  changeType: string;
  teacherName: string | null;
  progressPercentage: number | null;
  reason: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'In Progress',
  completed: 'Completed',
  repeated: 'Repeated',
  demoted: 'Moved Back',
  paused: 'Progression Update',
};

const CHANGE_LABELS: Record<string, string> = {
  initial: 'Enrolled',
  auto_promotion: 'Automatic promotion',
  manual_promotion: 'Promoted by admin',
  manual_demotion: 'Moved back by admin',
  repeat: 'Level repeated',
  pause: 'Progression paused',
  resume: 'Progression resumed',
};

export function LevelHistoryList({ history }: { history: LevelHistoryEntry[] }) {
  if (!history?.length) {
    return <p className="text-muted-foreground text-sm">No level history yet.</p>;
  }

  return (
    <div className="space-y-4 border-l-2 border-primary/200 pl-6">
      {history.map((h) => (
        <div key={h.id} className="relative">
          <span
            className={cn(
              'absolute -left-[31px] w-3 h-3 rounded-full top-1',
              h.status === 'completed'
                ? 'bg-primary'
                : h.status === 'in_progress'
                  ? 'bg-amber-500'
                  : 'bg-muted',
            )}
          />
          <p className="font-bold text-sm text-foreground">
            {h.level}
            <span
              className={cn(
                'ml-2 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5',
                h.status === 'completed'
                  ? 'bg-primary/10 text-primary'
                  : h.status === 'in_progress'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABELS[h.status] || h.status}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatMonthYear(h.startedAt)}
            {h.completedAt ? ` – ${formatMonthYear(h.completedAt)}` : h.status === 'in_progress' ? ' – present' : ''}
            {h.teacherName ? ` · ${h.teacherName}` : ''}
            {h.progressPercentage != null ? ` · ${Math.round(h.progressPercentage)}%` : ''}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {CHANGE_LABELS[h.changeType] || h.changeType}
            {h.reason ? ` — ${h.reason}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
