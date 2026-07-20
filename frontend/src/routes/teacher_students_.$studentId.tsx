import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/teacher_students_/$studentId')({beforeLoad: () => requireAuth(['teacher']),
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (['overview', 'homework', 'progress'].includes(search.tab as string)
      ? search.tab
      : 'overview') as TabValue
  })
});
