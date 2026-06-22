import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomService, ZoomReportParticipant } from './zoom.service';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
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
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(ParticipantTimelineEvent)
    private readonly timelineRepository: Repository<ParticipantTimelineEvent>,
    private readonly zoomService: ZoomService,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
  ) {}

  /** Called ~2 minutes after meeting.ended to replace webhook segments with Zoom report data. */
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

    for (const participant of participants) {
      await this.insertReportTimelineEvents(session, participant);
    }

    await this.attendanceIntelligence.recalculateSession(sessionId);

    const attendances = await this.attendanceRepository.find({ where: { sessionId } });
    for (const attendance of attendances) {
      attendance.isReconciled = true;
    }
    await this.attendanceRepository.save(attendances);

    this.logger.log(
      `Reconciliation complete for session ${sessionId}: ${participants.length} report rows, ${attendances.length} attendance records marked reconciled`,
    );
  }

  private async insertReportTimelineEvents(
    session: LiveSession,
    participant: ZoomReportParticipant,
  ): Promise<void> {
    const email = participant.user_email?.trim().toLowerCase() || '';
    const resolved = await this.resolveParticipant(session, email, participant.name || '');

    if (!resolved) {
      this.logger.warn(`Could not resolve report participant email=${email} name=${participant.name}`);
      return;
    }

    const joinTime = participant.join_time ? new Date(participant.join_time) : null;
    const leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;

    if (joinTime) {
      await this.timelineRepository.save(
        this.timelineRepository.create({
          sessionId: session.id,
          participantId: resolved.id,
          participantRole: resolved.role,
          zoomUserId: participant.user_id || participant.id || null,
          eventType: TimelineEventType.JOIN,
          timestamp: joinTime,
          source: TimelineEventSource.REPORT,
          rawPayload: participant,
          webhookEventId: `report_${session.id}_${resolved.id}_join`,
        }),
      );
    }

    if (leaveTime) {
      await this.timelineRepository.save(
        this.timelineRepository.create({
          sessionId: session.id,
          participantId: resolved.id,
          participantRole: resolved.role,
          zoomUserId: participant.user_id || participant.id || null,
          eventType: TimelineEventType.LEAVE,
          timestamp: leaveTime,
          source: TimelineEventSource.REPORT,
          rawPayload: participant,
          webhookEventId: `report_${session.id}_${resolved.id}_leave`,
        }),
      );
    }
  }

  private async resolveParticipant(
    session: LiveSession,
    email: string,
    name: string,
  ): Promise<{ id: string; role: 'teacher' | 'student' } | null> {
    if (email) {
      const student = await this.studentRepository.findOne({
        where: [{ email }, { zoomEmail: email }],
      });
      if (student) return { id: student.id, role: 'student' };

      const teacher = await this.teacherRepository.findOne({ where: { email } });
      if (teacher) return { id: teacher.id, role: 'teacher' };
    }

    if (session.teacher?.email && email === session.teacher.email.toLowerCase()) {
      return { id: session.teacherId, role: 'teacher' };
    }

    if (session.studentId) {
      const student = await this.studentRepository.findOne({ where: { id: session.studentId } });
      if (student && (!email || student.email?.toLowerCase() === email)) {
        return { id: student.id, role: 'student' };
      }
    }

    if (session.teacherId && session.teacher?.email?.toLowerCase() === email) {
      return { id: session.teacherId, role: 'teacher' };
    }

    this.logger.debug(`Unresolved report participant: ${email || name}`);
    return null;
  }
}
