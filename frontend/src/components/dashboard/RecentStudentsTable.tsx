import { ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { memo, useState, useEffect } from 'react';
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
  'from-brand-primary to-brand-electric',
  'from-blue-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-emerald-600',
];

export const RecentStudentsTable = memo(function RecentStudentsTable() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/students?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data && Array.isArray(data.data)) {
          const formattedStudents = data.data.map((student: any, index: number) => ({
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
            status: 'active' as const,
          }));
          setStudents(formattedStudents);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <GlassPanel className="overflow-hidden">
      <PanelHeader
        title={t.recentStudents}
        action={
          <button
            onClick={() => navigate({ to: '/students' })}
            className="flex items-center gap-1 text-sm font-medium text-brand-electric transition-colors hover:text-brand-electric/80 group"
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
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-brand-platinum">
                Loading students...
              </TableCell>
            </TableRow>
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-brand-platinum">
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
                      <p className="text-sm font-medium text-brand-silver transition-colors group-hover:text-brand-electric">
                        {student.fullName}
                      </p>
                      <p className="font-mono text-xs text-brand-platinum">ID: {student.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-brand-platinum">{student.createdAt}</TableCell>
                <TableCell className="text-brand-platinum">{student.level}</TableCell>
                <TableCell>
                  <span className="rounded-full border border-brand-electric/20 bg-brand-electric/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-brand-electric">
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
