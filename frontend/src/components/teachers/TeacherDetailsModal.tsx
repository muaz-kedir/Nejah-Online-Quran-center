import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  ArrowRight,
  MapPin,
} from 'lucide-react';

const API = 'http://localhost:3000/api';

interface TeacherDetailsModalProps {
  open: boolean;
  onClose: () => void;
  teacher: any;
}

export function TeacherDetailsModal({ open, onClose, teacher }: TeacherDetailsModalProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && teacher) {
      fetchAnalytics();
    }
  }, [open, teacher]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/teachers/${teacher.id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load teacher analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'active': return 'bg-emerald-500';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'on leave': return 'bg-amber-500';
      default: return 'bg-gray-400';
    }
  };

  const getLevelBadge = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      case 'intermediate': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      case 'advanced': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'ijazah': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
      default: return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700 rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900 dark:text-gray-100 font-serif flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center font-bold text-lg text-emerald-800 dark:text-emerald-300">
              {teacher.fullName?.charAt(0)}
            </div>
            <div>
              <span>{teacher.fullName}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className={cn('text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border-none flex items-center gap-1', getStatusColor(teacher.status)?.replace('bg-', 'bg-').replace('500', '100').replace('emerald', 'emerald-50'))}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(teacher.status))} />
                  {teacher.status || 'Active'}
                </Badge>
                <span className="text-xs text-gray-400 font-medium">{teacher.specialization || 'General Islamic Studies'}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Students</p>
              <p className="text-xl font-extrabold text-emerald-900 dark:text-gray-100 mt-1 font-serif">
                {analytics?.studentCount ?? (teacher.students?.length || 0)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Weekly Hours</p>
              <p className="text-xl font-extrabold text-emerald-900 dark:text-gray-100 mt-1 font-serif">
                {analytics?.totalWeeklyHours ?? '-'}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Experience</p>
              <p className="text-xl font-extrabold text-emerald-900 dark:text-gray-100 mt-1 font-serif">
                {teacher.experience || 0}y
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Topics</p>
              <p className="text-xl font-extrabold text-emerald-900 dark:text-gray-100 mt-1 font-serif">
                {analytics?.topics?.length || 0}
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {teacher.currentResidency && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{teacher.currentResidency}</span>
                </div>
              )}
              {analytics?.monthlySalary && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>${Number(analytics.monthlySalary).toLocaleString()}/month</span>
                </div>
              )}
              {teacher.email && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {teacher.email}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {analytics?.islamicEducationLevel && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <Badge className={cn('text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5 border-none', getLevelBadge(analytics.islamicEducationLevel))}>
                    {analytics.islamicEducationLevel}
                  </Badge>
                </div>
              )}
              {teacher.phoneNumber && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {teacher.phoneNumber}
                </div>
              )}
            </div>
          </div>

          {/* Teaching Topics */}
          {analytics?.topics && analytics.topics.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Teaching Topics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analytics.topics.map((topic: string, i: number) => (
                  <Badge key={i} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 rounded-full text-[10px] font-bold px-2.5 py-0.5">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Per-Student Progress */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Student Progress
            </h4>
            {loading ? (
              <div className="py-6 text-center text-sm text-gray-400 animate-pulse">Loading student progress...</div>
            ) : !analytics?.studentDetails || analytics.studentDetails.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">No students assigned yet.</div>
            ) : (
              <div className="space-y-3">
                {analytics.studentDetails.map((s: any) => (
                  <div key={s.studentId} className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {s.studentName?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{s.studentName}</span>
                      </div>
                      <Badge className={cn('text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border-none', getLevelBadge(s.rank))}>
                        {s.rank}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                          style={{ width: `${s.progressPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
                        {s.progressPercentage || 0}%
                      </span>
                    </div>
                    {s.lastStudiedSurah && (
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Last: {s.lastStudiedSurah}{s.lastStudiedAyah ? `:${s.lastStudiedAyah}` : ''} · {s.surahsCount || 0} surahs
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigate to Full Profile */}
          <div className="pt-2">
            <Button
              onClick={() => {
                window.location.href = `/teachers/${teacher.id}`;
              }}
              variant="outline"
              className="w-full rounded-xl border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5"
            >
              View Full Profile <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
