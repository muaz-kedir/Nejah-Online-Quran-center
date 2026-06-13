import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { AttendanceStatus } from './enums/live-session-status.enum';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Injectable()
export class ZoomAnalyticsService {
  private readonly logger = new Logger(ZoomAnalyticsService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  async getDashboardAnalytics(): Promise<any> {
    const totalSessions = await this.liveSessionRepository.count();
    const completedSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.COMPLETED },
    });
    const cancelledSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.CANCELLED },
    });
    const liveSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.LIVE },
    });

    const sessions = await this.liveSessionRepository.find({
      where: { status: LiveSessionStatus.COMPLETED },
    });

    const totalDuration = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const averageSessionDuration =
      sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;

    const allAttendances = await this.attendanceRepository.find();
    const totalAttendances = allAttendances.length;
    const presentCount = allAttendances.filter(
      (a) =>
        a.attendanceStatus === AttendanceStatus.PRESENT ||
        a.attendanceStatus === AttendanceStatus.LATE,
    ).length;
    const attendanceRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0;

    const totalStudents = await this.studentRepository.count({
      where: { status: 'active' as any },
    });
    const totalTeachers = await this.teacherRepository.count();

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      averageSessionDuration,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalStudents,
      totalTeachers,
      missedSessions: cancelledSessions,
      activeSessions: liveSessions,
    };
  }

  async getTeacherAnalytics(teacherId: string): Promise<any> {
    const sessions = await this.liveSessionRepository.find({
      where: { teacherId },
      relations: ['attendances'],
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === LiveSessionStatus.COMPLETED,
    ).length;
    const cancelledSessions = sessions.filter(
      (s) => s.status === LiveSessionStatus.CANCELLED,
    ).length;
    const liveSessions = sessions.filter((s) => s.status === LiveSessionStatus.LIVE).length;

    const completed = sessions.filter((s) => s.status === LiveSessionStatus.COMPLETED);
    const totalDuration = completed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const averageSessionDuration =
      completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

    const allAttendances = sessions.flatMap((s) => s.attendances || []);
    const presentCount = allAttendances.filter(
      (a) =>
        a.attendanceStatus === AttendanceStatus.PRESENT ||
        a.attendanceStatus === AttendanceStatus.LATE,
    ).length;
    const attendanceRate =
      allAttendances.length > 0 ? (presentCount / allAttendances.length) * 100 : 0;

    const studentIds = [...new Set(allAttendances.map((a) => a.studentId))];

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      averageSessionDuration,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalStudents: studentIds.length,
      teacherUtilization:
        totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    };
  }

  async getStudentAnalytics(studentId: string): Promise<any> {
    const attendances = await this.attendanceRepository.find({
      where: { studentId },
      relations: ['session'],
    });

    const totalSessions = attendances.length;
    const sessionsAttended = attendances.filter(
      (a) => a.attendanceStatus !== AttendanceStatus.ABSENT,
    ).length;
    const present = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.PRESENT,
    ).length;
    const late = attendances.filter((a) => a.attendanceStatus === AttendanceStatus.LATE).length;
    const absent = attendances.filter((a) => a.attendanceStatus === AttendanceStatus.ABSENT).length;
    const leftEarly = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.LEFT_EARLY,
    ).length;

    const totalDuration = attendances.reduce((sum, a) => sum + (a.duration || 0), 0);
    const averageDuration = sessionsAttended > 0 ? Math.round(totalDuration / sessionsAttended) : 0;

    const attendanceRate =
      totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100 * 100) / 100 : 0;

    return {
      totalSessions,
      sessionsAttended,
      present,
      late,
      absent,
      leftEarly,
      attendanceRate,
      totalDuration,
      averageDuration,
      engagement: totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0,
    };
  }

  async getMonthlyTrends(year: number, month: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sessions = await this.liveSessionRepository.find({
      where: {
        scheduledStart: Between(startDate, endDate),
      },
      relations: ['attendances'],
    });

    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === LiveSessionStatus.COMPLETED).length;
    const cancelled = sessions.filter((s) => s.status === LiveSessionStatus.CANCELLED).length;

    const totalDuration = sessions
      .filter((s) => s.status === LiveSessionStatus.COMPLETED)
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const avgDuration = completed > 0 ? Math.round(totalDuration / completed) : 0;

    const allAttendances = sessions.flatMap((s) => s.attendances || []);
    const presentCount = allAttendances.filter(
      (a) =>
        a.attendanceStatus === AttendanceStatus.PRESENT ||
        a.attendanceStatus === AttendanceStatus.LATE,
    ).length;
    const attendanceRate =
      allAttendances.length > 0 ? Math.round((presentCount / allAttendances.length) * 100) : 0;

    const sessionsByDay: Record<string, number> = {};
    sessions.forEach((s) => {
      const day = s.scheduledStart.toLocaleDateString('en-US', { weekday: 'long' });
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });

    return {
      month,
      year,
      totalSessions: total,
      completedSessions: completed,
      cancelledSessions: cancelled,
      averageDuration: avgDuration,
      attendanceRate,
      sessionsByDay,
    };
  }

  async getOverallStats(): Promise<any> {
    const totalSessions = await this.liveSessionRepository.count();
    const completedSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.COMPLETED },
    });
    const cancelledSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.CANCELLED },
    });
    const liveSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.LIVE },
    });
    const scheduledSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.SCHEDULED },
    });

    const completionRate =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      scheduledSessions,
      completionRate,
    };
  }
}
