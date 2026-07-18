import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

exportPDF, authHeaders, formatCurrency } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Loader2, Plus, CalendarDays, FileText, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_teacher-payments')({beforeLoad: () => requireAuth(['finance_manager', 'super_admin'])
});
