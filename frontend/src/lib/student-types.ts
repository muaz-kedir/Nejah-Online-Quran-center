export interface StudentDashboardData {
  student?: {
    id: string;
    level?: string;
    effectiveTeacher?: string;
    assignedTeacher?: string;
    enrollmentDate?: string;
    isTemporaryTeacher?: boolean;
    temporaryTeacher?: {
      name: string;
      startDate: string;
      endDate: string;
      originalTeacher: string;
    };
  };
  welcome?: {
    firstName?: string;
    quranLevel?: string;
    assignedTeacher?: string;
    enrollmentDate?: string;
  };
  progress?: {
    currentSurah?: string;
    currentAyah?: number;
    rank?: string;
    percentage?: number;
    memorizedSurahs?: number;
    memorizedAyahs?: number;
    completedJuz?: number;
  };
  levelProgress?: {
    currentLevel: string;
    completedLessons: number;
    totalLessons: number;
    progress: number;
    nextMilestone: string;
  };
  attendance?: {
    rate: number;
    presentDays: number;
    absentDays: number;
    weekly: Array<{ date: string; present: boolean }>;
  };
  liveClass?: {
    id: string;
    status: string;
    classTitle?: string;
    teacher?: { fullName: string };
    scheduledStart?: string;
  };
  upcomingClass?: {
    name: string;
    teacher: string;
    time: string;
  };
  todaysLesson?:
    | {
        level?: string;
        lessonNumber?: number;
        topicName?: string;
        lines?: string;
        page?: string;
        teacherNotes?: string;
        homework?: { title: string };
        surahName?: string;
        startAyah?: number;
        endAyah?: number;
        rule?: string;
        lessonTitle?: string;
        practice?: string;
        memorizationRange?: string;
        revisionPortion?: string;
        dailyTarget?: string;
      }
    | "—";
  recentFeedback?: Array<{
    id: string;
    teacherName: string;
    date: string;
    summary: string;
  }>;
  unreadNotifications?: number;
  notifications?: Array<{
    id: string;
    title: string;
    content?: string;
    type?: string;
    channel?: string;
    isRead: boolean;
  }>;
}

export interface StudentProfileData {
  student?: {
    id: string;
    fullName?: string;
    phone?: string;
    email?: string;
    level?: string;
    enrollmentDate?: string;
  };
  statistics?: {
    attendancePercentage?: number;
    progressPercentage?: number;
    homeworkCompletionRate?: number;
  };
}
