/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useEffect, useState } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/api';
import { authHeaders } from '@/lib/finance-api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createLazyFileRoute('/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [users, setUsers] = useState<any[]>([]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (selectedUser) params.set('userId', selectedUser);
      if (selectedPeriod) params.set('period', selectedPeriod);
      const res = await fetch(`${API_BASE}/audit-logs?${params}`, { headers: authHeaders() });
      const json = await res.json();
      setLogs(json.data || []);
      setMeta(json.meta || { total: 0, page: 1, limit: 50, totalPages: 0 });
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs/users`, { headers: authHeaders() });
      const json = await res.json();
      setUsers(json || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchLogs(); }, [selectedUser, selectedPeriod]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <PageHeader title="Audit Log" description="System-wide operation audit trail" />

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedUser || 'all'} onValueChange={(v) => setSelectedUser(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={selectedPeriod === p.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="text-sm text-muted-foreground ml-auto">
            {meta.total} entries
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No audit entries found</TableCell></TableRow>
                  ) : (
                    logs.map((log: any) => (
                      <TableRow key={log.id} className="font-mono text-xs">
                        <TableCell className="whitespace-nowrap">{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                        <TableCell>{log.userName || log.userEmail || 'System'}</TableCell>
                        <TableCell>{log.userRole || '-'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${
                            log.method === 'POST' ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400' :
                            log.method === 'PATCH' || log.method === 'PUT' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                            log.method === 'DELETE' ? 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              log.method === 'POST' ? 'bg-green-500' :
                              log.method === 'PATCH' || log.method === 'PUT' ? 'bg-amber-500' :
                              log.method === 'DELETE' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                            {log.action || `${log.method} ${log.path}`}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {meta.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchLogs(meta.page - 1)}>Previous</Button>
                <span className="flex items-center text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
                <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => fetchLogs(meta.page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
