/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from "@/lib/api";
import { User, Key, Save, Loader2, Camera, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RoleBadge } from '@/components/ui/role-badge';
import { PushNotificationToggle } from '@/components/ui/push-notification-toggle';
import { TelegramLink } from '@/components/ui/telegram-link';
import { useApiQuery } from '@/hooks/useApiQuery';

export const Route = createLazyFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: loading } = useApiQuery<any>({
    queryKey: ['profile'],
    path: '/users/profile',
  });

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Edit details form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await api(`/users/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ name, phone }),
      });

      toast.success('Profile updated successfully');
      localStorage.setItem('userName', name);
      window.dispatchEvent(new Event('profileUpdated'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
        if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      // Password strength: at least 6 chars, includes uppercase, lowercase, and number
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
      if (!pwdRegex.test(newPassword)) {
        toast.error('Password must contain uppercase, lowercase letters and a number, and be at least 6 characters');
        return;
      }

    setSavingPassword(true);
    try {
      await api(`/users/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-serif">{t.greeting}, {profile?.name}</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-foreground overflow-hidden">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="mt-4 text-xl font-bold text-foreground">{profile?.name}</h2>
                <p className="text-muted-foreground">{profile?.email}</p>
                {profile?.role && <div className="mt-2"><RoleBadge role={profile.role} variant="pill" /></div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingDetails} className="bg-primary hover:bg-primary">
                  {savingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your push notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <PushNotificationToggle variant="card" />
              <div className="mt-4 border-t pt-4">
                <TelegramLink />
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingPassword} className="bg-primary hover:bg-primary">
                  {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
