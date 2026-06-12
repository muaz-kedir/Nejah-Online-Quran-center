import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BookOpen, Award, TrendingUp, CalendarCheck, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, getLinkedStudentId, requireStudentAuth, studentPaths } from '@/lib/student-portal';
import {
  LearningPathCard,
  LevelHistoryList,
  type LearningPathData,
  type LevelHistoryEntry,
} from '@/components/progress/LearningPathCard';

function StudentProgress() {
  const [data, setData] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null);
  const [levelHistory, setLevelHistory] = useState<LevelHistoryEntry[]>([]);
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

    getLinkedStudentId().then((studentId) => {
      if (!studentId) return;
      api<LearningPathData>(`/progress/student/${studentId}/learning-path`)
        .then(setLearningPath)
        .catch(() => null);
      api<LevelHistoryEntry[]>(`/progress/student/${studentId}/level-history`)
        .then((h) => setLevelHistory(h || []))
        .catch(() => null);
    });
  }, []);

  if (loading) return <StudentPageLoader />;

  const overview = data?.overview || data;
  const percentage = overview?.memorizationPercentage ?? data?.percentage ?? 0;

  return (
    <StudentPortalLayout activePath={studentPaths.progress}>
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-nejah-sapphire font-serif">My Progress</h1>
        </div>

        {learningPath && (
          <div className="bg-card rounded-[32px] p-8 border mb-8">
            <LearningPathCard path={learningPath} />
          </div>
        )}

        <div className="bg-card rounded-[32px] p-8 border mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-nejah-sapphire">Academic Overview</h3>
              <p className="text-sm text-muted-foreground">{percentage}% memorization</p>
            </div>
            <Badge className="bg-primary/10 text-nejah-sapphire border-none">
              <Award className="h-3 w-3 mr-1" /> {overview?.rank || data?.rank}
            </Badge>
          </div>
          <ProgressBar value={percentage} className="h-3 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-muted p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground font-bold uppercase">Quran Level</p>
              <p className="font-bold text-nejah-sapphire mt-1">{overview?.quranLevel || '—'}</p>
            </div>
            <div className="bg-muted p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground font-bold uppercase">Current Surah</p>
              <p className="font-bold text-nejah-sapphire mt-1 text-sm">{overview?.currentSurah || '—'}</p>
            </div>
            <div className="bg-muted p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground font-bold uppercase">Current Page</p>
              <p className="font-bold text-nejah-sapphire mt-1">{overview?.currentPage || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground font-bold uppercase">Current Ayah</p>
              <p className="font-bold text-nejah-sapphire mt-1">{overview?.currentAyah || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-2xl col-span-2 md:col-span-1">
              <p className="text-xs text-muted-foreground font-bold uppercase">Juz Completed</p>
              <p className="font-bold text-nejah-sapphire mt-1">{overview?.completedJuz ?? 0}</p>
            </div>
          </div>
        </div>

        {attendance?.stats && (
          <div className="bg-card rounded-[32px] p-8 border mb-8">
            <h3 className="text-lg font-bold text-nejah-sapphire mb-4 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" /> Attendance History
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-bold text-nejah-sapphire">{attendance.stats.present}</p><p className="text-xs text-muted-foreground">Present</p></div>
              <div><p className="text-2xl font-bold text-amber-600">{attendance.stats.late}</p><p className="text-xs text-muted-foreground">Late</p></div>
              <div><p className="text-2xl font-bold text-red-600">{attendance.stats.absent}</p><p className="text-xs text-muted-foreground">Absent</p></div>
              <div><p className="text-2xl font-bold">{Math.round(attendance.stats.attendancePercentage || 0)}%</p><p className="text-xs text-muted-foreground">Rate</p></div>
            </div>
          </div>
        )}

        {levelHistory.length > 0 && (
          <div className="bg-card rounded-[32px] p-8 border mb-8">
            <h3 className="text-lg font-bold text-nejah-sapphire mb-6 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> Level History
            </h3>
            <LevelHistoryList history={levelHistory} />
          </div>
        )}

        <div className="bg-card rounded-[32px] p-8 border mb-8">
          <h3 className="text-lg font-bold text-nejah-sapphire mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Progress Timeline
          </h3>
          {data?.timeline?.length ? (
            <div className="space-y-4 border-l-2 border-primary/200 pl-6">
              {data.timeline.map((item: any, i: number) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[31px] w-3 h-3 rounded-full bg-primary top-1" />
                  <p className="font-bold text-sm text-nejah-sapphire">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {item.date ? new Date(item.date).toLocaleDateString() : ''}
                    {item.teacherName ? ` · ${item.teacherName}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No timeline entries yet.</p>
          )}
        </div>

        <div className="bg-card rounded-[32px] p-8 border mb-8">
          <h3 className="text-lg font-bold text-nejah-sapphire mb-4">Tajweed Evaluation</h3>
          {data?.tajweed?.length ? (
            <div className="space-y-4">
              {data.tajweed.map((t: any) => (
                <div key={t.id} className="bg-primary/10/50 p-4 rounded-2xl border border-primary/100">
                  <p className="text-xs font-bold text-primary">{t.teacherName} · {t.date ? new Date(t.date).toLocaleDateString() : ''}</p>
                  <p className="text-sm mt-2">{t.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No tajweed notes yet.</p>
          )}
        </div>

        <div className="bg-card rounded-[32px] p-8 border">
          <h3 className="text-lg font-bold text-nejah-sapphire mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Teacher Feedback
          </h3>
          {data?.teacherFeedback?.length ? (
            <div className="space-y-4">
              {data.teacherFeedback.map((f: any) => (
                <div key={f.id} className="border-b pb-4 last:border-0">
                  <p className="font-bold text-sm">{f.teacherName}</p>
                  <p className="text-xs text-muted-foreground">{f.date ? new Date(f.date).toLocaleDateString() : ''}</p>
                  <p className="text-sm mt-2 text-foreground">{f.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No feedback yet.</p>
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
