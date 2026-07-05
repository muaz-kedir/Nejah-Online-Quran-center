import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NotificationPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
  onDismiss: () => void;
}

export function NotificationPrompt({
  open,
  onOpenChange,
  onEnable,
  onDismiss,
}: NotificationPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm" aria-describedby="notification-description">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Bell className="h-7 w-7 text-nejah-electric" />
          </div>
          <DialogTitle className="text-center text-xl font-serif font-bold">
            Stay Updated
          </DialogTitle>
          <DialogDescription id="notification-description" className="text-center">
            Get instant push notifications for class sessions, homework, and important updates.
            Would you like to enable notifications?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full gap-2 h-12 rounded-xl font-bold" onClick={onEnable}>
            <Bell className="h-5 w-5" />
            Yes, Enable Notifications
          </Button>
          <Button
            variant="ghost"
            className="w-full h-11 rounded-xl text-muted-foreground"
            onClick={onDismiss}
          >
            Not now
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1">
          You can always change this later in your profile settings.
        </p>
      </DialogContent>
    </Dialog>
  );
}
