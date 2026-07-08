import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers_/$id')({
  component: TeacherIdLayout,
  beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
});

function TeacherIdLayout() {
  return <Outlet />;
}
