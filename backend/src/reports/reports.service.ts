import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, ILike, In, IsNull, Not } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { ClassSession, SessionStatus } from '../attendance/entities/class-session.entity';
import {
  StudentAttendance,
  StudentAttendanceStatus,
} from '../attendance/entities/student-attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Homework, HomeworkStatus, HomeworkDifficulty } from '../homework/entities/homework.entity';
import { Exam, ExamStatus } from '../exams/entities/exam.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { ReplacementStatus } from '../common/enums/replacement-status.enum';
import { ReplacementReason } from '../common/enums/replacement-reason.enum';
import { Notification, NotificationChannel } from '../notifications/entities/notification.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { LiveSession } from '../zoom/entities/live-session.entity';
import { SessionParticipantSummary } from '../zoom/entities/session-participant-summary.entity';
import { LiveSessionStatus } from '../zoom/enums/live-session-status.enum';

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface StudentPerformanceReport {
  studentId: string;
  studentName: string;
  email: string;
  country: string;
  level: string;
  teacherName: string;
  status: string;
  currentTopic: string;
  totalClasses: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  leftEarlyCount: number;
  attendanceRate: number;
  averageProgress: number;
  lastExamScore?: number;
  homeworkCompletionRate: string;
}

export interface TeacherActivityReport {
  teacherId: string;
  teacherName: string;
  email: string;
  totalStudents: number;
  totalClasses: number;
  totalHoursTaught: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  completionRate: string;
}

export interface AttendanceAnalytics {
  totalSessions: number;
  totalStudentsAssigned: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeftEarly: number;
  overallAttendanceRate: number;
  sessionsByDay: Record<string, number>;
  attendanceByStatus: Record<string, number>;
}

export interface ProgressAnalytics {
  learningTrack: string;
  totalStudents: number;
  avgProgressPercentage: number;
  completedTopics: number;
  totalTopics: number;
  progressDistribution: Record<string, number>;
}

export interface RegistrationReport {
  date: string;
  totalRegistrations: number;
  byGender: Record<string, number>;
  byLevel: Record<string, number>;
  byCountry: Record<string, number>;
}

export interface ParentActivityReport {
  parentId: string;
  parentName: string;
  email: string;
  totalStudents: number;
  notificationsReceived: number;
  lastActive: Date;
}

export interface HomeworkReport {
  totalHomework: number;
  pending: number;
  completed: number;
  byDifficulty: Record<string, number>;
  byStudent: Record<string, number>;
  averageCompletionTime: number;
}

export interface ExamReport {
  totalExams: number;
  totalStudentsTaken: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  byLearningTrack: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export interface TeacherReplacementReport {
  totalReplacements: number;
  upcoming: number;
  active: number;
  completed: number;
  cancelled: number;
  byReason: Record<string, number>;
  byStatus: Record<string, number>;
  details: Array<{
    id: string;
    studentName: string;
    originalTeacher: string;
    replacementTeacher: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentsRepository: Repository<Parent>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
    @InjectRepository(StudentAttendance)
    private studentAttendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(ProgressLog)
    private progressLogRepository: Repository<ProgressLog>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Exam)
    private examsRepository: Repository<Exam>,
    @InjectRepository(TeacherReplacement)
    private replacementsRepository: Repository<TeacherReplacement>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(LiveSession)
    private liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionParticipantSummary)
    private sessionParticipantSummaryRepository: Repository<SessionParticipantSummary>,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────────
  // 1. Summary Statistics
  // ────────────────────────────────────────────────────────────────────────────────

  async getSummaryStatistics(dateRange?: DateRangeFilter): Promise<any> {
    const where: any = {};

    if (dateRange?.startDate && dateRange?.endDate) {
      where.createdAt = Between(new Date(dateRange.startDate), new Date(dateRange.endDate));
    } else if (dateRange?.startDate) {
      where.createdAt = MoreThan(new Date(dateRange.startDate));
    } else if (dateRange?.endDate) {
      where.createdAt = LessThan(new Date(dateRange.endDate));
    }

    // Students
    const [totalStudents, activeStudents, inactiveStudents] = await Promise.all([
      this.studentsRepository.count({ where }),
      this.studentsRepository.count({ where: { ...where, status: 'active' as any } }),
      this.studentsRepository.count({ where: { ...where, status: 'inactive' as any } }),
    ]);

    // Parents
    const totalParents = await this.parentsRepository.count();

    // Teachers
    const totalTeachers = await this.teachersRepository.count();
    const activeTeachers = await this.teachersRepository.count({ where: { status: 'active' } });

    // Active classes (schedules)
    const activeClasses = await this.schedulesRepository.count({ where: { status: 'active' } });

    // Attendance rate: average of per-student attendance from real attendance records
    let attendanceRate = 0;
    const attendanceAgg = await this.studentAttendanceRepository
      .createQueryBuilder('sa')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN sa."attendanceStatus" IN ('${StudentAttendanceStatus.PRESENT}', '${StudentAttendanceStatus.LATE}') THEN 1 ELSE 0 END)`,
        'attended',
      )
      .getRawOne();
    const totalAttendanceRecords = parseInt(attendanceAgg?.total, 10) || 0;
    if (totalAttendanceRecords > 0) {
      attendanceRate = (parseInt(attendanceAgg.attended, 10) / totalAttendanceRecords) * 100;
    }

    // Average academic progress across all progress rows
    const progressAgg = await this.progressRepository
      .createQueryBuilder('p')
      .select('AVG(p."progressPercentage")', 'avg')
      .getRawOne();
    const averageAcademicProgress = parseFloat(progressAgg?.avg) || 0;

    // New registrations this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newStudentsThisMonth = await this.studentsRepository.count({
      where: { createdAt: MoreThan(firstDayOfMonth) },
    });

    // Homework stats
    const totalHomework = await this.homeworkRepository.count();
    const completedHomework = await this.homeworkRepository.count({
      where: { status: HomeworkStatus.COMPLETED },
    });
    const homeworkCompletionRate =
      totalHomework > 0 ? (completedHomework / totalHomework) * 100 : 0;

    // Exam stats
    const totalExams = await this.examsRepository.count();
    const completedExams = await this.examsRepository.count({
      where: { status: ExamStatus.COMPLETED },
    });

    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalParents,
      totalTeachers,
      activeTeachers,
      activeClasses,
      attendanceRate: parseFloat(attendanceRate.toFixed(2)),
      homeworkCompletionRate: parseFloat(homeworkCompletionRate.toFixed(2)),
      averageAcademicProgress: parseFloat(averageAcademicProgress.toFixed(2)),
      newStudentsThisMonth,
      totalHomework,
      completedHomework,
      totalExams,
      completedExams,
      dateRange,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 2. Student Performance Data
  // ────────────────────────────────────────────────────────────────────────────────

  private static readonly TRACK_TO_LEVELS: Record<string, string[]> = {
    qaidah: ['Qaida Nooraniya'],
    quran_reading: ['Quran Reading'],
    tajweed: ['Tajweed Program'],
    hifz: ['Hifz Program', "Hifz Muraja'a"],
  };

  async getStudentPerformance(filters: {
    learningProgram?: string;
    status?: string;
    teacherId?: string;
    country?: string;
    search?: string;
    dateRange?: DateRangeFilter;
    page?: number;
    limit?: number;
  }): Promise<{ data: StudentPerformanceReport[]; meta: any }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Build query with filters
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters.country) {
      where.country = ILike(`%${filters.country}%`);
    }

    if (filters.learningProgram) {
      const levels = ReportsService.TRACK_TO_LEVELS[filters.learningProgram] || [
        filters.learningProgram,
      ];
      where.level = In(levels);
    }

    // Search by student name or email (combined with the other filters)
    const whereClause = filters.search?.trim()
      ? [
          { ...where, fullName: ILike(`%${filters.search.trim()}%`) },
          { ...where, email: ILike(`%${filters.search.trim()}%`) },
        ]
      : where;

    const [students, total] = await this.studentsRepository.findAndCount({
      where: whereClause,
      relations: ['teacher'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const performanceReports: StudentPerformanceReport[] = [];

    for (const student of students) {
      // Get attendance stats
      const attendanceStats = await this.getStudentAttendanceStats(student.id);

      // Get progress stats
      const progressStats = await this.getStudentProgressStats(student.id);

      // Get last exam score
      const lastExam = await this.examsRepository.findOne({
        where: { studentId: student.id },
        order: { createdAt: 'DESC' },
      });

      // Get homework stats
      const [totalHomework, completedHomework] = await Promise.all([
        this.homeworkRepository.count({ where: { studentId: student.id } }),
        this.homeworkRepository.count({
          where: { studentId: student.id, status: HomeworkStatus.COMPLETED },
        }),
      ]);

      const homeworkCompletionRate =
        totalHomework > 0 ? ((completedHomework / totalHomework) * 100).toFixed(2) : '0';

      performanceReports.push({
        studentId: student.id,
        studentName: student.fullName,
        email: student.email,
        country: student.country || '—',
        level: student.level,
        teacherName: student.teacher?.fullName || 'Unassigned',
        status: student.status,
        currentTopic: progressStats.currentTopic,
        totalClasses: attendanceStats.total,
        presentCount: attendanceStats.present,
        lateCount: attendanceStats.late,
        absentCount: attendanceStats.absent,
        leftEarlyCount: attendanceStats.leftEarly,
        attendanceRate: attendanceStats.rate,
        averageProgress: progressStats.avgProgress,
        lastExamScore: lastExam?.score,
        homeworkCompletionRate,
      });
    }

    return {
      data: performanceReports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getStudentAttendanceStats(studentId: string): Promise<{
    total: number;
    present: number;
    late: number;
    absent: number;
    leftEarly: number;
    rate: number;
  }> {
    const attendances = await this.studentAttendanceRepository.find({
      where: { studentId },
      relations: ['classSession'],
    });

    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.PRESENT,
    ).length;
    const late = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.LATE,
    ).length;
    const absent = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.ABSENT,
    ).length;
    const leftEarly = attendances.filter(
      (a) => a.attendanceStatus === StudentAttendanceStatus.LEFT_EARLY,
    ).length;

    const rate = total > 0 ? ((present + late) / total) * 100 : 0;

    return {
      total,
      present,
      late,
      absent,
      leftEarly,
      rate: parseFloat(rate.toFixed(2)),
    };
  }

  private async getStudentProgressStats(studentId: string): Promise<{
    avgProgress: number;
    tracks: string[];
    currentTopic: string;
  }> {
    const progresses = await this.progressRepository.find({
      where: { studentId },
      order: { updatedAt: 'DESC' },
    });

    if (progresses.length === 0) {
      return { avgProgress: 0, tracks: [], currentTopic: '—' };
    }

    const avgProgress =
      progresses.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / progresses.length;
    const tracks = [...new Set(progresses.map((p) => p.learningTrack).filter(Boolean))];
    const latest = progresses[0];
    const currentTopic = latest.currentTopicId || latest.lastStudiedSurah || '—';

    return {
      avgProgress: parseFloat(avgProgress.toFixed(2)),
      tracks,
      currentTopic,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 3. Teacher Activity Data
  // ────────────────────────────────────────────────────────────────────────────────

  async getTeacherActivity(filters: {
    dateRange?: DateRangeFilter;
    status?: string;
    country?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: TeacherActivityReport[]; meta: any }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    const [teachers, total] = await this.teachersRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const activityReports: TeacherActivityReport[] = [];

    for (const teacher of teachers) {
      const classes = await this.classSessionRepository.find({
        where: { teacherId: teacher.id },
        relations: ['studentAttendances'],
      });

      const totalClasses = classes.length;
      const totalStudentsAssigned = classes.reduce(
        (sum, c) => sum + (c.totalStudentsAssigned || 0),
        0,
      );

      // Calculate teacher attendance
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      for (const session of classes) {
        if (session.teacherAttendanceStatus === 'PRESENT') {
          presentCount++;
        } else if (session.teacherAttendanceStatus === 'LATE') {
          lateCount++;
        } else {
          absentCount++;
        }
      }

      // Calculate hours taught
      let totalHours = 0;
      for (const session of classes) {
        if (session.actualStartTime && session.actualEndTime) {
          const durationMs = session.actualEndTime.getTime() - session.actualStartTime.getTime();
          totalHours += durationMs / (1000 * 60 * 60);
        } else if (session.scheduledStartTime && session.scheduledEndTime) {
          // Fallback: calculate from scheduled times
          const start = new Date(`2000-01-01T${session.scheduledStartTime}`);
          const end = new Date(`2000-01-01T${session.scheduledEndTime}`);
          totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
      }

      activityReports.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        email: teacher.email,
        totalStudents: totalStudentsAssigned,
        totalClasses,
        totalHoursTaught: parseFloat(totalHours.toFixed(2)),
        presentCount,
        lateCount,
        absentCount,
        completionRate: totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : '0',
      });
    }

    return {
      data: activityReports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 4. Attendance Analytics
  // ────────────────────────────────────────────────────────────────────────────────

  async getAttendanceAnalytics(
    filters: DateRangeFilter & { teacherId?: string; studentId?: string },
  ): Promise<AttendanceAnalytics> {
    const sessionWhere: Record<string, unknown> = {
      status: LiveSessionStatus.COMPLETED,
    };

    if (filters.startDate && filters.endDate) {
      sessionWhere.scheduledStart = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    } else if (filters.startDate) {
      sessionWhere.scheduledStart = MoreThan(new Date(filters.startDate));
    } else if (filters.endDate) {
      sessionWhere.scheduledStart = LessThan(new Date(filters.endDate));
    }

    if (filters.teacherId) {
      sessionWhere.teacherId = filters.teacherId;
    }

    const sessions = await this.liveSessionRepository.find({
      where: sessionWhere,
    });

    const totalSessions = sessions.length;
    const sessionIds = sessions.map((s) => s.id);

    const summaryWhere: Record<string, unknown> = { userType: 'student' };
    if (sessionIds.length > 0) {
      summaryWhere.sessionId = In(sessionIds);
    }
    if (filters.studentId) {
      summaryWhere.participantId = filters.studentId;
    }

    const summaries =
      sessionIds.length > 0
        ? await this.sessionParticipantSummaryRepository.find({ where: summaryWhere })
        : [];

    const totalStudentsAssigned = summaries.length;

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leftEarlyCount = 0;

    const sessionsByDay: Record<string, number> = {};
    const attendanceByStatus: Record<string, number> = {
      present: 0,
      late: 0,
      absent: 0,
      leftEarly: 0,
    };

    for (const session of sessions) {
      const day = new Date(session.scheduledStart).toLocaleDateString('en-US', {
        weekday: 'long',
      });
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    }

    for (const summary of summaries) {
      switch (summary.status) {
        case 'present':
          presentCount++;
          attendanceByStatus.present++;
          break;
        case 'late':
          lateCount++;
          attendanceByStatus.late++;
          break;
        case 'absent':
          absentCount++;
          attendanceByStatus.absent++;
          break;
        case 'left_early':
          leftEarlyCount++;
          attendanceByStatus.leftEarly++;
          break;
        case 'partial':
          presentCount++;
          attendanceByStatus.present++;
          break;
        default:
          absentCount++;
          attendanceByStatus.absent++;
          break;
      }
    }

    const overallAttendanceRate =
      totalStudentsAssigned > 0
        ? parseFloat(
            (((presentCount + lateCount + leftEarlyCount) / totalStudentsAssigned) * 100).toFixed(2),
          )
        : 0;

    return {
      totalSessions,
      totalStudentsAssigned,
      totalPresent: presentCount,
      totalLate: lateCount,
      totalAbsent: absentCount,
      totalLeftEarly: leftEarlyCount,
      overallAttendanceRate,
      sessionsByDay,
      attendanceByStatus,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 5. Academic Progress by Learning Track
  // ────────────────────────────────────────────────────────────────────────────────

  async getProgressAnalytics(filters: {
    learningProgram?: string;
    status?: string;
  }): Promise<ProgressAnalytics[]> {
    const where: any = {};

    if (filters.learningProgram) {
      where.learningTrack = filters.learningProgram;
    }

    const progresses = await this.progressRepository.find({
      where,
      relations: ['student'],
    });

    // Group by learning track
    const trackStats: Record<
      string,
      {
        totalStudents: number;
        progressSum: number;
        completedTopics: number;
        totalTopics: number;
        progressDistribution: Record<string, number>;
      }
    > = {};

    for (const progress of progresses) {
      const track = progress.learningTrack || 'unknown';

      if (!trackStats[track]) {
        trackStats[track] = {
          totalStudents: 0,
          progressSum: 0,
          completedTopics: 0,
          totalTopics: 0,
          progressDistribution: {
            beginner: 0,
            intermediate: 0,
            advanced: 0,
            expert: 0,
          },
        };
      }

      trackStats[track].totalStudents++;
      trackStats[track].progressSum += progress.progressPercentage || 0;

      // Count completed topics/surahs
      const completedTopicIds = progress.completedTopicIds || [];
      trackStats[track].completedTopics += completedTopicIds.length;

      // Calculate total topics based on track
      const totalTopics = this.getTotalTopicsForTrack(track);
      trackStats[track].totalTopics += totalTopics;

      // Categorize by rank
      const rank = progress.rank?.toLowerCase() || 'beginner';
      trackStats[track].progressDistribution[rank] =
        (trackStats[track].progressDistribution[rank] || 0) + 1;
    }

    // Convert to array with calculated averages
    return Object.entries(trackStats).map(([track, stats]) => ({
      learningTrack: track,
      totalStudents: stats.totalStudents,
      avgProgressPercentage:
        stats.totalStudents > 0
          ? parseFloat((stats.progressSum / stats.totalStudents).toFixed(2))
          : 0,
      completedTopics: stats.completedTopics,
      totalTopics: stats.totalTopics || 1,
      progressDistribution: stats.progressDistribution,
    }));
  }

  private getTotalTopicsForTrack(track: string): number {
    // Approximate topic counts based on curriculum
    switch (track) {
      case 'qaidah':
        return 25; // Basic Arabic, reading, etc.
      case 'tajweed':
        return 15; // Rules of recitation
      case 'quran_reading':
        return 114; // Surahs
      case 'hifz':
        return 114; // Surahs to memorize
      default:
        return 100;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 6. Registration Reports
  // ────────────────────────────────────────────────────────────────────────────────

  async getRegistrationReports(
    filters: DateRangeFilter & { country?: string; level?: string },
  ): Promise<RegistrationReport[]> {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThan(filters.endDate);
    }

    if (filters.level) {
      where.level = filters.level;
    }

    const students = await this.studentsRepository.find({
      where,
    });

    // Group by day
    const dailyStats: Record<string, RegistrationReport> = {};

    for (const student of students) {
      const date = student.createdAt.toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          totalRegistrations: 0,
          byGender: {},
          byLevel: {},
          byCountry: {},
        };
      }

      dailyStats[date].totalRegistrations++;

      // Count by gender
      const gender = student.gender || 'unknown';
      dailyStats[date].byGender[gender] = (dailyStats[date].byGender[gender] || 0) + 1;

      // Count by level
      const level = student.level || 'unknown';
      dailyStats[date].byLevel[level] = (dailyStats[date].byLevel[level] || 0) + 1;

      // Count by country
      const country = student.country || 'unknown';
      dailyStats[date].byCountry[country] = (dailyStats[date].byCountry[country] || 0) + 1;
    }

    return Object.values(dailyStats).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 7. Parent Activity Reports
  // ────────────────────────────────────────────────────────────────────────────────

  async getParentActivityReports(
    filters: DateRangeFilter & { country?: string },
  ): Promise<ParentActivityReport[]> {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThan(filters.endDate);
    }

    if (filters.country) {
      where.country = filters.country;
    }

    const parents = await this.parentsRepository.find({
      where,
      relations: ['students', 'user'],
    });

    const reports: ParentActivityReport[] = [];

    for (const parent of parents) {
      const notifications = await this.notificationRepository.find({
        where: { userId: parent.user?.id },
        order: { createdAt: 'DESC' },
      });

      reports.push({
        parentId: parent.id,
        parentName: parent.fullName,
        email: parent.email,
        totalStudents: parent.students?.length || 0,
        notificationsReceived: notifications.length,
        lastActive: parent.updatedAt || parent.createdAt,
      });
    }

    return reports;
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 8. Homework Reports
  // ────────────────────────────────────────────────────────────────────────────────

  async getHomeworkReports(
    filters: DateRangeFilter & { difficulty?: string; status?: string },
  ): Promise<HomeworkReport> {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThan(filters.endDate);
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.status) {
      where.status = filters.status as HomeworkStatus;
    }

    const homeworkList = await this.homeworkRepository.find({
      where,
    });

    const totalHomework = homeworkList.length;
    const completed = homeworkList.filter((h) => h.status === HomeworkStatus.COMPLETED).length;
    const pending = homeworkList.filter((h) => h.status === HomeworkStatus.PENDING).length;

    // Count by difficulty
    const byDifficulty: Record<string, number> = {};
    for (const homework of homeworkList) {
      const diff = homework.difficulty || 'unknown';
      byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
    }

    // Count by student
    const byStudent: Record<string, number> = {};
    for (const homework of homeworkList) {
      const studentName = homework.student?.fullName || 'Unknown';
      byStudent[studentName] = (byStudent[studentName] || 0) + 1;
    }

    // Calculate average completion time (days)
    let totalCompletionTime = 0;
    let completedCount = 0;
    for (const homework of homeworkList) {
      if (
        homework.status === HomeworkStatus.COMPLETED &&
        homework.updatedAt &&
        homework.createdAt
      ) {
        const diffTime = homework.updatedAt.getTime() - homework.createdAt.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        totalCompletionTime += diffDays;
        completedCount++;
      }
    }

    const averageCompletionTime =
      completedCount > 0 ? parseFloat((totalCompletionTime / completedCount).toFixed(2)) : 0;

    return {
      totalHomework,
      pending,
      completed,
      byDifficulty,
      byStudent,
      averageCompletionTime,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 9. Exam Reports
  // ────────────────────────────────────────────────────────────────────────────────

  async getExamReports(
    filters: DateRangeFilter & { status?: string; learningTrack?: string },
  ): Promise<ExamReport> {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThan(filters.endDate);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const exams = await this.examsRepository.find({
      where,
      relations: ['student', 'progress'],
    });

    const totalExams = exams.length;
    const totalStudentsTaken = [...new Set(exams.map((e) => e.studentId))].length;

    // Calculate scores
    const scores = exams.map((e) => e.score || 0);
    const averageScore =
      totalExams > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / totalExams).toFixed(2)) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Pass rate (assuming 50% is passing)
    const passedExams = scores.filter((s) => s >= 50).length;
    const passRate = totalExams > 0 ? ((passedExams / totalExams) * 100).toFixed(2) : '0';

    // By learning track
    const byLearningTrack: Record<string, number> = {};
    for (const exam of exams) {
      const track = exam.progress?.learningTrack || exam.student?.level || 'unknown';
      byLearningTrack[track] = (byLearningTrack[track] || 0) + 1;
    }

    // By difficulty
    const byDifficulty: Record<string, number> = {};
    for (const exam of exams) {
      const difficulty = exam.difficulty || 'unknown';
      byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + 1;
    }

    return {
      totalExams,
      totalStudentsTaken,
      averageScore,
      highestScore,
      lowestScore,
      passRate: parseFloat(passRate),
      byLearningTrack,
      byDifficulty,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────────
  // 10. Teacher Replacement Reports
  // ────────────────────────────────────────────────────────────────────────────────

  async getTeacherReplacementReports(
    filters: DateRangeFilter & { status?: string; reason?: string },
  ): Promise<TeacherReplacementReport> {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThan(filters.endDate);
    }

    if (filters.status) {
      where.status = filters.status as ReplacementStatus;
    }

    const replacements = await this.replacementsRepository.find({
      where,
      relations: ['student', 'originalTeacher', 'replacementTeacher'],
      order: { startDate: 'DESC' },
    });

    const totalReplacements = replacements.length;

    // Count by status
    const byStatus: Record<string, number> = {};
    for (const replacement of replacements) {
      const status = replacement.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    // Count by reason
    const byReason: Record<string, number> = {};
    for (const replacement of replacements) {
      const reason = replacement.reason || 'unknown';
      byReason[reason] = (byReason[reason] || 0) + 1;
    }

    const details = replacements.map((r) => ({
      id: r.id,
      studentName: r.student?.fullName || 'Unknown',
      originalTeacher: r.originalTeacher?.fullName || 'Unknown',
      replacementTeacher: r.replacementTeacher?.fullName || 'Unknown',
      startDate: r.startDate,
      endDate: r.endDate,
      reason: r.customReason || r.reason || 'unknown',
      status: r.status,
    }));

    return {
      totalReplacements,
      upcoming: byStatus[ReplacementStatus.UPCOMING] || 0,
      active: byStatus[ReplacementStatus.ACTIVE] || 0,
      completed: byStatus[ReplacementStatus.COMPLETED] || 0,
      cancelled: byStatus[ReplacementStatus.CANCELLED] || 0,
      byReason,
      byStatus,
      details,
    };
  }
}
