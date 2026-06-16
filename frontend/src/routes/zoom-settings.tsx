import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Video,
  Link2,
  Link2Off,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TeacherZoomRow = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherStatus?: string;
  connectionStatus: string;
  zoomUserId: string | null;
  zoomEmail: string | null;
  connectedAt: string | null;
};

type AdminOverview = {
  summary: {
    totalTeachers: number;
    connected: number;
    disconnected: number;
    platformConfigured: boolean;
  };
  teachers: TeacherZoomRow[];
};

type TeacherIntegration = {
  connectionStatus: string;
  zoomUserId?: string;
  zoomEmail?: string;
  connectedAt?: string;
};

const ADMIN_ROLES = ['admin', 'super_admin'];

export const Route = createFileRoute('/zoom-settings')({
  component: ZoomSettingsPage,
  beforeLoad: () => requireAuth(['teacher', 'admin', 'super_admin']),
});

function ZoomSettingsPage() {
  const userRole =
    typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';
  const isAdminView = ADMIN_ROLES.includes(userRole);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-nejah-slate-blue mb-1">
            Integration
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Zoom Settings</h1>
          <p className="text-sm leading-relaxed text-nejah-slate-blue mt-1">
            {isAdminView
              ? 'Manage Zoom connections for all teachers. Server-to-Server OAuth is configured at the platform level.'
              : 'Connect your Zoom account to enable automatic meeting creation and attendance tracking.'}
          </p>
        </div>

        {isAdminView ? <AdminZoomPanel /> : <TeacherZoomPanel />}
      </div>
    </DashboardLayout>
  );
}

function TeacherZoomPanel() {
  const [integration, setIntegration] = useState<TeacherIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [zoomUserId, setZoomUserId] = useState('');
  const [zoomEmail, setZoomEmail] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api<TeacherIntegration | null>('/zoom-settings/status');
      setIntegration(data);
    } catch {
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    if (!zoomUserId.trim()) {
      toast.error('Zoom User ID is required');
      return;
    }
    setConnecting(true);
    try {
      const result = await api<TeacherIntegration>('/zoom-settings/connect', {
        method: 'POST',
        body: JSON.stringify({
          zoomUserId: zoomUserId.trim(),
          zoomEmail: zoomEmail.trim() || undefined,
        }),
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
    <div className="grid gap-6 md:grid-cols-2">
      <ZoomIntegrationCard
        loading={loading}
        isConnected={isConnected}
        integration={integration}
        zoomUserId={zoomUserId}
        zoomEmail={zoomEmail}
        connecting={connecting}
        onZoomUserIdChange={setZoomUserId}
        onZoomEmailChange={setZoomEmail}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <HowItWorksCard />
    </div>
  );
}

function AdminZoomPanel() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [connectTarget, setConnectTarget] = useState<TeacherZoomRow | null>(null);
  const [zoomUserId, setZoomUserId] = useState('');
  const [zoomEmail, setZoomEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<AdminOverview>('/zoom-settings/overview');
      if (data.teachers?.length > 0) {
        setOverview(data);
        return;
      }

      // Fallback: build rows from teachers list + integrations if overview is empty
      const [teachersRes, integrations] = await Promise.all([
        api<{ data: Array<{ id: string; fullName: string; email: string; status?: string }> }>(
          '/teachers?limit=500&status=all',
        ),
        api<Array<{ teacherId: string; connectionStatus: string; zoomUserId?: string; zoomEmail?: string; connectedAt?: string }>>(
          '/zoom-settings/all',
        ).catch(() => []),
      ]);

      const integrationMap = new Map(integrations.map((i) => [i.teacherId, i]));
      const teachers = (teachersRes.data || []).map((teacher) => {
        const integration = integrationMap.get(teacher.id);
        return {
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          teacherEmail: teacher.email,
          teacherStatus: teacher.status || 'active',
          connectionStatus: integration?.connectionStatus ?? 'disconnected',
          zoomUserId: integration?.zoomUserId ?? null,
          zoomEmail: integration?.zoomEmail ?? null,
          connectedAt: integration?.connectedAt ?? null,
        };
      });

      const connected = teachers.filter((t) => t.connectionStatus === 'connected').length;
      setOverview({
        summary: {
          totalTeachers: teachers.length,
          connected,
          disconnected: teachers.length - connected,
          platformConfigured: data.summary?.platformConfigured ?? true,
        },
        teachers,
      });
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load Zoom settings');
      toast.error(err.message || 'Failed to load Zoom settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const filteredTeachers = useMemo(() => {
    if (!overview?.teachers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return overview.teachers;
    return overview.teachers.filter(
      (t) =>
        t.teacherName.toLowerCase().includes(q) ||
        t.teacherEmail?.toLowerCase().includes(q) ||
        t.zoomUserId?.toLowerCase().includes(q) ||
        t.zoomEmail?.toLowerCase().includes(q),
    );
  }, [overview, search]);

  const openConnect = (teacher: TeacherZoomRow) => {
    setConnectTarget(teacher);
    setZoomUserId(teacher.zoomUserId || '');
    setZoomEmail(teacher.zoomEmail || '');
  };

  const closeConnect = () => {
    setConnectTarget(null);
    setZoomUserId('');
    setZoomEmail('');
  };

  const handleAdminConnect = async () => {
    if (!connectTarget || !zoomUserId.trim()) {
      toast.error('Zoom User ID is required');
      return;
    }
    setSaving(true);
    try {
      await api(`/zoom-settings/teacher/${connectTarget.teacherId}/connect`, {
        method: 'POST',
        body: JSON.stringify({
          zoomUserId: zoomUserId.trim(),
          zoomEmail: zoomEmail.trim() || undefined,
        }),
      });
      toast.success(`Zoom connected for ${connectTarget.teacherName}`);
      closeConnect();
      await fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect Zoom');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminDisconnect = async (teacher: TeacherZoomRow) => {
    if (!confirm(`Disconnect Zoom for ${teacher.teacherName}?`)) return;
    try {
      await api(`/zoom-settings/teacher/${teacher.teacherId}/disconnect`, { method: 'POST' });
      toast.success(`Zoom disconnected for ${teacher.teacherName}`);
      await fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-nejah-slate-blue" />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-nejah-electric" />
              <div>
                <p className="text-2xl font-bold">{overview?.summary.totalTeachers ?? 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{overview?.summary.connected ?? 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{overview?.summary.disconnected ?? 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Not Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel rounded-3xl border-border dark:border-white/5">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg font-bold">Teacher Zoom Integrations</CardTitle>
            <CardDescription>
              Platform OAuth:{' '}
              {overview?.summary.platformConfigured ? (
                <Badge className="bg-green-100 text-green-700 border-none ml-1">Configured</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 border-none ml-1">Missing env vars</Badge>
              )}
            </CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border dark:border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-white/5 bg-muted/30">
                  <th className="text-left p-3 font-bold">Teacher</th>
                  <th className="text-left p-3 font-bold">Account</th>
                  <th className="text-left p-3 font-bold">Status</th>
                  <th className="text-left p-3 font-bold">Zoom User ID</th>
                  <th className="text-left p-3 font-bold">Zoom Email</th>
                  <th className="text-left p-3 font-bold">Connected</th>
                  <th className="text-right p-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {loadError ? (
                        <span className="text-red-600">{loadError}</span>
                      ) : search.trim() ? (
                        'No teachers match your search'
                      ) : (
                        'No teachers in the system yet. Add teachers from the Teachers page first.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const connected = teacher.connectionStatus === 'connected';
                    return (
                      <tr
                        key={teacher.teacherId}
                        className="border-b border-border/50 dark:border-white/5 last:border-0"
                      >
                        <td className="p-3">
                          <p className="font-semibold">{teacher.teacherName}</p>
                          <p className="text-xs text-muted-foreground">{teacher.teacherEmail}</p>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {teacher.teacherStatus || 'active'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={cn(
                              'border-none',
                              connected
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700',
                            )}
                          >
                            {connected ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-xs">{teacher.zoomUserId || '—'}</td>
                        <td className="p-3 text-xs">{teacher.zoomEmail || '—'}</td>
                        <td className="p-3 text-xs">
                          {teacher.connectedAt
                            ? new Date(teacher.connectedAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openConnect(teacher)}
                            >
                              {connected ? 'Update' : 'Connect'}
                            </Button>
                            {connected && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleAdminDisconnect(teacher)}
                              >
                                Disconnect
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <HowItWorksCard />

      <Dialog open={!!connectTarget} onOpenChange={(open) => !open && closeConnect()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {connectTarget?.connectionStatus === 'connected' ? 'Update' : 'Connect'} Zoom —{' '}
              {connectTarget?.teacherName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="adminZoomUserId">Zoom User ID *</Label>
              <Input
                id="adminZoomUserId"
                placeholder="Zoom user ID or email"
                value={zoomUserId}
                onChange={(e) => setZoomUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminZoomEmail">Zoom Email (optional)</Label>
              <Input
                id="adminZoomEmail"
                type="email"
                placeholder="teacher@example.com"
                value={zoomEmail}
                onChange={(e) => setZoomEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeConnect}>
              Cancel
            </Button>
            <Button onClick={handleAdminConnect} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ZoomIntegrationCard({
  loading,
  isConnected,
  integration,
  zoomUserId,
  zoomEmail,
  connecting,
  onZoomUserIdChange,
  onZoomEmailChange,
  onConnect,
  onDisconnect,
}: {
  loading: boolean;
  isConnected: boolean;
  integration: TeacherIntegration | null;
  zoomUserId: string;
  zoomEmail: string;
  connecting: boolean;
  onZoomUserIdChange: (v: string) => void;
  onZoomEmailChange: (v: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Video className="h-5 w-5 text-nejah-electric" />
          Zoom Integration
        </CardTitle>
        <CardDescription>Link your Zoom account to this platform</CardDescription>
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
                <p className="text-sm font-bold">{isConnected ? 'Connected' : 'Not Connected'}</p>
                <p className="text-xs text-nejah-slate-blue">
                  {isConnected
                    ? `Zoom User: ${integration?.zoomEmail || integration?.zoomUserId}`
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
                    <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                      Zoom User ID
                    </p>
                    <p className="font-mono text-xs mt-1">{integration?.zoomUserId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                      Zoom Email
                    </p>
                    <p className="text-xs mt-1">{integration?.zoomEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-nejah-slate-blue uppercase tracking-widest">
                      Connected Since
                    </p>
                    <p className="text-xs mt-1">
                      {integration?.connectedAt
                        ? new Date(integration.connectedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onDisconnect}
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
                  <Label htmlFor="zoomUserId">Zoom User ID or licensed email *</Label>
                  <Input
                    id="zoomUserId"
                    placeholder="your-licensed-email@yourdomain.com"
                    value={zoomUserId}
                    onChange={(e) => onZoomUserIdChange(e.target.value)}
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
                    onChange={(e) => onZoomEmailChange(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                <Button onClick={onConnect} className="w-full gap-2" disabled={connecting}>
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
  );
}

function HowItWorksCard() {
  return (
    <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">How It Works</CardTitle>
        <CardDescription>Zoom integration overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3">
          {[
            ['Connect Zoom Account', 'Each teacher needs a Zoom User ID linked to their profile'],
            ['Automatic Meeting Creation', 'Zoom meetings are created when a teacher starts a class'],
            ['Automatic Attendance', 'Join and leave times are recorded automatically'],
            ['Session Management', 'Sessions are tracked with attendance and duration data'],
          ].map(([title, desc], i) => (
            <div key={title} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <div>
                <p className="font-bold text-foreground">{title}</p>
                <p className="text-nejah-slate-blue text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Prerequisites</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            Server-to-Server OAuth credentials must be set in backend environment variables. Each
            teacher must have their Zoom User ID connected before they can start live sessions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
