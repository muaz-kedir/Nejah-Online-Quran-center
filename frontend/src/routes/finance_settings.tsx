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

export const Route = createFileRoute('/finance_settings')({
  component: FinanceSettingsPage,
  beforeLoad: () => requireAuth(['finance_manager', 'super_admin']),
});

function FinanceSettingsPage() {
  const [name, setName] = useState(localStorage.getItem('userName') || '');
  const [email] = useState(localStorage.getItem('userEmail') || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
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

  const changePassword = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/users/change-password`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Account" title="Profile Settings" description="Manage your finance manager profile" />
      <div className="glass-panel max-w-lg space-y-6 rounded-2xl p-6">
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={email} disabled /></div>
          <Button onClick={saveProfile} disabled={saving}>Save Profile</Button>
        </div>
        <div className="space-y-3 border-t border-white/10 pt-6">
          <p className="font-medium">Change Password</p>
          <div><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          <Button variant="outline" onClick={changePassword} disabled={saving}>Update Password</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
