/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE } from "@/lib/api";
import { useState, useEffect } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, DollarSign, RefreshCw, Lock, ShieldCheck } from 'lucide-react';

export const Route = createLazyFileRoute('/fee_settings')({
  component: FeeSettingsPage,
});

function FeeSettingsPage() {
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FeeConfig | null>(null);
  const [form, setForm] = useState({ learningGoalId: '', country: '', amount: '', currency: 'ETB' });
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : '';
  const isReadonly = userRole === 'finance_manager';

  const token = () => localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const fetchData = async () => {
    try {
      const [feesRes, goalsRes] = await Promise.all([
        fetch(`${API}/fee-config`, { headers }),
        fetch(`${API}/learning-goals/admin`, { headers }),
      ]);
      if (feesRes.ok) setFees(await feesRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ learningGoalId: '', country: '', amount: '', currency: 'ETB' });
    setShowModal(true);
  };

  const openEdit = (fee: FeeConfig) => {
    setEditing(fee);
    setForm({ learningGoalId: fee.learningGoalId, country: fee.country, amount: String(fee.amount), currency: fee.currency });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.learningGoalId || !form.country || !form.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const body = { learningGoalId: form.learningGoalId, country: form.country, amount: parseFloat(form.amount), currency: form.currency };
      const url = editing ? `${API}/fee-config/${editing.id}` : `${API}/fee-config`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to save');
      toast.success(editing ? 'Fee updated' : 'Fee created');
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee configuration?')) return;
    try {
      const res = await fetch(`${API}/fee-config/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Fee deleted');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Fee Settings" description="Configure monthly fees per learning goal and country"
        actions={
          <Button onClick={handleRefresh} variant="outline" className="h-10 gap-2 rounded-xl px-4" disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      <GlassPanel>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            {fees.length} fee configuration(s)
            {isReadonly && (
              <Badge variant="outline" className="ml-2 text-xs">
                <Lock className="h-3 w-3 mr-1" /> Read-only
              </Badge>
            )}
          </p>
          {!isReadonly && (
            <Button onClick={openCreate} className="bg-primary hover:bg-nejah-azure text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Fee
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : fees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No fee configurations yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Learning Goal</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Country</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Currency</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-muted/50">
                    <td className="py-3 px-4">{fee.learningGoal?.name || fee.learningGoalId}</td>
                    <td className="py-3 px-4">{fee.country}</td>
                    <td className="py-3 px-4 font-medium">{fee.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">{fee.currency}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!isReadonly ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(fee)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {!isReadonly && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent aria-describedby={undefined} className="dark:bg-nejah-surface dark:border-nejah-border-blue">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Fee' : 'Add Fee Configuration'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Learning Goal</Label>
                <Select value={form.learningGoalId} onValueChange={(v) => setForm({ ...form, learningGoalId: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectValue placeholder="Select goal..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="e.g. Ethiopia"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue"
                />
              </div>
              <div className="grid gap-2">
                <Label>Monthly Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 1500"
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue"
                />
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-nejah-azure text-white">{editing ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
