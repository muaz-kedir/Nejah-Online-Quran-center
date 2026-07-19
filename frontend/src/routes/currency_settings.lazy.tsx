/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { useState, useMemo } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader, GlassPanel } from '@/components/dashboard/design-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Trash2, Globe, Database } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';

export const Route = createLazyFileRoute('/currency_settings')({
  component: CurrencySettingsPage,
});

function CurrencySettingsPage() {
  const queryClient = useQueryClient();
  const { data: rates = [], isLoading: loading } = useApiQuery<CurrencyRate[]>({
    queryKey: ['currency-rates'],
    path: '/currency/rates',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('ETB');
  const [toCurrency, setToCurrency] = useState('USD');
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);

  const lastRefresh = useMemo(() => {
    return rates.reduce((latest: string | null, r: CurrencyRate) => {
      return r.lastFetchedAt && (!latest || r.lastFetchedAt > latest) ? r.lastFetchedAt : latest;
    }, null);
  }, [rates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api<any>('/currency/refresh', { method: 'POST' });
      toast.success(`Rates refreshed from ${data.source}`);
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to refresh. Using fallback rates.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdd = async () => {
    if (!fromCurrency || !toCurrency || !rate) {
      toast.error('Fill all fields');
      return;
    }
    setSaving(true);
    try {
      await api('/currency/rates', {
        method: 'POST',
        body: JSON.stringify({ fromCurrency, toCurrency, rate: parseFloat(rate) }),
      });
      toast.success('Rate saved');
      setRate('');
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rate?')) return;
    try {
      await api(`/currency/rates/${id}`, { method: 'DELETE' });
      toast.success('Rate deleted');
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
    } catch {}
  };

  const convertTest = async () => {
    try {
      const data = await api<any>(`/currency/convert?from=${fromCurrency}&to=${toCurrency}&amount=1000`);
      toast.success(`1,000 ${data.from} = ${data.result.toLocaleString()} ${data.to} (rate: ${data.rate})`);
    } catch {}
  };

  return (
    <DashboardLayout>
      <PageHeader title="Currency Rates" description="Real-time exchange rates — auto-refreshed daily from live market data" />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassPanel>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Add / Update Rate</h3>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Live Refresh'}
            </Button>
          </div>

          {lastRefresh && (
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Last live update: {new Date(lastRefresh).toLocaleString()}
            </p>
          )}

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>From</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>To</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Exchange Rate</Label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 0.0175 (1 ETB = 0.0175 USD)"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving} className="bg-primary hover:bg-nejah-azure text-white">
                {saving ? 'Saving...' : 'Save Rate'}
              </Button>
              <Button variant="outline" onClick={convertTest}>
                Test Convert 1,000
              </Button>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="font-semibold text-foreground mb-4">Current Rates</h3>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : rates.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
              <p className="text-muted-foreground">No rates configured.</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Live Refresh" to fetch from the market.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rates.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                  <div>
                    <span className="font-medium text-foreground">1 {r.fromCurrency} = {Number(r.rate).toFixed(6)} {r.toCurrency}</span>
                    {r.lastFetchedAt && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Updated: {new Date(r.lastFetchedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>
    </DashboardLayout>
  );
}
