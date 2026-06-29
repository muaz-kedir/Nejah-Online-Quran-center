import { API_BASE, apiUrl } from "@/lib/api";
import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AmbientSection, BentoStatCard, PageHeader } from '@/components/dashboard/design-system';
import { requireAuth } from '@/lib/auth';
import {
  Users, GraduationCap, UserCheck, BookOpen, ClipboardList, Calendar,
  TrendingUp, UserCog, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Route = createFileRoute('/qirat_dashboard')({
  component: QiratDashboardPage,
  beforeLoad: () => requireAuth(['qirat_manager', 'super_admin', 'admin']),
});

function QiratDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/qirat/dashboard`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load dashboard');
      setData(await res.json());
    } catch (e: any) {
      toast.error(e.message || 'Failed to load academic dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cards = data ? [
    { label: 'Total Students', value: data.totalStudents, icon: Users },
    { label: 'Active Students', value: data.activeStudents, icon: Users },
    { label: 'Inactive Students', value: data.inactiveStudents, icon: Users },
    { label: 'Total Teachers', value: data.totalTeachers, icon: GraduationCap },
    { label: 'Active Teachers', value: data.activeTeachers, icon: GraduationCap },
    { label: 'Active Classes', value: data.activeClasses, icon: Calendar },
    { label: "Today's Classes", value: data.todaysClasses, icon: Calendar },
    { label: 'Attendance Rate', value: `${data.attendanceRate}%`, icon: UserCheck },
    { label: 'Homework Completion', value: `${data.homeworkCompletionRate}%`, icon: ClipboardList },
    { label: 'Qaidah Nooraniyah', value: data.studentsInQaidah, icon: BookOpen },
    { label: 'Quran Reading', value: data.studentsInQuranReading, icon: BookOpen },
    { label: 'Tajweed', value: data.studentsInTajweed, icon: BookOpen },
    { label: 'Hifz', value: data.studentsInHifz, icon: BookOpen },
    { label: 'Teacher Replacements', value: data.totalReplacements, icon: UserCog },
    { label: 'New Registrations', value: data.newStudentRegistrations, icon: TrendingUp },
  ] : [];

  return (
    <DashboardLayout>
      <AmbientSection>
        <PageHeader
          eyebrow="Academic Director"
          title="Qirat Manager Dashboard"
          description="Real-time academic operations overview"
          actions={
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          }
        />
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {loading
            ? Array.from({ length: 15 }).map((_, i) => <div key={i} className="glass-panel h-28 animate-pulse rounded-2xl" />)
            : cards.map((c) => (
                <BentoStatCard key={c.label} label={c.label} value={String(c.value)} icon={<c.icon className="h-5 w-5" />} />
              ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { to: '/students', label: 'Students' },
            { to: '/teachers', label: 'Teachers' },
            { to: '/live-sessions', label: 'Live Sessions' },
            { to: '/schedules', label: 'Schedules' },
            { to: '/progress', label: 'Quran Progress' },
            { to: '/reports', label: 'Academic Reports' },
          ].map((link) => (
            <Link key={link.to} to={link.to} className="glass-panel rounded-2xl p-5 transition hover:border-nejah-electric/30">
              <p className="font-medium text-foreground">{link.label}</p>
              <p className="mt-1 text-xs text-nejah-slate-blue">Manage →</p>
            </Link>
          ))}
        </div>
      </AmbientSection>
    </DashboardLayout>
  );
}
