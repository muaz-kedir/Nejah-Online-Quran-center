import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search, BookOpen, Award, TrendingUp, Star, MessageSquare, Plus, History,
} from 'lucide-react';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';

const API = 'http://localhost:3000/api';

export const Route = createFileRoute('/progress')({
  component: ProgressPage,
  beforeLoad: () => requireAuth(['admin', 'super_admin']),
});

function ProgressPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [logTarget, setLogTarget] = useState<any>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [viewFeedbackTarget, setViewFeedbackTarget] = useState<any>(null);
  const [logForm, setLogForm] = useState({
    lastStudiedSurah: '',
    lastStudiedAyah: '',
  });

  const token = () => localStorage.getItem('token');
  const userRole = () => localStorage.getItem('userRole');
  const isTeacherOrAdmin = () => {
    const role = userRole();
    return role === 'teacher' || role === 'admin' || role === 'super_admin';
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/students?limit=200`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      const studentsList = data.data || [];
      setStudents(studentsList);

      const progressResults = await Promise.allSettled(
        studentsList.map((s: any) =>
          fetch(`${API}/progress/student/${s.id}`, {
            headers: { Authorization: `Bearer ${token()}` },
          }).then((r) => r.ok ? r.json() : null)
        )
      );
      const pMap: Record<string, any> = {};
      progressResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          pMap[studentsList[i].id] = result.value;
        }
      });
      setProgressMap(pMap);

      const feedbackResults = await Promise.allSettled(
        studentsList.map((s: any) =>
          fetch(`${API}/progress/student/${s.id}/feedback`, {
            headers: { Authorization: `Bearer ${token()}` },
          }).then((r) => r.ok ? r.json() : [])
        )
      );
      const fMap: Record<string, any[]> = {};
      feedbackResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          fMap[studentsList[i].id] = result.value;
        }
      });
      setFeedbackMap(fMap);
    } catch (error) {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTarget) return;
    setLogLoading(true);
    try {
      const body: any = {};
      if (logForm.lastStudiedSurah) body.lastStudiedSurah = logForm.lastStudiedSurah;
      if (logForm.lastStudiedAyah) body.lastStudiedAyah = parseInt(logForm.lastStudiedAyah, 10);

      const res = await fetch(`${API}/progress/student/${logTarget.id}/log`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to log progress');
      }
      toast.success('Progress updated');
      setLogTarget(null);
      setLogForm({ lastStudiedSurah: '', lastStudiedAyah: '' });
      fetchAll();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLogLoading(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTarget || !feedbackContent.trim()) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`${API}/progress/student/${feedbackTarget.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ content: feedbackContent }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to add feedback');
      }
      toast.success('Feedback added');
      setFeedbackTarget(null);
      setFeedbackContent('');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const filtered = useMemo(() =>
    students.filter((s: any) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase())
    ),
    [students, search]
  );

  const getRankColor = (rank: string) => {
    const map: Record<string, string> = {
      Beginner: 'bg-blue-100 text-blue-700',
      Intermediate: 'bg-amber-100 text-amber-700',
      Advanced: 'bg-purple-100 text-purple-700',
      Expert: 'bg-emerald-100 text-emerald-700',
    };
    return map[rank] || 'bg-gray-100 text-gray-700';
  };

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quran Progress</h1>
        <p className="text-gray-600 mt-1">Track student Quran memorization and progress</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No students found</div>
        ) : (
          filtered.map((s: any) => {
            const p = progressMap[s.id];
            const feedbacks = feedbackMap[s.id] || [];
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{s.fullName}</h3>
                    <Badge className={getRankColor(p?.rank || 'Beginner')}>{p?.rank || 'Beginner'}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Award className="h-4 w-4" /> Surahs</span>
                    <span className="font-semibold">{p?.surahsCount || 0}/114</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Star className="h-4 w-4" /> Ayahs</span>
                    <span className="font-semibold">{p?.ayahsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Progress</span>
                    <span className="font-semibold text-emerald-600">{p?.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${p?.progressPercentage || 0}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  {p?.lastStudiedSurah ? (
                    <span>Last studied: {p.lastStudiedSurah} (Ayah {p.lastStudiedAyah})</span>
                  ) : (
                    <span>No recent activity</span>
                  )}
                </div>

                {isTeacherOrAdmin() && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setLogForm({ lastStudiedSurah: p?.lastStudiedSurah || '', lastStudiedAyah: String(p?.lastStudiedAyah || '') });
                        setLogTarget(s);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Log
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setFeedbackTarget(s)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" /> Feedback
                    </Button>
                    {feedbacks.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewFeedbackTarget(s)}
                      >
                        <History className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!logTarget} onOpenChange={() => setLogTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Log Progress - {logTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogProgress}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="surah">Last Studied Surah</Label>
                <Input
                  id="surah"
                  value={logForm.lastStudiedSurah}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedSurah: e.target.value })}
                  placeholder="e.g. Surah Al-Fatiha"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ayah">Last Studied Ayah</Label>
                <Input
                  id="ayah"
                  type="number"
                  min={1}
                  value={logForm.lastStudiedAyah}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedAyah: e.target.value })}
                  placeholder="e.g. 7"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={logLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {logLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackTarget} onOpenChange={() => setFeedbackTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Feedback - {feedbackTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFeedback}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback Notes</Label>
                <Textarea
                  id="feedback"
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Write your feedback about the student's progress..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFeedbackTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={feedbackLoading} className="bg-emerald-600 hover:bg-emerald-700">
                {feedbackLoading ? 'Sending...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewFeedbackTarget} onOpenChange={() => setViewFeedbackTarget(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Feedback History - {viewFeedbackTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-80 overflow-y-auto space-y-4">
            {(feedbackMap[viewFeedbackTarget?.id] || []).length === 0 ? (
              <p className="text-gray-400 text-center py-8">No feedback yet</p>
            ) : (
              (feedbackMap[viewFeedbackTarget?.id] || []).map((fb: any) => (
                <div key={fb.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-emerald-700">
                      {fb.teacher?.fullName || 'Teacher'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{fb.content}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFeedbackTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
