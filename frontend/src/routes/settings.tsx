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

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const [autoAttendance, setAutoAttendance] = useState(false);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure system preferences and options</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" /> Security</TabsTrigger>
          <TabsTrigger value="database"><Database className="h-4 w-4 mr-2" /> Database</TabsTrigger>
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
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage email and in-app notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Receive in-app notifications</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Email Reports</Label>
                  <p className="text-sm text-gray-500">Receive weekly reports via email</p>
                </div>
                <Switch checked={emailReports} onCheckedChange={setEmailReports} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Auto Attendance Alerts</Label>
                  <p className="text-sm text-gray-500">Alert parents when student is absent</p>
                </div>
                <Switch checked={autoAttendance} onCheckedChange={setAutoAttendance} />
              </div>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
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
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
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
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Database Status</span>
                  <span className="text-emerald-600 font-semibold">Connected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Backup</span>
                  <span className="text-gray-700">N/A</span>
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
    </DashboardLayout>
  );
}
