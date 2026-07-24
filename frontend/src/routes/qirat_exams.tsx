import { API_BASE, apiUrl } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/qirat_exams')({
  component: QiratExamsPage,
  beforeLoad: () => requireAuth(['qirat_manager', 'super_admin']),
});

function QiratExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/exams`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load exams');
        const data = await res.json();
        setExams(Array.isArray(data) ? data : data.data || []);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Evaluations" title="Exams & Evaluations" description="Monitor weekly, monthly, and memorization tests" />
      <div className="glass-panel overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : exams.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No exams found</TableCell></TableRow>
            ) : exams.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title || e.name}</TableCell>
                <TableCell>{e.student?.fullName || e.studentName || '—'}</TableCell>
                <TableCell>{e.subject || e.learningTrack || '—'}</TableCell>
                <TableCell>{e.score != null ? `${e.score}${e.maxScore ? `/${e.maxScore}` : ''}` : '—'}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{e.status || 'pending'}</Badge></TableCell>
                <TableCell>{e.examDate ? new Date(e.examDate).toLocaleDateString() : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
