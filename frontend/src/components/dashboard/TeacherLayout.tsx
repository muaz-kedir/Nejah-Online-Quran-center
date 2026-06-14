import { memo, ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';
import { TeacherSidebar } from './TeacherSidebar';
import { cn } from '@/lib/utils';

interface TeacherLayoutProps {
  children: ReactNode;
}

export const TeacherLayout = memo(function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-nejah-midnight transition-colors duration-300">
      <TeacherSidebar activePath={location.pathname} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden ml-64">
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
});
