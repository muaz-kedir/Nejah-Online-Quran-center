import { useState, useEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { 
  BookOpen, Award, TrendingUp, CalendarCheck, GraduationCap, 
  Download, Clock, CheckCircle2, AlertCircle, XCircle, ChevronRight,
  Star, FileText, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudentPortalLayout, StudentPageLoader } from '@/components/student/StudentPortalLayout';
import { api, requireStudentAuth, studentPaths } from '@/lib/student-portal';

function StudentProgress() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  
  useEffect(() => {
    api('/student/dashboard/progress')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StudentPageLoader />;
  if (!data) return <div className="p-8 text-center text-muted-foreground dark:text-gray-200">No progress data found.</div>;

  const overview = data.overview || {};
  const learningTrack = overview.learningTrack || 'quran_reading';
  
  const handlePrint = () => {
    window.print();
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'Present': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Present</Badge>;
      case 'Late': return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><AlertCircle className="w-3 h-3 mr-1"/> Late</Badge>;
      case 'Absent': return <Badge className="bg-rose-100 text-rose-700 border-rose-200"><XCircle className="w-3 h-3 mr-1"/> Absent</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground dark:text-gray-200">{status}</Badge>;
    }
  };

  const renderAcademicOverview = () => {
    const p = overview.progressSummary || {};
    const lastLog = data.timeline?.find((t: any) => t.type === 'daily_log');
    
    if (learningTrack === 'qaidah') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Current Topic</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1 text-sm">{overview.currentTopic?.label || 'Not Started'}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Progress</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{p.completed || 0} / {p.total || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Remaining</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{p.remaining || 0} Topics</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Last Lesson</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1 text-sm">{lastLog?.date ? new Date(lastLog.date).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      );
    }
    
    if (learningTrack === 'quran_reading') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Current Surah</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1 text-sm">{overview.lastPosition?.lastStudiedSurah || 'Not Started'}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Current Ayah</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{overview.lastPosition?.lastStudiedAyah || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Completed Surahs</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{overview.progress?.surahsCount || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Completed Ayahs</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{overview.progress?.ayahsCount || 0}</p>
          </div>
        </div>
      );
    }

    if (learningTrack === 'tajweed') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Current Rule</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1 text-sm">{overview.currentTopic?.label || 'Not Started'}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Completed Rules</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{p.completed || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Remaining Rules</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{p.remaining || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Last Lesson</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1 text-sm">{lastLog?.date ? new Date(lastLog.date).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      );
    }

    if (learningTrack === 'hifz') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Current Memorization</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1 text-sm">{overview.lastPosition?.lastStudiedSurah || 'Not Started'}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Memorized Surahs</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{overview.progress?.surahsCount || 0}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Memorized Juz</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{Math.floor((overview.progress?.surahsCount || 0) / 4)}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-2xl border">
            <p className="text-xs text-foreground font-bold uppercase">Revision Progress</p>
            <p className="font-bold text-nejah-sapphire text-foreground mt-1">{overview.progress?.progressPercentage || 0}%</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const filteredAttendance = (data.attendanceHistory || []).filter((a: any) => {
    if (attendanceFilter === 'all') return true;
    const date = new Date(a.date);
    const now = new Date();
    if (attendanceFilter === 'this_week') {
      const msInWeek = 7 * 24 * 60 * 60 * 1000;
      return (now.getTime() - date.getTime()) < msInWeek;
    }
    if (attendanceFilter === 'this_month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  return (
    <StudentPortalLayout activePath={studentPaths.progress}>
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto print:p-0 print:max-w-none">
        
        {/* PDF Header (Hidden normally) */}
        <div className="hidden print:block text-center mb-8 border-b pb-6">
          <h1 className="text-3xl font-extrabold text-nejah-sapphire text-foreground font-serif">Nejah Quran Institute</h1>
          <p className="text-xl font-bold mt-2">Student Progress Report</p>
          <p className="text-muted-foreground dark:text-gray-200 mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 print:hidden">
          <div>
            <p className="text-[10px] font-extrabold text-nejah-electric uppercase tracking-widest mb-1">Student Portal</p>
            <h1 className="text-4xl font-extrabold text-nejah-sapphire text-foreground font-serif">My Progress</h1>
          </div>
          <Button onClick={handlePrint} variant="outline" className="gap-2 font-bold rounded-xl border-nejah-blue/20 text-nejah-sapphire text-foreground hover:bg-nejah-blue/10">
            <Download className="w-4 h-4" /> Download PDF Report
          </Button>
        </div>

        {/* 1. Academic Overview */}
        <div className="bg-card rounded-[32px] p-8 border mb-8 print:shadow-none print:border-gray-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-nejah-sapphire text-foreground">Academic Overview</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-200 mt-1">{overview.learningTrackLabel || overview.quranLevel || 'Quran Reading'}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-nejah-blue/10 text-nejah-sapphire text-foreground border-none px-3 py-1 mb-2">
                <Award className="h-4 w-4 mr-1.5" /> {overview.progress?.rank || overview.rank || 'Beginner'}
              </Badge>
              <p className="text-2xl font-black text-nejah-sapphire text-foreground">{data.percentage}%</p>
            </div>
          </div>
          <ProgressBar value={data.percentage} className="h-3 mb-2" />
          {renderAcademicOverview()}
        </div>

        {/* 5. Level-Based Evaluation */}
        {data.evaluations?.length > 0 && (
          <div className="bg-card rounded-[32px] p-8 border mb-8 print:break-inside-avoid">
            <h3 className="text-xl font-bold text-nejah-sapphire text-foreground mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5" /> Official Evaluations
            </h3>
            <div className="space-y-6">
              {data.evaluations.map((ev: any) => (
                <div key={ev.id} className="bg-muted/30 rounded-2xl p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-nejah-sapphire text-foreground text-lg">{ev.evaluationType}</h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-200">{ev.programType} · {new Date(ev.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1 border-primary text-primary">
                      {ev.score}/100
                    </Badge>
                  </div>
                  
                  {Object.keys(ev.criteriaRatings || {}).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {Object.entries(ev.criteriaRatings).map(([key, value]: any) => (
                        <div key={key} className="bg-white dark:bg-card p-3 rounded-xl border text-center">
                          <p className="text-[10px] font-bold uppercase text-foreground mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="font-bold text-nejah-sapphire text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-primary/5 p-4 rounded-xl">
                    <p className="font-bold text-sm mb-1 text-primary">Teacher Comments</p>
                    <p className="text-sm text-gray-100 dark:text-gray-300">{ev.notes || 'No additional comments.'}</p>
                  </div>
                  
                  {ev.recommendations && (
                    <div className="mt-3 p-4 rounded-xl border border-dashed">
                      <p className="font-bold text-sm mb-1">Recommendations</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-200">{ev.recommendations}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 2. Progress Timeline */}
          <div className="bg-card rounded-[32px] p-8 border">
            <h3 className="text-xl font-bold text-nejah-sapphire text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Progress Timeline
            </h3>
            {data.timeline?.length > 0 ? (
              <div className="space-y-6 border-l-2 border-nejah-blue/20 pl-6 ml-2">
                {data.timeline.slice(0, 10).map((item: any, i: number) => (
                  <div key={i} className="relative group">
                    <span className="absolute -left-[31px] w-3 h-3 rounded-full bg-nejah-electric top-1.5 ring-4 ring-background" />
                    
                    <div className="bg-muted/50 p-4 rounded-2xl border hover:border-nejah-blue/30 transition-colors cursor-pointer print:border-none print:p-0 print:bg-transparent" onClick={() => setSelectedDetails(item)}>
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{item.courseLevel}</Badge>
                        <span className="text-[10px] text-muted-foreground dark:text-gray-200 font-medium">{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-nejah-sapphire text-foreground mt-2">Lesson completed</p>
                      <p className="text-sm text-gray-100 dark:text-gray-300 mt-1">{item.description}</p>
                      
                      {item.notes && <p className="text-xs text-muted-foreground dark:text-gray-200 mt-3 italic line-clamp-2 print:line-clamp-none">"{item.notes}"</p>}
                      
                      <div className="flex items-center justify-between mt-3 print:hidden">
                        <p className="text-xs text-muted-foreground dark:text-gray-200 font-medium flex items-center gap-1.5"><User className="w-3 h-3"/> {item.teacherName}</p>
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-nejah-sapphire text-foreground">View Details <ChevronRight className="w-3 h-3 ml-1" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground dark:text-gray-200 p-8 bg-muted/30 rounded-2xl border border-dashed">No timeline entries yet.</p>
            )}
          </div>

          <div className="space-y-8">
            {/* 3. Attendance History */}
            <div className="bg-card rounded-[32px] p-8 border">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h3 className="text-xl font-bold text-nejah-sapphire text-foreground flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" /> Attendance
                </h3>
                <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <h3 className="text-xl font-bold text-nejah-sapphire text-foreground mb-6 hidden print:block">Attendance History</h3>

              {data.attendanceStats && (
                <div className="grid grid-cols-4 gap-2 text-center mb-6 p-4 bg-muted/30 rounded-2xl border">
                  <div><p className="text-2xl font-black text-nejah-sapphire text-foreground">{data.attendanceStats.present}</p><p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Present</p></div>
                  <div><p className="text-2xl font-black text-amber-600">{data.attendanceStats.late}</p><p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Late</p></div>
                  <div><p className="text-2xl font-black text-rose-600">{data.attendanceStats.absent}</p><p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Absent</p></div>
                  <div><p className="text-2xl font-black text-nejah-electric">{Math.round(data.attendanceStats.attendancePercentage || 0)}%</p><p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Rate</p></div>
                </div>
              )}

              {filteredAttendance.length > 0 ? (
                <div className="space-y-3">
                  {filteredAttendance.slice(0, 10).map((ah: any) => (
                    <div key={ah.id} className="flex items-center justify-between p-3 rounded-xl border bg-card text-sm">
                      <div>
                        <p className="font-bold text-nejah-sapphire text-foreground">{new Date(ah.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-200 mt-0.5">{ah.course}</p>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">{getAttendanceBadge(ah.status)}</div>
                        <p className="text-[10px] text-muted-foreground dark:text-gray-200 font-medium flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> {ah.joinTime ? new Date(ah.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground dark:text-gray-200 text-sm p-4">No attendance records found.</p>
              )}
            </div>

            {/* 4. Teacher Daily Feedback */}
            <div className="bg-card rounded-[32px] p-8 border print:break-inside-avoid">
              <h3 className="text-xl font-bold text-nejah-sapphire text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Daily Feedback
              </h3>
              {data.teacherFeedback?.length > 0 ? (
                <div className="space-y-4">
                  {data.teacherFeedback.slice(0, 5).map((f: any) => (
                    <div key={f.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-sm text-nejah-sapphire text-foreground flex items-center gap-1.5"><User className="w-3 h-3"/> {f.teacherName}</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-200 font-medium bg-muted px-2 py-1 rounded-md">{new Date(f.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-gray-100 dark:text-gray-300 leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">{f.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground dark:text-gray-200 p-8 bg-muted/30 rounded-2xl border border-dashed">No daily feedback yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 7. View Details Modal */}
      <Dialog open={!!selectedDetails} onOpenChange={(open) => !open && setSelectedDetails(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-nejah-sapphire text-foreground font-serif">Lesson Details</DialogTitle>
            <DialogDescription>
              {selectedDetails?.date && new Date(selectedDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-2xl border">
                <p className="text-xs font-bold text-foreground uppercase mb-1">Course Level</p>
                <p className="font-bold text-nejah-sapphire text-foreground">{selectedDetails?.courseLevel}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-2xl border">
                <p className="text-xs font-bold text-foreground uppercase mb-1">Teacher</p>
                <p className="font-bold text-nejah-sapphire text-foreground">{selectedDetails?.teacherName || 'Assigned Teacher'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-foreground uppercase mb-2">Lesson Details</p>
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="font-bold text-lg text-primary">{selectedDetails?.description}</p>
              </div>
            </div>

            {selectedDetails?.notes && (
              <div>
                <p className="text-sm font-bold text-foreground uppercase mb-2">Teacher Notes</p>
                <div className="bg-card p-4 rounded-2xl border shadow-sm text-sm leading-relaxed">
                  {selectedDetails.notes}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t">
              <Badge variant="outline" className="uppercase tracking-widest text-[10px]">{selectedDetails?.status || 'Completed'}</Badge>
              <Button onClick={() => setSelectedDetails(null)} className="rounded-xl px-6">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </StudentPortalLayout>
  );
}

export const Route = createFileRoute('/student_/progress')({
  component: StudentProgress,
  beforeLoad: requireStudentAuth,
});
