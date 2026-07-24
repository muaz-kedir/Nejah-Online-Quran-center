// Zoom settings page commented out -- teachers paste meeting links manually
// import { useState, useEffect, useMemo } from 'react';
// import { createFileRoute } from '@tanstack/react-router';
// import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { toast } from 'sonner';
// import { requireAuth } from '@/lib/auth';
// import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
// import { api, API_BASE } from '@/lib/api';
// import {
//   Video,
//   Link2,
//   Link2Off,
//   CheckCircle,
//   AlertCircle,
//   Loader2,
//   Search,
//   Users,
//   RefreshCw,
// } from 'lucide-react';
// import { cn } from '@/lib/utils';
//
// type TeacherZoomRow = {
//   teacherId: string;
//   teacherName: string;
//   teacherEmail: string;
//   teacherStatus?: string;
//   connectionStatus: string;
//   zoomUserId: string | null;
//   zoomEmail: string | null;
//   connectedAt: string | null;
// };
//
// type AdminOverview = {
//   summary: {
//     totalTeachers: number;
//     connected: number;
//     disconnected: number;
//     platformConfigured: boolean;
//   };
//   teachers: TeacherZoomRow[];
// };
//
// type TeacherZoomStatus = {
//   connected: boolean;
//   email: string | null;
//   zoomUserId: string | null;
//   connectedAt: string | null;
// };
//
// type PlatformConfigStatus = {
//   configured: boolean;
//   source: 'env' | 'database' | 'none';
//   activeSource?: 'env' | 'database' | 'none';
//   envConfigured?: boolean;
//   databaseConfigured?: boolean;
//   credentialsConflict?: boolean;
//   accountId: string | null;
//   clientId: string | null;
//   hasClientSecret: boolean;
//   hasSecretToken: boolean;
// };
//
// const ADMIN_ROLES = ['super_admin'];
//
// export const Route = createFileRoute('/zoom-settings')({
//   ssr: false,
//   component: ZoomSettingsPage,
//   beforeLoad: () => requireAuth(['teacher', 'super_admin']),
// });
//
// function ZoomSettingsPage() {
//   const userRole =
//     typeof window !== 'undefined' ? localStorage.getItem('userRole') || '' : '';
//   const isAdminView = ADMIN_ROLES.includes(userRole);
//
//   const Layout = isAdminView ? DashboardLayout : TeacherLayout;
//
//   return (
//     <Layout>
//       <div className="space-y-8 pb-12">
//         <div>
//           <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-1">
//             Integration
//           </p>
//           <h1 className="text-3xl font-medium tracking-tight text-foreground">Zoom Settings</h1>
//           <p className="text-sm leading-relaxed text-muted-foreground mt-1">
//             {isAdminView
//               ? 'Manage Zoom connections for all teachers. Server-to-Server OAuth is configured at the platform level.'
//               : 'Connect your Zoom account to enable automatic meeting creation and attendance tracking.'}
//           </p>
//         </div>
//
//         {isAdminView ? <AdminZoomPanel /> : <TeacherZoomPanel />}
//       </div>
//     </Layout>
//   );
// }
//
// function TeacherZoomPanel() {
//   const [status, setStatus] = useState<TeacherZoomStatus | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [disconnecting, setDisconnecting] = useState(false);
//   const [connectError, setConnectError] = useState<string | null>(null);
//
//   const fetchStatus = async () => {
//     setLoading(true);
//     try {
//       const data = await api<TeacherZoomStatus>('/zoom/oauth/status');
//       setStatus(data);
//     } catch {
//       setStatus({ connected: false, email: null, zoomUserId: null, connectedAt: null });
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   useEffect(() => {
//     fetchStatus();
//     const params = new URLSearchParams(window.location.search);
//     const oauthResult = params.get('zoom_oauth');
//     if (oauthResult === 'success') {
//       toast.success('Zoom account connected successfully');
//       fetchStatus();
//     } else if (oauthResult === 'error') {
//       const reason = params.get('reason') || 'Authorization failed';
//       setConnectError(reason);
//       toast.error(reason);
//     }
//     if (oauthResult) {
//       window.history.replaceState({}, '', '/zoom-settings');
//     }
//   }, []);
//
//   const handleConnect = () => {
//     const token = localStorage.getItem('token');
//     window.location.href = `${API_BASE}/zoom/oauth/authorize?token=${encodeURIComponent(token || '')}`;
//   };
//
//   const handleDisconnect = async () => {
//     setDisconnecting(true);
//     try {
//       await api('/zoom/oauth/disconnect', { method: 'DELETE' });
//       setStatus({ connected: false, email: null, zoomUserId: null, connectedAt: null });
//       setConnectError(null);
//       toast.success('Zoom disconnected');
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to disconnect');
//     } finally {
//       setDisconnecting(false);
//     }
//   };
//
//   const isConnected = status?.connected === true;
//   const connectedEmail = status?.email || '';
//
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-24">
//         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }
//
//   return (
//     <div className="grid gap-6 md:grid-cols-2">
//       <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2 text-lg font-bold">
//             <Video className="h-5 w-5 text-nejah-electric" />
//             Zoom
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {isConnected ? (
//             <div className="space-y-4">
//               <div className="flex items-center gap-2 text-sm">
//                 <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
//                 <span className="font-medium">
//                   Connected — <span className="text-foreground">{connectedEmail}</span>
//                 </span>
//               </div>
//               <Button
//                 onClick={handleDisconnect}
//                 disabled={disconnecting}
//                 variant="outline"
//                 className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
//               >
//                 {disconnecting ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Link2Off className="h-4 w-4" />
//                 )}
//                 Disconnect
//               </Button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               <p className="text-sm text-muted-foreground">
//                 Create Zoom meetings right from your dashboard.
//               </p>
//               <Button onClick={handleConnect} className="w-full bg-nejah-electric hover:bg-nejah-electric/90 gap-2">
//                 <Video className="h-4 w-4" />
//                 Connect Zoom Account
//               </Button>
//               {connectError && (
//                 <p className="text-xs text-red-500 mt-2">{connectError}</p>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
//
// function AdminZoomPanel() {
//   const [overview, setOverview] = useState<AdminOverview | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [platformConfig, setPlatformConfig] = useState<PlatformConfigStatus | null>(null);
//   const [configOpen, setConfigOpen] = useState(false);
//   const [configLoading, setConfigLoading] = useState(false);
//   const [configForm, setConfigForm] = useState({ accountId: '', clientId: '', clientSecret: '', secretToken: '' });
//   const [searchQuery, setSearchQuery] = useState('');
//
//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [overviewData, configData] = await Promise.all([
//         api<AdminOverview>('/zoom/admin/overview'),
//         api<PlatformConfigStatus>('/zoom/admin/platform-config'),
//       ]);
//       setOverview(overviewData);
//       setPlatformConfig(configData);
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to load Zoom admin data');
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const handleSaveConfig = async () => {
//     setConfigLoading(true);
//     try {
//       const updated = await api<PlatformConfigStatus>('/zoom/admin/platform-config', {
//         method: 'POST',
//         body: configForm,
//       });
//       setPlatformConfig(updated);
//       toast.success('Platform configuration saved');
//       setConfigOpen(false);
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to save configuration');
//     } finally {
//       setConfigLoading(false);
//     }
//   };
//
//   useEffect(() => {
//     fetchData();
//   }, []);
//
//   const filteredTeachers = useMemo(() => {
//     if (!overview?.teachers) return [];
//     if (!searchQuery) return overview.teachers;
//     const q = searchQuery.toLowerCase();
//     return overview.teachers.filter(
//       (t) =>
//         t.teacherName.toLowerCase().includes(q) ||
//         t.teacherEmail.toLowerCase().includes(q)
//     );
//   }, [overview, searchQuery]);
//
//   const handleReconnect = async (teacherId: string) => {
//     const token = localStorage.getItem('token');
//     window.location.href = `${API_BASE}/zoom/oauth/authorize?token=${encodeURIComponent(token || '')}&admin_teacher_id=${teacherId}`;
//   };
//
//   const handleDisconnectUser = async (teacherId: string) => {
//     try {
//       await api(`/zoom/admin/disconnect/${teacherId}`, { method: 'DELETE' });
//       toast.success('Disconnected');
//       fetchData();
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to disconnect');
//     }
//   };
//
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-24">
//         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }
//
//   const summary = overview?.summary;
//
//   return (
//     <>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
//         <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
//           <CardContent className="pt-6">
//             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Teachers</p>
//             <p className="text-3xl font-bold mt-1">{summary?.totalTeachers ?? '-'}</p>
//           </CardContent>
//         </Card>
//         <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
//           <CardContent className="pt-6">
//             <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Connected</p>
//             <p className="text-3xl font-bold mt-1 text-green-600">{summary?.connected ?? '-'}</p>
//           </CardContent>
//         </Card>
//         <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
//           <CardContent className="pt-6">
//             <p className="text-xs font-medium text-red-500 uppercase tracking-wider">Disconnected</p>
//             <p className="text-3xl font-bold mt-1 text-red-500">{summary?.disconnected ?? '-'}</p>
//           </CardContent>
//         </Card>
//         <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
//           <CardContent className="pt-6">
//             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform Config</p>
//             <p className="text-3xl font-bold mt-1">{platformConfig?.configured ? '✅' : '❌'}</p>
//           </CardContent>
//         </Card>
//       </div>
//
//       <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm mb-6">
//         <CardContent className="pt-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-semibold">Platform Configuration</p>
//               <p className="text-xs text-muted-foreground mt-1">
//                 {platformConfig?.configured
//                   ? `Configured via ${platformConfig.source} (Account: ${platformConfig.accountId})`
//                   : 'Zoom Server-to-Server OAuth is not configured'}
//               </p>
//             </div>
//             <Button onClick={() => { setConfigOpen(true); setConfigForm({ accountId: platformConfig?.accountId || '', clientId: platformConfig?.clientId || '', clientSecret: '', secretToken: '' }); }}>
//               {platformConfig?.configured ? 'Update' : 'Configure'}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//
//       <Card className="glass-panel bg-card dark:bg-nejah-surface border-border dark:border-white/5 rounded-3xl shadow-sm">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-lg font-bold">Teacher Connections</CardTitle>
//             <div className="flex items-center gap-3">
//               <div className="relative">
//                 <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   placeholder="Search teachers..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-9 h-10 w-52 rounded-xl"
//                 />
//               </div>
//               <Button variant="outline" size="icon" onClick={fetchData}>
//                 <RefreshCw className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-border dark:border-white/5">
//                   <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
//                   <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
//                   <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
//                   <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Zoom Email</th>
//                   <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Connected</th>
//                   <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredTeachers.map((teacher) => (
//                   <tr key={teacher.teacherId} className="border-b border-border dark:border-white/5 hover:bg-muted/30 transition-colors">
//                     <td className="py-3 px-4 font-medium">{teacher.teacherName}</td>
//                     <td className="py-3 px-4 text-muted-foreground">{teacher.teacherEmail}</td>
//                     <td className="py-3 px-4">
//                       <Badge variant={teacher.connectionStatus === 'connected' ? 'default' : 'secondary'}>
//                         {teacher.connectionStatus}
//                       </Badge>
//                     </td>
//                     <td className="py-3 px-4 text-muted-foreground">{teacher.zoomEmail || '-'}</td>
//                     <td className="py-3 px-4 text-xs text-muted-foreground">
//                       {teacher.connectedAt ? new Date(teacher.connectedAt).toLocaleDateString() : '-'}
//                     </td>
//                     <td className="py-3 px-4 text-right">
//                       {teacher.connectionStatus === 'connected' ? (
//                         <Button variant="outline" size="sm" className="text-red-500 border-red-200" onClick={() => handleDisconnectUser(teacher.teacherId)}>
//                           Disconnect
//                         </Button>
//                       ) : (
//                         <Button variant="outline" size="sm" onClick={() => handleReconnect(teacher.teacherId)}>
//                           Reconnect
//                         </Button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//                 {filteredTeachers.length === 0 && (
//                   <tr>
//                     <td colSpan={6} className="py-8 text-center text-muted-foreground">No teachers found</td>
//                     </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//
//       <Dialog open={configOpen} onOpenChange={setConfigOpen}>
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>Zoom Platform Configuration</DialogTitle>
//             <DialogDescription>
//               Enter your Zoom Server-to-Server OAuth credentials. These are used to create meetings on behalf of connected teachers.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <Label>Account ID</Label>
//               <Input value={configForm.accountId} onChange={(e) => setConfigForm(p => ({ ...p, accountId: e.target.value }))} placeholder="Zoom Account ID" />
//             </div>
//             <div className="space-y-2">
//               <Label>Client ID</Label>
//               <Input value={configForm.clientId} onChange={(e) => setConfigForm(p => ({ ...p, clientId: e.target.value }))} placeholder="Zoom Client ID" />
//             </div>
//             <div className="space-y-2">
//               <Label>Client Secret</Label>
//               <Input type="password" value={configForm.clientSecret} onChange={(e) => setConfigForm(p => ({ ...p, clientSecret: e.target.value }))} placeholder="Enter client secret" />
//             </div>
//             <div className="space-y-2">
//               <Label>Secret Token (optional)</Label>
//               <Input type="password" value={configForm.secretToken} onChange={(e) => setConfigForm(p => ({ ...p, secretToken: e.target.value }))} placeholder="Verification token for events" />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancel</Button>
//             <Button onClick={handleSaveConfig} disabled={configLoading}>
//               {configLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
//               Save
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
