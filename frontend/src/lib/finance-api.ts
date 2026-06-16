import { API_BASE, apiUrl } from "@/lib/api";
const API = apiUrl(`/finance`);

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export interface FinanceFilters {
  search?: string;
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  country?: string;
  learningProgram?: string;
  paymentStatus?: PaymentStatus | '';
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  billingMonth?: string;
  page?: number;
  limit?: number;
}

export function buildParams(filters: FinanceFilters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
  });
  return params;
}

export async function financeFetch<T>(path: string, filters?: FinanceFilters): Promise<T> {
  const qs = filters ? `?${buildParams(filters).toString()}` : '';
  const res = await fetch(`${API}${path}${qs}`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid': return 'default';
    case 'partial': return 'secondary';
    case 'overdue': return 'destructive';
    default: return 'outline';
  }
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[], title?: string) {
  if (!rows.length) return;
  const escape = (v: unknown) => {
    const str = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const headers = Object.keys(rows[0]);
  const lines = [
    ...(title ? [escape(title), ''] : []),
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(title: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #ccc;padding:4px 6px}th{background:#e8f0fe}</style></head>
    <body><h1>${title}</h1>
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table><script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}
