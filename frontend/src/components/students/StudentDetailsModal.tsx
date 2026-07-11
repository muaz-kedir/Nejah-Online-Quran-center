import { API_BASE, apiUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  BookOpen, 
  UserCheck, 
  Phone, 
  TrendingUp, 
  Clock, 
  ExternalLink,
  Shield,
  GraduationCap,
  Globe,
  Home,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  student: any;
}

export function StudentDetailsModal({ open, onClose, student }: StudentDetailsModalProps) {
  if (!student) return null;

  const handleOpenClassSession = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/attendance/sessions/by-schedule-today/${scheduleId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const session = await response.json();
        window.location.href = `/class-session/${session.id}`;
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to open class session');
      }
    } catch (error) {
      console.error(error);
      alert('Network error launching classroom');
    }
  };

  const isToday = (dayOfWeek: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    return dayOfWeek.toLowerCase() === currentDay.toLowerCase();
  };

  const getLevelColor = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case 'beginner': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'intermediate': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'advanced': return 'bg-primary/10 text-primary border-primary/200';
      case 'hifz': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-2xl dark:bg-nejah-surface overflow-hidden">
        {/* Header Section with Profile Cover Style */}
        <div className="relative h-60 bg-gradient-to-br from-[#084133] via-[#0a5c48] to-[#107c62]">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')]" />
          
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-10 w-40 h-40 bg-primary/40/10 rounded-full blur-3xl" />

          <div className="absolute -bottom-12 left-8 flex items-end gap-6 z-20">
            <div className="w-36 h-36 rounded-[2.5rem] border-[8px] border-white dark:border-nejah-border-blue bg-card dark:bg-nejah-surface shadow-2xl overflow-hidden flex-shrink-0">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted dark:bg-nejah-surface text-[#084133] text-5xl font-black">
                  {student.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="pb-14">
              <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-lg leading-tight">{student.fullName}</h2>
              <div className="flex items-center gap-2 mt-3">
                <Badge className={cn('text-[10px] uppercase font-bold tracking-widest px-3 py-1 border shadow-sm', getLevelColor(student.level))}>
                  {student.level} Level
                </Badge>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-nejah-electric text-[10px] font-bold border border-white/10">
                  <Shield className="h-3 w-3" />
                  ID: {student.studentCode}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-6 right-8">
            <Badge className={cn(
              "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter border-none",
              student.status === 'active' ? "bg-primary/40 text-nejah-sapphire text-foreground" : "bg-nejah-slate-blue text-white"
            )}>
              {student.status}
            </Badge>
          </div>
        </div>

        <div className="pt-28 px-8 pb-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary/10/50 dark:bg-primary/10/10 p-5 rounded-3xl border border-primary/100 dark:border-nejah-border-blue/30">
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Attendance</p>
              <h3 className="text-2xl font-black text-nejah-sapphire text-nejah-electric">{student.attendanceRate || 0}%</h3>
              <div className="w-full h-1.5 bg-primary/10 dark:bg-primary/10/40 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${student.attendanceRate}%` }} />
              </div>
            </div>
            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30">
              <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Progress</p>
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-400">{student.progressRate || 0}%</h3>
              <div className="w-full h-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: `${student.progressRate}%` }} />
              </div>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Age</p>
              <h3 className="text-2xl font-black text-blue-900 dark:text-blue-400">{student.age} <span className="text-xs opacity-50">Years</span></h3>
            </div>
            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/30">
              <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-widest mb-1">Gender</p>
              <h3 className="text-2xl font-black text-purple-900 dark:text-purple-400 uppercase tracking-tighter">{student.gender}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#084133]" /> Personal Directory
                </h4>
                <div className="bg-muted dark:bg-nejah-surface/50 rounded-3xl p-6 border border-border dark:border-nejah-border-blue space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Residency</p>
                      <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.currentResidency || 'Not provided'}</p>
                    </div>
                  </div>
                  {student.country && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Country</p>
                        <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.country}</p>
                      </div>
                    </div>
                  )}
                  {student.city && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</p>
                        <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.city}</p>
                      </div>
                    </div>
                  )}
                  {student.learningGoals && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                        <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Learning Goals</p>
                        <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.learningGoals}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Home className="h-4 w-4 text-[#084133]" /> Family Information
                </h4>
                <div className="bg-muted dark:bg-nejah-surface/50 rounded-3xl p-6 border border-border dark:border-nejah-border-blue space-y-4">
                  {student.familyName ? (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Parent/Guardian</p>
                          <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.familyName}</p>
                        </div>
                      </div>
                      {student.familyPhone && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone</p>
                            <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.familyPhone}</p>
                          </div>
                        </div>
                      )}
                      {student.familyAddress && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Address</p>
                            <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.familyAddress}</p>
                          </div>
                        </div>
                      )}
                      {student.familyCountry && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Country</p>
                            <p className="text-sm font-semibold text-foreground dark:text-foreground">{student.familyCountry}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No family information provided</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                   <GraduationCap className="h-4 w-4 text-[#084133]" /> Academic Status
                </h4>
                <div className="bg-[#084133]/5 dark:bg-[#084133]/10 rounded-3xl p-6 border border-[#084133]/10 dark:border-nejah-border-blue/30 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-card dark:bg-nejah-surface flex items-center justify-center shadow-sm">
                         <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Assigned Teacher</p>
                         <p className="text-lg font-black text-[#084133] text-nejah-electric">{student.teacher?.fullName || student.teacher?.user?.name || 'Seeking teacher...'}</p>
                      </div>
                   </div>
                   {student.teacher && (
                     <Button variant="ghost" size="sm" className="rounded-xl font-bold bg-white/50 dark:bg-nejah-surface">
                        Profile
                     </Button>
                   )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest flex items-center gap-2">
                   <Clock className="h-4 w-4 text-[#084133]" /> Weekly Schedule
                </h4>
                <Badge variant="outline" className="rounded-lg text-[10px] font-black uppercase px-2 py-0.5 border-nejah-border-blue/20 text-[#084133]">
                   {student.schedules?.length || 0} Slots
                </Badge>
              </div>
              <div className="space-y-3">
                {student.schedules && student.schedules.length > 0 ? (
                  student.schedules.map((slot: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-card dark:bg-nejah-surface border border-border dark:border-nejah-border-blue rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/10/20 flex flex-col items-center justify-center">
                             <span className="text-[9px] font-black text-primary uppercase">{slot.dayOfWeek?.substring(0, 3)}</span>
                          </div>
                          <div>
                             <p className="text-xs font-bold text-foreground dark:text-white uppercase tracking-tight">{slot.dayOfWeek}</p>
                             <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {slot.startTimeString} - {slot.endTimeString}
                             </div>
                          </div>
                       </div>
                        <Button 
                           onClick={() => handleOpenClassSession(slot.id)}
                           size="sm" 
                           className={cn(
                             "h-8 rounded-lg text-[10px] font-bold gap-1.5",
                             isToday(slot.dayOfWeek) 
                               ? "bg-primary hover:bg-nejah-azure text-white border border-primary/500 shadow-md"
                               : "bg-muted hover:bg-muted text-muted-foreground hover:text-[#084133]"
                           )}
                           disabled={!isToday(slot.dayOfWeek) && localStorage.getItem('userRole') !== 'super_admin'}
                        >
                           <ExternalLink className="h-3 w-3" />
                           {isToday(slot.dayOfWeek) ? "Start Today's Session" : "Scheduled"}
                        </Button>
                    </div>
                  ))
                ) : (
                  <div className="bg-muted dark:bg-nejah-surface/50 p-8 rounded-3xl border border-dashed border-border dark:border-nejah-border-blue text-center">
                     <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                     <p className="text-xs font-bold text-muted-foreground tracking-tight italic">No classes scheduled yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
