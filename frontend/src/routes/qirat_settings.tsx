import { API_BASE, apiUrl } from "@/lib/api";
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { PushNotificationToggle } from '@/components/ui/push-notification-toggle';
import { TelegramLink } from '@/components/ui/telegram-link';

export const Route = createFileRoute('/qirat_settings')({
  component: QiratSettingsPage,
  beforeLoad: () => requireAuth(['qirat_manager', 'super_admin', 'admin']),
});

function QiratSettingsPage() {
  const [name, setName] = useState(localStorage.getItem('userName') || '');
  const [email] = useState(localStorage.getItem('userEmail') || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const res = await fetch(apiUrl(`/users/${userId}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      localStorage.setItem('userName', name);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Account" title="Profile Settings" description="Manage your Qirat Manager profile" />
      <div className="glass-panel max-w-lg space-y-4 rounded-2xl p-6">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Email</Label><Input value={email} disabled /></div>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>
      <div className="glass-panel max-w-lg space-y-4 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-5 w-5 text-nejah-electric" />
          <p className="font-medium">Notification Settings</p>
        </div>
        <PushNotificationToggle variant="card" />
        <div className="border-t mt-4 pt-4">
          <TelegramLink />
        </div>
      </div>
    </DashboardLayout>
  );
}
