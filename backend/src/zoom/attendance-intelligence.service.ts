import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
import { AttendanceStatus } from './enums/live-session-status.enum';

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
      webhookEventId: event.webhookEventId || null,
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

    let attendanceStatus: AttendanceStatus;
    if (totalConnectedTimeMs === 0) {
      attendanceStatus = AttendanceStatus.ABSENT;
    } else {
      const ratio = totalConnectedTimeMs / (scheduledMinutes * 60000);
      if (ratio >= thresholds.presentRatio) {
        attendanceStatus = AttendanceStatus.PRESENT;
      } else if (ratio >= thresholds.lateRatio) {
        attendanceStatus = AttendanceStatus.LATE;
      } else {
        attendanceStatus = AttendanceStatus.ABSENT;
      }

      if (
        lastLeaveTime &&
        session.scheduledEnd &&
        lastLeaveTime < session.scheduledEnd &&
        totalConnectedTimeMs > 0
      ) {
        const leftEarlyMs =
          session.scheduledEnd.getTime() - lastLeaveTime.getTime();
        if (leftEarlyMs > thresholds.earlyLeaveMinutes * 60000) {
          attendanceStatus = AttendanceStatus.LEFT_EARLY;
        }
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
    attendance.attendanceStatus = result.attendanceStatus;
    attendance.firstJoinTime = result.firstJoinTime;
    attendance.lastLeaveTime = result.lastLeaveTime;

    return this.attendanceRepository.save(attendance);
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

  async recalculateSession(sessionId: string): Promise<void> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['attendances'],
    });
    if (!session) return;

    const participantIds = await this.getDistinctParticipants(sessionId);

    for (const participantId of participantIds) {
      await this.calculateAndUpdateAttendance(sessionId, participantId);
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
      segments.push({
        joinTime: currentJoin,
        leaveTime: null,
        durationMs: Date.now() - currentJoin.getTime(),
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
