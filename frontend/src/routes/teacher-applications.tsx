import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronLeft, ChevronRight, FileCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Users, Eye, RefreshCw, Power, PowerOff, Copy, Check, Link as LinkIcon, UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { apiHeaders, apiUrl } from "@/lib/api";
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  applicationNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  gender: string;
  status: string;
  createdAt: string;
}

interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  moreInfo: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; dot: string }> = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', color: 'text-primary', bg: 'bg-primary/10 border-primary/200', icon: CheckCircle2, dot: 'bg-primary/100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle, dot: 'bg-red-500' },
  MORE_INFO_REQUIRED: { label: 'More Info', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle, dot: 'bg-blue-500' },
};

export const Route = createFileRoute('/teacher-applications')({
  component: TeacherApplicationsPage,
  beforeLoad: () => requireAuth(['super_admin']),
});

function TeacherApplicationsContent() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, moreInfo: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [announcementText, setAnnouncementText] = useState({ en: '', ar: '', am: '' });
  const [isSavingText, setIsSavingText] = useState(false);

  // Student registration link
  const regLink = `${window.location.origin}/register`;

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/teacher-applications/settings`));
      if (res.ok) {
        const data = await res.json();
        setIsApplicationsOpen(data.isApplicationsOpen);
        setAnnouncementText({
          en: data.announcementText?.en || '',
          ar: data.announcementText?.ar || '',
          am: data.announcementText?.am || '',
        });
      }
    } catch {}
  }, []);

  const toggleApplicationsOpen = async (open?: boolean) => {
    setIsToggling(true);
    try {
      const newState = open ?? !isApplicationsOpen;
      const res = await fetch(apiUrl(`/teacher-applications/settings/toggle`), {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ isApplicationsOpen: newState }),
      });
      if (!res.ok) throw new Error('Failed to toggle application status');
      setIsApplicationsOpen(newState);
      toast.success(newState ? 'Teacher applications are now OPEN to the public' : 'Teacher applications are now CLOSED');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsToggling(false);
    }
  };

  const saveAnnouncementText = async () => {
    setIsSavingText(true);
    try {
      const res = await fetch(apiUrl(`/teacher-applications/settings`), {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ announcementText }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to save announcement text');
      }
      toast.success('Announcement text saved');
      await fetchSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingText(false);
    }
  };

  const fetchApplications = useCallback(async (opts?: { page?: number; searchTerm?: string; statusVal?: string }) => {
    setIsLoading(true);
    try {
      const page = opts?.page ?? 1;
      const term = opts?.searchTerm ?? search;
      const sFilter = opts?.statusVal ?? statusFilter;
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (term) params.set('search', term);
      if (sFilter !== 'all') params.set('status', sFilter);

      const res = await fetch(apiUrl(`/teacher-applications?${params}`), { headers: apiHeaders() });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data.data);
      setMeta(data.meta);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/teacher-applications/stats`), { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchApplications({ page: meta.page, searchTerm: search, statusVal: statusFilter });
    fetchStats();
    fetchSettings();
  }, [fetchApplications, fetchStats, fetchSettings, meta.page, search, statusFilter]);

  useEffect(() => {
    fetchApplications({ page: 1 });
    fetchStats();
    fetchSettings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications({ page: 1, searchTerm: search, statusVal: statusFilter });
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    fetchApplications({ page: 1, searchTerm: search, statusVal: val });
  };

  return (
    <>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Recruitment</p>
          <h1 className="text-2xl font-bold text-foreground text-foreground font-serif">
            Teacher Applications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage teacher applications</p>
        </div>
        <Button variant="outline" size="sm" className="h-10 gap-2" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Settings Card */}
      <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue shadow-sm mb-6">
        <div className="p-5">
          <h2 className="text-lg font-semibold mb-4">Announcement Settings</h2>

          {/* Text inputs + Open/Close in one card */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-medium text-foreground">Banner Announcement Text</p>
              <p className="text-sm text-muted-foreground mb-3">
                Customize the text shown on the announcement banner at the top of the public site.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">English</Label>
                <Input
                  value={announcementText.en}
                  onChange={e => setAnnouncementText(p => ({ ...p, en: e.target.value }))}
                  placeholder="We're looking for qualified Quran & Islamic teachers"
                  className="bg-muted border-border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Arabic</Label>
                <Input
                  value={announcementText.ar}
                  onChange={e => setAnnouncementText(p => ({ ...p, ar: e.target.value }))}
                  placeholder="نبحث عن معلمي قرآن كريم مؤهلين"
                  className="bg-muted border-border"
                  dir="rtl"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Amharic</Label>
                <Input
                  value={announcementText.am}
                  onChange={e => setAnnouncementText(p => ({ ...p, am: e.target.value }))}
                  placeholder="ብቃት ያላቸው የቁርአን እና እስላማዊ መምህራን እንፈልጋለን"
                  className="bg-muted border-border"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border dark:border-nejah-border-blue">
            <Button onClick={saveAnnouncementText} disabled={isSavingText}>
              {isSavingText ? 'Saving...' : 'Save Announcement Text'}
            </Button>
          </div>

          {/* Open / Close button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Post / Unpost</p>
              <p className="text-sm text-muted-foreground">
                {isApplicationsOpen
                  ? 'Applications are OPEN — the public can apply'
                  : 'Applications are CLOSED — the public cannot apply'}
              </p>
            </div>
            <Button
              variant={isApplicationsOpen ? "destructive" : "default"}
              className={isApplicationsOpen ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary"}
              onClick={() => toggleApplicationsOpen()}
              disabled={isToggling}
            >
              {isToggling ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> :
               isApplicationsOpen ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
              {isApplicationsOpen ? "Close Applications (Unpost)" : "Open Applications (Post)"}
            </Button>
          </div>
        </div>
      </div>

      {/* Teacher Application Link Card — only when open */}
      {isApplicationsOpen && (
        <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue shadow-sm mb-6">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Teacher Application Link</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with prospective teachers to direct them to the application form.
              This link is only available while applications are open.
            </p>
            <TeacherAppLinkSection />
          </div>
        </div>
      )}

      {/* Student Registration Link Card */}
      <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue shadow-sm mb-6">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Student Registration Link</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Share this link with prospective students to direct them to the registration form.
          </p>
          <StudentRegLinkSection />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'More Info', value: stats.moreInfo, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-transparent`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card dark:bg-nejah-surface rounded-xl border border-border dark:border-nejah-border-blue shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-center">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or application #..."
                className="pl-9 h-10 bg-muted border-border"
              />
            </div>
            <Button type="submit" size="sm" className="h-10 bg-primary hover:bg-nejah-azure">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px] h-10 bg-muted border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="MORE_INFO_REQUIRED">More Info Required</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 border-border" onClick={handleRefresh}>
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border dark:border-nejah-border-blue bg-muted/50 dark:bg-nejah-surface/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground dark:text-muted-foreground">Applicant</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground dark:text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground dark:text-muted-foreground hidden lg:table-cell">Country</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground dark:text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground dark:text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground dark:text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map(app => {
                  const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING_REVIEW;
                  return (
                    <tr key={app.id} className="border-t border-border dark:border-nejah-border-blue hover:bg-muted/50 dark:hover:bg-nejah-surface/50 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: '/teacher-applications/$id', params: { id: app.id } })}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-foreground dark:text-foreground">{app.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{app.applicationNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-muted-foreground dark:text-muted-foreground">{app.email}</p>
                        <p className="text-xs text-muted-foreground">{app.phoneNumber}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground dark:text-muted-foreground">{app.country}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-nejah-sapphire dark:hover:text-nejah-electric hover:bg-primary/10"
                          onClick={(e) => { e.stopPropagation(); navigate({ to: '/teacher-applications/$id', params: { id: app.id } }); }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-nejah-border-blue">
            <p className="text-xs text-muted-foreground">
              Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchApplications({ page: meta.page - 1 })}
                className="h-8 px-2 border-border">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <Button key={p} variant={p === meta.page ? 'default' : 'outline'} size="sm"
                  onClick={() => fetchApplications({ page: p })}
                  className={`h-8 w-8 px-0 ${p === meta.page ? 'bg-primary hover:bg-nejah-azure' : 'border-border'}`}
                >
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchApplications({ page: meta.page + 1 })}
                className="h-8 px-2 border-border">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TeacherAppLinkSection() {
  const link = `${window.location.origin}/apply-as-teacher`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Teacher application link copied');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Failed to copy link'));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2.5">
        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <code className="text-sm text-foreground truncate">{link}</code>
      </div>
      <Button variant="outline" className="shrink-0 gap-2" onClick={copy}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function StudentRegLinkSection() {
  const link = `${window.location.origin}/register`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('Registration link copied');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Failed to copy link'));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2.5">
        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <code className="text-sm text-foreground truncate">{link}</code>
      </div>
      <Button variant="outline" className="shrink-0 gap-2" onClick={copy}>
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function TeacherApplicationsPage() {
  return (
    <DashboardLayout>
      <TeacherApplicationsContent />
    </DashboardLayout>
  );
}
