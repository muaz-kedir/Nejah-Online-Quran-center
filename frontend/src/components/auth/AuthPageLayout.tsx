import { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { GlassPanel } from '@/components/dashboard/design-system';

interface AuthPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showBack?: boolean;
  footer?: ReactNode;
}

const maxWidthClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function AuthPageLayout({
  children,
  title,
  subtitle,
  maxWidth = 'md',
  showBack = true,
  footer,
}: AuthPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col justify-center admin-shell-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 ambient-glow dark:ambient-glow-dark opacity-70" />

      <div className={`relative z-10 mx-auto w-full ${maxWidthClass[maxWidth]}`}>
        {showBack && (
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-nejah-slate-blue transition-colors hover:text-nejah-electric"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        )}

        <GlassPanel className="overflow-hidden px-8 pb-10 pt-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-nejah-electric/30 bg-nejah-surface/50 p-2 shadow-nejah-glow">
              <img src="/logo.png" alt="Nejah" className="h-11 w-11 rounded-full object-cover" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-nejah-slate-blue">{subtitle}</p>
            )}
          </div>
          {children}
        </GlassPanel>

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </div>
  );
}
