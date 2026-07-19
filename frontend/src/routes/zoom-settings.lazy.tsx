/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useEffect, useMemo } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { api, API_BASE } from '@/lib/api';
import {
  Video,
  Link2,
  Link2Off,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Users,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApiQuery } from '@/hooks/useApiQuery';

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

type TeacherZoomStatus = {
  connected: boolean;
  email: string | null;
  zoomUserId: string | null;
  connectedAt: string | null;
};

type PlatformConfigStatus = {
  configured: boolean;
  source: 'env' | 'database' | 'none';
  activeSource?: 'env' | 'database' | 'none';
  envConfigured?: boolean;
  databaseConfigured?: boolean;
  credentialsConflict?: boolean;
  accountId: string | null;
  clientId: string | null;
  hasClientSecret: boolean;
  hasSecretToken: boolean;
};

const ADMIN_ROLES = ['super_admin'];

function TeacherZoomPanel() {
  const queryClient = useQueryClient();
  const { data: status, isLoading: loading } = useApiQuery<TeacherZoomStatus>({
    queryKey: ['zoom-oauth-status'],
    path: '/zoom/oauth/status',
  });
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get('zoom_oauth');
    if (oauthResult === 'success') {
      toast.success('Zoom account connected successfully');
      queryClient.invalidateQueries({ queryKey: ['zoom-oauth-status'] });
    } else if (oauthResult === 'error') {
      const reason = params.get('reason') || 'Authorization failed';
      setConnectError(reason);
      toast.error(reason);
    }
    if (oauthResult) {
      window.history.replaceState({}, '', '/zoom-settings');
    }
  }, []);

  const handleConnect = () => {
    const token = localStorage.getItem('token');
    window.location.href = `${API_BASE}/zoom/oauth/authorize?token=${encodeURIComponent(token || '')}`;
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api('/zoom/oauth/disconnect', { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['zoom-oauth-status'] });
      setConnectError(null);
      toast.success('Zoom disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = status?.connected === true;
  const connectedEmail = status?.email || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-nejah-slate-blue" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Video className="h-5 w-5 text-nejah-electric" />
            Zoom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-medium">
                  Connected — <span className="text-foreground">{connectedEmail}</span>
                </span>
              </div>
              <Button
                onClick={handleDisconnect}
                disabled={disconnecting}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2Off className="h-4 w-4" />
                )}
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>Not Connected</span>
              </div>
              <Button
                onClick={handleConnect}
                className="w-full gap-2 bg-nejah-sapphire hover:bg-nejah-azure text-white"
              >
                <Link2 className="h-4 w-4" />
                Connect Zoom Account
              </Button>
              {connectError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{connectError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <HowItWorksCard />
    </div>
  );
}

function AdminZoomPanel() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [platformStatus, setPlatformStatus] = useState<PlatformConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [connectTarget, setConnectTarget] = useState<TeacherZoomRow | null>(null);
  const [zoomUserId, setZoomUserId] = useState('');
  const [zoomEmail, setZoomEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [accountUsers, setAccountUsers] = useState<
    Array<{ id: string; email: string; displayName?: string; status?: string }>
  >([]);
  const [accountUsersLoading, setAccountUsersLoading] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);

  const handleOverviewRefresh = async () => {
    setOverviewRefreshing(true);
    await fetchOverview();
    setOverviewRefreshing(false);
  };

  const fetchOverview = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [data, platform] = await Promise.all([
        api<AdminOverview>('/zoom-settings/overview'),
        api<PlatformConfigStatus>('/zoom-settings/platform').catch(() => null),
      ]);
      setPlatformStatus(platform);
      if (data.teachers?.length > 0) {
        setOverview({
          ...data,
          summary: {
            ...data.summary,
            platformConfigured: platform?.configured ?? data.summary?.platformConfigured ?? false,
          },
        });
        return;
      }

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
          platformConfigured: platform?.configured ?? data.summary?.platformConfigured ?? false,
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

  const openConnect = async (teacher: TeacherZoomRow) => {
    setConnectTarget(teacher);
    setZoomUserId(teacher.zoomUserId || teacher.teacherEmail || '');
    setZoomEmail(teacher.zoomEmail || teacher.teacherEmail || '');
    setAccountUsersLoading(true);
    try {
      const data = await api<{ users: Array<{ id: string; email: string; displayName?: string }> }>(
        '/zoom-settings/account-users',
      );
      setAccountUsers(data.users || []);
    } catch {
      setAccountUsers([]);
    } finally {
      setAccountUsersLoading(false);
    }
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
      <PlatformConfigCard
        status={platformStatus}
        onSaved={fetchOverview}
      />
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleOverviewRefresh} disabled={overviewRefreshing}>
              <RefreshCw className={cn('h-4 w-4', overviewRefreshing && 'animate-spin')} />
              {overviewRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
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
            <DialogDescription>
              Enter the teacher&apos;s licensed Zoom email or User ID from your Zoom account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {accountUsers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="adminZoomPick">Pick from Zoom account</Label>
                <select
                  id="adminZoomPick"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value=""
                  onChange={(e) => {
                    const picked = accountUsers.find((u) => u.id === e.target.value);
                    if (picked) {
                      setZoomUserId(picked.id);
                      setZoomEmail(picked.email);
                    }
                  }}
                >
                  <option value="">Select licensed Zoom user\u2026</option>
                  {accountUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                      {user.displayName ? ` (${user.displayName})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">
                  These are users on the same Zoom account as your Server-to-Server app.
                </p>
              </div>
            )}
            {accountUsersLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading Zoom account users\u2026
              </p>
            )}
            {!accountUsersLoading && accountUsers.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-xs text-amber-800 dark:text-amber-400">
                Could not load Zoom users. Ensure <strong>user:read:admin</strong> scope is added
                to your Server-to-Server OAuth app in Zoom Marketplace, then activate the app.
              </div>
            )}
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

function PlatformConfigCard({
  status,
  onSaved,
}: {
  status: PlatformConfigStatus | null;
  onSaved: () => Promise<void>;
}) {
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';
  const isSuperAdmin = userRole === 'super_admin';
  const [accountId, setAccountId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (status?.accountId) setAccountId(status.accountId);
    if (status?.clientId) setClientId(status.clientId);
  }, [status?.accountId, status?.clientId]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyOk(null);
    try {
      const result = await api<{ ok: boolean; message: string; source?: string }>(
        '/zoom-settings/platform/verify',
        { method: 'POST' },
      );
      setVerifyOk(true);
      toast.success(
        result.message +
          (result.source === 'env'
            ? ' (using Render/server environment variables)'
            : ' (using saved database credentials)'),
      );
    } catch (err: any) {
      setVerifyOk(false);
      toast.error(err.message || 'Zoom credentials are invalid');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!accountId.trim() || !clientId.trim()) {
      toast.error('Account ID and Client ID are required');
      return;
    }
    if (!clientSecret.trim()) {
      toast.error('Client Secret is required \u2014 paste it from Zoom Marketplace \u2192 Server-to-Server OAuth app');
      return;
    }
    setSaving(true);
    try {
      await api('/zoom-settings/platform', {
        method: 'POST',
        body: JSON.stringify({
          accountId: accountId.trim(),
          clientId: clientId.trim(),
          ...(clientSecret.trim() ? { clientSecret: clientSecret.trim() } : {}),
          ...(secretToken.trim() ? { secretToken: secretToken.trim() } : {}),
        }),
      });
      toast.success('Zoom credentials saved and verified with Zoom');
      setClientSecret('');
      setSecretToken('');
      setVerifyOk(true);
      await onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Zoom credentials');
    } finally {
      setSaving(false);
    }
  };

  const configured = status?.configured ?? false;

  return (
    <Card className="glass-panel rounded-3xl border-border dark:border-white/5 mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Video className="h-5 w-5 text-nejah-electric" />
          Platform Configuration (Server-to-Server OAuth)
        </CardTitle>
        <CardDescription>
          Required for automatic Zoom meeting creation and user verification. Credentials from
          environment variables take precedence over values saved here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {configured ? (
            <Badge className="bg-green-100 text-green-700 border-none">
              Configured ({status?.source === 'env' ? 'environment' : 'database'})
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-none">Not configured</Badge>
          )}
          {verifyOk === true && (
            <Badge className="bg-green-100 text-green-700 border-none">Zoom API verified</Badge>
          )}
          {verifyOk === false && (
            <Badge className="bg-red-100 text-red-700 border-none">Zoom API failed</Badge>
          )}
        </div>

        {status?.credentialsConflict && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-400">
            <strong>Credential conflict:</strong> Render environment variables and saved Zoom Settings
            use different Client IDs. Stale env vars often cause &quot;Invalid client_id or
            client_secret&quot;. Update or remove <code className="text-[10px]">ZOOM_*</code> on
            Render, or save the correct values below and redeploy.
          </div>
        )}

        {status?.source === 'env' && configured && !status?.credentialsConflict && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-400">
            Platform credentials are loaded from <strong>server environment variables</strong>{' '}
            (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET). Values saved below are ignored
            until those env vars are removed. Use &quot;Test Zoom Connection&quot; to verify them.
          </div>
        )}

        {!configured && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-400">
            Create a <strong>Server-to-Server OAuth</strong> app in the{' '}
            <a
              href="https://marketplace.zoom.us/develop/create"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Zoom Marketplace
            </a>
            . Copy Account ID, Client ID, and Client Secret \u2014 all three are required when saving.
          </div>
        )}

        {configured && status?.databaseConfigured === false && status?.envConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-400">
            Zoom credentials are only in Render environment variables. If you see authentication
            errors, update <code className="text-[10px]">ZOOM_ACCOUNT_ID</code>,{' '}
            <code className="text-[10px]">ZOOM_CLIENT_ID</code>, and{' '}
            <code className="text-[10px]">ZOOM_CLIENT_SECRET</code> on Render (no quotes), or
            save all three fields below.
          </div>
        )}

        {isSuperAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zoomAccountId">Account ID</Label>
              <Input
                id="zoomAccountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="From Zoom OAuth app"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoomClientId">Client ID</Label>
              <Input
                id="zoomClientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="From Zoom OAuth app"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoomClientSecret">Client Secret *</Label>
              <Input
                id="zoomClientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Required \u2014 paste from Zoom Marketplace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoomSecretToken">Webhook Secret Token (optional)</Label>
              <Input
                id="zoomSecretToken"
                type="password"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                placeholder="For Zoom webhook verification"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Platform Credentials
              </Button>
              {configured && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="gap-2"
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Test Zoom Connection
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only a super admin can update platform credentials. Contact your super admin or set
            ZOOM_* variables on the backend server.
          </p>
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
            ['Connect Zoom', 'One click links your Nejah account email for meeting creation'],
            ['Automatic Meeting Creation', 'Zoom meetings are created when you schedule a live session'],
            ['Students Join via Link', 'Students receive the join URL and open it in their browser or the Zoom app'],
            ['Automatic Attendance', 'Join and leave times are recorded automatically via webhooks'],
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
        <div className="mt-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-bold text-blue-800 dark:text-blue-400">Teacher Experience</p>
          <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
            Connect your Zoom email once \u2192 Schedule a class \u2192 Meeting is created automatically \u2192 Students join
            via the generated link. No Zoom account needed for students.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createLazyFileRoute('/zoom-settings')({
  component: ZoomSettingsPage,
});

function ZoomSettingsPage() {
  const userRole =
    typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';
  const isAdminView = ADMIN_ROLES.includes(userRole);

  const Layout = isAdminView ? DashboardLayout : TeacherLayout;

  return (
    <Layout>
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
    </Layout>
  );
}
