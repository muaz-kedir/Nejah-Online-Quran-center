import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  studentId: string;
  enrollmentDate: string;
  primaryCourse: string;
  status: 'active' | 'pending';
}

const recentStudents: Student[] = [
  {
    id: '1',
    name: 'Omar Al-Fayid',
    initials: 'OA',
    avatarColor: 'from-teal-400 to-teal-600',
    studentId: 'ID: ST-8821',
    enrollmentDate: 'Oct 12, 2023',
    primaryCourse: 'Hifz & Tajweed',
    status: 'active',
  },
  {
    id: '2',
    name: 'Fatima Zahra',
    initials: 'FZ',
    avatarColor: 'from-pink-400 to-rose-500',
    studentId: 'ID: ST-8822',
    enrollmentDate: 'Oct 14, 2023',
    primaryCourse: 'Arabic Language',
    status: 'active',
  },
  {
    id: '3',
    name: 'Zaid Mansour',
    initials: 'ZM',
    avatarColor: 'from-amber-400 to-orange-500',
    studentId: 'ID: ST-8825',
    enrollmentDate: 'Oct 15, 2023',
    primaryCourse: 'Islamic Studies',
    status: 'pending',
  },
];

export function RecentStudentsTable() {
  const { t } = useApp();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.recentStudents}</h2>
        <button className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors group">
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
            {recentStudents.map((student) => (
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
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{student.studentId}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">
                  {student.enrollmentDate}
                </td>
                <td className="py-3.5 px-4 text-sm text-gray-600 dark:text-gray-300">
                  {student.primaryCourse}
                </td>
                <td className="py-3.5 px-4">
                  <Badge
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider border-0 rounded-full px-2.5',
                      student.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    )}
                  >
                    {student.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
