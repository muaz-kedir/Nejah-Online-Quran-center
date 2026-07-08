import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const roleStyles: Record<string, string> = {
  super_admin:
    'bg-purple-100 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-500/25',
  teacher:
    'bg-primary/10 text-nejah-electric border-nejah-electric/20',
  student:
    'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
  parent:
    'bg-orange-100 dark:bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-500/25',
  qirat_manager:
    'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25',
  finance_manager:
    'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/25',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  qirat_manager: 'Qirat Manager',
  finance_manager: 'Finance Manager',
};

interface RoleBadgeProps {
  role: string;
  className?: string;
  variant?: 'badge' | 'pill' | 'text';
}

export function RoleBadge({ role, className, variant = 'badge' }: RoleBadgeProps) {
  const label = roleLabels[role] || role.replace(/_/g, ' ');
  const style = roleStyles[role] || 'bg-muted text-muted-foreground border-border';

  if (variant === 'text') {
    return (
      <span className={cn('text-xs font-semibold uppercase tracking-wider', style.match(/text-\S+/g)?.[0] || 'text-muted-foreground', className)}>
        {label.toUpperCase()}
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border', style, className)}>
        {label}
      </div>
    );
  }

  return (
    <Badge className={cn('text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border', style, className)}>
      {label.toUpperCase()}
    </Badge>
  );
}

export function getRoleBadgeColor(role: string): string {
  return roleStyles[role] || 'bg-muted text-muted-foreground border-border';
}

export function getRoleLabel(role: string): string {
  return roleLabels[role] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
