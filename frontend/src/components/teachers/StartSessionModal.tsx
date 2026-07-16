import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink, Video, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StartSessionModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (meetingLink?: string) => Promise<void>;
  session: {
    title: string;
    studentName: string;
    startTime: string;
    endTime: string;
  };
}

export function StartSessionModal({
  open,
  onClose,
  onStart,
  session,
}: StartSessionModalProps) {
  const [meetingLink, setMeetingLink] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleStart = async () => {
    if (meetingLink && !validateUrl(meetingLink)) {
      setError("Please enter a valid HTTPS URL (e.g., https://meet.google.com/...)");
      return;
    }

    setStarting(true);
    setError("");
    try {
      await onStart(meetingLink || undefined);
      setMeetingLink("");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to start session");
    } finally {
      setStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-serif">
            Start Live Session
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Paste a meeting link from any provider (Zoom, Google Meet, Teams, Jitsi, etc.)
            or start without one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-2xl bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{session.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {session.studentName} &middot; {session.startTime} – {session.endTime}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Meeting Link
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              placeholder="https://meet.google.com/abc-defg-hij"
              value={meetingLink}
              onChange={(e) => {
                setMeetingLink(e.target.value);
                setError("");
              }}
              className={cn(
                "rounded-xl",
                error && "border-red-500 focus-visible:ring-red-500",
              )}
            />
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Works with Zoom, Google Meet, Microsoft Teams, Jitsi, Skype, or any HTTPS meeting URL.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={starting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={starting}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600"
          >
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Video className="h-4 w-4 mr-2" />
            )}
            Start & Notify Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
