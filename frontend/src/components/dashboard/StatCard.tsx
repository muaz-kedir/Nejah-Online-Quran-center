import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  title?: string;
  value: string | number;
  label: string;
  subValue?: string;
  color: string;
  bgColor: string;
}

export function StatCard({ icon: Icon, value, label, subValue, color, bgColor }: StatCardProps) {
  return (
    <div className="glass-panel bg-card dark:bg-nejah-surface p-6 rounded-[24px] border border-border dark:border-white/5 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className={cn("p-4 rounded-2xl", bgColor)}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        {subValue && (
          <Badge
            className={cn(
              "rounded-full border-none px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
              subValue.includes("+")
                ? "bg-primary/10 text-nejah-electric"
                : subValue.includes("Next")
                  ? "bg-amber-50 text-amber-600"
                  : "bg-blue-50 text-blue-600",
            )}
          >
            {subValue}
          </Badge>
        )}
      </div>
      <div className="mt-6">
        <h3 className="text-3xl font-extrabold text-foreground font-serif leading-none">{value}</h3>
        <p className="text-sm font-semibold text-muted-foreground dark:text-nejah-slate-blue mt-2">
          {label}
        </p>
      </div>
    </div>
  );
}
