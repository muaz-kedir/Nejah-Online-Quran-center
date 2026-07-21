// Zoom settings page — teachers now paste meeting links manually.
// Zoom OAuth integration has been deprecated.
import { createFileRoute } from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { requireAuth } from '@/lib/auth';

export const Route = createFileRoute('/zoom-settings')({
  ssr: false,
  component: ZoomSettingsPlaceholder,
  beforeLoad: () => requireAuth(['teacher', 'super_admin']),
});

function ZoomSettingsPlaceholder() {
  return (
    <TeacherLayout>
      <div className="flex items-center justify-center py-24 text-nejah-slate-blue">
        <p>Zoom settings are no longer required. Teachers now paste meeting links directly when scheduling sessions.</p>
      </div>
    </TeacherLayout>
  );
}
