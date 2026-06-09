import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Play,
  BookOpen,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, apiHeaders, requireStudentAuth, storeStudentId, studentPaths } from '@/lib/student-portal';
import { LearningPathCard, useLearningPath } from '@/components/progress/LearningPathCard';

const dayLabels: Record<string, string> = {
  Sunday: 'S', Monday: 'M', Tuesday: 'T', Wednesday: 'W',
  Thursday: 'T', Friday: 'F', Saturday: 'S',
};

function StudentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', email: '' });
  const { path: learningPath } = useLearningPath(profile?.student?.id);

  useEffect(() => {
    Promise.all([
      api('/student/dashboard'),
      api('/student/profile').catch(() => null),
    ])
      .then(([dash, prof]) => {
        setData(dash);
        setProfile(prof);
        if (prof?.student) {
          storeStudentId(prof.student.id);
          setProfileForm({ phone: prof.student.phone || '', email: prof.student.email || '' });
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error('Could not load your dashboard. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Check password fields');
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/change-password`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(pwForm),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
      toast.success('Password updated');
      setChangePasswordOpen(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setChangingPw(false);
    }
  };

  const saveProfile = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/profile`, {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ phone: profileForm.phone, email: profileForm.email }),
      });
      toast.success('Profile updated');
      setProfileOpen(false);
    } catch {
      toast.error('Could not update profile');
    }
  };

  if (loading) return <StudentPageLoader />;

  const student = data?.student;
  const welcome = data?.welcome;
  const progress = data?.progress;
  const attendance = data?.attendance;

  const displayLevel =
    student?.level || welcome?.quranLevel || profile?.student?.level || '—';
  const displayTeacher =
    student?.effectiveTeacher ||
    student?.assignedTeacher ||
    welcome?.assignedTeacher ||
    profile?.student?.assignedTeacher ||
    'Not assigned yet';
  const enrollmentRaw =
    student?.enrollmentDate || welcome?.enrollmentDate || profile?.student?.enrollmentDate;
  const displayEnrolled = enrollmentRaw
    ? new Date(enrollmentRaw).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const joinClass = () => {
    if (data?.liveClass?.id) {
      window.location.href = `/class-session/${data.liveClass.id}`;
    } else if (data?.upcomingClass?.meetingLink) {
      window.open(data.upcomingClass.meetingLink, '_blank');
    } else {
      toast.info('No live meeting available yet.');
    }
  };

  return (
    <StudentPortalLayout
      activePath={studentPaths.dashboard}
      student={student ? { ...student, level: displayLevel } : undefined}
      unreadNotifications={data?.unreadNotifications}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenProfile={() => setProfileOpen(true)}
    >
      <main className="flex-1 px-10 pb-10 space-y-8">
        <div>
          <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">
            Assalamu Alaikum, {welcome?.studentName?.split(' ')[0] || student?.name?.split(' ')[0] || 'Student'}!
          </p>
          <h2 className="text-3xl font-extrabold text-emerald-950 font-serif">Your Learning Center</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-gray-600">
            <span><strong>Level:</strong> {displayLevel}</span>
            <span><strong>Teacher:</strong> {displayTeacher}</span>
            <span><strong>Enrolled:</strong> {displayEnrolled}</span>
          </div>
        </div>

        {student?.isTemporaryTeacher && student?.temporaryTeacher && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <p className="font-bold mb-1">Temporary Teacher Assigned</p>
            <p>
              <strong>{student.temporaryTeacher.name}</strong> is teaching your classes from{' '}
              {student.temporaryTeacher.startDate} to {student.temporaryTeacher.endDate}.
              Your regular teacher is {student.temporaryTeacher.originalTeacher}.
            </p>
          </div>
        )}

        {learningPath && (
          <div className="bg-white rounded-3xl p-6 border shadow-sm">
            <LearningPathCard path={learningPath} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Current Hifz Progress</h3>
                  <p className="text-sm text-gray-400">{progress?.currentSurah} · Ayah {progress?.currentAyah}</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-800 border-none">{progress?.rank}</Badge>
              </div>
              <ProgressBar value={progress?.percentage || 0} className="h-2 mb-4" />
              <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
                <div className="bg-gray-50 p-3 rounded-xl"><p className="font-bold text-lg">{progress?.memorizedSurahs}</p><p className="text-xs text-gray-400">Surahs</p></div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="font-bold text-lg">{progress?.memorizedAyahs}</p><p className="text-xs text-gray-400">Ayahs</p></div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="font-bold text-lg">{progress?.completedJuz}</p><p className="text-xs text-gray-400">Juz</p></div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate({ to: studentPaths.progress })}>
                View Full Progress <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="bg-white rounded-3xl p-6 border shadow-sm">
              <h3 className="text-lg font-bold text-emerald-900 mb-3">Today&apos;s Lesson</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400 font-bold uppercase">Surah</p><p className="font-medium">{data?.todaysLesson?.surah}</p></div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400 font-bold uppercase">Ayah Range</p><p className="font-medium">{data?.todaysLesson?.ayahRange}</p></div>
                <div className="bg-gray-50 p-3 rounded-xl sm:col-span-2"><p className="text-xs text-gray-400 font-bold uppercase">Revision</p><p className="font-medium">{data?.todaysLesson?.revision}</p></div>
                {data?.todaysLesson?.homework && (
                  <div className="bg-amber-50 p-3 rounded-xl sm:col-span-2 border border-amber-100">
                    <p className="text-xs text-amber-700 font-bold uppercase">Homework</p>
                    <p className="font-medium">{data.todaysLesson.homework.title}</p>
                  </div>
                )}
              </div>
            </div>

            {data?.recentFeedback?.length > 0 && (
              <div className="bg-emerald-950 text-white rounded-3xl p-6">
                <h3 className="font-bold mb-4">Recent Teacher Feedback</h3>
                {data.recentFeedback.slice(0, 2).map((f: any) => (
                  <div key={f.id} className="mb-4 last:mb-0 border-b border-white/10 pb-4 last:border-0">
                    <p className="text-xs text-emerald-300">{f.teacherName} · {f.date ? new Date(f.date).toLocaleDateString() : ''}</p>
                    <p className="text-sm mt-1 italic">&quot;{f.summary}&quot;</p>
                  </div>
                ))}
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => navigate({ to: studentPaths.progress })}>
                  View All Feedback
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-900 text-white rounded-3xl p-6">
              <Badge className="bg-white/10 text-emerald-100 border-none mb-3">Upcoming Class</Badge>
              {data?.liveClass ? (
                <>
                  <h3 className="text-xl font-bold">{data.liveClass.classTitle}</h3>
                  <p className="text-emerald-200 text-sm mb-4">Live now</p>
                </>
              ) : data?.upcomingClass ? (
                <>
                  <h3 className="text-xl font-bold">{data.upcomingClass.name}</h3>
                  <p className="text-emerald-200 text-sm">with {data.upcomingClass.teacher}</p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">{data.upcomingClass.time}</p>
                </>
              ) : (
                <p className="text-emerald-200">No class scheduled</p>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <Button className="bg-white text-emerald-950" onClick={joinClass}>
                  <Play className="h-4 w-4 mr-2" /> Join Class
                </Button>
                <Button variant="outline" className="border-white/30 text-white" onClick={() => navigate({ to: studentPaths.classes })}>
                  View Schedule
                </Button>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-gray-50 rounded-3xl p-6 border text-left hover:border-emerald-200 transition-colors"
              onClick={() => navigate({ to: studentPaths.progress })}
            >
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3 text-center">Weekly Attendance</h4>
              <div className="flex justify-between px-1 mb-3">
                {attendance?.weekly?.map((day: any) => {
                  const wd = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
                  const short = dayLabels[wd] || '?';
                  return (
                    <div key={day.date} className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-12 rounded-full ${day.present ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                      <span className="text-[10px] font-bold text-gray-400">{short}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-sm font-bold text-emerald-800">{attendance?.rate ?? 0}% · Present {attendance?.presentDays ?? 0} / Absent {attendance?.absentDays ?? 0}</p>
            </button>

            <div className="bg-white rounded-3xl p-6 border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</h3>
                {data?.unreadNotifications > 0 && <Badge className="bg-red-500 text-white border-none">{data.unreadNotifications}</Badge>}
              </div>
              {data?.notifications?.length ? (
                <ul className="space-y-2 text-sm">
                  {data.notifications.slice(0, 3).map((n: any) => (
                    <li key={n.id} className={n.isRead ? 'text-gray-400' : 'font-medium text-gray-800'}>{n.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No notifications</p>
              )}
              <Button variant="link" className="px-0 text-emerald-700 mt-2" onClick={() => navigate({ to: studentPaths.notifications })}>
                View All Notifications
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
          <button type="button" className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50" onClick={() => { setSettingsOpen(false); setChangePasswordOpen(true); }}>
            <Lock className="h-5 w-5 text-emerald-700" />
            <span className="font-bold text-sm">Change Password</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader><DialogTitle>My Profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            <p><strong>Name:</strong> {profile?.student?.fullName}</p>
            <p><strong>Level:</strong> {displayLevel}</p>
            <p><strong>Teacher:</strong> {displayTeacher}</p>
            <p><strong>Enrolled:</strong> {displayEnrolled}</p>
            <div><Label>Phone</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="bg-gray-50 p-2 rounded-lg"><p className="font-bold">{profile?.statistics?.attendancePercentage}%</p><p className="text-xs text-gray-400">Attendance</p></div>
              <div className="bg-gray-50 p-2 rounded-lg"><p className="font-bold">{profile?.statistics?.progressPercentage}%</p><p className="text-xs text-gray-400">Progress</p></div>
              <div className="bg-gray-50 p-2 rounded-lg"><p className="font-bold">{profile?.statistics?.homeworkCompletionRate}%</p><p className="text-xs text-gray-400">Homework</p></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveProfile} className="bg-emerald-700">Save Contact Info</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field, i) => (
              <div key={field}>
                <Label>{field === 'currentPassword' ? 'Current' : field === 'newPassword' ? 'New' : 'Confirm'}</Label>
                <div className="relative">
                  <Input
                    type={(i === 0 ? showCurrentPw : i === 1 ? showNewPw : showConfirmPw) ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => [setShowCurrentPw, setShowNewPw, setShowConfirmPw][i]((v) => !v)}>
                    {(i === 0 ? showCurrentPw : i === 1 ? showNewPw : showConfirmPw) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword} disabled={changingPw} className="bg-emerald-700">{changingPw ? 'Saving...' : 'Update Password'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_dashboard')({
  component: StudentDashboard,
  beforeLoad: requireStudentAuth,
});
