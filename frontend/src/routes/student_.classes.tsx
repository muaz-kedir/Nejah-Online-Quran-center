import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, Clock, User, Play, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';

function StudentClasses() {
  const [data, setData] = useState<any>({ current: [], upcoming: [], previous: [], liveClass: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/student/dashboard/classes')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StudentPageLoader />;

  const joinClass = (link?: string, sessionId?: string) => {
    if (sessionId) {
      window.location.href = `/class-session/${sessionId}`;
      return;
    }
    if (link) window.open(link, '_blank');
  };

  const ClassCard = ({ cls, showJoin }: { cls: any; showJoin?: boolean }) => (
    <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-emerald-950 font-serif">{cls.className || cls.name}</h3>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-gray-500">
              <CalendarDays className="h-4 w-4" /> {cls.dayOfWeek || cls.day || '—'}
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" /> {cls.time || `${cls.startTime || ''} - ${cls.endTime || ''}`}
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <User className="h-4 w-4" /> {cls.teacherName || cls.teacher}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-none uppercase text-[10px] font-bold">{cls.status || 'scheduled'}</Badge>
          {showJoin && (
            <Button size="sm" className="bg-emerald-700" onClick={() => joinClass(cls.meetingLink, data.liveClass?.id)}>
              <Play className="h-3 w-3 mr-1" /> Join Class
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <StudentPortalLayout activePath={studentPaths.classes}>
      <main className="flex-1 px-10 py-10 max-w-5xl">
        <div className="mb-10">
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Student Portal</p>
          <h1 className="text-4xl font-extrabold text-emerald-950 font-serif">My Classes</h1>
        </div>

        {data.liveClass && (
          <section className="mb-10">
            <h2 className="text-sm font-extrabold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Video className="h-4 w-4" /> Live Now
            </h2>
            <div className="bg-emerald-950 text-white rounded-3xl p-8">
              <h3 className="text-2xl font-bold">{data.liveClass.classTitle}</h3>
              <Button className="mt-4 bg-white text-emerald-950" onClick={() => joinClass(data.liveClass.meetingLink, data.liveClass.id)}>
                Enter Live Class
              </Button>
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Current Class</h2>
          {data.current?.length ? (
            <div className="space-y-4">{data.current.map((c: any) => <ClassCard key={c.id} cls={c} showJoin />)}</div>
          ) : (
            <p className="text-gray-400 text-sm">No class scheduled for today.</p>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Upcoming Classes</h2>
          {data.upcoming?.length ? (
            <div className="space-y-4">{data.upcoming.map((c: any) => <ClassCard key={c.id} cls={c} />)}</div>
          ) : (
            <p className="text-gray-400 text-sm">No upcoming classes.</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-emerald-950 mb-4">Previous Classes</h2>
          {data.previous?.length ? (
            <div className="space-y-4">
              {data.previous.map((c: any) => (
                <div key={c.id} className="bg-gray-50 rounded-2xl p-5 border">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-emerald-900">
                      {c.classDate ? new Date(c.classDate).toLocaleDateString() : '—'}
                    </span>
                    <span className="text-gray-500">{c.duration ? `${c.duration} min` : '—'}</span>
                  </div>
                  <p className="mt-2 font-medium">{c.lessonCovered || 'Quran Class'}</p>
                  {c.teacherNotes && <p className="text-sm text-gray-500 mt-2 italic">"{c.teacherNotes}"</p>}
                  <p className="text-xs text-gray-400 mt-2">Teacher: {c.teacherName || '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No completed class history yet.</p>
          )}
        </section>
      </main>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/classes')({
  component: StudentClasses,
  beforeLoad: requireStudentAuth,
});
