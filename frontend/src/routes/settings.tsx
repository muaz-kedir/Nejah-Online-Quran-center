import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Bell, Shield, Database, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { AmbientSection, PageHeader } from '@/components/dashboard/design-system';
import { PushNotificationToggle } from '@/components/ui/push-notification-toggle';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function SettingsPage() {
  const [emailReports, setEmailReports] = useState(true);
  const [autoAttendance, setAutoAttendance] = useState(false);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <DashboardLayout>
      <AmbientSection>
        <Breadcrumbs />
        <PageHeader
          eyebrow="Configuration"
          title="System Settings"
          description="Configure system preferences and options"
        />

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="glass-panel">
            <TabsTrigger value="general"><Globe className="mr-2 h-4 w-4" /> General</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Security</TabsTrigger>
            <TabsTrigger value="database"><Database className="mr-2 h-4 w-4" /> Database</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic platform information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input defaultValue="Nejah Online Quran Center" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input defaultValue="admin@nejah.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Platform Description</Label>
                  <Input defaultValue="Online Quran learning platform" />
                </div>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage push, email, and in-app notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <PushNotificationToggle variant="card" />
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Email Reports</Label>
                      <p className="text-sm text-nejah-slate-blue">Receive weekly reports via email</p>
                    </div>
                    <Switch checked={emailReports} onCheckedChange={setEmailReports} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Auto Attendance Alerts</Label>
                      <p className="text-sm text-nejah-slate-blue">Alert parents when student is absent</p>
                    </div>
                    <Switch checked={autoAttendance} onCheckedChange={setAutoAttendance} />
                  </div>
                </div>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage authentication and access control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JWT Secret Rotation</Label>
                  <Input type="password" placeholder="Enter new JWT secret" />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue="60" />
                </div>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" /> Update Security
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>View database status and perform maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-white/5 bg-background/30 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-nejah-slate-blue">Database Status</span>
                    <span className="font-semibold text-nejah-electric">Connected</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-nejah-slate-blue">Last Backup</span>
                    <span className="text-foreground">N/A</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">Backup Now</Button>
                  <Button variant="outline">Restore</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AmbientSection>
    </DashboardLayout>
  );
}
