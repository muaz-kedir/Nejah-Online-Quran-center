import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionParticipantSummary } from './entities/session-participant-summary.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { TimelineEventType } from './entities/participant-timeline-event.entity';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { AttendanceReconciliationService } from './attendance-reconciliation.service';
import { SessionAttendanceService } from './session-attendance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SessionAttendance } from './entities/session-attendance.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';

export type ZoomParticipantPayload = {
  userId?: string;
  email: string;
  name: string;
  joinTime: Date;
  leaveTime?: Date;
  duration?: number;
  zoomParticipantId: string;
};

@Injectable()
export class LiveSessionAttendanceReportService {
  private readonly logger = new Logger(LiveSessionAttendanceReportService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly sessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionParticipantSummary)
    private readonly summaryRepository: Repository<SessionParticipantSummary>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    @InjectRepository(ScheduleStudent)
    private readonly scheduleStudentRepository: Repository<ScheduleStudent>,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
    private readonly reconciliationService: AttendanceReconciliationService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleMeetingStarted(zoomMeetingId: string, startTime: Date, meetingUUID?: string) {
    const session = await this.sessionRepository.findOne({
      where: { zoomMeetingId },
      relations: ['teacher', 'schedule', 'schedule.scheduleStudents'],
    });
    if (!session) {
      this.logger.warn(`No live session for Zoom meeting ${zoomMeetingId}`);
      return;
    }

    if (
      session.status === LiveSessionStatus.SCHEDULED ||
      session.status === LiveSessionStatus.LIVE
    ) {
      session.status = LiveSessionStatus.LIVE;
      session.actualStart = startTime;
      if (meetingUUID) session.zoomMeetingUUID = meetingUUID;
      await this.sessionRepository.save(session);
    }

    const studentIds = await this.getEnrolledStudentIds(session);
    if (studentIds.length > 0) {
      await this.sessionAttendanceService.bulkCreateAttendance(session.id, studentIds);
    }

    for (const studentId of studentIds) {
      const student = await this.studentRepository.findOne({ where: { id: studentId } });
      if (student?.userId) {
        await this.attendanceIntelligence.upsertAbsentSummary({
          sessionId: session.id,
          userId: student.userId,
          userType: 'student',
          participantId: student.id,
          userName: student.fullName,
          userEmail: student.email,
        });
      }
    }

    if (session.teacher?.userId) {
      await this.attendanceIntelligence.upsertAbsentSummary({
        sessionId: session.id,
        userId: session.teacher.userId,
        userType: 'teacher',
        participantId: session.teacher.id,
        userName: session.teacher.fullName,
        userEmail: session.teacher.email,
      });
    }
  }

  async handleParticipantJoined(zoomMeetingId: string, participant: ZoomParticipantPayload) {
    const session = await this.findSessionByZoomMeetingId(zoomMeetingId);
    if (!session) return;

    const resolved = await this.resolveParticipant(participant, session);

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId: session.id,
      participantId: resolved.participantId,
      participantRole: resolved.role,
      zoomUserId: participant.zoomParticipantId,
      eventType: TimelineEventType.JOIN,
      timestamp: participant.joinTime,
      webhookEventId: `${zoomMeetingId}_${resolved.participantId}_join_${participant.joinTime.getTime()}`,
    });

    await this.attendanceIntelligence.openAttendanceSegment({
      sessionId: session.id,
      userId: resolved.userId,
      userEmail: participant.email,
      userType: resolved.role,
      zoomParticipantId: participant.zoomParticipantId,
      joinTime: participant.joinTime,
      source: 'webhook',
    });

    if (resolved.role === 'student') {
      await this.attendanceIntelligence.calculateAndUpdateAttendance(
        session.id,
        resolved.participantId,
      );
    }

    if (resolved.role === 'teacher') {
      session.teacherJoinTime = participant.joinTime;
      await this.sessionRepository.save(session);
    }

    await this.attendanceIntelligence.upsertParticipantSummary({
      sessionId: session.id,
      userId: resolved.userId,
      userType: resolved.role,
      participantId: resolved.participantId,
      userName: participant.name,
      userEmail: participant.email,
    });
  }

  async handleParticipantLeft(zoomMeetingId: string, participant: ZoomParticipantPayload) {
    const session = await this.findSessionByZoomMeetingId(zoomMeetingId);
    if (!session) return;

    const resolved = await this.resolveParticipant(participant, session);
    const leaveTime = participant.leaveTime || new Date();

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId: session.id,
      participantId: resolved.participantId,
      participantRole: resolved.role,
      zoomUserId: participant.zoomParticipantId,
      eventType: TimelineEventType.LEAVE,
      timestamp: leaveTime,
      webhookEventId: `${zoomMeetingId}_${resolved.participantId}_leave_${leaveTime.getTime()}`,
    });

    await this.attendanceIntelligence.closeOpenSegment(
      session.id,
      participant.email,
      leaveTime,
      participant.duration,
    );

    if (resolved.role === 'student') {
      await this.attendanceIntelligence.calculateAndUpdateAttendance(
        session.id,
        resolved.participantId,
      );
    }

    if (resolved.role === 'teacher') {
      session.teacherLeaveTime = leaveTime;
      if (session.actualStart) {
        const start = session.teacherJoinTime || session.actualStart;
        session.durationMinutes = Math.floor(
          (leaveTime.getTime() - start.getTime()) / 60000,
        );
      }
      await this.sessionRepository.save(session);
    }

    await this.attendanceIntelligence.upsertParticipantSummary({
      sessionId: session.id,
      userId: resolved.userId,
      userType: resolved.role,
      participantId: resolved.participantId,
      userName: participant.name,
      userEmail: participant.email,
    });
  }

  async handleMeetingEnded(zoomMeetingId: string, endTime: Date, meetingUUID?: string) {
    const session = await this.sessionRepository.findOne({
      where: { zoomMeetingId },
    });
    if (!session) return;

    session.status = LiveSessionStatus.COMPLETED;
    session.actualEnd = endTime;
    session.completedAt = endTime;
    session.teacherLeaveTime = session.teacherLeaveTime || endTime;
    if (meetingUUID) session.zoomMeetingUUID = meetingUUID;

    if (session.actualStart) {
      session.durationMinutes = Math.floor(
        (endTime.getTime() - session.actualStart.getTime()) / 60000,
      );
    }

    await this.sessionRepository.save(session);
    await this.attendanceIntelligence.closeAllOpenSegments(session.id, endTime);

    try {
      await this.attendanceIntelligence.recalculateSession(session.id);
    } catch (err) {
      this.logger.error(`Failed to recalculate session ${session.id}`, err);
    }

    if (session.zoomMeetingUUID) {
      this.reconciliationService.scheduleReconciliation(session.id, session.zoomMeetingUUID);
    }

    const attendances = await this.attendanceRepository.find({
      where: { sessionId: session.id },
      relations: ['student'],
    });
    const studentUserIds = attendances
      .map((a) => a.student?.userId)
      .filter((id): id is string => !!id);

    if (studentUserIds.length > 0) {
      try {
        await this.notificationsService.sendCustomNotifications(
          studentUserIds,
          'Class Completed',
          `Your class has ended. Duration: ${session.durationMinutes || 'N/A'} minutes.`,
          { sessionId: session.id, durationMinutes: session.durationMinutes },
        );
      } catch (err) {
        this.logger.error('Failed to send completion notification', err);
      }
    }
  }

  async getSessionAttendanceSummary(sessionId: string) {
    const records = await this.summaryRepository.find({
      where: { sessionId, userType: 'student' },
      order: { userName: 'ASC' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const late = records.filter((r) => r.status === 'late').length;
    const leftEarly = records.filter((r) => r.status === 'left_early').length;
    const partial = records.filter((r) => r.status === 'partial').length;
    const absent = records.filter((r) => r.status === 'absent').length;

    return {
      total,
      present,
      late,
      leftEarly,
      partial,
      absent,
      attendanceRate:
        total > 0 ? Math.round(((present + late + leftEarly) / total) * 100) : 0,
      records: records.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        status: r.status,
        joinTime: r.firstJoinTime,
        leaveTime: r.lastLeaveTime,
        durationMinutes: Math.round(r.totalDurationSeconds / 60),
        isReconciled: r.isReconciled,
      })),
    };
  }

  async getTeacherAttendanceReport(
    teacherId: string,
    filters: { startDate?: Date; endDate?: Date; sessionId?: string },
  ) {
    const qb = this.summaryRepository
      .createQueryBuilder('summary')
      .innerJoin(LiveSession, 'session', 'session.id = summary.sessionId')
      .where('session.teacherId = :teacherId', { teacherId })
      .andWhere('summary.userType = :userType', { userType: 'student' });

    if (filters.sessionId) {
      qb.andWhere('summary.sessionId = :sessionId', { sessionId: filters.sessionId });
    }
    if (filters.startDate) {
      qb.andWhere('session.scheduledStart >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('session.scheduledStart <= :endDate', { endDate: filters.endDate });
    }

    const records = await qb.orderBy('session.scheduledStart', 'DESC').getMany();
    return this.formatSummaryRecords(records);
  }

  async getAdminAttendanceReport(filters: {
    startDate?: Date;
    endDate?: Date;
    teacherId?: string;
    studentId?: string;
    status?: string;
  }) {
    const sessionWhere: Record<string, unknown> = {};
    if (filters.teacherId) sessionWhere.teacherId = filters.teacherId;
    if (filters.startDate && filters.endDate) {
      sessionWhere.scheduledStart = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      sessionWhere.scheduledStart = MoreThanOrEqual(filters.startDate);
    } else if (filters.endDate) {
      sessionWhere.scheduledStart = LessThanOrEqual(filters.endDate);
    }

    const sessions = await this.sessionRepository.find({
      where: sessionWhere,
      relations: ['teacher', 'schedule'],
      order: { scheduledStart: 'DESC' },
    });

    if (!sessions.length) return [];

    const sessionIds = sessions.map((s) => s.id);
    const summaryWhere: any = { sessionId: In(sessionIds) };
    if (filters.studentId) summaryWhere.participantId = filters.studentId;
    if (filters.status) summaryWhere.status = filters.status.toLowerCase();

    const summaries = await this.summaryRepository.find({
      where: summaryWhere,
      order: { sessionId: 'ASC' },
    });

    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    return summaries.map((summary) => {
      const session = sessionMap.get(summary.sessionId);
      return {
        sessionId: summary.sessionId,
        sessionTitle: session?.schedule?.className || session?.metadata?.className || 'Live Session',
        scheduledStart: session?.scheduledStart,
        scheduledEnd: session?.scheduledEnd,
        actualStart: session?.actualStart,
        actualEnd: session?.actualEnd,
        teacherId: session?.teacherId,
        teacherName: session?.teacher?.fullName,
        userId: summary.userId,
        userType: summary.userType,
        userName: summary.userName,
        userEmail: summary.userEmail,
        firstJoinTime: summary.firstJoinTime,
        lastLeaveTime: summary.lastLeaveTime,
        totalDurationSeconds: summary.totalDurationSeconds,
        status: summary.status,
        isReconciled: summary.isReconciled,
        durationMinutes: Math.round(summary.totalDurationSeconds / 60),
      };
    });
  }

  async exportAdminReportCsv(filters: {
    startDate?: Date;
    endDate?: Date;
    teacherId?: string;
    studentId?: string;
    status?: string;
  }): Promise<string> {
    const records = await this.getAdminAttendanceReport(filters);
    if (!records.length) return '';

    const headers = [
      'sessionId',
      'scheduledStart',
      'teacherName',
      'userName',
      'userEmail',
      'userType',
      'status',
      'joinTime',
      'leaveTime',
      'durationMinutes',
      'isReconciled',
    ];

    const rows = records.map((r) =>
      [
        r.sessionId,
        r.scheduledStart,
        r.teacherName,
        r.userName,
        r.userEmail,
        r.userType,
        r.status,
        r.firstJoinTime,
        r.lastLeaveTime,
        r.durationMinutes,
        r.isReconciled,
      ]
        .map((v) => (typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : v ?? ''))
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async assertTeacherSessionAccess(teacherId: string, sessionId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('You are not assigned to this session');
    }
    return session;
  }

  private formatSummaryRecords(records: SessionParticipantSummary[]) {
    return records.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      status: r.status,
      joinTime: r.firstJoinTime,
      leaveTime: r.lastLeaveTime,
      durationMinutes: Math.round(r.totalDurationSeconds / 60),
      isReconciled: r.isReconciled,
      sessionId: r.sessionId,
    }));
  }

  private async findSessionByZoomMeetingId(zoomMeetingId: string) {
    return this.sessionRepository.findOne({
      where: { zoomMeetingId },
      relations: ['teacher'],
    });
  }

  private async getEnrolledStudentIds(session: LiveSession): Promise<string[]> {
    const ids = new Set<string>();
    if (session.studentId) ids.add(session.studentId);

    if (session.scheduleId) {
      const scheduleStudents = await this.scheduleStudentRepository.find({
        where: { scheduleId: session.scheduleId },
      });
      for (const ss of scheduleStudents) ids.add(ss.studentId);
    }

    if (session.schedule?.scheduleStudents) {
      for (const ss of session.schedule.scheduleStudents) {
        if (ss.studentId) ids.add(ss.studentId);
      }
    }

    return Array.from(ids);
  }

  private async resolveParticipant(
    participant: ZoomParticipantPayload,
    session: LiveSession,
  ): Promise<{
    participantId: string;
    userId: string;
    role: 'teacher' | 'student';
  }> {
    const email = participant.email?.trim().toLowerCase() || '';

    if (email) {
      const student = await this.studentRepository.findOne({
        where: [{ email }, { zoomEmail: email }],
      });
      if (student?.userId) {
        return { participantId: student.id, userId: student.userId, role: 'student' };
      }

      const teacher = await this.teacherRepository.findOne({ where: { email } });
      if (teacher?.userId) {
        return { participantId: teacher.id, userId: teacher.userId, role: 'teacher' };
      }
    }

    if (session.teacher?.email && email === session.teacher.email.toLowerCase()) {
      return {
        participantId: session.teacherId,
        userId: session.teacher.userId,
        role: 'teacher',
      };
    }

    const zoomUserId = participant.zoomParticipantId;
    if (zoomUserId) {
      const integration = await this.zoomIntegrationRepository.findOne({
        where: { zoomUserId },
      });
      if (integration) {
        const teacher = await this.teacherRepository.findOne({
          where: { id: integration.teacherId },
        });
        if (teacher?.userId) {
          return { participantId: teacher.id, userId: teacher.userId, role: 'teacher' };
        }
      }
    }

    if (session.studentId) {
      const student = await this.studentRepository.findOne({ where: { id: session.studentId } });
      if (student?.userId) {
        return { participantId: student.id, userId: student.userId, role: 'student' };
      }
    }

    if (session.teacherId && session.teacher?.userId) {
      return {
        participantId: session.teacherId,
        userId: session.teacher.userId,
        role: 'teacher',
      };
    }

    return {
      participantId: participant.zoomParticipantId || 'unknown',
      userId: participant.userId || participant.zoomParticipantId || 'unknown',
      role: 'student',
    };
  }
}
