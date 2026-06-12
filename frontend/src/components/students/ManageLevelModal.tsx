import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowDown, RotateCcw, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  LearningPathCard,
  LevelHistoryList,
  type LearningPathData,
  type LevelHistoryEntry,
} from '@/components/progress/LearningPathCard';

interface ManageLevelModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: { id: string; fullName?: string } | null;
}

type LevelAction = 'promote' | 'demote' | 'repeat' | 'pause' | 'resume';

export function ManageLevelModal({ open, onClose, onSuccess, student }: ManageLevelModalProps) {
  const [path, setPath] = useState<LearningPathData | null>(null);
  const [history, setHistory] = useState<LevelHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<LevelAction | null>(null);
  const [reason, setReason] = useState('');

  const fetchData = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        api<LearningPathData>(`/progress/student/${student.id}/learning-path`),
        api<LevelHistoryEntry[]>(`/progress/student/${student.id}/level-history`).catch(() => []),
      ]);
      setPath(p);
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      toast.error('Failed to load level information');
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (open) {
      setReason('');
      fetchData();
    }
  }, [open, fetchData]);

  const applyAction = async (action: LevelAction) => {
    if (!student?.id) return;
    setActing(action);
    try {
      const res = await api<{ message: string }>(`/progress/student/${student.id}/level-action`, {
        method: 'POST',
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      toast.success(res?.message || 'Level updated');
      setReason('');
      await fetchData();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply level action');
    } finally {
      setActing(null);
    }
  };

  const paused = path?.progressionPaused;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] dark:bg-nejah-surface dark:border-nejah-border-blue">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Manage Level{student?.fullName ? ` — ${student.fullName}` : ''}
          </DialogTitle>
          <DialogDescription>
            Review the learning journey and manually override automatic progression. All changes
            are recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6 max-h-[65vh] overflow-y-auto px-1">
            {path && (
              <div className="bg-muted dark:bg-nejah-surface rounded-2xl p-5">
                <LearningPathCard path={path} />
              </div>
            )}

            <div className="space-y-3">
              <div className="grid gap-2">
                <Label className="dark:text-muted-foreground">Reason (recorded in audit log)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Passed external evaluation, repeating for revision..."
                  rows={2}
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="rounded-xl bg-primary hover:bg-nejah-azure text-white"
                  disabled={!!acting}
                  onClick={() => applyAction('promote')}
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {acting === 'promote' ? 'Promoting...' : 'Promote'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={!!acting}
                  onClick={() => applyAction('demote')}
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {acting === 'demote' ? 'Demoting...' : 'Demote'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={!!acting}
                  onClick={() => applyAction('repeat')}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {acting === 'repeat' ? 'Restarting...' : 'Repeat Level'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={!!acting}
                  onClick={() => applyAction(paused ? 'resume' : 'pause')}
                >
                  {paused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                  {acting === 'pause' || acting === 'resume'
                    ? 'Saving...'
                    : paused
                      ? 'Resume Progression'
                      : 'Pause Progression'}
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-nejah-sapphire text-foreground mb-3">
                Level History
              </h4>
              <LevelHistoryList history={history} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
