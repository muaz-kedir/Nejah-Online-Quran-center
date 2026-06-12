import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface TemporaryReplacementClassCardProps {
  assignment: {
    id: string;
    student?: { fullName?: string };
    startDate: string;
    endDate: string;
    startTimeString?: string;
    endTimeString?: string;
    meetingLink?: string;
    classSessionId?: string;
    status: string;
  };
  onStarted?: () => void;
}

export function TemporaryReplacementClassCard({
  assignment,
  onStarted,
}: TemporaryReplacementClassCardProps) {
  const [meetingLink, setMeetingLink] = useState(assignment.meetingLink || '');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(assignment.classSessionId || '');

  const handleStartClass = async () => {
    const link = meetingLink.trim();
    if (!link) {
      toast.error('Please enter a Zoom or meeting link');
      return;
    }
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      toast.error('Meeting link must start with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      const res = await api<any>(`/teacher-replacements/${assignment.id}/start-class`, {
        method: 'POST',
        body: JSON.stringify({ meetingLink: link }),
      });
      setSessionId(res.session?.id || '');
      toast.success(`Class started — ${assignment.student?.fullName || 'student'} has been notified`);
      onStarted?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start class');
    } finally {
      setLoading(false);
    }
  };

  const openClassSession = () => {
    if (sessionId) {
      window.location.href = `/class-session/${sessionId}`;
    }
  };

  return (
    <li className="text-sm text-amber-900 bg-card/80 rounded-xl px-4 py-4 border border-amber-100 space-y-3">
      <div>
        <span className="font-semibold">{assignment.student?.fullName || 'Student'}</span>
        <span className="text-amber-700 block text-xs mt-1">
          {assignment.startDate} → {assignment.endDate}
          {assignment.startTimeString && assignment.endTimeString && (
            <> · {assignment.startTimeString} – {assignment.endTimeString}</>
          )}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`zoom-${assignment.id}`} className="text-xs text-amber-800">
          Zoom / Meeting Link
        </Label>
        <Input
          id={`zoom-${assignment.id}`}
          type="url"
          placeholder="https://zoom.us/j/..."
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          className="h-9 text-sm bg-white"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading || !['upcoming', 'active'].includes(assignment.status)}
          onClick={handleStartClass}
          className="bg-amber-700 hover:bg-amber-800 text-white h-8 text-xs"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Video className="h-3 w-3 mr-1" />
          )}
          Create Class & Send Link
        </Button>
        {sessionId && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openClassSession}
            className="h-8 text-xs border-amber-200"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open Class Session
          </Button>
        )}
      </div>
    </li>
  );
}
