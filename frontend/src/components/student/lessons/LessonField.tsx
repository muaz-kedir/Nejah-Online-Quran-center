import type { ReactNode } from "react";

interface LessonFieldProps {
  label: string;
  children: ReactNode;
  colorScheme?: "default" | "amber";
  spanFull?: boolean;
}

export function LessonField({
  label,
  children,
  colorScheme = "default",
  spanFull,
}: LessonFieldProps) {
  if (colorScheme === "amber") {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl sm:col-span-2 border border-amber-100 dark:border-amber-800/50">
        <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="font-semibold text-amber-900 dark:text-amber-100">{children}</p>
      </div>
    );
  }
  return (
    <div
      className={`bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 p-4 rounded-xl border border-primary/8 ${spanFull ? "sm:col-span-2" : ""}`}
    >
      <p className="text-[10px] text-foreground font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-semibold text-foreground">{children}</p>
    </div>
  );
}
