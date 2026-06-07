import { useState, useEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  BookOpen, 
  Plus, 
  Clock, 
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Filter,
  Pencil,
  Trash2,
  X,
  Save,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { toast } from 'sonner';
import { TemporaryReplacementClassCard } from '@/components/teachers/TemporaryReplacementClassCard';

const API = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

// ─── Note types ────────────────────────────────────────────────────────────────
const NOTE_TYPES = ['Class Reminder', 'Observation', 'General Reminder'] as const;
type NoteType = typeof NOTE_TYPES[number];

const noteTypeColor: Record<NoteType, string> = {
  'Class Reminder': 'bg-emerald-600',
  'Observation': 'bg-amber-500',
  'General Reminder': 'bg-blue-500',
};
const noteTypeLabelColor: Record<NoteType, string> = {
  'Class Reminder': 'text-emerald-700',
  'Observation': 'text-amber-600',
  'General Reminder': 'text-blue-600',
};

// ─── Sidebar ────────────────────────────────────────────────────────────────────
const TeacherSidebar = ({ activePath }: { activePath: string }) => {
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') window.location.href = path;
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher_dashboard' },
    { label: 'Students', icon: Users, path: '/teacher_students' },
    { label: 'Schedule', icon: Calendar, path: '/teacher_schedule' },
    { label: 'Notifications', icon: Bell, path: '/teacher_notifications' },
    { label: 'Profile', icon: User, path: '/teacher_profile' },
  ];

  return (
    <div className="w-64 bg-[#052c22] text-white flex flex-col h-screen fixed inset-y-0 left-0">
      <div className="p-8 pb-12">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Nejah" className="h-10 w-auto rounded-xl" />
          <div>
            <h1 className="font-bold text-base leading-none">Teacher Suite</h1>
            <p className="text-[10px] text-emerald-400 font-medium tracking-widest mt-1 uppercase">Modern Maqam</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive ? "bg-emerald-900/50 text-white" : "text-emerald-100/50 hover:bg-emerald-900/30 hover:text-white"
            )}>
              <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-400" : "text-emerald-100/40 group-hover:text-emerald-300")} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-emerald-800">
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              window.location.href = '/login';
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-100/50 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

// ─── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({ teacher }: any) => (
  <div className="h-20 flex items-center justify-between px-10 bg-white border-b border-gray-100 sticky top-0 z-10 w-full ml-64 max-w-[calc(100%-256px)]">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-emerald-50 rounded-lg lg:hidden">
        <LayoutDashboard className="h-5 w-5 text-emerald-700" />
      </div>
      <h2 className="text-xl font-bold text-emerald-950 font-serif hidden md:block">Teacher Suite</h2>
    </div>

    <div className="flex-1 max-w-xl mx-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search students, resources, or notes..." className="pl-12 bg-gray-50 border-none rounded-2xl h-12 w-full focus-visible:ring-emerald-500 text-sm" />
      </div>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-sm font-bold text-emerald-950 leading-tight">{teacher?.name || 'Teacher'}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{teacher?.title || 'Instructor'}</p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-emerald-100 p-0.5 bg-emerald-50 flex items-center justify-center text-emerald-800 font-bold">
          {teacher?.avatar ? (
            <img src={teacher.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{(teacher?.name || 'T').charAt(0)}</span>
          )}
        </div>
      </div>
      <div className="w-px h-8 bg-gray-100" />
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-emerald-700 transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
        </button>
        <button className="p-2 text-gray-400 hover:text-emerald-700 transition-colors">
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, title, value, subValue, label, color, bgColor }: any) => (
  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-start justify-between">
      <div className={cn("p-4 rounded-2xl", bgColor)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      {subValue && (
        <Badge className={cn("rounded-full border-none px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", subValue.includes('+') ? "bg-emerald-50 text-emerald-600" : (subValue.includes('Next') ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"))}>
          {subValue}
        </Badge>
      )}
    </div>
    <div className="mt-6">
      <h3 className="text-3xl font-extrabold text-emerald-950 font-serif leading-none">{value}</h3>
      <p className="text-sm font-semibold text-gray-400 mt-2">{label}</p>
    </div>
  </div>
);

// ─── Note Modal ─────────────────────────────────────────────────────────────────
interface NoteModalProps {
  note: any;
  onClose: () => void;
  onSave: (data: { title: string; content: string; type: string }) => void;
}

const NoteModal = ({ note, onClose, onSave }: NoteModalProps) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [type, setType] = useState<NoteType>(note?.type || 'General Reminder');
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSaving(true);
    await onSave({ title, content, type });
    setSaving(false);
  };

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === backdropRef.current && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-extrabold text-emerald-950 font-serif">{note ? 'Edit Note' : 'Add Personal Reflection'}</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Your notes are private and visible only to you</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5">
          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Note Type</label>
            <div className="flex gap-2 flex-wrap">
              {NOTE_TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                  type === t
                    ? t === 'Class Reminder' ? 'bg-emerald-600 border-emerald-600 text-white' : t === 'Observation' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Focus on Makharij with Sarah"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-emerald-950 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your note or observation here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 pb-8">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-xl text-sm font-bold bg-[#052c22] text-white hover:bg-emerald-900 transition-all flex items-center gap-2 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : (note ? 'Save Changes' : 'Add Note')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<{ open: boolean; note: any }>({ open: false, note: null });

  // ── Dynamic time status
  const getSessionStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (cur > endTime) return 'COMPLETED';
    if (cur >= startTime && cur <= endTime) return 'LIVE NOW';
    return 'READY TO START';
  };

  // ── Format date relative
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  // ── Launch session
  const handleLaunchSession = async (scheduleId: string) => {
    try {
      const response = await fetch(`${API}/attendance/sessions/by-schedule-today/${scheduleId}`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const session = await response.json();
        window.location.href = `/class-session/${session.id}`;
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to initialize session');
      }
    } catch {
      toast.error('Network error launching classroom');
    }
  };

  // ── Fetch all dashboard data
  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, sessRes, notesRes] = await Promise.all([
          fetch(`${API}/teacher/dashboard`, { headers: authHeaders() }),
          fetch(`${API}/teacher/dashboard/today-sessions`, { headers: authHeaders() }),
          fetch(`${API}/teacher/dashboard/notes`, { headers: authHeaders() }),
        ]);
        if (dashRes.ok) {
          const dash = await dashRes.json();
          if (dash.message) {
            toast.error(dash.message);
          } else {
            setData(dash);
          }
        } else if (dashRes.status === 403 || dashRes.status === 404) {
          const err = await dashRes.json().catch(() => ({}));
          toast.error(err.message || 'Teacher profile not found for your account');
        }
        if (sessRes.ok) setTodaySessions(await sessRes.json());
        if (notesRes.ok) setNotes(await notesRes.json());
      } catch {
        console.error('Dashboard load failed');
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(() => setTodaySessions(p => [...p]), 60000);
    return () => clearInterval(iv);
  }, []);

  // ── Notes actions
  const openCreate = () => setNoteModal({ open: true, note: null });
  const openEdit = (note: any) => setNoteModal({ open: true, note });
  const closeModal = () => setNoteModal({ open: false, note: null });

  const handleSaveNote = async (body: { title: string; content: string; type: string }) => {
    const { note } = noteModal;
    try {
      if (note) {
        const res = await fetch(`${API}/teacher/dashboard/notes/${note.id}`, {
          method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
          toast.success('Note updated!');
          closeModal();
        } else toast.error('Failed to update note');
      } else {
        const res = await fetch(`${API}/teacher/dashboard/notes`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          setNotes(prev => [created, ...prev]);
          toast.success('Note added!');
          closeModal();
        } else toast.error('Failed to create note');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch(`${API}/teacher/dashboard/notes/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== id));
        toast.success('Note deleted');
      } else toast.error('Failed to delete note');
    } catch {
      toast.error('Network error');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#052c22]"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc] text-gray-900 font-sans">
      <TeacherSidebar activePath="/teacher_dashboard" />

      <div className="flex-1 flex flex-col ml-64">
        <Topbar teacher={data?.teacher} />

        <main className="p-10 space-y-12">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Assalamu Alaikum, Teacher</p>
              <h2 className="text-4xl font-extrabold text-emerald-950 font-serif">Dashboard Overview</h2>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="h-12 rounded-xl px-6 border-gray-200 font-bold text-gray-600 gap-2">View Schedule</Button>
              <Button onClick={openCreate} className="h-12 rounded-xl px-6 bg-[#052c22] hover:bg-[#084133] font-bold gap-2 text-white shadow-xl">
                <Plus className="h-5 w-5" /> New Lesson Note
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} value={data?.stats?.totalStudents || 0} label="My Students" color="text-emerald-700" bgColor="bg-emerald-50/50" />
            <StatCard icon={Calendar} value={data?.stats?.todayClasses || 0} label="Today's Classes" color="text-amber-700" bgColor="bg-amber-50/50" />
            <StatCard icon={Filter} value={`${data?.stats?.overallAttendance || 0}%`} label="Overall Attendance" color="text-emerald-600" bgColor="bg-emerald-50/50" />
            <StatCard icon={ClipboardList} value={data?.stats?.homeworkPending || 0} label="Homework Pending" color="text-red-700" bgColor="bg-red-50/50" />
          </div>

          {(data?.temporaryStudents?.length > 0 || data?.reassignedAwayStudents?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.temporaryStudents?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-amber-900 mb-1">Temporary Students</h3>
                  <p className="text-xs text-amber-700 mb-4">
                    Enter your Zoom link and create the class — the student will be notified to join.
                  </p>
                  <ul className="space-y-3">
                    {data.temporaryStudents.map((r: any) => (
                      <TemporaryReplacementClassCard
                        key={r.id}
                        assignment={r}
                        onStarted={() => {
                          fetch(`${API}/teacher/dashboard`, {
                            headers: { Authorization: `Bearer ${getToken()}` },
                          })
                            .then((res) => res.json())
                            .then(setData)
                            .catch(() => {});
                        }}
                      />
                    ))}
                  </ul>
                </div>
              )}
              {data?.reassignedAwayStudents?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Students Temporarily Reassigned</h3>
                  <ul className="space-y-2">
                    {data.reassignedAwayStudents.map((r: any) => (
                      <li key={r.id} className="text-sm text-blue-900 bg-white/70 rounded-lg px-3 py-2">
                        <span className="font-semibold">{r.student?.fullName}</span>
                        <span className="text-blue-700"> → {r.replacementTeacher?.fullName}</span>
                        <span className="text-blue-600"> ({r.startDate} – {r.endDate})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Progress Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-950 font-serif">Active Student Progress</h3>
                <button
                  type="button"
                  onClick={() => { window.location.href = '/teacher_students'; }}
                  className="text-xs font-bold text-[#052c22] flex items-center gap-1 hover:underline"
                >
                  View All Students <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/30 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-8 py-5">Student Name</th>
                      <th className="px-8 py-5">Current Surah/Juz</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.studentProgress?.map((student: any) => (
                      <tr
                        key={student.id}
                        className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          window.location.href = `/teacher_students/${student.id}?tab=progress`;
                        }}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-bold text-xs text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                              {student.initials}
                            </div>
                            <span className="font-bold text-emerald-950">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6"><span className="text-sm font-semibold text-gray-600">{student.currentSurah}</span></td>
                        <td className="px-8 py-6">
                          <Badge className={cn(
                            "rounded-full border-none px-3 py-1 text-[8px] font-extrabold uppercase tracking-widest leading-none",
                            student.status === 'EXCEEDING' ? "bg-emerald-50 text-emerald-600" :
                            student.status === 'ON TRACK' ? "bg-emerald-50 text-emerald-700/70" :
                            student.status === 'NEEDS REVIEW' ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {student.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-20">
                            <ProgressBar value={student.progress} className={cn("h-1.5",
                              student.status === 'EXCEEDING' ? "bg-emerald-100 [&>div]:bg-emerald-600" :
                              student.status === 'NEEDS REVIEW' ? "bg-amber-100 [&>div]:bg-amber-600" : "bg-gray-100 [&>div]:bg-gray-400"
                            )} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Teacher Notes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-emerald-950 font-serif">Teacher's Notes</h3>
                <button className="p-2 bg-gray-100 rounded-lg text-gray-400 hover:bg-gray-200 transition-all">
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                {notes.length === 0 && (
                  <div className="bg-white rounded-[24px] p-8 border border-dashed border-gray-200 text-center">
                    <p className="text-sm text-gray-400 font-medium">No notes yet. Add your first reflection!</p>
                  </div>
                )}

                {notes.map((note: any) => (
                  <div key={note.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                    {/* Colored accent bar */}
                    <div className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full",
                      noteTypeColor[note.type as NoteType] || 'bg-gray-400'
                    )} />

                    {/* Hover action buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEdit(note)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 text-gray-500 transition-all"
                        title="Edit note"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 transition-all"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-3 pr-16">
                      <span className={cn(
                        "text-[9px] font-extrabold uppercase tracking-widest",
                        noteTypeLabelColor[note.type as NoteType] || 'text-gray-500'
                      )}>{note.type}</span>
                      <span className="text-[10px] font-bold text-gray-400">{formatDate(note.createdAt)}</span>
                    </div>
                    <h4 className="text-base font-bold text-emerald-950 font-serif leading-tight mb-2">{note.title}</h4>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))}

                <button
                  onClick={openCreate}
                  className="w-full h-16 rounded-[24px] border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-700 transition-all"
                >
                  + Add Personal Reflection
                </button>
              </div>
            </div>
          </div>

          {/* Today's Remaining Sessions */}
          <div className="space-y-8 pt-8">
            <h3 className="text-2xl font-bold text-emerald-950 font-serif">Today's Remaining Sessions</h3>

            {todaySessions.length === 0 ? (
              <div className="bg-white rounded-[32px] p-12 border border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="h-10 w-10 text-emerald-600" />
                </div>
                <h4 className="text-2xl font-bold text-emerald-950 font-serif mb-2">No remaining sessions for today.</h4>
                <p className="text-gray-400 font-medium">You have completed all your scheduled classes or have a day off.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {todaySessions.map((session: any) => {
                  const dynamicStatus = getSessionStatus(session.startTime, session.endTime);
                  return (
                    <div key={session.scheduleId} className="bg-white rounded-[40px] p-10 overflow-hidden relative group shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-8">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-bold text-emerald-950">{session.startTime} - {session.endTime}</span>
                      </div>
                      <h4 className="text-4xl font-extrabold text-emerald-950 font-serif mb-2 line-clamp-1">{session.title}</h4>
                      <p className="text-sm text-gray-400 font-semibold mb-10">{session.sessionType}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-900 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                            {session.studentAvatar}
                          </div>
                          <span className="text-xs font-bold text-emerald-950">{session.studentName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={cn(
                            "border-none font-bold text-[9px] uppercase tracking-wider px-3 py-1",
                            dynamicStatus === 'COMPLETED' ? "bg-gray-100 text-gray-500" :
                            dynamicStatus === 'LIVE NOW' ? "bg-red-50 text-red-600 animate-pulse" :
                            "bg-emerald-50 text-emerald-600"
                          )}>
                            {dynamicStatus}
                          </Badge>
                          <button
                            onClick={() => handleLaunchSession(session.scheduleId)}
                            className="text-sm font-extrabold text-emerald-850 hover:underline cursor-pointer"
                          >
                            Open Quran View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Add Note button */}
      <div className="fixed bottom-10 right-10">
        <button
          onClick={openCreate}
          className="w-14 h-14 bg-[#052c22] rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Note Modal */}
      {noteModal.open && (
        <NoteModal note={noteModal.note} onClose={closeModal} onSave={handleSaveNote} />
      )}
    </div>
  );
}

export const Route = createFileRoute('/teacher_dashboard')({
  component: TeacherDashboard,
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      if (!token) { window.location.href = '/login'; throw new Error('Not authenticated'); }
      if (role !== 'teacher') { window.location.href = '/dashboard'; throw new Error('Access denied'); }
    }
  },
});
