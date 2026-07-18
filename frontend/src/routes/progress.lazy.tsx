/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split). Do not edit.

import { API_BASE } from "@/lib/api";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createLazyFileRoute} from '@tanstack/react-router';
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
  Search, BookOpen, Award, TrendingUp, Star, MessageSquare, Plus, History, Eye, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { requireAuth } from '@/lib/auth';
import { SurahSelect } from '@/components/progress/SurahSelect';
import { getSurahByNumber, TOTAL_MUSHAF_PAGES } from '@/lib/quran-surahs';

export const Route = createLazyFileRoute('/progress')({
  component: ProgressPage,
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
  const [viewProgressTarget, setViewProgressTarget] = useState<any>(null);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [viewProgressLoading, setViewProgressLoading] = useState(false);
  const [logForm, setLogForm] = useState({
    surahNumber: undefined as number | undefined,
    lastStudiedPage: '',
    lastStudiedAyah: '',
  });

  // Helper functions
  const token = () => localStorage.getItem('token');
  const userRole = () => localStorage.getItem('userRole');
  const isTeacherOrAdmin = () => {
    const role = userRole();
    return role === 'teacher' || role === 'super_admin';
  };
  const isSuperAdminOrAdmin = () => {
    const role = userRole();
    return role === 'super_admin';
  };

  const fetchProgressLogs = async (studentId: string) => {
    setViewProgressLoading(true);
    try {
      const res = await fetch(`${API}/progress/student/${studentId}/logs`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProgressLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch progress logs', error);
    } finally {
      setViewProgressLoading(false);
    }
  };

  // Fetch progress logs when modal opens
  useEffect(() => {
    if (viewProgressTarget) {
      fetchProgressLogs(viewProgressTarget.id);
    }
  }, [viewProgressTarget]);

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
    if (!logForm.surahNumber) {
      toast.error('Please select a surah');
      return;
    }
    setLogLoading(true);
    try {
      const surah = getSurahByNumber(logForm.surahNumber);
      const body = {
        surahNumber: logForm.surahNumber,
        lastStudiedPage: parseInt(logForm.lastStudiedPage, 10),
        lastStudiedAyah: parseInt(logForm.lastStudiedAyah, 10),
      };

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
      toast.success(`Progress logged for ${surah?.englishName || 'surah'}`);
      setLogTarget(null);
      setLogForm({ surahNumber: undefined, lastStudiedPage: '', lastStudiedAyah: '' });
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAll();
    setIsRefreshing(false);
  }, []);

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
      Expert: 'bg-primary/10 text-primary',
    };
    return map[rank] || 'bg-muted text-foreground';
  };

  return (
    <DashboardLayout>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quran Progress</h1>
          <p className="text-muted-foreground mt-1">Track student Quran memorization and progress</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="h-10 gap-2 rounded-xl px-4" disabled={isRefreshing}>
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No students found</div>
        ) : (
          filtered.map((s: any) => {
            const p = progressMap[s.id];
            const feedbacks = feedbackMap[s.id] || [];
            return (
              <div key={s.id} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{s.fullName}</h3>
                    <Badge className={getRankColor(p?.rank || 'Beginner')}>{p?.rank || 'Beginner'}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Award className="h-4 w-4" /> Surahs</span>
                    <span className="font-semibold">{p?.surahsCount || 0}/114</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Star className="h-4 w-4" /> Ayahs</span>
                    <span className="font-semibold">{p?.ayahsCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Progress</span>
                    <span className="font-semibold text-primary">{p?.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${p?.progressPercentage || 0}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                  {p?.lastStudiedSurah ? (
                    <span>
                      Last studied: {p.lastStudiedSurah}
                      {p.lastStudiedPage ? ` · Page ${p.lastStudiedPage}` : ''}
                      {p.lastStudiedAyah ? ` · Ayah ${p.lastStudiedAyah}` : ''}
                    </span>
                  ) : (
                    <span>No recent activity</span>
                  )}
                </div>

                {(isTeacherOrAdmin() || isSuperAdminOrAdmin()) && (
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    {isSuperAdminOrAdmin() ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setViewProgressTarget(s)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View Details
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setLogForm({
                            surahNumber: p?.surahNumber || undefined,
                            lastStudiedPage: p?.lastStudiedPage ? String(p.lastStudiedPage) : '',
                            lastStudiedAyah: p?.lastStudiedAyah ? String(p.lastStudiedAyah) : '',
                          });
                          setLogTarget(s);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Log
                      </Button>
                    )}
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
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Log Progress - {logTarget?.fullName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogProgress}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Surah</Label>
                <SurahSelect
                  value={logForm.surahNumber}
                  onChange={(surahNumber) => setLogForm({ ...logForm, surahNumber })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="page">Mushaf Page (1–{TOTAL_MUSHAF_PAGES})</Label>
                <Input
                  id="page"
                  type="number"
                  min={1}
                  max={TOTAL_MUSHAF_PAGES}
                  value={logForm.lastStudiedPage}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedPage: e.target.value })}
                  placeholder="e.g. 5"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ayah">
                  Ayah
                  {logForm.surahNumber && getSurahByNumber(logForm.surahNumber)
                    ? ` (max ${getSurahByNumber(logForm.surahNumber)!.totalAyahs})`
                    : ''}
                </Label>
                <Input
                  id="ayah"
                  type="number"
                  min={1}
                  value={logForm.lastStudiedAyah}
                  onChange={(e) => setLogForm({ ...logForm, lastStudiedAyah: e.target.value })}
                  placeholder="e.g. 7"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={logLoading} className="bg-primary hover:bg-primary">
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
              <Button type="submit" disabled={feedbackLoading} className="bg-primary hover:bg-primary">
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
              <p className="text-muted-foreground text-center py-8">No feedback yet</p>
            ) : (
              (feedbackMap[viewFeedbackTarget?.id] || []).map((fb: any) => (
                <div key={fb.id} className="bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary">
                      {fb.teacher?.fullName || 'Teacher'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{fb.content}</p>
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

      {/* Progress Details Modal */}
      <Dialog open={!!viewProgressTarget} onOpenChange={() => setViewProgressTarget(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Progress Details - {viewProgressTarget?.fullName}
            </DialogTitle>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-primary/10 dark:bg-primary/10/20 p-4 rounded-xl text-center border border-primary/100 dark:border-nejah-border-blue/30">
                <div className="text-2xl font-bold text-primary">{progressMap[viewProgressTarget?.id]?.surahsCount || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Surahs</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border border-amber-100 dark:border-amber-900/30">
                <div className="text-2xl font-bold text-amber-600">{progressMap[viewProgressTarget?.id]?.ayahsCount || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Ayahs</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-900/30">
                <div className="text-2xl font-bold text-blue-600">{progressMap[viewProgressTarget?.id]?.progressPercentage || 0}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Progress</div>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Progress Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Progress Timeline
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {viewProgressLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading progress logs...</div>
                ) : progressLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No progress logs found</div>
                ) : (
                  progressLogs.map((log: any, idx: number) => (
                    <div key={log.id} className="bg-card dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-foreground text-foreground">
                            {log.surahName || log.topicName || 'Progress Log'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{log.learningTrack === 'hifz' ? 'Memorization' : 'Reading'}</span>
                            {log.completionStatus && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                                {log.completionStatus}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                        {log.surahNumber && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3 w-3 text-primary" />
                            <span>Surah {log.surahNumber}: {log.surahName}</span>
                          </div>
                        )}
                        {log.lastStudiedPage && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3 w-3 text-amber-600" />
                            <span>Page: {log.lastStudiedPage}</span>
                          </div>
                        )}
                        {log.lastStudiedAyah && (
                          <div className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-blue-600" />
                            <span>Ayah: {log.lastStudiedAyah}</span>
                          </div>
                        )}
                        {log.notes && (
                          <div className="mt-2 p-2 bg-muted dark:bg-nejah-surface rounded-lg text-xs">
                            <span className="font-semibold text-muted-foreground">Notes: </span>
                            {log.notes}
                          </div>
                        )}
                      </div>
                      {log.teacher && (
                        <div className="mt-3 pt-3 border-t border-border dark:border-nejah-border-blue flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold">Logged by:</span>
                          <span>{log.teacher?.fullName || 'Unknown'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Progress Graph (Visual representation of surah/aya changes) */}
            {progressLogs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Progress Chart
                </h4>
                <div className="bg-card dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-xl p-4">
                  <div className="space-y-2">
                    {progressLogs.slice().reverse().map((log: any, idx: number) => {
                      // Calculate cumulative progress
                      const progressPercentage = (progressMap[viewProgressTarget?.id]?.progressPercentage || 0) * (idx / progressLogs.length);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 text-xs font-medium text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div className="flex-1 h-8 flex items-center bg-muted dark:bg-nejah-surface rounded-lg overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-nejah-azure flex items-center justify-center text-[9px] text-white font-medium whitespace-nowrap px-2"
                              style={{ width: `${progressPercentage}%` }}
                            >
                              {log.surahName || 'Log'}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {log.surahName || log.topicName || 'Log'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-primary/10 dark:bg-primary/10/20 rounded-xl p-4 border border-primary/100 dark:border-nejah-border-blue/30">
              <h5 className="text-sm font-bold text-nejah-sapphire text-nejah-electric mb-2">Summary</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-primary text-nejah-electric font-semibold">Current Rank:</span>{' '}
                  <span className="text-foreground dark:text-foreground">{progressMap[viewProgressTarget?.id]?.rank || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-primary text-nejah-electric font-semibold">Total Logs:</span>{' '}
                  <span className="text-foreground dark:text-foreground">{progressLogs.length}</span>
                </div>
                <div>
                  <span className="text-primary text-nejah-electric font-semibold">Last Studied:</span>{' '}
                  <span className="text-foreground dark:text-foreground">{progressMap[viewProgressTarget?.id]?.lastStudiedSurah || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-primary text-nejah-electric font-semibold">Last Page:</span>{' '}
                  <span className="text-foreground dark:text-foreground">{progressMap[viewProgressTarget?.id]?.lastStudiedPage || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end pt-4 border-t border-border dark:border-nejah-border-blue">
            <Button variant="outline" onClick={() => setViewProgressTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
