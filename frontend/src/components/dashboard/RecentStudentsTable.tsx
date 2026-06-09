import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { memo, useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

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
  'from-teal-400 to-teal-600',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.recentStudents}</h2>
        <button
          onClick={() => navigate({ to: '/students' })}
          className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors group"
        >
          {t.viewAll}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <th className="text-left py-3 px-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Student Name
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Enrollment Date
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Primary Course
              </th>
              <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  No students registered yet
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0',
                          student.avatarColor
                        )}
                      >
                        {student.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">ID: {student.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {student.createdAt}
                  </td>
                  <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {student.level}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider border-0 rounded-full px-2.5',
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      )}
                    >
                      {student.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
