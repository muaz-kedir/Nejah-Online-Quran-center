import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import {
  SessionAttendance,
  AttendanceThresholds,
  DEFAULT_ATTENDANCE_THRESHOLDS,
} from './entities/session-attendance.entity';
import {
  ParticipantTimelineEvent,
  TimelineEventType,
  TimelineEventSource,
} from './entities/participant-timeline-event.entity';
import { LiveSession } from './entities/live-session.entity';
import { AttendanceSegment } from './entities/attendance-segment.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { SessionParticipantSummary } from './entities/session-participant-summary.entity';
import {
  AttendanceStatus,
  attendanceStatusToApi,
} from './enums/live-session-status.enum';
import { buildWebhookEventId } from './webhook-event-id.util';

export interface ParticipantSegment {
  joinTime: Date;
  leaveTime: Date | null;
  durationMs: number;
}

export interface TeachingOverlapResult {
  teacherTotalMs: number;
  studentTotalMs: number;
  overlapMs: number;
  overlapMinutes: number;
  segments: Array<{
    start: Date;
    end: Date;
    durationMs: number;
  }>;
  teacherSegments: ParticipantSegment[];
  studentSegments: ParticipantSegment[];
}

export interface AttendanceCalculationResult {
  firstJoinTime: Date | null;
  lastLeaveTime: Date | null;
  totalConnectedTimeMs: number;
  longestContinuousPresenceMs: number;
  rejoinCount: number;
  segments: ParticipantSegment[];
  durationMinutes: number;
  attendanceStatus: AttendanceStatus;
}

@Injectable()
export class AttendanceIntelligenceService {
  private readonly logger = new Logger(AttendanceIntelligenceService.name);

  constructor(
    @InjectRepository(ParticipantTimelineEvent)
    private readonly timelineRepository: Repository<ParticipantTimelineEvent>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(AttendanceSegment)
    private readonly segmentRepository: Repository<AttendanceSegment>,
    @InjectRepository(SessionParticipantSummary)
    private readonly summaryRepository: Repository<SessionParticipantSummary>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {}

  async appendTimelineEvent(event: {
    sessionId: string;
    participantId: string;
    participantRole: 'teacher' | 'student';
    zoomUserId?: string;
    eventType: TimelineEventType;
    timestamp: Date;
    device?: string;
    clientType?: string;
    rawPayload?: any;
    webhookEventId?: string;
    source?: TimelineEventSource;
  }): Promise<ParticipantTimelineEvent> {
    const entity = this.timelineRepository.create({
      sessionId: event.sessionId,
      participantId: event.participantId,
      participantRole: event.participantRole,
      zoomUserId: event.zoomUserId || null,
      eventType: event.eventType,
      timestamp: event.timestamp,
      device: event.device || null,
      clientType: event.clientType || null,
      rawPayload: event.rawPayload || null,
      webhookEventId: event.webhookEventId
        ? event.webhookEventId.length > 64
          ? buildWebhookEventId('legacy', event.webhookEventId)
          : event.webhookEventId
        : null,
      source: event.source || TimelineEventSource.WEBHOOK,
    });
    return this.timelineRepository.save(entity);
  }

  async getTimelineForSession(sessionId: string): Promise<ParticipantTimelineEvent[]> {
    return this.timelineRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });
  }

  async getTimelineForParticipant(
    sessionId: string,
    participantId: string,
  ): Promise<ParticipantTimelineEvent[]> {
    return this.timelineRepository.find({
      where: { sessionId, participantId },
      order: { timestamp: 'ASC' },
    });
  }

  calculateAttendanceFromSegments(
    segments: ParticipantSegment[],
    session: LiveSession,
    thresholds: AttendanceThresholds = DEFAULT_ATTENDANCE_THRESHOLDS,
  ): AttendanceCalculationResult {
    if (segments.length === 0) {
      return {
        firstJoinTime: null,
        lastLeaveTime: null,
        totalConnectedTimeMs: 0,
        longestContinuousPresenceMs: 0,
        rejoinCount: 0,
        segments: [],
        durationMinutes: 0,
        attendanceStatus: AttendanceStatus.ABSENT,
      };
    }

    const sorted = [...segments].sort(
      (a, b) => a.joinTime.getTime() - b.joinTime.getTime(),
    );

    const firstJoinTime = sorted[0].joinTime;
    let lastLeaveTime: Date | null = null;
    let totalConnectedTimeMs = 0;
    let longestContinuousPresenceMs = 0;
    const rejoinCount = sorted.length - 1;

    for (const seg of sorted) {
      const endTime = seg.leaveTime || seg.joinTime;
      const actualDuration = endTime.getTime() - seg.joinTime.getTime();
      totalConnectedTimeMs += actualDuration;
      if (actualDuration > longestContinuousPresenceMs) {
        longestContinuousPresenceMs = actualDuration;
      }
      if (!lastLeaveTime || (seg.leaveTime && seg.leaveTime > lastLeaveTime)) {
        lastLeaveTime = seg.leaveTime;
      }
    }

    const durationMinutes = Math.round(totalConnectedTimeMs / 60000);
    const scheduledMinutes = session.scheduledEnd && session.scheduledStart
      ? Math.max(1, Math.round(
          (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000,
        ))
      : 60;

    const scheduledSeconds = scheduledMinutes * 60;
    const ratio = scheduledSeconds > 0 ? totalConnectedTimeMs / (scheduledSeconds * 1000) : 0;
    const lateThresholdMs = 5 * 60 * 1000;
    const leftEarlyThresholdMs = 10 * 60 * 1000;

    let attendanceStatus: AttendanceStatus;
    if (!firstJoinTime || totalConnectedTimeMs === 0) {
      attendanceStatus = AttendanceStatus.ABSENT;
    } else if (ratio < thresholds.lateRatio) {
      // Any verified join counts as at least partial attendance
      attendanceStatus = AttendanceStatus.PARTIAL;
    } else if (ratio < thresholds.presentRatio) {
      attendanceStatus = AttendanceStatus.PARTIAL;
    } else {
      const joinedLate =
        firstJoinTime.getTime() - session.scheduledStart.getTime() > lateThresholdMs;
      const leftEarly =
        lastLeaveTime &&
        session.scheduledEnd &&
        session.scheduledEnd.getTime() - lastLeaveTime.getTime() > leftEarlyThresholdMs;

      if (joinedLate) {
        attendanceStatus = AttendanceStatus.LATE;
      } else if (leftEarly) {
        attendanceStatus = AttendanceStatus.LEFT_EARLY;
      } else {
        attendanceStatus = AttendanceStatus.PRESENT;
      }
    }

    return {
      firstJoinTime,
      lastLeaveTime,
      totalConnectedTimeMs,
      longestContinuousPresenceMs,
      rejoinCount,
      segments: sorted,
      durationMinutes,
      attendanceStatus,
    };
  }

  async calculateAndUpdateAttendance(
    sessionId: string,
    participantId: string,
    thresholds?: AttendanceThresholds,
  ): Promise<SessionAttendance> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const timelineEvents = await this.getTimelineForParticipant(
      sessionId,
      participantId,
    );

    const segments = this.buildSegmentsFromTimeline(timelineEvents);
    const result = this.calculateAttendanceFromSegments(segments, session, thresholds);

    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId: participantId },
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        sessionId,
        studentId: participantId,
      });
    }

    attendance.joinTime = result.firstJoinTime || attendance.joinTime;
    attendance.leaveTime = result.lastLeaveTime || attendance.leaveTime;
    attendance.duration = result.durationMinutes;
    attendance.totalConnectedTimeMs = result.totalConnectedTimeMs;
    attendance.longestContinuousPresenceMs = result.longestContinuousPresenceMs;
    attendance.rejoinCount = result.rejoinCount;
    attendance.firstJoinTime = result.firstJoinTime;
    attendance.lastLeaveTime = result.lastLeaveTime;

    if (
      (attendance.joinTime || attendance.firstJoinTime) &&
      result.attendanceStatus === AttendanceStatus.ABSENT
    ) {
      attendance.attendanceStatus = AttendanceStatus.PARTIAL;
    } else {
      attendance.attendanceStatus = result.attendanceStatus;
    }

    const saved = await this.attendanceRepository.save(attendance);
    return saved;
  }

  async openAttendanceSegment(params: {
    sessionId: string;
    userId: string;
    userEmail: string;
    userType: string;
    zoomParticipantId?: string;
    joinTime: Date;
    source?: string;
  }): Promise<AttendanceSegment> {
    const segment = this.segmentRepository.create({
      sessionId: params.sessionId,
      userId: params.userId,
      userEmail: params.userEmail.toLowerCase(),
      userType: params.userType,
      zoomParticipantId: params.zoomParticipantId || null,
      joinTime: params.joinTime,
      source: params.source || 'webhook',
    });
    return this.segmentRepository.save(segment);
  }

  async closeOpenSegment(
    sessionId: string,
    userEmail: string,
    leaveTime: Date,
    durationSeconds?: number,
  ): Promise<AttendanceSegment | null> {
    const email = userEmail.toLowerCase();
    const openSegment = await this.segmentRepository.findOne({
      where: { sessionId, userEmail: email, leaveTime: IsNull() },
      order: { joinTime: 'DESC' },
    });

    if (!openSegment) return null;

    const duration =
      durationSeconds ??
      Math.max(0, Math.round((leaveTime.getTime() - openSegment.joinTime.getTime()) / 1000));

    openSegment.leaveTime = leaveTime;
    openSegment.durationSeconds = duration;
    return this.segmentRepository.save(openSegment);
  }

  async closeAllOpenSegments(sessionId: string, leaveTime: Date): Promise<void> {
    const openSegments = await this.segmentRepository.find({
      where: { sessionId, leaveTime: IsNull() },
    });

    for (const segment of openSegments) {
      segment.leaveTime = leaveTime;
      segment.durationSeconds = Math.max(
        0,
        Math.round((leaveTime.getTime() - segment.joinTime.getTime()) / 1000),
      );
    }

    if (openSegments.length > 0) {
      await this.segmentRepository.save(openSegments);
    }
  }

  async replaceWebhookSegmentsFromTimeline(sessionId: string): Promise<void> {
    await this.segmentRepository.delete({ sessionId, source: 'webhook' });

    const events = await this.getTimelineForSession(sessionId);
    const webhookEvents = events.filter(
      (e) =>
        e.source === TimelineEventSource.WEBHOOK ||
        e.source === TimelineEventSource.APP ||
        !e.source,
    );

    const byParticipant = new Map<string, ParticipantTimelineEvent[]>();
    for (const event of webhookEvents) {
      const key = `${event.participantRole}:${event.participantId}`;
      const list = byParticipant.get(key) || [];
      list.push(event);
      byParticipant.set(key, list);
    }

    for (const [, participantEvents] of byParticipant) {
      const segments = this.buildSegmentsFromTimeline(participantEvents);
      const first = participantEvents[0];
      for (const seg of segments) {
        if (!seg.joinTime) continue;
        await this.segmentRepository.save(
          this.segmentRepository.create({
            sessionId,
            userId: first.participantId,
            userEmail: '',
            userType: first.participantRole,
            joinTime: seg.joinTime,
            leaveTime: seg.leaveTime,
            durationSeconds: Math.round(seg.durationMs / 1000),
            source: 'webhook',
          }),
        );
      }
    }
  }

  async rebuildReportSegments(
    sessionId: string,
    rows: Array<{
      userId: string;
      userEmail: string;
      userType: string;
      zoomParticipantId?: string;
      joinTime: Date | null;
      leaveTime: Date | null;
      durationSeconds: number;
    }>,
  ): Promise<void> {
    await this.segmentRepository.delete({ sessionId, source: 'report' });

    for (const row of rows) {
      if (!row.joinTime) continue;
      await this.segmentRepository.save(
        this.segmentRepository.create({
          sessionId,
          userId: row.userId,
          userEmail: row.userEmail.toLowerCase(),
          userType: row.userType,
          zoomParticipantId: row.zoomParticipantId || null,
          joinTime: row.joinTime,
          leaveTime: row.leaveTime,
          durationSeconds: row.durationSeconds,
          source: 'report',
        }),
      );
    }
  }

  async upsertParticipantSummary(params: {
    sessionId: string;
    userId: string;
    userType: string;
    participantId?: string;
    userName?: string;
    userEmail?: string;
    isReconciled?: boolean;
    sessionEndTime?: Date;
  }): Promise<SessionParticipantSummary> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: params.sessionId },
    });
    if (!session) {
      throw new Error(`Session ${params.sessionId} not found`);
    }

    const email = params.userEmail?.toLowerCase() || '';
    const dbSegments = email
      ? await this.segmentRepository.find({
          where: { sessionId: params.sessionId, userEmail: email },
        })
      : await this.segmentRepository.find({
          where: { sessionId: params.sessionId, userId: params.userId },
        });

    let timelineSegments: ParticipantSegment[] = [];
    let timelineResult: AttendanceCalculationResult | null = null;

    if (params.participantId) {
      const timelineEvents = await this.getTimelineForParticipant(
        params.sessionId,
        params.participantId,
      );
      timelineSegments = this.buildSegmentsFromTimeline(
        timelineEvents,
        params.sessionEndTime,
      );
      if (timelineSegments.length > 0) {
        timelineResult = this.calculateAttendanceFromSegments(timelineSegments, session);
      }
    }

    let firstJoinTime: Date | null = null;
    let lastLeaveTime: Date | null = null;
    let totalDurationSeconds = 0;
    let attendanceStatus = AttendanceStatus.ABSENT;

    if (dbSegments.length > 0) {
      totalDurationSeconds = dbSegments.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
      const joinTimes = dbSegments.map((s) => s.joinTime?.getTime()).filter(Boolean) as number[];
      const leaveTimes = dbSegments.map((s) => s.leaveTime?.getTime()).filter(Boolean) as number[];
      firstJoinTime = joinTimes.length ? new Date(Math.min(...joinTimes)) : null;
      lastLeaveTime = leaveTimes.length ? new Date(Math.max(...leaveTimes)) : null;
    }

    if (timelineSegments.length > 0) {
      const tlJoin = timelineSegments[0].joinTime;
      const tlLeave = timelineSegments.reduce(
        (max, s) => (s.leaveTime && (!max || s.leaveTime > max) ? s.leaveTime : max),
        null as Date | null,
      );
      const tlDuration = Math.round(
        timelineSegments.reduce((sum, s) => sum + s.durationMs, 0) / 1000,
      );

      if (!firstJoinTime || tlJoin < firstJoinTime) firstJoinTime = tlJoin;
      if (tlLeave && (!lastLeaveTime || tlLeave > lastLeaveTime)) lastLeaveTime = tlLeave;
      if (tlDuration > totalDurationSeconds) totalDurationSeconds = tlDuration;
      if (timelineResult) attendanceStatus = timelineResult.attendanceStatus;
    }

    if (params.userType === 'student' && params.participantId) {
      const attendance = await this.attendanceRepository.findOne({
        where: { sessionId: params.sessionId, studentId: params.participantId },
      });
      if (attendance) {
        if (!firstJoinTime && attendance.firstJoinTime) firstJoinTime = attendance.firstJoinTime;
        if (!firstJoinTime && attendance.joinTime) firstJoinTime = attendance.joinTime;
        if (!lastLeaveTime && attendance.lastLeaveTime) lastLeaveTime = attendance.lastLeaveTime;
        if (!lastLeaveTime && attendance.leaveTime) lastLeaveTime = attendance.leaveTime;

        const attDurationSec = attendance.totalConnectedTimeMs
          ? Math.round(Number(attendance.totalConnectedTimeMs) / 1000)
          : (attendance.duration || 0) * 60;
        if (attDurationSec > totalDurationSeconds) totalDurationSeconds = attDurationSec;

        if (attendance.attendanceStatus && attendance.attendanceStatus !== AttendanceStatus.ABSENT) {
          attendanceStatus = attendance.attendanceStatus;
        }
      }
    }

    if (
      attendanceStatus === AttendanceStatus.ABSENT &&
      totalDurationSeconds > 0 &&
      firstJoinTime
    ) {
      const pseudo: ParticipantSegment[] = [
        {
          joinTime: firstJoinTime,
          leaveTime: lastLeaveTime,
          durationMs: totalDurationSeconds * 1000,
        },
      ];
      attendanceStatus = this.calculateAttendanceFromSegments(pseudo, session).attendanceStatus;
    }

    let summary = await this.summaryRepository.findOne({
      where: { sessionId: params.sessionId, userId: params.userId },
    });

    if (!summary) {
      summary = this.summaryRepository.create({
        sessionId: params.sessionId,
        userId: params.userId,
        userType: params.userType,
      });
    }

    summary.participantId = params.participantId || summary.participantId;
    summary.userName = params.userName || summary.userName;
    summary.userEmail = email || summary.userEmail;
    summary.firstJoinTime = firstJoinTime;
    summary.lastLeaveTime = lastLeaveTime;
    summary.totalDurationSeconds = totalDurationSeconds;
    summary.status = attendanceStatusToApi(attendanceStatus);
    if (params.isReconciled !== undefined) {
      summary.isReconciled = params.isReconciled;
    }

    return this.summaryRepository.save(summary);
  }

  async syncSummariesForSession(sessionId: string, isReconciled = false): Promise<void> {
    const summaries = await this.summaryRepository.find({ where: { sessionId } });
    for (const summary of summaries) {
      await this.upsertParticipantSummary({
        sessionId,
        userId: summary.userId,
        userType: summary.userType,
        participantId: summary.participantId,
        userName: summary.userName,
        userEmail: summary.userEmail,
        isReconciled,
      });
    }
  }

  async upsertAbsentSummary(params: {
    sessionId: string;
    userId: string;
    userType: string;
    participantId?: string;
    userName?: string;
    userEmail?: string;
  }): Promise<SessionParticipantSummary> {
    let summary = await this.summaryRepository.findOne({
      where: { sessionId: params.sessionId, userId: params.userId },
    });

    if (!summary) {
      summary = this.summaryRepository.create({
        sessionId: params.sessionId,
        userId: params.userId,
        userType: params.userType,
        participantId: params.participantId,
        userName: params.userName,
        userEmail: params.userEmail?.toLowerCase(),
        status: 'absent',
        totalDurationSeconds: 0,
      });
    }

    return this.summaryRepository.save(summary);
  }

  async calculateTeacherOverlap(
    sessionId: string,
  ): Promise<TeachingOverlapResult> {
    const teacherEvents = await this.timelineRepository.find({
      where: { sessionId, participantRole: 'teacher' },
      order: { timestamp: 'ASC' },
    });
    const studentEvents = await this.timelineRepository.find({
      where: { sessionId, participantRole: 'student' },
      order: { timestamp: 'ASC' },
    });

    const teacherSegments = this.buildSegmentsFromTimeline(teacherEvents);
    const studentSegments = this.buildSegmentsFromTimeline(studentEvents);

    const teacherTotalMs = teacherSegments.reduce(
      (sum, s) => sum + s.durationMs,
      0,
    );
    const studentTotalMs = studentSegments.reduce(
      (sum, s) => sum + s.durationMs,
      0,
    );

    const overlapSegments: TeachingOverlapResult['segments'] = [];

    for (const tSeg of teacherSegments) {
      const tStart = tSeg.joinTime.getTime();
      const tEnd = (tSeg.leaveTime || tSeg.joinTime).getTime();

      for (const sSeg of studentSegments) {
        const sStart = sSeg.joinTime.getTime();
        const sEnd = (sSeg.leaveTime || sSeg.joinTime).getTime();

        const overlapStart = Math.max(tStart, sStart);
        const overlapEnd = Math.min(tEnd, sEnd);
        const overlapMs = overlapEnd - overlapStart;

        if (overlapMs > 0) {
          overlapSegments.push({
            start: new Date(overlapStart),
            end: new Date(overlapEnd),
            durationMs: overlapMs,
          });
        }
      }
    }

    const overlapMs = overlapSegments.reduce((sum, s) => sum + s.durationMs, 0);

    return {
      teacherTotalMs,
      studentTotalMs,
      overlapMs,
      overlapMinutes: Math.round(overlapMs / 60000),
      segments: overlapSegments,
      teacherSegments,
      studentSegments,
    };
  }

  async closeOpenTimelineJoins(sessionId: string, endTime: Date): Promise<void> {
    const events = await this.getTimelineForSession(sessionId);
    const byParticipant = new Map<string, ParticipantTimelineEvent[]>();

    for (const event of events) {
      const list = byParticipant.get(event.participantId) || [];
      list.push(event);
      byParticipant.set(event.participantId, list);
    }

    for (const [participantId, participantEvents] of byParticipant) {
      const sorted = [...participantEvents].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const lastEvent = sorted[sorted.length - 1];
      if (lastEvent?.eventType === TimelineEventType.JOIN) {
        await this.appendTimelineEvent({
          sessionId,
          participantId,
          participantRole: lastEvent.participantRole,
          zoomUserId: lastEvent.zoomUserId || undefined,
          eventType: TimelineEventType.LEAVE,
          timestamp: endTime,
          source: TimelineEventSource.APP,
          webhookEventId: buildWebhookEventId('session_end', sessionId, participantId),
        });
      }
    }

    await this.closeAllOpenSegments(sessionId, endTime);
    await this.replaceWebhookSegmentsFromTimeline(sessionId);
  }

  async healStaleSummariesForSessions(sessionIds: string[]): Promise<void> {
    if (!sessionIds.length) return;

    const attendances = await this.attendanceRepository.find({
      where: { sessionId: In(sessionIds) },
      relations: ['student'],
    });

    for (const attendance of attendances) {
      if (!attendance.student?.userId) continue;
      if (!attendance.joinTime && !attendance.firstJoinTime) continue;

      const summary = await this.summaryRepository.findOne({
        where: { sessionId: attendance.sessionId, userId: attendance.student.userId },
      });

      const needsHeal =
        !summary ||
        summary.totalDurationSeconds === 0 ||
        (summary.status === 'absent' && (attendance.joinTime || attendance.firstJoinTime));

      if (needsHeal) {
        await this.upsertParticipantSummary({
          sessionId: attendance.sessionId,
          userId: attendance.student.userId,
          userType: 'student',
          participantId: attendance.studentId,
          userName: attendance.student.fullName,
          userEmail: attendance.student.email,
        });
      }
    }
  }

  async recalculateSession(sessionId: string, endTime?: Date): Promise<void> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['attendances', 'teacher'],
    });
    if (!session) return;

    if (endTime) {
      await this.closeOpenTimelineJoins(sessionId, endTime);
    }

    const participantIds = new Set(await this.getDistinctParticipants(sessionId));

    const allAttendances = await this.attendanceRepository.find({ where: { sessionId } });
    for (const att of allAttendances) {
      participantIds.add(att.studentId);
    }

    for (const participantId of participantIds) {
      await this.calculateAndUpdateAttendance(sessionId, participantId);
      const student = await this.studentRepository.findOne({ where: { id: participantId } });
      if (student?.userId) {
        await this.upsertParticipantSummary({
          sessionId,
          userId: student.userId,
          userType: 'student',
          participantId,
          userName: student.fullName,
          userEmail: student.email,
          sessionEndTime: endTime,
        });
      }
    }

    if (session.teacherId) {
      const teacher =
        session.teacher ||
        (await this.teacherRepository.findOne({ where: { id: session.teacherId } }));
      if (teacher?.userId) {
        await this.upsertParticipantSummary({
          sessionId,
          userId: teacher.userId,
          userType: 'teacher',
          participantId: teacher.id,
          userName: teacher.fullName,
          userEmail: teacher.email,
        });
      }
    }

    const overlap = await this.calculateTeacherOverlap(sessionId);

    const attendances = await this.attendanceRepository.find({
      where: { sessionId },
    });

    for (const attendance of attendances) {
      const studentOverlap = overlap.segments
        .filter(() => true)
        .reduce((sum, s) => sum + s.durationMs, 0);
      attendance.teacherOverlapMs = studentOverlap;
    }
    await this.attendanceRepository.save(attendances);

    if (overlap.overlapMs > 0 && !session.durationMinutes) {
      session.durationMinutes = overlap.overlapMinutes;
      await this.liveSessionRepository.save(session);
    }

    this.logger.log(`Recalculated analytics for session ${sessionId}: ${attendances.length} participants, ${overlap.overlapMinutes}min overlap`);
  }

  private async getDistinctParticipants(sessionId: string): Promise<string[]> {
    const rows = await this.timelineRepository
      .createQueryBuilder('t')
      .select('DISTINCT t.participantId')
      .where('t.sessionId = :sessionId', { sessionId })
      .getRawMany();
    return rows.map((r) => r.participantId);
  }

  buildSegmentsFromTimeline(
    events: ParticipantTimelineEvent[],
    sessionEndTime?: Date,
  ): ParticipantSegment[] {
    const sorted = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const segments: ParticipantSegment[] = [];
    let currentJoin: Date | null = null;

    for (const event of sorted) {
      if (event.eventType === TimelineEventType.JOIN) {
        if (currentJoin) {
          segments.push({
            joinTime: currentJoin,
            leaveTime: event.timestamp,
            durationMs: event.timestamp.getTime() - currentJoin.getTime(),
          });
        }
        currentJoin = event.timestamp;
      } else if (event.eventType === TimelineEventType.LEAVE) {
        if (currentJoin) {
          segments.push({
            joinTime: currentJoin,
            leaveTime: event.timestamp,
            durationMs: event.timestamp.getTime() - currentJoin.getTime(),
          });
          currentJoin = null;
        }
      }
    }

    if (currentJoin) {
      const end = sessionEndTime || new Date();
      segments.push({
        joinTime: currentJoin,
        leaveTime: end,
        durationMs: end.getTime() - currentJoin.getTime(),
      });
    }

    return segments;
  }

  async getSessionTimelineSummary(sessionId: string): Promise<{
    events: ParticipantTimelineEvent[];
    teacherTimeline: ParticipantTimelineEvent[];
    studentTimelines: Map<string, ParticipantTimelineEvent[]>;
    overlap?: TeachingOverlapResult;
  }> {
    const allEvents = await this.getTimelineForSession(sessionId);
    const teacherEvents = allEvents.filter((e) => e.participantRole === 'teacher');
    const studentEvents = allEvents.filter((e) => e.participantRole === 'student');

    const studentMap = new Map<string, ParticipantTimelineEvent[]>();
    for (const event of studentEvents) {
      const existing = studentMap.get(event.participantId) || [];
      existing.push(event);
      studentMap.set(event.participantId, existing);
    }

    let overlap: TeachingOverlapResult | undefined;
    try {
      overlap = await this.calculateTeacherOverlap(sessionId);
    } catch {
    }

    return {
      events: allEvents,
      teacherTimeline: teacherEvents,
      studentTimelines: studentMap,
      overlap,
    };
  }
}
