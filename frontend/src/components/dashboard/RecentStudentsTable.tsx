import { ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { memo, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { GlassPanel, PanelHeader } from './design-system';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApiQuery } from '@/hooks/useApiQuery';

interface Student {
  id: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  level: string;
  createdAt: string;
  status: 'active' | 'pending';
}

const avatarColors = [
  'from-nejah-sapphire to-nejah-electric',
  'from-blue-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-nejah-azure',
];

export const RecentStudentsTable = memo(function RecentStudentsTable() {
  const { t } = useApp();
  const navigate = useNavigate();

  const { data, isLoading } = useApiQuery<{ data: any[] }>({
    queryKey: ['dashboard', 'recent-students'],
    path: '/students?limit=5',
    refetchInterval: 30_000,
  });

  const students = useMemo(() => {
    if (!data || !Array.isArray(data.data)) return [];
    return data.data.map((student: any, index: number) => ({
      id: student.id,
      fullName: student.fullName,
      initials: student.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      avatarColor: avatarColors[index % avatarColors.length],
      level: student.level || 'Beginner',
      createdAt: new Date(student.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      status: (student.status === 'active' || student.status === 'pending' ? student.status : 'active') as 'active' | 'pending',
    }));
  }, [data]);

  return (
    <GlassPanel className="overflow-hidden">
      <PanelHeader
        title={t.recentStudents}
        action={
          <button
            onClick={() => navigate({ to: '/students' })}
            className="flex items-center gap-1 text-sm font-medium text-nejah-electric transition-colors hover:text-nejah-electric/80 group"
          >
            {t.viewAll}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Student Name</TableHead>
            <TableHead>Enrollment Date</TableHead>
            <TableHead>Primary Course</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Loading students...
              </TableCell>
            </TableRow>
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No students registered yet
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id} className="group cursor-pointer">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm',
                        student.avatarColor,
                      )}
                    >
                      {student.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground transition-colors group-hover:text-nejah-electric">
                        {student.fullName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">ID: {student.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{student.createdAt}</TableCell>
                <TableCell className="text-muted-foreground">{student.level}</TableCell>
                <TableCell>
                  <span className="rounded-full border border-nejah-electric/20 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-nejah-electric">
                    {student.status}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </GlassPanel>
  );
});
