/* eslint-disable */
// @ts-nocheck
// Lazy component (code-split).

import { apiUrl, clearAuthStorage } from "@/lib/api";
import { useState, useEffect } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { requireAuth } from '@/lib/auth';
import { User, Mail, Phone, MapPin, GraduationCap, Clock, Calendar, ChevronRight, Pencil, Globe, BookOpen, Star, Languages, DollarSign, Users, CheckCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PushNotificationToggle } from '@/components/ui/push-notification-toggle';
import { TelegramLink } from '@/components/ui/telegram-link';
import { useApiQuery } from '@/hooks/useApiQuery';

export const Route = createLazyFileRoute('/teacher_profile')({
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localTeacher, setLocalTeacher] = useState<any>({ fullName: '', email: '' });

  const redirectToLogin = () => {
    clearAuthStorage();
    toast.error('Session expired. Please log in again.');
    navigate({ to: '/login' });
  };

  const { data: apiData, isLoading } = useApiQuery<{ teacher: any; stats: any }>({
    queryKey: ['teacher-profile'],
    path: '/teachers/dashboard',
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setLocalTeacher({
      fullName: localStorage.getItem('userName') || '',
      email: localStorage.getItem('userEmail') || '',
    });
  }, []);

  const teacher = apiData ? { ...apiData.teacher, stats: apiData.stats } : localTeacher;

  const formatArray = (arr: string[] | undefined | null): string => {
    if (!arr || arr.length === 0) return 'Not specified';
    return arr.join(', ');
  };

  const formatTimeAvailabilities = (availabilities: string[]) => {
    if (!availabilities || availabilities.length === 0) return 'Not specified';
    return availabilities.map(t => t.replace(/["\[\]]/g, '')).join(', ');
  };

  if (isLoading && !teacher.fullName) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nejah-border-blue"></div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-primary dark:text-primary tracking-widest uppercase mb-1">
              My Profile
            </p>
            <h1 className="text-4xl font-extrabold text-nejah-sapphire text-foreground font-serif">
              Teacher Profile
            </h1>
          </div>
          <Button 
            className="h-11 px-6 bg-primary hover:bg-nejah-azure text-white rounded-xl"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-sm border border-border dark:border-nejah-border-blue overflow-hidden">
          <div className="bg-gradient-to-r from-nejah-sapphire to-nejah-midnight p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-nejah-azure flex items-center justify-center text-4xl font-bold border-4 border-primary/700">
                {teacher.fullName?.charAt(0) || 'T'}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">{teacher.fullName}</h2>
                <p className="text-nejah-electric mt-1">{teacher.specialization || 'Quran Teacher'}</p>
                <p className="text-xs text-nejah-electric/70 mt-1">{teacher.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-border dark:border-nejah-border-blue">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground text-foreground uppercase tracking-wider border-b border-border dark:border-nejah-border-blue pb-2 mb-4">
                Basic Information
              </h3>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-foreground text-foreground font-medium">{teacher.email}</p>
                </div>
              </div>
              
              {teacher.phoneNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Phone</p>
                    <p className="text-sm text-foreground text-foreground font-medium">{teacher.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground text-foreground uppercase tracking-wider border-b border-border dark:border-nejah-border-blue pb-2 mb-4">
                Professional Details
              </h3>
              
              {teacher.qualification && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Qualification</p>
                    <p className="text-sm text-foreground text-foreground font-medium">{teacher.qualification}</p>
                  </div>
                </div>
              )}
              
              {teacher.experience > 0 && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Experience</p>
                    <p className="text-sm text-foreground text-foreground font-medium">{teacher.experience} years</p>
                  </div>
                </div>
              )}
            </div>

            {/* Availability */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground text-foreground uppercase tracking-wider border-b border-border dark:border-nejah-border-blue pb-2 mb-4">
                Availability
              </h3>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Preferred Times</p>
                  <p className="text-sm text-foreground text-foreground font-medium">
                    {formatTimeAvailabilities(teacher.availability)}
                  </p>
                </div>
              </div>

              {teacher.languages && teacher.languages.length > 0 && (
                <div className="flex items-start gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Languages</p>
                    <p className="text-sm text-foreground font-medium">{formatArray(teacher.languages)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Extended Professional Details */}
        <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-sm border border-border dark:border-nejah-border-blue overflow-hidden p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border dark:border-nejah-border-blue pb-2 mb-4">
                Location
              </h3>

              {teacher.country && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Country</p>
                    <p className="text-sm text-foreground font-medium">{teacher.country}</p>
                  </div>
                </div>
              )}

              {teacher.city && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">City</p>
                    <p className="text-sm text-foreground font-medium">{teacher.city}</p>
                  </div>
                </div>
              )}

              {teacher.streetAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Street Address</p>
                    <p className="text-sm text-foreground font-medium">{teacher.streetAddress}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Islamic Education */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border dark:border-nejah-border-blue pb-2 mb-4">
                Islamic Education
              </h3>

              {teacher.islamicEducationLevel && (
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Education Level</p>
                    <Badge className="mt-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-none text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                      {teacher.islamicEducationLevel}
                    </Badge>
                  </div>
                </div>
              )}

              {teacher.qiratEducationLevel && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Qirat Level</p>
                    <p className="text-sm text-foreground font-medium">{teacher.qiratEducationLevel}</p>
                  </div>
                </div>
              )}

              {teacher.teachingTopics && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Teaching Topics</p>
                    <p className="text-sm text-foreground font-medium">{teacher.teachingTopics}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status & Misc */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border dark:border-nejah-border-blue pb-2 mb-4">
                Status & Details
              </h3>

              {teacher.status && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge className={cn(
                      'text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border-none',
                      teacher.status === 'active' ? 'bg-brand-electric/10 text-brand-electric' :
                      teacher.status === 'on leave' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {teacher.status}
                    </Badge>
                  </div>
                </div>
              )}

              {teacher.monthlySalary > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Salary</p>
                    <p className="text-sm text-foreground font-medium">${Number(teacher.monthlySalary).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {teacher.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                    <p className="text-sm text-foreground font-medium">{teacher.dateOfBirth}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-900/50">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider mb-4">
              Total Students
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-blue-900/40 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                  {teacher.stats?.totalStudents || '-'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Assigned Students</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-nejah-surface/30 dark:to-nejah-surface/20 border-primary/200 dark:border-nejah-border-blue/50">
            <h3 className="text-sm font-bold text-nejah-sapphire dark:text-nejah-electric uppercase tracking-wider mb-4">
              Average Attendance
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-primary/10/40 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary text-nejah-electric" />
              </div>
              <div>
                <p className="text-4xl font-bold text-nejah-sapphire dark:text-nejah-electric">
                  {teacher.stats?.averageAttendanceRate || '-'}%
                </p>
                <p className="text-sm text-primary text-nejah-electric mt-1">Attendance Rate</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-900/50">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider mb-4">
              Classes Today
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-amber-900/40 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-4xl font-bold text-amber-900 dark:text-amber-100">
                  {teacher.stats?.todayClassesCount || '-'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Scheduled Classes</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card dark:bg-nejah-surface rounded-3xl shadow-sm border border-border dark:border-nejah-border-blue overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-nejah-electric" />
          <h3 className="text-lg font-bold text-foreground">Notification Settings</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your push notification preferences to stay updated on class sessions and student activities.
        </p>
        <PushNotificationToggle variant="card" />
        <div className="border-t mt-4 pt-4">
          <TelegramLink />
        </div>
      </div>

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
          setIsEditModalOpen(false);
          toast.success('Profile updated successfully');
        }}
        teacher={teacher}
        apiEndpoint={apiUrl('/teachers/profile')}
      />
    </TeacherLayout>
  );
}
