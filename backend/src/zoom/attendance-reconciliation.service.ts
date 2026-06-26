import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomService, ZoomReportParticipant } from './zoom.service';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { SessionParticipantSummary } from './entities/session-participant-summary.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import {
  ParticipantTimelineEvent,
  TimelineEventSource,
  TimelineEventType,
} from './entities/participant-timeline-event.entity';

@Injectable()
export class AttendanceReconciliationService {
  private readonly logger = new Logger(AttendanceReconciliationService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(SessionParticipantSummary)
    private readonly summaryRepository: Repository<SessionParticipantSummary>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(ParticipantTimelineEvent)
    private readonly timelineRepository: Repository<ParticipantTimelineEvent>,
    private readonly zoomService: ZoomService,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
  ) {}

  scheduleReconciliation(sessionId: string, meetingUUID: string): void {
    setTimeout(() => {
      this.reconcileSessionFromReport(sessionId, meetingUUID).catch((error: Error) => {
        this.logger.error(
          `Reconciliation failed for session ${sessionId}: ${error.message}`,
          error.stack,
        );
      });
    }, 2 * 60 * 1000);
  }

  async reconcileSessionFromReport(
    sessionId: string,
    meetingUUID: string,
  ): Promise<void> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher'],
    });

    if (!session) {
      this.logger.warn(`Reconciliation skipped — session ${sessionId} not found`);
      return;
    }

    const uuid = meetingUUID || session.zoomMeetingUUID;
    if (!uuid) {
      this.logger.warn(`Reconciliation skipped — no meeting UUID for session ${sessionId}`);
      return;
    }

    this.logger.log(`Starting attendance reconciliation for session ${sessionId}`);

    const participants = await this.zoomService.getMeetingParticipantsReport(uuid);

    await this.timelineRepository.delete({
      sessionId,
      source: TimelineEventSource.WEBHOOK,
    });

    const reportSegmentRows: Array<{
      userId: string;
      userEmail: string;
      userType: string;
      zoomParticipantId?: string;
      joinTime: Date | null;
      leaveTime: Date | null;
      durationSeconds: number;
    }> = [];

    for (const participant of participants) {
      const resolved = await this.resolveParticipant(session, participant);
      if (!resolved) continue;

      await this.insertReportTimelineEvents(session, participant, resolved);

      const joinTime = participant.join_time ? new Date(participant.join_time) : null;
      const leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;
      reportSegmentRows.push({
        userId: resolved.userId,
        userEmail: participant.user_email || resolved.email,
        userType: resolved.role,
        zoomParticipantId: participant.user_id || participant.id,
        joinTime,
        leaveTime,
        durationSeconds: participant.duration || 0,
      });

      await this.attendanceIntelligence.upsertParticipantSummary({
        sessionId: session.id,
        userId: resolved.userId,
        userType: resolved.role,
        participantId: resolved.participantId,
        userName: participant.name || resolved.name,
        userEmail: participant.user_email || resolved.email,
        isReconciled: true,
      });
    }

    await this.attendanceIntelligence.rebuildReportSegments(sessionId, reportSegmentRows);
    await this.attendanceIntelligence.recalculateSession(sessionId);

    const attendances = await this.attendanceRepository.find({ where: { sessionId } });
    for (const attendance of attendances) {
      attendance.isReconciled = true;
    }
    await this.attendanceRepository.save(attendances);

    const summaries = await this.summaryRepository.find({ where: { sessionId } });
    for (const summary of summaries) {
      summary.isReconciled = true;
    }
    await this.summaryRepository.save(summaries);

    this.logger.log(
      `Reconciliation complete for session ${sessionId}: ${participants.length} report rows`,
    );
  }

  private async insertReportTimelineEvents(
    session: LiveSession,
    participant: ZoomReportParticipant,
    resolved: {
      participantId: string;
      role: 'teacher' | 'student';
      userId: string;
      email: string;
      name: string;
    },
  ): Promise<void> {
    const joinTime = participant.join_time ? new Date(participant.join_time) : null;
    const leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;

    if (joinTime) {
      await this.timelineRepository.save(
        this.timelineRepository.create({
          sessionId: session.id,
          participantId: resolved.participantId,
          participantRole: resolved.role,
          zoomUserId: participant.user_id || participant.id || null,
          eventType: TimelineEventType.JOIN,
          timestamp: joinTime,
          source: TimelineEventSource.REPORT,
          rawPayload: participant,
          webhookEventId: `report_${session.id}_${resolved.participantId}_join`,
        }),
      );
    }

    if (leaveTime) {
      await this.timelineRepository.save(
        this.timelineRepository.create({
          sessionId: session.id,
          participantId: resolved.participantId,
          participantRole: resolved.role,
          zoomUserId: participant.user_id || participant.id || null,
          eventType: TimelineEventType.LEAVE,
          timestamp: leaveTime,
          source: TimelineEventSource.REPORT,
          rawPayload: participant,
          webhookEventId: `report_${session.id}_${resolved.participantId}_leave`,
        }),
      );
    }
  }

  private async resolveParticipant(
    session: LiveSession,
    participant: ZoomReportParticipant,
  ): Promise<{
    participantId: string;
    role: 'teacher' | 'student';
    userId: string;
    email: string;
    name: string;
  } | null> {
    const email = participant.user_email?.trim().toLowerCase() || '';
    const name = participant.name || '';

    if (email) {
      const student = await this.studentRepository.findOne({
        where: [{ email }, { zoomEmail: email }],
      });
      if (student?.userId) {
        return {
          participantId: student.id,
          role: 'student',
          userId: student.userId,
          email: student.email,
          name: student.fullName,
        };
      }

      const teacher = await this.teacherRepository.findOne({ where: { email } });
      if (teacher?.userId) {
        return {
          participantId: teacher.id,
          role: 'teacher',
          userId: teacher.userId,
          email: teacher.email,
          name: teacher.fullName,
        };
      }
    }

    if (session.teacher?.email && email === session.teacher.email.toLowerCase()) {
      return {
        participantId: session.teacherId,
        role: 'teacher',
        userId: session.teacher.userId,
        email: session.teacher.email,
        name: session.teacher.fullName,
      };
    }

    if (session.studentId) {
      const student = await this.studentRepository.findOne({ where: { id: session.studentId } });
      if (student?.userId && (!email || student.email?.toLowerCase() === email)) {
        return {
          participantId: student.id,
          role: 'student',
          userId: student.userId,
          email: student.email,
          name: student.fullName,
        };
      }
    }

    this.logger.debug(`Unresolved report participant: ${email || name}`);
    return null;
  }
}
