// Zoom OAuth integration has been deprecated — teachers paste meeting links manually.
import { createLazyFileRoute } from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';

export const Route = createLazyFileRoute('/zoom-settings')({
  component: () => (
    <TeacherLayout>
      <div className="flex items-center justify-center py-24 text-nejah-slate-blue">
        <p>Zoom settings are no longer required. Teachers paste meeting links directly.</p>
      </div>
    </TeacherLayout>
  ),
});
