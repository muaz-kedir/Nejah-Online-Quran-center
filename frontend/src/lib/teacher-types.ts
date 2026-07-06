export interface TeacherDashboardData {
  teacher?: {
    id: string;
    name?: string;
    fullName?: string;
    avatarUrl?: string;
    avatar?: string;
    initials?: string;
  };
  stats?: {
    totalStudents: number;
    todayClasses: number;
    attendanceRate: number;
    pendingHomeworkReviews: number;
  };
  studentProgress?: Array<{
    id: string;
    initials: string;
    name: string;
    currentSurah: string;
    status: string;
    progress: number;
  }>;
  temporaryStudents?: Array<{
    id: string;
    student?: { fullName: string };
    replacementTeacher?: { fullName: string };
    startDate: string;
    endDate: string;
  }>;
  reassignedAwayStudents?: Array<{
    id: string;
    student?: { fullName: string };
    replacementTeacher?: { fullName: string };
    startDate: string;
    endDate: string;
  }>;
  unreadNotificationsCount?: number;
}

export interface TodaySession {
  scheduleId: string;
  liveSessionId?: string;
  startTime: string;
  endTime: string;
  title: string;
  sessionType: string;
  studentName: string;
  sessionPhase?: string;
  sessionStatus?: string;
  countdownMinutes?: number | null;
}

export interface TeacherNote {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}
