import { memo, ReactNode, useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { TeacherPortalLayout } from '../teachers/TeacherPortalLayout';

interface TeacherLayoutProps {
  children: ReactNode;
}

export const TeacherLayout = memo(function TeacherLayout({ children }: TeacherLayoutProps) {
  const location = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') || 'Teacher');
    }
  }, []);

  return (
    <TeacherPortalLayout
      activePath={location.pathname}
      teacher={{ name: userName }}
    >
      <main className="relative flex-1 p-4 sm:p-6 lg:p-10">
        <div className="pointer-events-none absolute inset-0 ambient-glow dark:ambient-glow-dark opacity-60" />
        <div className="relative z-10">{children}</div>
      </main>
    </TeacherPortalLayout>
  );
});
