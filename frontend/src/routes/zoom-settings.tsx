import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Video, Link2, Link2Off, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/zoom-settings')({
  component: ZoomSettingsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin', 'teacher']),
});

function ZoomSettingsPage() {
  const [integration, setIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [zoomUserId, setZoomUserId] = useState('');
  const [zoomEmail, setZoomEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const endpoint = localStorage.getItem('userRole') === 'teacher'
        ? '/zoom-settings/status'
        : '/zoom-settings/all';
      const data = await api(endpoint);
      setIntegration(data);
    } catch {
      // Not integrated yet
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!zoomUserId.trim()) {
      toast.error('Zoom User ID is required');
      return;
    }
    setConnecting(true);
    try {
      const result = await api('/zoom-settings/connect', {
        method: 'POST',
        body: JSON.stringify({ zoomUserId: zoomUserId.trim(), zoomEmail: zoomEmail.trim() || undefined }),
      });
      setIntegration(result);
      toast.success('Zoom account connected successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect Zoom account');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api('/zoom-settings/disconnect', { method: 'POST' });
      setIntegration(null);
      toast.success('Zoom account disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    }
  };

  const isConnected = integration?.connectionStatus === 'connected';

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-nejah-slate-blue mb-1">
            Integration
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Zoom Settings</h1>
          <p className="text-sm leading-relaxed text-nejah-slate-blue mt-1">
            Connect your Zoom account to enable automatic meeting creation and attendance tracking.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Video className="h-5 w-5 text-nejah-electric" />
                Zoom Integration
              </CardTitle>
              <CardDescription>
                Link your Zoom developer account to this platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-nejah-slate-blue" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-background/50 dark:bg-nejah-surface border border-border dark:border-white/5">
                    {isConnected ? (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </p>
                      <p className="text-xs text-nejah-slate-blue">
                        {isConnected
                          ? `Zoom User: ${integration.zoomEmail || integration.zoomUserId}`
                          : 'Link your Zoom account to enable automatic meetings'}
                      </p>
                    </div>
                    {isConnected && (
                      <Badge className="bg-green-100 text-green-700 border-none">Active</Badge>
                    )}
                  </div>

                  {isConnected ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Zoom User ID</p>
                          <p className="font-mono text-xs mt-1">{integration.zoomUserId}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Zoom Email</p>
                          <p className="text-xs mt-1">{integration.zoomEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">Connected Since</p>
                          <p className="text-xs mt-1">{integration.connectedAt ? new Date(integration.connectedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
                      >
                        <Link2Off className="h-4 w-4" />
                        Disconnect Zoom Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="zoomUserId">Zoom User ID *</Label>
                        <Input
                          id="zoomUserId"
                          placeholder="e.g., abc123def45"
                          value={zoomUserId}
                          onChange={(e) => setZoomUserId(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zoomEmail">Zoom Email (optional)</Label>
                        <Input
                          id="zoomEmail"
                          type="email"
                          placeholder="your-zoom-email@example.com"
                          value={zoomEmail}
                          onChange={(e) => setZoomEmail(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                      <Button
                        onClick={handleConnect}
                        className="w-full gap-2"
                        disabled={connecting}
                      >
                        {connecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                        {connecting ? 'Connecting...' : 'Connect Zoom Account'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">How It Works</CardTitle>
              <CardDescription>Zoom integration overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Connect Your Zoom Account</p>
                    <p className="text-nejah-slate-blue text-xs">Enter your Zoom User ID from the Zoom developer portal</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Automatic Meeting Creation</p>
                    <p className="text-nejah-slate-blue text-xs">Zoom meetings are auto-created when you schedule a class</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Automatic Attendance Tracking</p>
                    <p className="text-nejah-slate-blue text-xs">Student join/leave times are recorded automatically</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Session Management</p>
                    <p className="text-nejah-slate-blue text-xs">Sessions are tracked with attendance and duration data</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Prerequisites</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  Make sure your Zoom account has Server-to-Server OAuth credentials configured.
                  Contact your system administrator if you need help setting this up.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
