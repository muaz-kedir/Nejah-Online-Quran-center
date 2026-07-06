import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionParticipantSummary } from './entities/session-participant-summary.entity';
import { LiveSessionStatus, AttendanceStatus } from './enums/live-session-status.enum';
import { ReconciliationStatus } from './enums/reconciliation-status.enum';
import { TimelineEventType, TimelineEventSource } from './entities/participant-timeline-event.entity';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { AttendanceReconciliationService } from './attendance-reconciliation.service';
import { SessionAttendanceService } from './session-attendance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SessionAttendance } from './entities/session-attendance.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import { LiveSessionLookupService } from './live-session-lookup.service';
import { buildWebhookEventId } from './webhook-event-id.util';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
    private readonly reconciliationService: AttendanceReconciliationService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly notificationsService: NotificationsService,
    private readonly liveSessionLookup: LiveSessionLookupService,
  ) {}

  private async resolveSessionForWebhook(
    meetingId: string,
    options?: { meetingUUID?: string; hostId?: string; eventType?: string },
  ): Promise<LiveSession | null> {
    const result = await this.liveSessionLookup.resolve({
      meetingId,
      meetingUUID: options?.meetingUUID,
      hostId: options?.hostId,
      eventType: options?.eventType,
    });

    if (result.session) {
      this.logger.log(
        `Zoom ${options?.eventType || 'event'} matched liveSession=${result.session.id} ` +
          `via ${result.matchedBy} (meetingId=${meetingId}, teacherId=${result.session.teacherId})`,
      );
      return result.session;
    }

    this.liveSessionLookup.logLookupFailure(
      {
        meetingId,
        meetingUUID: options?.meetingUUID,
        hostId: options?.hostId,
        eventType: options?.eventType,
      },
      result,
    );
    return null;
  }

  /** Record teacher entrance when they join/start via the app (not only Zoom webhooks). */
  async recordTeacherJoin(sessionId: string, teacher: Teacher, joinTime: Date): Promise<void> {
    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId,
      participantId: teacher.id,
      participantRole: 'teacher',
      eventType: TimelineEventType.JOIN,
      timestamp: joinTime,
      source: TimelineEventSource.APP,
      webhookEventId: buildWebhookEventId('app_teacher_join', sessionId, teacher.id, String(joinTime.getTime())),
    });

    await this.attendanceIntelligence.openAttendanceSegment({
      sessionId,
      userId: teacher.userId,
      userEmail: teacher.email,
      userType: 'teacher',
      joinTime,
      source: 'app',
    });

    if (teacher.userId) {
      await this.attendanceIntelligence.upsertParticipantSummary({
        sessionId,
        userId: teacher.userId,
        userType: 'teacher',
        participantId: teacher.id,
        userName: teacher.fullName,
        userEmail: teacher.email,
      });
    }
  }

  async handleMeetingStarted(
    zoomMeetingId: string,
    startTime: Date,
    meetingUUID?: string,
    hostId?: string,
  ) {
    const session = await this.resolveSessionForWebhook(zoomMeetingId, {
      meetingUUID,
      hostId,
      eventType: 'meeting.started',
    });
    if (!session) return;

    if (
      session.status === LiveSessionStatus.SCHEDULED ||
      session.status === LiveSessionStatus.LIVE
    ) {
      session.status = LiveSessionStatus.LIVE;
      session.actualStart = startTime;
      if (meetingUUID) session.zoomMeetingUUID = meetingUUID;
      await this.sessionRepository.save(session);
    }

    await this.seedEnrollmentOnStart(session.id);
  }

  /** Pre-create absent attendance rows for all enrolled students when a session goes live. */
  async seedEnrollmentOnStart(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher', 'schedule', 'schedule.scheduleStudents'],
    });
    if (!session) return;

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

  async handleParticipantJoined(
    zoomMeetingId: string,
    participant: ZoomParticipantPayload,
    meetingUUID?: string,
    hostId?: string,
  ) {
    const session = await this.resolveSessionForWebhook(zoomMeetingId, {
      meetingUUID,
      hostId,
      eventType: 'meeting.participant_joined',
    });
    if (!session) return;

    const sessionWithTeacher =
      session.teacher
        ? session
        : await this.sessionRepository.findOne({
            where: { id: session.id },
            relations: ['teacher'],
          });
    if (!sessionWithTeacher) return;

    const resolved = await this.resolveParticipant(participant, sessionWithTeacher);

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId: session.id,
      participantId: resolved.participantId,
      participantRole: resolved.role,
      zoomUserId: participant.zoomParticipantId,
      eventType: TimelineEventType.JOIN,
      timestamp: participant.joinTime,
      webhookEventId: buildWebhookEventId(
        'webhook_join',
        session.id,
        resolved.participantId,
        String(participant.joinTime.getTime()),
        zoomMeetingId,
      ),
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

  async handleParticipantLeft(
    zoomMeetingId: string,
    participant: ZoomParticipantPayload,
    meetingUUID?: string,
    hostId?: string,
  ) {
    const session = await this.resolveSessionForWebhook(zoomMeetingId, {
      meetingUUID,
      hostId,
      eventType: 'meeting.participant_left',
    });
    if (!session) return;

    const sessionWithTeacher =
      session.teacher
        ? session
        : await this.sessionRepository.findOne({
            where: { id: session.id },
            relations: ['teacher'],
          });
    if (!sessionWithTeacher) return;

    const resolved = await this.resolveParticipant(participant, sessionWithTeacher);
    const leaveTime = participant.leaveTime || new Date();

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId: session.id,
      participantId: resolved.participantId,
      participantRole: resolved.role,
      zoomUserId: participant.zoomParticipantId,
      eventType: TimelineEventType.LEAVE,
      timestamp: leaveTime,
      webhookEventId: buildWebhookEventId(
        'webhook_leave',
        session.id,
        resolved.participantId,
        String(leaveTime.getTime()),
        zoomMeetingId,
      ),
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

  async handleMeetingEnded(
    zoomMeetingId: string,
    endTime: Date,
    meetingUUID?: string,
    hostId?: string,
  ) {
    const session = await this.resolveSessionForWebhook(zoomMeetingId, {
      meetingUUID,
      hostId,
      eventType: 'meeting.ended',
    });
    if (!session) return;

    if (meetingUUID) session.zoomMeetingUUID = meetingUUID;
    await this.finalizeSessionAttendance(session.id, endTime, {
      completionReason: session.completionReason,
    });
  }

  /**
   * Shared end-of-session pipeline used by Zoom webhooks and teacher "End Session" API.
   */
  async finalizeSessionAttendance(
    sessionId: string,
    endTime: Date,
    options?: { completionReason?: string; skipNotifications?: boolean },
  ): Promise<LiveSession | null> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher', 'schedule'],
    });
    if (!session) return null;

    if (session.status !== LiveSessionStatus.COMPLETED) {
      session.status = LiveSessionStatus.COMPLETED;
      session.actualEnd = endTime;
      session.completedAt = endTime;
      session.teacherLeaveTime = session.teacherLeaveTime || endTime;
      if (options?.completionReason) session.completionReason = options.completionReason;

      if (session.actualStart) {
        session.durationMinutes = Math.floor(
          (endTime.getTime() - session.actualStart.getTime()) / 60000,
        );
      }
    }

    await this.sessionRepository.save(session);
    await this.attendanceIntelligence.closeAllOpenSegments(session.id, endTime);

    try {
      await this.attendanceIntelligence.recalculateSession(session.id, endTime);
      await this.attendanceIntelligence.healStaleSummariesForSessions([session.id]);
    } catch (err) {
      this.logger.error(`Failed to recalculate session ${session.id}`, err);
    }

    if (session.zoomMeetingUUID) {
      this.reconciliationService.scheduleReconciliation(session.id, session.zoomMeetingUUID);
    }

    await this.syncStudentAttendanceRates(session.id);

    if (!options?.skipNotifications) {
      const attendances = await this.attendanceRepository.find({
        where: { sessionId: session.id },
        relations: ['student'],
      });
      const studentUserIds = attendances
        .map((a) => a.student?.userId)
        .filter((id): id is string => !!id);

      if (studentUserIds.length > 0) {
        try {
          const qiratManagers = await this.userRepository.find({
            where: { role: UserRole.QIRAT_MANAGER, isActive: true },
          });
          const recipients = [...studentUserIds, ...qiratManagers.map((u) => u.id)];
          await this.notificationsService.sendCustomNotifications(
            recipients,
            'Class Completed',
            `Your class has ended. Duration: ${session.durationMinutes || 'N/A'} minutes.`,
            { sessionId: session.id, durationMinutes: session.durationMinutes },
          );
        } catch (err) {
          this.logger.error('Failed to send completion notification', err);
        }
      }
    }

    return session;
  }

  private async syncStudentAttendanceRates(sessionId: string): Promise<void> {
    const attendances = await this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student'],
    });

    const studentIds = [...new Set(attendances.map((a) => a.studentId).filter(Boolean))];
    for (const studentId of studentIds) {
      const allAttendances = await this.attendanceRepository.find({ where: { studentId } });
      if (!allAttendances.length) continue;

      const presentCount = allAttendances.filter(
        (a) =>
          a.attendanceStatus === AttendanceStatus.PRESENT ||
          a.attendanceStatus === AttendanceStatus.LATE ||
          a.attendanceStatus === AttendanceStatus.PARTIAL,
      ).length;
      const rate = Math.round((presentCount / allAttendances.length) * 100);
      await this.studentRepository.update(studentId, { attendanceRate: rate });
    }
  }

  async getAdminSessionsOverview(limit = 100) {
    const sessions = await this.sessionRepository.find({
      where: { status: LiveSessionStatus.COMPLETED },
      relations: ['teacher', 'schedule'],
      order: { scheduledStart: 'DESC' },
      take: limit,
    });

    if (!sessions.length) return [];

    const sessionIds = sessions.map((s) => s.id);
    await this.attendanceIntelligence.healStaleSummariesForSessions(sessionIds);

    const summaries = await this.summaryRepository.find({
      where: { sessionId: In(sessionIds), userType: 'student' },
    });

    const bySession = new Map<string, SessionParticipantSummary[]>();
    for (const summary of summaries) {
      const list = bySession.get(summary.sessionId) || [];
      list.push(summary);
      bySession.set(summary.sessionId, list);
    }

    return sessions.map((session) => {
      const records = bySession.get(session.id) || [];
      const present = records.filter(
        (r) => r.status === 'present' || (r.totalDurationSeconds > 0 && r.status !== 'absent'),
      ).length;
      const late = records.filter((r) => r.status === 'late').length;
      const leftEarly = records.filter((r) => r.status === 'left_early').length;
      const partial = records.filter((r) => r.status === 'partial').length;
      const absent = records.filter(
        (r) => r.status === 'absent' && r.totalDurationSeconds === 0 && !r.firstJoinTime,
      ).length;

      return {
        id: session.id,
        sessionId: session.id,
        classTitle: session.schedule?.className || session.metadata?.className || 'Live Session',
        subject: session.schedule?.className || 'Quran Class',
        quranLevel: session.metadata?.level,
        status: session.status,
        sessionDate: session.scheduledStart,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        actualStart: session.actualStart,
        actualEnd: session.actualEnd,
        durationMinutes: session.durationMinutes,
        teacher: session.teacher
          ? { id: session.teacher.id, fullName: session.teacher.fullName }
          : null,
        totalStudentsPresent: present,
        totalStudentsLate: late,
        totalStudentsAbsent: absent,
        totalStudentsLeftEarly: leftEarly,
        totalStudentsPartial: partial,
        attendanceRate:
          records.length > 0
            ? Math.round(
                ((present + late + leftEarly + partial) / records.length) * 100,
              )
            : 0,
        attendances: records.map((r) => ({
          studentId: r.participantId,
          student: { fullName: r.userName, email: r.userEmail },
          attendanceStatus: r.status?.toUpperCase(),
          joinTime: r.firstJoinTime,
          leaveTime: r.lastLeaveTime,
          duration: Math.round(r.totalDurationSeconds / 60),
          isReconciled: r.isReconciled,
        })),
        isLiveSession: true,
      };
    });
  }

  resolvePeriodRange(period: 'day' | 'week' | 'month' = 'month') {
    const endDate = new Date();
    let startDate: Date;

    if (period === 'day') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate, period };
  }

  private aggregateSummaryStats(records: SessionParticipantSummary[]) {
    const joined = records.filter(
      (r) => r.firstJoinTime != null || r.totalDurationSeconds > 0,
    );
    const present = records.filter((r) => r.status === 'present').length;
    const late = records.filter((r) => r.status === 'late').length;
    const leftEarly = records.filter((r) => r.status === 'left_early').length;
    const partial = records.filter((r) => r.status === 'partial').length;
    const absent = records.filter(
      (r) =>
        r.status === 'absent' &&
        !r.firstJoinTime &&
        r.totalDurationSeconds === 0,
    ).length;
    const total = records.length;
    const attendanceRate =
      total > 0 ? Math.round((joined.length / total) * 100) : 0;

    return {
      present: present + partial + late + leftEarly,
      late,
      leftEarly,
      partial,
      absent,
      total,
      attendanceRate,
      attended: joined.length,
    };
  }

  async getAdminTeacherSummaries(period: 'day' | 'week' | 'month' = 'month') {
    const { startDate, endDate } = this.resolvePeriodRange(period);

    const teachers = await this.teacherRepository.find({
      where: { status: 'active' as any },
      order: { fullName: 'ASC' },
    });

    const sessions = await this.sessionRepository.find({
      where: {
        status: LiveSessionStatus.COMPLETED,
        scheduledStart: Between(startDate, endDate),
      },
      relations: ['teacher', 'schedule'],
    });

    const sessionIds = sessions.map((s) => s.id);
    await this.attendanceIntelligence.healStaleSummariesForSessions(sessionIds);

    const summaries =
      sessionIds.length > 0
        ? await this.summaryRepository.find({
            where: { sessionId: In(sessionIds), userType: 'student' },
          })
        : [];

    const summariesBySession = new Map<string, SessionParticipantSummary[]>();
    for (const summary of summaries) {
      const list = summariesBySession.get(summary.sessionId) || [];
      list.push(summary);
      summariesBySession.set(summary.sessionId, list);
    }

    const sessionsByTeacher = new Map<string, LiveSession[]>();
    for (const session of sessions) {
      if (!session.teacherId) continue;
      const list = sessionsByTeacher.get(session.teacherId) || [];
      list.push(session);
      sessionsByTeacher.set(session.teacherId, list);
    }

    const teacherIdsWithSessions = new Set(sessions.map((s) => s.teacherId).filter(Boolean));
    const teachersToShow =
      teachers.length > 0
        ? teachers
        : teacherIdsWithSessions.size > 0
          ? await this.teacherRepository.find({
              where: { id: In([...teacherIdsWithSessions]) },
            })
          : [];

    const seen = new Set<string>();
    const result = [];

    for (const teacher of teachersToShow) {
      if (seen.has(teacher.id)) continue;
      seen.add(teacher.id);

      const teacherSessions = sessionsByTeacher.get(teacher.id) || [];
      const teacherRecords: SessionParticipantSummary[] = [];
      for (const session of teacherSessions) {
        const recs = summariesBySession.get(session.id) || [];
        teacherRecords.push(...recs);
      }

      const stats = this.aggregateSummaryStats(teacherRecords);

      result.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        email: teacher.email,
        sessionCount: teacherSessions.length,
        totalStudents: stats.total,
        present: stats.present,
        late: stats.late,
        absent: stats.absent,
        leftEarly: stats.leftEarly,
        partial: stats.partial,
        attendanceRate: stats.attendanceRate,
        period,
        startDate,
        endDate,
      });
    }

    // Teachers with sessions but not in active list
    for (const teacherId of teacherIdsWithSessions) {
      if (seen.has(teacherId)) continue;
      const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
      if (!teacher) continue;

      const teacherSessions = sessionsByTeacher.get(teacherId) || [];
      const teacherRecords: SessionParticipantSummary[] = [];
      for (const session of teacherSessions) {
        teacherRecords.push(...(summariesBySession.get(session.id) || []));
      }
      const stats = this.aggregateSummaryStats(teacherRecords);

      result.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        email: teacher.email,
        sessionCount: teacherSessions.length,
        totalStudents: stats.total,
        present: stats.present,
        late: stats.late,
        absent: stats.absent,
        leftEarly: stats.leftEarly,
        partial: stats.partial,
        attendanceRate: stats.attendanceRate,
        period,
        startDate,
        endDate,
      });
    }

    return result.sort((a, b) => b.sessionCount - a.sessionCount || a.teacherName.localeCompare(b.teacherName));
  }

  async getAdminTeacherDetail(
    teacherId: string,
    period: 'day' | 'week' | 'month' = 'month',
  ) {
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const { startDate, endDate } = this.resolvePeriodRange(period);

    const sessions = await this.sessionRepository.find({
      where: {
        teacherId,
        status: LiveSessionStatus.COMPLETED,
        scheduledStart: Between(startDate, endDate),
      },
      relations: ['schedule'],
      order: { scheduledStart: 'DESC' },
    });

    const sessionIds = sessions.map((s) => s.id);
    await this.attendanceIntelligence.healStaleSummariesForSessions(sessionIds);

    const summaries =
      sessionIds.length > 0
        ? await this.summaryRepository.find({
            where: { sessionId: In(sessionIds), userType: 'student' },
          })
        : [];

    const summariesBySession = new Map<string, SessionParticipantSummary[]>();
    for (const summary of summaries) {
      const list = summariesBySession.get(summary.sessionId) || [];
      list.push(summary);
      summariesBySession.set(summary.sessionId, list);
    }

    const overallStats = this.aggregateSummaryStats(summaries);

    const sessionRows = sessions.map((session) => {
      const records = summariesBySession.get(session.id) || [];
      const stats = this.aggregateSummaryStats(records);
      return {
        sessionId: session.id,
        classTitle: session.schedule?.className || session.metadata?.className || 'Live Session',
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        actualStart: session.actualStart,
        actualEnd: session.actualEnd,
        durationMinutes: session.durationMinutes,
        totalStudentsPresent: stats.present,
        totalStudentsLate: stats.late,
        totalStudentsAbsent: stats.absent,
        totalStudentsLeftEarly: stats.leftEarly,
        totalStudentsPartial: stats.partial,
        attendanceRate: stats.attendanceRate,
      };
    });

    const records = await this.getAdminAttendanceReport({
      teacherId,
      startDate,
      endDate,
    });

    return {
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
      },
      period,
      startDate,
      endDate,
      summary: {
        sessionCount: sessions.length,
        totalStudents: overallStats.total,
        present: overallStats.present,
        late: overallStats.late,
        absent: overallStats.absent,
        leftEarly: overallStats.leftEarly,
        partial: overallStats.partial,
        attendanceRate: overallStats.attendanceRate,
      },
      sessions: sessionRows,
      records,
    };
  }

  async getSessionAttendanceSummary(sessionId: string) {
    await this.attendanceIntelligence.healStaleSummariesForSessions([sessionId]);

    const records = await this.summaryRepository.find({
      where: { sessionId, userType: 'student' },
      order: { userName: 'ASC' },
    });

    // Fallback: merge session_attendances when summaries still lack join times
    const attendances = await this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student'],
    });

    const summaryByUserId = new Map(records.map((r) => [r.userId, r]));
    for (const att of attendances) {
      if (!att.student?.userId) continue;
      const existing = summaryByUserId.get(att.student.userId);
      const hasJoin = att.joinTime || att.firstJoinTime;
      if (hasJoin && (!existing || !existing.firstJoinTime)) {
        await this.attendanceIntelligence.upsertParticipantSummary({
          sessionId,
          userId: att.student.userId,
          userType: 'student',
          participantId: att.studentId,
          userName: att.student.fullName,
          userEmail: att.student.email,
        });
      }
    }

    const refreshedRecords = await this.summaryRepository.find({
      where: { sessionId, userType: 'student' },
      order: { userName: 'ASC' },
    });

    const total = refreshedRecords.length;
    const present = refreshedRecords.filter((r) => r.status === 'present').length;
    const late = refreshedRecords.filter((r) => r.status === 'late').length;
    const leftEarly = refreshedRecords.filter((r) => r.status === 'left_early').length;
    const partial = refreshedRecords.filter((r) => r.status === 'partial').length;
    const absent = refreshedRecords.filter(
      (r) => r.status === 'absent' && !r.firstJoinTime && r.totalDurationSeconds === 0,
    ).length;

    return {
      total,
      present,
      late,
      leftEarly,
      partial,
      absent,
      attendanceRate:
        total > 0
          ? Math.round(
              ((present + late + leftEarly + partial) / total) * 100,
            )
          : 0,
      records: refreshedRecords.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        status: r.status,
        joinTime: r.firstJoinTime,
        leaveTime: r.lastLeaveTime,
        firstJoinTime: r.firstJoinTime,
        lastLeaveTime: r.lastLeaveTime,
        durationMinutes: Math.round(r.totalDurationSeconds / 60),
        totalDurationSeconds: r.totalDurationSeconds,
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
    const summaryWhere: Record<string, unknown> = {
      sessionId: In(sessionIds),
      userType: 'student',
    };
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

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
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
    const participantName = this.normalizeName(participant.name || '');

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

    const enrolledIds = await this.getEnrolledStudentIds(session);
    if (enrolledIds.length > 0) {
      const enrolledStudents = await this.studentRepository.find({
        where: { id: In(enrolledIds) },
      });

      if (participantName) {
        const byName = enrolledStudents.find(
          (s) => this.normalizeName(s.fullName) === participantName,
        );
        if (byName?.userId) {
          return { participantId: byName.id, userId: byName.userId, role: 'student' };
        }

        const fuzzy = enrolledStudents.find((s) => {
          const full = this.normalizeName(s.fullName);
          return full.includes(participantName) || participantName.includes(full);
        });
        if (fuzzy?.userId) {
          return { participantId: fuzzy.id, userId: fuzzy.userId, role: 'student' };
        }
      }

      if (enrolledStudents.length === 1 && enrolledStudents[0].userId) {
        const only = enrolledStudents[0];
        return { participantId: only.id, userId: only.userId, role: 'student' };
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

    this.logger.warn(
      `Unresolved participant for session ${session.id}: email=${email || 'none'} name=${participant.name || 'none'}`,
    );

    return {
      participantId: participant.zoomParticipantId || 'unknown',
      userId: participant.userId || participant.zoomParticipantId || 'unknown',
      role: 'student',
    };
  }
}
