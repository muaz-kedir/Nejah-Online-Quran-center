import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronLeft, ChevronRight, FileCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Users, Eye, RefreshCw, Power, PowerOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { requireAuth } from '@/lib/auth';
import { API_BASE, apiHeaders } from '@/lib/api';

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
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle, dot: 'bg-red-500' },
  MORE_INFO_REQUIRED: { label: 'More Info', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle, dot: 'bg-blue-500' },
};

export const Route = createFileRoute('/teacher-applications')({
  component: TeacherApplicationsPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function TeacherApplicationsContent() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, moreInfo: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/teacher-applications/settings`);
      if (res.ok) {
        const data = await res.json();
        setIsApplicationsOpen(data.isApplicationsOpen);
      }
    } catch {}
  }, []);

  const toggleApplicationsOpen = async () => {
    setIsToggling(true);
    try {
      const newState = !isApplicationsOpen;
      const res = await fetch(`${API_BASE}/teacher-applications/settings/toggle`, {
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

  const fetchApplications = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`${API_BASE}/teacher-applications?${params}`, { headers: apiHeaders() });
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data.data);
      setMeta(data.meta);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/teacher-applications/stats`, { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchStats();
    fetchSettings();
  }, [fetchApplications, fetchStats, fetchSettings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications(1);
  };

  return (
    <>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-semibold">Recruitment</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-serif">
            Teacher Applications
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage teacher applications</p>
        </div>
        
        {/* Toggle Button */}
        <Button 
          variant={isApplicationsOpen ? "destructive" : "default"} 
          className={isApplicationsOpen ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
          onClick={toggleApplicationsOpen}
          disabled={isToggling}
        >
          {isToggling ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : 
           isApplicationsOpen ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
          {isApplicationsOpen ? "Close Applications (Unpost)" : "Open Applications (Post)"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'More Info', value: stats.moreInfo, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-transparent`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-center">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or application #..."
                className="pl-9 h-10 bg-gray-50 border-gray-200"
              />
            </div>
            <Button type="submit" size="sm" className="h-10 bg-emerald-700 hover:bg-emerald-800">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
              <SelectTrigger className="w-[180px] h-10 bg-gray-50 border-gray-200">
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
            <Button variant="outline" size="icon" className="h-10 w-10 border-gray-200" onClick={() => { fetchApplications(meta.page); fetchStats(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Applicant</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Country</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map(app => {
                  const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING_REVIEW;
                  return (
                    <tr key={app.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: '/teacher-applications/$id', params: { id: app.id } })}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{app.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{app.applicationNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-600 dark:text-gray-300">{app.email}</p>
                        <p className="text-xs text-gray-400">{app.phoneNumber}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600 dark:text-gray-300">{app.country}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                        {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchApplications(meta.page - 1)}
                className="h-8 px-2 border-gray-200">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map(p => (
                <Button key={p} variant={p === meta.page ? 'default' : 'outline'} size="sm"
                  onClick={() => fetchApplications(p)}
                  className={`h-8 w-8 px-0 ${p === meta.page ? 'bg-emerald-700 hover:bg-emerald-800' : 'border-gray-200'}`}
                >
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchApplications(meta.page + 1)}
                className="h-8 px-2 border-gray-200">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TeacherApplicationsPage() {
  return (
    <DashboardLayout>
      <TeacherApplicationsContent />
    </DashboardLayout>
  );
}
