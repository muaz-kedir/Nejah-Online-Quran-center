import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SessionMeeting, SessionStatus } from './entities/session-meeting.entity';
import { StudentSessionAttendance, StudentAttendanceStatus } from './entities/student-session-attendance.entity';

@Injectable()
export class SessionsAnalyticsService {
  constructor(
    @InjectRepository(SessionMeeting)
    private sessionRepository: Repository<SessionMeeting>,
    @InjectRepository(StudentSessionAttendance)
    private attendanceRepository: Repository<StudentSessionAttendance>,
  ) {}

  async getDashboardAnalytics(): Promise<{
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    liveSessions: number;
    scheduledSessions: number;
    attendanceRate: number;
    averageSessionDuration: number;
    totalStudents: number;
    totalTeachers: number;
    completionRate: number;
  }> {
    const totalSessions = await this.sessionRepository.count();
    const completedSessions = await this.sessionRepository.count({
      where: { status: SessionStatus.ENDED },
    });
    const cancelledSessions = await this.sessionRepository.count({
      where: { status: SessionStatus.CANCELLED },
    });
    const liveSessions = await this.sessionRepository.count({
      where: { status: SessionStatus.LIVE },
    });
    const scheduledSessions = await this.sessionRepository.count({
      where: { status: SessionStatus.SCHEDULED },
    });

    const sessionsWithDuration = await this.sessionRepository.find({
      where: { status: SessionStatus.ENDED },
      select: ['totalDuration'],
    });
    const totalDuration = sessionsWithDuration.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
    const averageSessionDuration = sessionsWithDuration.length > 0
      ? Math.round(totalDuration / sessionsWithDuration.length)
      : 0;

    const allAttendances = await this.attendanceRepository.find();
    const totalAttendances = allAttendances.length;
    const presentCount = allAttendances.filter(
      (a) =>
        a.attendanceStatus === StudentAttendanceStatus.PRESENT ||
        a.attendanceStatus === StudentAttendanceStatus.LATE,
    ).length;
    const attendanceRate = totalAttendances > 0
      ? Math.round((presentCount / totalAttendances) * 100 * 100) / 100
      : 0;

    const teacherIds = new Set<string>();
    const studentIds = new Set<string>();
    const sessions = await this.sessionRepository.find({
      relations: ['studentAttendances'],
    });
    for (const s of sessions) {
      if (s.teacherId) teacherIds.add(s.teacherId);
      if (s.studentAttendances) {
        for (const a of s.studentAttendances) {
          if (a.studentId) studentIds.add(a.studentId);
        }
      }
    }

    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      scheduledSessions,
      attendanceRate,
      averageSessionDuration,
      totalStudents: studentIds.size,
      totalTeachers: teacherIds.size,
      completionRate,
    };
  }

  async getMonthlyTrends(year: number, month: number): Promise<{
    month: number;
    year: number;
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    averageDuration: number;
    attendanceRate: number;
    sessionsByDay: Array<{
      day: string;
      date: string;
      total: number;
      completed: number;
      cancelled: number;
      avgDuration: number;
      maxDuration: number;
    }>;
    totalTeachingHours: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sessions = await this.sessionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === SessionStatus.ENDED).length;
    const cancelled = sessions.filter((s) => s.status === SessionStatus.CANCELLED).length;

    const completedSessions = sessions.filter((s) => s.status === SessionStatus.ENDED);
    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
    const avgDuration = completedSessions.length > 0
      ? Math.round(totalDuration / completedSessions.length)
      : 0;

    const sessionIds = sessions.map((s) => s.id);
    const allAttendances = sessionIds.length > 0
      ? await this.attendanceRepository.find({
          where: { sessionMeetingId: In(sessionIds) },
        })
      : [];
    const presentCount = allAttendances.filter(
      (a) =>
        a.attendanceStatus === StudentAttendanceStatus.PRESENT ||
        a.attendanceStatus === StudentAttendanceStatus.LATE,
    ).length;
    const attendanceRate = allAttendances.length > 0
      ? Math.round((presentCount / allAttendances.length) * 100)
      : 0;

    const sessionsByDayMap: Record<string, { total: number; completed: number; cancelled: number; durations: number[] }> = {};
    for (const s of sessions) {
      const dateKey = s.createdAt.toISOString().split('T')[0];
      if (!sessionsByDayMap[dateKey]) {
        sessionsByDayMap[dateKey] = { total: 0, completed: 0, cancelled: 0, durations: [] };
      }
      sessionsByDayMap[dateKey].total++;
      if (s.status === SessionStatus.ENDED) {
        sessionsByDayMap[dateKey].completed++;
        if (s.totalDuration) sessionsByDayMap[dateKey].durations.push(s.totalDuration);
      }
      if (s.status === SessionStatus.CANCELLED) {
        sessionsByDayMap[dateKey].cancelled++;
      }
    }

    const sessionsByDay = Object.entries(sessionsByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        day: date,
        date,
        total: stats.total,
        completed: stats.completed,
        cancelled: stats.cancelled,
        avgDuration:
          stats.durations.length > 0
            ? Math.round(stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length)
            : 0,
        maxDuration: stats.durations.length > 0 ? Math.max(...stats.durations) : 0,
      }));

    const teachingHours = completedSessions.reduce((sum, s) => sum + ((s.totalDuration || 0) / 60), 0);

    return {
      month,
      year,
      totalSessions: total,
      completedSessions: completed,
      cancelledSessions: cancelled,
      averageDuration: avgDuration,
      attendanceRate,
      sessionsByDay,
      totalTeachingHours: Math.round(teachingHours * 10) / 10,
    };
  }
}
