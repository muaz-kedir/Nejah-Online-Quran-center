import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teachers_/$id/students_/$studentId')({beforeLoad: () => requireAuth(['super_admin', 'qirat_manager']),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (['schedule', 'attendance', 'progress'].includes(search.tab as string)
      ? search.tab
      : 'schedule') as TabId
  })
});
