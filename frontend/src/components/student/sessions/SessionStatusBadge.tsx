import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Radio, Clock, CheckCircle2, XCircle } from "lucide-react";

type SessionStatus = "LIVE" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "EXPIRED";

const statusConfig: Record<
  SessionStatus,
  { label: string; icon: React.ElementType; className: string; dotClassName?: string }
> = {
  LIVE: {
    label: "Live Now",
    icon: Radio,
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50",
    dotClassName: "bg-red-500 animate-pulse",
  },
  SCHEDULED: {
    label: "Upcoming",
    icon: Clock,
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-gray-200 dark:bg-gray-800/30 dark:text-muted-foreground dark:border-gray-700/50",
  },
  NO_SHOW: {
    label: "No Show",
    icon: XCircle,
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50",
  },
  EXPIRED: {
    label: "Expired",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-gray-200 dark:bg-gray-800/30 dark:text-muted-foreground dark:border-gray-700/50",
  },
};

export function SessionStatusBadge({
  status,
  className,
  size = "default",
}: {
  status: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const key = (status || "SCHEDULED").toUpperCase() as SessionStatus;
  const config = statusConfig[key] || statusConfig.SCHEDULED;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        config.className,
        className,
      )}
    >
      {key === "LIVE" && config.dotClassName ? (
        <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClassName)} />
      ) : (
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {config.label}
    </Badge>
  );
}
