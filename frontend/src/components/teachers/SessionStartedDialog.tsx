import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Copy, ExternalLink, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface NotificationSummary {
  studentCount: number;
  parentCount: number;
  warnings: string[];
}

interface SessionStartedDialogProps {
  open: boolean;
  onClose: () => void;
  onGoToClassroom: () => void;
  session: {
    title: string;
    studentName: string;
  };
  meetingLink: string | null;
  notificationSummary: NotificationSummary;
}

export function SessionStartedDialog({
  open,
  onClose,
  onGoToClassroom,
  session,
  meetingLink,
  notificationSummary,
}: SessionStartedDialogProps) {
  const handleCopyLink = async () => {
    if (!meetingLink) return;
    try {
      await navigator.clipboard.writeText(meetingLink);
      toast.success("Meeting link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenMeeting = () => {
    if (!meetingLink) return;
    window.open(meetingLink, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-serif">
                Live Session Started
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {session.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-2xl bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notifications Dispatched</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {notificationSummary.studentCount} student{notificationSummary.studentCount !== 1 ? "s" : ""} notified
              </Badge>
              {notificationSummary.parentCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {notificationSummary.parentCount} parent{notificationSummary.parentCount !== 1 ? "s" : ""} notified
                </Badge>
              )}
            </div>

            {notificationSummary.warnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Some notification channels reported temporary issues. Students may still receive notifications through other available channels.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:gap-2">
          {meetingLink && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="rounded-xl flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenMeeting}
                className="rounded-xl flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Meeting
              </Button>
            </div>
          )}
          <Button
            onClick={onGoToClassroom}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full"
          >
            Go to Classroom
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
