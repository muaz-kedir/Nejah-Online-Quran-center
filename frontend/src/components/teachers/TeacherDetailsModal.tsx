import { API_BASE } from "@/lib/api";
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
  Globe,
} from 'lucide-react';

const API = API_BASE;

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
      case 'active': return 'bg-primary/100';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'on leave': return 'bg-amber-500';
      default: return 'bg-nejah-slate-blue';
    }
  };

  const getLevelBadge = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      case 'intermediate': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      case 'advanced': return 'bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric';
      case 'ijazah': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400';
      default: return 'bg-muted text-foreground dark:bg-nejah-surface dark:text-muted-foreground';
    }
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto dark:bg-nejah-surface dark:border-nejah-border-blue rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-nejah-sapphire text-foreground font-serif flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface dark:to-nejah-surface flex items-center justify-center font-bold text-lg text-nejah-sapphire text-nejah-electric">
              {teacher.fullName?.charAt(0)}
            </div>
            <div>
              <span>{teacher.fullName}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className={cn('text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border-none flex items-center gap-1', getStatusColor(teacher.status)?.replace('bg-', 'bg-').replace('500', '100').replace('emerald', 'primary'))}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', getStatusColor(teacher.status))} />
                  {teacher.status || 'Active'}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">{teacher.specialization || 'General Islamic Studies'}</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-muted dark:bg-nejah-surface/50 p-3 rounded-xl border border-border dark:border-nejah-border-blue">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Students</p>
              <p className="text-xl font-extrabold text-nejah-sapphire text-foreground mt-1 font-serif">
                {analytics?.studentCount ?? (teacher.students?.length || 0)}
              </p>
            </div>
            <div className="bg-muted dark:bg-nejah-surface/50 p-3 rounded-xl border border-border dark:border-nejah-border-blue">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Weekly Hours</p>
              <p className="text-xl font-extrabold text-nejah-sapphire text-foreground mt-1 font-serif">
                {analytics?.totalWeeklyHours ?? '-'}
              </p>
            </div>
            <div className="bg-muted dark:bg-nejah-surface/50 p-3 rounded-xl border border-border dark:border-nejah-border-blue">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Experience</p>
              <p className="text-xl font-extrabold text-nejah-sapphire text-foreground mt-1 font-serif">
                {teacher.experience || 0}y
              </p>
            </div>
            <div className="bg-muted dark:bg-nejah-surface/50 p-3 rounded-xl border border-border dark:border-nejah-border-blue">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Topics</p>
              <p className="text-xl font-extrabold text-nejah-sapphire text-foreground mt-1 font-serif">
                {analytics?.topics?.length || 0}
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {teacher.country && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.country}</span>
                </div>
              )}
              {teacher.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.city}</span>
                </div>
              )}
              {analytics?.monthlySalary && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${Number(analytics.monthlySalary).toLocaleString()}/month</span>
                </div>
              )}
              {teacher.email && (
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                  <span className="font-medium text-foreground dark:text-muted-foreground">Email:</span> {teacher.email}
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
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                  <span className="font-medium text-foreground dark:text-muted-foreground">Phone:</span> {teacher.phoneNumber}
                </div>
              )}
            </div>
          </div>

          {/* Teaching Topics */}
          {analytics?.topics && analytics.topics.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Teaching Topics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analytics.topics.map((topic: string, i: number) => (
                  <Badge key={i} className="bg-primary/10 text-primary dark:bg-nejah-sapphire/40 text-nejah-electric border border-primary/50 dark:border-nejah-border-blue/30 rounded-full text-[10px] font-bold px-2.5 py-0.5">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Per-Student Progress */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Student Progress
            </h4>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground animate-pulse">Loading student progress...</div>
            ) : !analytics?.studentDetails || analytics.studentDetails.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No students assigned yet.</div>
            ) : (
              <div className="space-y-3">
                {analytics.studentDetails.map((s: any) => (
                  <div key={s.studentId} className="bg-muted dark:bg-nejah-surface/30 p-3 rounded-xl border border-border dark:border-nejah-border-blue">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 dark:bg-nejah-sapphire/40 text-primary text-nejah-electric flex items-center justify-center font-bold text-xs">
                          {s.studentName?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-foreground dark:text-foreground">{s.studentName}</span>
                      </div>
                      <Badge className={cn('text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 border-none', getLevelBadge(s.rank))}>
                        {s.rank}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted dark:bg-nejah-surface h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-nejah-azure transition-all"
                          style={{ width: `${s.progressPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground dark:text-muted-foreground min-w-[40px] text-right">
                        {s.progressPercentage || 0}%
                      </span>
                    </div>
                    {s.lastStudiedSurah && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
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
              className="w-full rounded-xl border-primary/200 dark:border-nejah-border-blue text-primary text-nejah-electric hover:bg-primary/10 dark:hover:bg-nejah-sapphire/30 gap-1.5"
            >
              View Full Profile <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
