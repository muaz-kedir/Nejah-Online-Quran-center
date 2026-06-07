import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BookOpen, Award, TrendingUp, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';

function StudentProgress() {
  const [data, setData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/student/dashboard/progress'),
      api('/student/dashboard/attendance').catch(() => null),
    ])
      .then(([progress, att]) => {
        setData(progress);
        setAttendance(att);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StudentPageLoader />;

  const overview = data?.overview || data;
  const percentage = overview?.memorizationPercentage ?? data?.percentage ?? 0;

  return (
    <StudentPortalLayout activePath={studentPaths.progress}>
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">My Progress</h1>
        </div>

        <div className="bg-white rounded-[32px] p-8 border mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-emerald-950">Academic Overview</h3>
              <p className="text-sm text-gray-400">{percentage}% memorization</p>
            </div>
            <Badge className="bg-emerald-50 text-emerald-800 border-none">
              <Award className="h-3 w-3 mr-1" /> {overview?.rank || data?.rank}
            </Badge>
          </div>
          <ProgressBar value={percentage} className="h-3 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs text-gray-400 font-bold uppercase">Quran Level</p>
              <p className="font-bold text-emerald-950 mt-1">{overview?.quranLevel || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs text-gray-400 font-bold uppercase">Current Surah</p>
              <p className="font-bold text-emerald-950 mt-1 text-sm">{overview?.currentSurah || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs text-gray-400 font-bold uppercase">Current Page</p>
              <p className="font-bold text-emerald-950 mt-1">{overview?.currentPage || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs text-gray-400 font-bold uppercase">Current Ayah</p>
              <p className="font-bold text-emerald-950 mt-1">{overview?.currentAyah || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl col-span-2 md:col-span-1">
              <p className="text-xs text-gray-400 font-bold uppercase">Juz Completed</p>
              <p className="font-bold text-emerald-950 mt-1">{overview?.completedJuz ?? 0}</p>
            </div>
          </div>
        </div>

        {attendance?.stats && (
          <div className="bg-white rounded-[32px] p-8 border mb-8">
            <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" /> Attendance History
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-bold text-emerald-800">{attendance.stats.present}</p><p className="text-xs text-gray-400">Present</p></div>
              <div><p className="text-2xl font-bold text-amber-600">{attendance.stats.late}</p><p className="text-xs text-gray-400">Late</p></div>
              <div><p className="text-2xl font-bold text-red-600">{attendance.stats.absent}</p><p className="text-xs text-gray-400">Absent</p></div>
              <div><p className="text-2xl font-bold">{Math.round(attendance.stats.attendancePercentage || 0)}%</p><p className="text-xs text-gray-400">Rate</p></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[32px] p-8 border mb-8">
          <h3 className="text-lg font-bold text-emerald-950 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Progress Timeline
          </h3>
          {data?.timeline?.length ? (
            <div className="space-y-4 border-l-2 border-emerald-200 pl-6">
              {data.timeline.map((item: any, i: number) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[31px] w-3 h-3 rounded-full bg-emerald-600 top-1" />
                  <p className="font-bold text-sm text-emerald-900">{item.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {item.date ? new Date(item.date).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No timeline entries yet.</p>
          )}
        </div>

        <div className="bg-white rounded-[32px] p-8 border mb-8">
          <h3 className="text-lg font-bold text-emerald-950 mb-4">Tajweed Evaluation</h3>
          {data?.tajweed?.length ? (
            <div className="space-y-4">
              {data.tajweed.map((t: any) => (
                <div key={t.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700">{t.teacherName} · {t.date ? new Date(t.date).toLocaleDateString() : ''}</p>
                  <p className="text-sm mt-2">{t.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No tajweed notes yet.</p>
          )}
        </div>

        <div className="bg-white rounded-[32px] p-8 border">
          <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Teacher Feedback
          </h3>
          {data?.teacherFeedback?.length ? (
            <div className="space-y-4">
              {data.teacherFeedback.map((f: any) => (
                <div key={f.id} className="border-b pb-4 last:border-0">
                  <p className="font-bold text-sm">{f.teacherName}</p>
                  <p className="text-xs text-gray-400">{f.date ? new Date(f.date).toLocaleDateString() : ''}</p>
                  <p className="text-sm mt-2 text-gray-700">{f.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No feedback yet.</p>
          )}
        </div>
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/progress')({
  component: StudentProgress,
  beforeLoad: requireStudentAuth,
});
