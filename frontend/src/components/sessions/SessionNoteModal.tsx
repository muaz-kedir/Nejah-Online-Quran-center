import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/auth';
import { toast } from 'sonner';

interface SessionNoteModalProps {
  sessionId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SessionNoteModal({ sessionId, onClose, onSaved }: SessionNoteModalProps) {
  const [lessonSummary, setLessonSummary] = useState('');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [homeworkAssigned, setHomeworkAssigned] = useState('');
  const [studentPerformance, setStudentPerformance] = useState('');
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'teacher_only' | 'all'>('all');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/session-notes/session/' + sessionId, {
        method: 'POST',
        body: {
          content: content || lessonSummary || topicsCovered || 'Session notes',
          visibility,
          lessonSummary: lessonSummary || undefined,
          topicsCovered: topicsCovered || undefined,
          homeworkAssigned: homeworkAssigned || undefined,
          studentPerformance: studentPerformance || undefined,
          completionRemarks: completionRemarks || undefined,
        },
      });
      toast.success('Notes saved successfully');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-xl border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-foreground">Class Notes</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lesson Summary</label>
            <textarea
              value={lessonSummary}
              onChange={(e) => setLessonSummary(e.target.value)}
              placeholder="What was covered in this session..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topics Covered</label>
            <textarea
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              placeholder="Surah verses, Tajweed rules, etc..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Homework Assigned</label>
            <textarea
              value={homeworkAssigned}
              onChange={(e) => setHomeworkAssigned(e.target.value)}
              placeholder="Homework given to the student..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Student Performance</label>
            <textarea
              value={studentPerformance}
              onChange={(e) => setStudentPerformance(e.target.value)}
              placeholder="Progress, strengths, areas for improvement..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Remarks</label>
            <textarea
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              placeholder="Additional remarks..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visibility</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="all"
                  checked={visibility === 'all'}
                  onChange={() => setVisibility('all')}
                  className="text-primary"
                />
                <span className="text-sm">Visible to student</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="teacher_only"
                  checked={visibility === 'teacher_only'}
                  onChange={() => setVisibility('teacher_only')}
                  className="text-primary"
                />
                <span className="text-sm">Teacher only</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="rounded-xl" disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
