import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Star, 
  TrendingUp, 
  History,
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle2,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardProgress } from '@/components/ui/card';
import { Badge as BadgeComponent } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProgressDetailsModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function ProgressDetailsModal({ open, onClose, studentId, studentName }: ProgressDetailsModalProps) {
  const [progressData, setProgressData] = useState<any>(null);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchProgressData();
    }
  }, [open, studentId]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [progressRes, logsRes] = await Promise.all([
        fetch(`http://localhost:3000/api/progress/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:3000/api/progress/student/${studentId}/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const progress = await progressRes.json();
      const logs = await logsRes.json();

      setProgressData(progress);
      setProgressLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error('Failed to fetch progress data', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    const map: Record<string, string> = {
      Beginner: 'bg-blue-100 text-blue-700',
      Intermediate: 'bg-amber-100 text-amber-700',
      Advanced: 'bg-purple-100 text-purple-700',
      Expert: 'bg-emerald-100 text-emerald-700',
    };
    return map[rank] || 'bg-gray-100 text-gray-700';
  };

  const getLearningTrackLabel = (track: string) => {
    const map: Record<string, string> = {
      qaidah: 'Qaidah Nooraniyah',
      quran_reading: 'Quran Reading',
      tajweed: 'Tajweed',
      hifz: 'Hifz',
    };
    return map[track] || track;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {studentName}'s Progress
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Quran memorization and learning progress details
              </p>
            </div>
            {progressData?.rank && (
              <Badge className={getRankColor(progressData.rank)}>
                {progressData.rank} Level
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
            Loading progress data...
          </div>
        ) : !progressData ? (
          <div className="py-12 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No progress data available</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-center border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {progressData.surahsCount || 0}
                  </span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Surahs</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {progressData.ayahsCount || 0}
                  </span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Ayahs</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {progressData.progressPercentage || 0}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Progress</div>
              </div>
            </div>

            {/* Learning Track Info */}
            {progressData.learningTrack && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Current Learning Track
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getLearningTrackLabel(progressData.learningTrack)}
                  </span>
                  {progressData.progressPercentage && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full" 
                          style={{ width: `${progressData.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        {progressData.progressPercentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Studied Info */}
            {(progressData.lastStudiedSurah || progressData.currentTopicId) && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-emerald-100" />
                  <h4 className="text-sm font-bold uppercase tracking-wider opacity-90">
                    Last Studied
                  </h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">
                      {progressData.lastStudiedSurah || progressData.currentTopicId}
                    </div>
                    <div className="text-xs opacity-90 mt-1">
                      {progressData.lastStudiedPage && `Page: ${progressData.lastStudiedPage}`}
                      {progressData.lastStudiedAyah && ` · Ayah: ${progressData.lastStudiedAyah}`}
                    </div>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-100 opacity-50" />
                </div>
              </div>
            )}

            {/* Progress Timeline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  Progress Timeline
                </h4>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {progressLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No progress logs yet</p>
                  </div>
                ) : (
                  progressLogs.map((log: any, idx: number) => (
                    <div key={log.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-100">
                            {log.surahName || log.topicName || 'Progress Log'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            {log.learningTrack && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {getLearningTrackLabel(log.learningTrack)}
                              </span>
                            )}
                            {log.completionStatus && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                {log.completionStatus}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {log.surahNumber && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3 w-3 text-emerald-600" />
                            <span>Surah {log.surahNumber}: {log.surahName}</span>
                          </div>
                        )}
                        {log.lastStudiedPage && (
                          <div className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-amber-600" />
                            <span>Page: {log.lastStudiedPage}</span>
                          </div>
                        )}
                        {log.lastStudiedAyah && (
                          <div className="flex items-center gap-2">
                            <Star className="h-3 w-3 text-blue-600" />
                            <span>Ayah: {log.lastStudiedAyah}</span>
                          </div>
                        )}
                        {log.memorizationStatus && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-purple-600" />
                            <span>Memorization: {log.memorizationStatus}</span>
                          </div>
                        )}
                        {log.revisionStatus && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Revision: {log.revisionStatus}</span>
                          </div>
                        )}
                        {log.notes && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs">
                            <span className="font-semibold text-gray-500">Notes: </span>
                            {log.notes}
                          </div>
                        )}
                      </div>
                      {log.teacher && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span className="font-semibold">Logged by:</span>
                          <span>{log.teacher?.fullName || 'Unknown'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Progress Chart */}
            {progressLogs.length > 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Progress Chart
                  </h4>
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="space-y-2">
                    {progressLogs.slice().reverse().map((log: any, idx: number) => {
                      const percentage = Math.min(
                        ((idx + 1) / progressLogs.length) * 100,
                        100
                      );
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 text-xs font-medium text-gray-500 text-right">
                            {idx + 1}
                          </div>
                          <div className="flex-1 h-8 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 flex items-center justify-center text-[9px] text-white font-medium whitespace-nowrap px-2 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            >
                              {log.surahName?.substring(0, 15)} {log.surahName?.length > 15 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-100 dark:border-emerald-900/30">
              <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Summary
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/30">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Rank</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {progressData.rank || 'N/A'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/30">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Sessions</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {progressLogs.length}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/30">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Session</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {progressLogs.length > 0 
                      ? new Date(progressLogs[0].createdAt).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/30">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Next Goal</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {progressData.rank === 'Beginner' 
                      ? 'Complete Intermediate Level'
                      : progressData.rank === 'Intermediate'
                      ? 'Advance to Advanced Level'
                      : progressData.rank === 'Advanced'
                      ? 'Reach Expert Level'
                      : 'Maintain and Review'}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
