import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { TeacherLayout } from '@/components/dashboard/TeacherLayout';
import { requireAuth } from '@/lib/auth';
import { User, Mail, Phone, MapPin, GraduationCap, Clock, Calendar, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditTeacherModal } from '@/components/teachers/EditTeacherModal';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:3000/api';

export const Route = createFileRoute('/teacher_profile')({
  component: TeacherProfilePage,
  beforeLoad: () => requireAuth(['teacher']),
});

function TeacherProfilePage() {
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchTeacherProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/teachers/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeacher({ ...data.teacher, stats: data.stats });
      } else {
        const err = await response.json().catch(() => ({}));
        console.error(err.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to fetch teacher profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  const formatTimeAvailabilities = (availabilities: string[]) => {
    if (!availabilities || availabilities.length === 0) return 'Not specified';
    return availabilities.map(t => t.replace(/["\[\]]/g, '')).join(', ');
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nejah-border-blue"></div>
        </div>
      </TeacherLayout>
    );
  }

  if (!teacher) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground dark:text-muted-foreground">Teacher profile not found</p>
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

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={async () => {
          // Refresh teacher data
          await fetchTeacherProfile();
          setIsEditModalOpen(false);
          toast.success('Profile updated successfully');
        }}
        teacher={teacher}
      />
    </TeacherLayout>
  );
}

import { Users, CheckCircle } from 'lucide-react';
