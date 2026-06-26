import {
  Bell,
  Video,
  Calendar,
  CheckCircle,
  BookOpen,
  MessageSquare,
  Award,
  FileText,
  Megaphone,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  MEETING_STARTED: Video,
  MEETING_ENDED: Video,
  ATTENDANCE_MARKED: CheckCircle,
  ATTENDANCE_CORRECTED: CheckCircle,
  CLASS_ALERT: AlertTriangle,
  CLASS_REMINDER: Calendar,
  SESSION_CANCELLED: AlertTriangle,
  SCHEDULE_CHANGED: RefreshCw,
  HOMEWORK_ASSIGNED: BookOpen,
  HOMEWORK_UPDATED: BookOpen,
  HOMEWORK_DUE_SOON: ClipboardList,
  HOMEWORK_GRADED: Award,
  TEACHER_FEEDBACK: MessageSquare,
  DAILY_PROGRESS: TrendingUp,
  EVALUATION_PUBLISHED: Award,
  EXAM_RESULTS: Award,
  RESOURCE_ADDED: FileText,
  RESOURCE_UPDATED: FileText,
  SYSTEM_ALERT: Megaphone,
  SYSTEM_ANNOUNCEMENT: Megaphone,
  MAINTENANCE: AlertTriangle,
  FEATURE_UPDATE: Megaphone,
  PAYMENT_REMINDER: DollarSign,
  PAYMENT_RECEIVED: DollarSign,
  PAYMENT_OVERDUE: DollarSign,
  STUDENT_JOINED: Bell,
  STUDENT_LEFT: Bell,
  TEMP_REPLACEMENT: RefreshCw,
};

export const NOTIFICATION_COLORS: Record<string, string> = {
  MEETING_STARTED: "text-red-500",
  MEETING_ENDED: "text-red-500",
  ATTENDANCE_MARKED: "text-green-500",
  ATTENDANCE_CORRECTED: "text-green-500",
  CLASS_ALERT: "text-amber-500",
  CLASS_REMINDER: "text-blue-500",
  SESSION_CANCELLED: "text-red-500",
  SCHEDULE_CHANGED: "text-amber-500",
  HOMEWORK_ASSIGNED: "text-indigo-500",
  HOMEWORK_UPDATED: "text-indigo-500",
  HOMEWORK_DUE_SOON: "text-amber-500",
  HOMEWORK_GRADED: "text-emerald-500",
  TEACHER_FEEDBACK: "text-purple-500",
  DAILY_PROGRESS: "text-cyan-500",
  EVALUATION_PUBLISHED: "text-emerald-500",
  EXAM_RESULTS: "text-emerald-500",
  RESOURCE_ADDED: "text-sky-500",
  RESOURCE_UPDATED: "text-sky-500",
  SYSTEM_ALERT: "text-rose-500",
  SYSTEM_ANNOUNCEMENT: "text-rose-500",
  MAINTENANCE: "text-amber-500",
  FEATURE_UPDATE: "text-rose-500",
  PAYMENT_REMINDER: "text-emerald-500",
  PAYMENT_RECEIVED: "text-green-500",
  PAYMENT_OVERDUE: "text-red-500",
  STUDENT_JOINED: "text-blue-500",
  STUDENT_LEFT: "text-blue-500",
  TEMP_REPLACEMENT: "text-amber-500",
};

export const NOTIFICATION_BG_COLORS: Record<string, string> = {
  MEETING_STARTED: "bg-red-50 dark:bg-red-950/20",
  MEETING_ENDED: "bg-red-50 dark:bg-red-950/20",
  ATTENDANCE_MARKED: "bg-green-50 dark:bg-green-950/20",
  ATTENDANCE_CORRECTED: "bg-green-50 dark:bg-green-950/20",
  CLASS_ALERT: "bg-amber-50 dark:bg-amber-950/20",
  CLASS_REMINDER: "bg-blue-50 dark:bg-blue-950/20",
  SESSION_CANCELLED: "bg-red-50 dark:bg-red-950/20",
  SCHEDULE_CHANGED: "bg-amber-50 dark:bg-amber-950/20",
  HOMEWORK_ASSIGNED: "bg-indigo-50 dark:bg-indigo-950/20",
  HOMEWORK_UPDATED: "bg-indigo-50 dark:bg-indigo-950/20",
  HOMEWORK_DUE_SOON: "bg-amber-50 dark:bg-amber-950/20",
  HOMEWORK_GRADED: "bg-emerald-50 dark:bg-emerald-950/20",
  TEACHER_FEEDBACK: "bg-purple-50 dark:bg-purple-950/20",
  DAILY_PROGRESS: "bg-cyan-50 dark:bg-cyan-950/20",
  EVALUATION_PUBLISHED: "bg-emerald-50 dark:bg-emerald-950/20",
  EXAM_RESULTS: "bg-emerald-50 dark:bg-emerald-950/20",
  RESOURCE_ADDED: "bg-sky-50 dark:bg-sky-950/20",
  RESOURCE_UPDATED: "bg-sky-50 dark:bg-sky-950/20",
  SYSTEM_ALERT: "bg-rose-50 dark:bg-rose-950/20",
  SYSTEM_ANNOUNCEMENT: "bg-rose-50 dark:bg-rose-950/20",
  MAINTENANCE: "bg-amber-50 dark:bg-amber-950/20",
  FEATURE_UPDATE: "bg-rose-50 dark:bg-rose-950/20",
  PAYMENT_REMINDER: "bg-emerald-50 dark:bg-emerald-950/20",
  PAYMENT_RECEIVED: "bg-green-50 dark:bg-green-950/20",
  PAYMENT_OVERDUE: "bg-red-50 dark:bg-red-950/20",
  STUDENT_JOINED: "bg-blue-50 dark:bg-blue-950/20",
  STUDENT_LEFT: "bg-blue-50 dark:bg-blue-950/20",
  TEMP_REPLACEMENT: "bg-amber-50 dark:bg-amber-950/20",
};

export const NOTIFICATION_ACTIONS: Record<string, { label: string; defaultPath: string }> = {
  MEETING_STARTED: { label: "Join Class", defaultPath: "" },
  MEETING_ENDED: { label: "View Details", defaultPath: "/student/classes" },
  ATTENDANCE_MARKED: { label: "View Attendance", defaultPath: "/student/progress" },
  ATTENDANCE_CORRECTED: { label: "View Attendance", defaultPath: "/student/progress" },
  CLASS_ALERT: { label: "View Schedule", defaultPath: "/student/classes" },
  CLASS_REMINDER: { label: "Go to Class", defaultPath: "/student/classes" },
  SESSION_CANCELLED: { label: "View Schedule", defaultPath: "/student/classes" },
  SCHEDULE_CHANGED: { label: "View Schedule", defaultPath: "/student/classes" },
  HOMEWORK_ASSIGNED: { label: "View Homework", defaultPath: "/student/homework" },
  HOMEWORK_UPDATED: { label: "View Homework", defaultPath: "/student/homework" },
  HOMEWORK_DUE_SOON: { label: "View Homework", defaultPath: "/student/homework" },
  HOMEWORK_GRADED: { label: "View Results", defaultPath: "/student/homework" },
  TEACHER_FEEDBACK: { label: "View Feedback", defaultPath: "/student/progress" },
  DAILY_PROGRESS: { label: "View Progress", defaultPath: "/student/progress" },
  EVALUATION_PUBLISHED: { label: "View Evaluation", defaultPath: "/student/evaluations" },
  EXAM_RESULTS: { label: "View Results", defaultPath: "/student/evaluations" },
  RESOURCE_ADDED: { label: "View Resource", defaultPath: "/student/resources" },
  RESOURCE_UPDATED: { label: "View Resource", defaultPath: "/student/resources" },
  SYSTEM_ALERT: { label: "View Details", defaultPath: "/student/notifications" },
  SYSTEM_ANNOUNCEMENT: { label: "View Details", defaultPath: "/student/notifications" },
  MAINTENANCE: { label: "Learn More", defaultPath: "/student/notifications" },
  FEATURE_UPDATE: { label: "Learn More", defaultPath: "/student/notifications" },
  PAYMENT_REMINDER: { label: "View Payments", defaultPath: "/student/notifications" },
  PAYMENT_RECEIVED: { label: "View Payments", defaultPath: "/student/notifications" },
  PAYMENT_OVERDUE: { label: "View Payments", defaultPath: "/student/notifications" },
  STUDENT_JOINED: { label: "View Class", defaultPath: "/student/classes" },
  STUDENT_LEFT: { label: "View Class", defaultPath: "/student/classes" },
  TEMP_REPLACEMENT: { label: "View Schedule", defaultPath: "/student/classes" },
};

export function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatFullDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
