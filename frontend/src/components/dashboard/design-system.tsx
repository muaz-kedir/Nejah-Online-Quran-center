/**
 * Nejah Admin Console — Premium Futuristic Design System
 * Reusable primitives for glassmorphism, ambient glow, and neo-Islamic framing.
 */
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/** Frosted glass panel — cards, modals, side panels */
export function GlassPanel({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        'glass-panel relative overflow-hidden rounded-2xl',
        glow && 'ring-1 ring-brand-electric/20 shadow-[0_0_24px_rgba(0,102,204,0.15)]',
        className,
      )}
    >
      {/* Subtle hex corner accent */}
      <span className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rotate-45 border border-brand-silver/10 dark:border-white/5" />
      {children}
    </div>
  );
}

/** Elegant 1px silver gradient divider */
export function SilverDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-px w-full bg-gradient-to-r from-transparent via-brand-silver/30 to-transparent',
        className,
      )}
    />
  );
}

/** Ambient radial glow wrapper for hero / page sections */
export function AmbientSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('ambient-glow relative', className)}>
      <div className="pointer-events-none absolute inset-0 dark:ambient-glow-dark opacity-80" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

/** Page header with mono subtitle + tight tracking title */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-platinum">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-medium tracking-tight text-brand-silver">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-platinum">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

/** Bento stat card with mono numbers and electric progress ring */
export function BentoStatCard({
  label,
  value,
  sub,
  icon,
  highlight = false,
  progress,
}: {
  label: string;
  value: string | number;
  sub?: ReactNode;
  icon: ReactNode;
  highlight?: boolean;
  progress?: number;
}) {
  return (
    <GlassPanel
      glow={highlight}
      className={cn(
        'group p-6 transition-all duration-300 hover:border-brand-electric/30',
        highlight && 'bg-brand-primary/20 dark:bg-brand-primary/30',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-brand-platinum">{label}</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-brand-silver">{value}</p>
          {sub && <p className="mt-1 text-xs text-brand-platinum">{sub}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-electric/20 bg-brand-electric/10 text-brand-electric transition-transform group-hover:scale-105">
          {icon}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-brand-void/50 dark:bg-black/30">
            <div
              className="h-full rounded-full bg-brand-electric shadow-[0_0_12px_rgba(0,102,204,0.5)] transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
    </GlassPanel>
  );
}

/** Panel header for data tables / widgets */
export function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-sm font-medium tracking-tight text-brand-silver">{title}</h2>
        {action}
      </div>
      <SilverDivider />
    </>
  );
}
