import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '@/lib/auth';

exportPDF } from '@/lib/finance-api';
import { FinanceFilterBar } from '@/components/finance/FinanceFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Users, GraduationCap, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance_reports')({beforeLoad: () => requireAuth(['finance_manager', 'super_admin'])
});
