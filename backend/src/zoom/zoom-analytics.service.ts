import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { ParticipantTimelineEvent } from './entities/participant-timeline-event.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { AttendanceStatus } from './enums/live-session-status.enum';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';

@Injectable()
export class ZoomAnalyticsService {
  private readonly logger = new Logger(ZoomAnalyticsService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(ParticipantTimelineEvent)
    private readonly timelineRepository: Repository<ParticipantTimelineEvent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
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
    const noShowSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.NO_SHOW },
    });
    const expiredSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.EXPIRED },
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

    const teachingHours = await this.getTotalTeachingHours();

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      noShowSessions,
      expiredSessions,
      averageSessionDuration,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalStudents,
      totalTeachers,
      missedSessions: cancelledSessions + noShowSessions + expiredSessions,
      activeSessions: liveSessions,
      totalTeachingHours: Math.round(teachingHours * 10) / 10,
      completionRate:
        totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0,
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
    const noShowSessions = sessions.filter((s) => s.status === LiveSessionStatus.NO_SHOW).length;

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

    const teacherOverlapMs = allAttendances.reduce(
      (sum, a) => sum + (a.teacherOverlapMs || 0),
      0,
    );

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      noShowSessions,
      averageSessionDuration,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      totalStudents: studentIds.length,
      teacherUtilization:
        totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      totalTeachingMinutes: totalDuration,
      totalOverlapMinutes: Math.round(teacherOverlapMs / 60000),
    };
  }

  async getStudentAnalytics(studentId: string): Promise<any> {
    const attendances = await this.attendanceRepository.find({
      where: { studentId },
      relations: ['session', 'session.teacher'],
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

    const totalTeacherOverlapMs = attendances.reduce(
      (sum, a) => sum + (a.teacherOverlapMs || 0),
      0,
    );
    const teachingMinutes = Math.round(totalTeacherOverlapMs / 60000);

    const streak = this.calculateStreak(attendances.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ));

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
      teachingMinutes,
      currentStreak: streak,
      engagement: totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0,
    };
  }

  async getTeacherTeachingHours(
    teacherId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalHours: number;
    totalMinutes: number;
    sessionCount: number;
    averageMinutesPerSession: number;
    dailyBreakdown: Record<string, number>;
  }> {
    const where: any = {
      teacherId,
      status: LiveSessionStatus.COMPLETED,
    };

    if (startDate && endDate) {
      where.scheduledStart = Between(startDate, endDate);
    }

    const sessions = await this.liveSessionRepository.find({
      where,
      order: { scheduledStart: 'ASC' },
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const dailyBreakdown: Record<string, number> = {};

    for (const s of sessions) {
      const day = s.scheduledStart.toISOString().split('T')[0];
      dailyBreakdown[day] = (dailyBreakdown[day] || 0) + (s.durationMinutes || 0);
    }

    return {
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalMinutes,
      sessionCount: sessions.length,
      averageMinutesPerSession:
        sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
      dailyBreakdown,
    };
  }

  async getStudentLearningHours(
    studentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalHours: number;
    totalMinutes: number;
    sessionCount: number;
    averageMinutesPerSession: number;
    teachingHours: number;
    dailyBreakdown: Record<string, number>;
  }> {
    const where: any = { studentId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const attendances = await this.attendanceRepository.find({
      where,
      relations: ['session'],
    });

    const attended = attendances.filter(
      (a) => a.attendanceStatus !== AttendanceStatus.ABSENT && a.duration,
    );

    const totalMinutes = attended.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalTeachingMs = attended.reduce((sum, a) => sum + (a.teacherOverlapMs || 0), 0);
    const dailyBreakdown: Record<string, number> = {};

    for (const a of attended) {
      const day = a.createdAt.toISOString().split('T')[0];
      dailyBreakdown[day] = (dailyBreakdown[day] || 0) + (a.duration || 0);
    }

    return {
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      totalMinutes,
      sessionCount: attended.length,
      averageMinutesPerSession:
        attended.length > 0 ? Math.round(totalMinutes / attended.length) : 0,
      teachingHours: Math.round((totalTeachingMs / 3600000) * 10) / 10,
      dailyBreakdown,
    };
  }

  async getSessionTimeline(sessionId: string): Promise<any> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher', 'student', 'attendances', 'attendances.student'],
    });

    if (!session) return null;

    const timeline = await this.attendanceIntelligence.getSessionTimelineSummary(
      sessionId,
    );

    return {
      session,
      timeline: timeline.events.map((e) => ({
        id: e.id,
        participantId: e.participantId,
        role: e.participantRole,
        eventType: e.eventType,
        timestamp: e.timestamp,
        device: e.device,
        clientType: e.clientType,
      })),
      teacherTimeline: timeline.teacherTimeline.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        timestamp: e.timestamp,
      })),
      studentTimelines: Array.from(timeline.studentTimelines.entries()).map(
        ([studentId, events]) => ({
          studentId,
          events: events.map((e) => ({
            id: e.id,
            eventType: e.eventType,
            timestamp: e.timestamp,
            device: e.device,
          })),
        }),
      ),
      overlap: timeline.overlap
        ? {
            teacherTotalMs: timeline.overlap.teacherTotalMs,
            studentTotalMs: timeline.overlap.studentTotalMs,
            overlapMinutes: timeline.overlap.overlapMinutes,
            segments: timeline.overlap.segments,
          }
        : null,
      attendances: session.attendances.map((a) => ({
        studentId: a.studentId,
        studentName: (a.student as any)?.fullName || 'Unknown',
        status: a.attendanceStatus,
        duration: a.duration,
        rejoinCount: a.rejoinCount,
        totalConnectedTimeMs: a.totalConnectedTimeMs,
        longestContinuousPresenceMs: a.longestContinuousPresenceMs,
        teacherOverlapMs: a.teacherOverlapMs,
      })),
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

    const teachingHours = sessions
      .filter((s) => s.status === LiveSessionStatus.COMPLETED)
      .reduce((sum, s) => sum + ((s.durationMinutes || 0) / 60), 0);

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
    const noShowSessions = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.NO_SHOW },
    });

    const completionRate =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const teachingHours = await this.getTotalTeachingHours();

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      liveSessions,
      scheduledSessions,
      noShowSessions,
      completionRate,
      totalTeachingHours: Math.round(teachingHours * 10) / 10,
    };
  }

  async getTeacherRankings(): Promise<any[]> {
    const teachers = await this.teacherRepository.find();
    const rankings = [];

    for (const teacher of teachers) {
      const sessions = await this.liveSessionRepository.find({
        where: { teacherId: teacher.id, status: LiveSessionStatus.COMPLETED },
      });

      const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const sessionIds = sessions.map((s) => s.id);
      const totalStudents = sessionIds.length > 0
        ? new Set(
            (await this.attendanceRepository.find({
              where: { sessionId: In(sessionIds) },
            })).map((a) => a.studentId),
          ).size
        : 0;

      rankings.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName || 'Unknown',
        totalSessions: sessions.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalStudents,
      });
    }

    return rankings.sort((a, b) => b.totalHours - a.totalHours);
  }

  private async getTotalTeachingHours(): Promise<number> {
    const completedSessions = await this.liveSessionRepository.find({
      where: { status: LiveSessionStatus.COMPLETED },
    });
    const totalMinutes = completedSessions.reduce(
      (sum, s) => sum + (s.durationMinutes || 0),
      0,
    );
    return totalMinutes / 60;
  }

  private calculateStreak(
    attendances: SessionAttendance[],
  ): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < attendances.length; i++) {
      const attDate = new Date(attendances[i].createdAt);
      attDate.setHours(0, 0, 0, 0);

      if (attendances[i].attendanceStatus === AttendanceStatus.ABSENT) break;

      if (i === 0) {
        const diffDays = Math.round(
          (today.getTime() - attDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays > 1) break;
        streak = 1;
      } else {
        const prevDate = new Date(attendances[i - 1].createdAt);
        prevDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round(
          (prevDate.getTime() - attDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 1) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  }
}
