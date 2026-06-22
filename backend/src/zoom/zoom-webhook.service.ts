import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { AttendanceStatus } from './enums/live-session-status.enum';
import { ZoomService } from './zoom.service';
import { SessionAttendanceService } from './session-attendance.service';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ProcessedWebhook } from './entities/processed-webhook.entity';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { TimelineEventType } from './entities/participant-timeline-event.entity';
import { AttendanceReconciliationService } from './attendance-reconciliation.service';

@Injectable()
export class ZoomWebhookService {
  private readonly logger = new Logger(ZoomWebhookService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    @InjectRepository(ProcessedWebhook)
    private readonly processedWebhookRepository: Repository<ProcessedWebhook>,
    private readonly zoomService: ZoomService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
    private readonly notificationsService: NotificationsService,
    private readonly reconciliationService: AttendanceReconciliationService,
  ) {}

  async handleWebhook(
    event: string,
    payload: Record<string, unknown>,
    eventId?: string,
  ): Promise<void> {
    this.logger.log(`Zoom webhook received: ${event}`);

    if (eventId) {
      const alreadyProcessed = await this.processedWebhookRepository.findOne({
        where: { eventId },
      });
      if (alreadyProcessed) {
        this.logger.log(`Skipping already-processed webhook event: ${eventId}`);
        return;
      }
    }

    switch (event) {
      case 'meeting.started':
        await this.handleMeetingStarted(payload);
        break;
      case 'meeting.ended':
        await this.handleMeetingEnded(payload);
        break;
      case 'meeting.participant_joined':
      case 'participant.joined':
        await this.handleParticipantJoined(payload);
        break;
      case 'meeting.participant_left':
      case 'participant.left':
        await this.handleParticipantLeft(payload);
        break;
      case 'recording.completed':
        await this.handleRecordingCompleted(payload);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }

    if (eventId) {
      try {
        await this.processedWebhookRepository.save(
          this.processedWebhookRepository.create({ eventId }),
        );
      } catch {
        // duplicate key is safe to ignore
      }
    }
  }

  private async handleMeetingStarted(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    if (!zoomMeetingId) {
      this.logger.warn('Meeting started webhook missing meeting ID');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
      relations: ['attendances'],
    });

    if (!session) {
      this.logger.warn(`No live session found for Zoom meeting ${zoomMeetingId}`);
      return;
    }

    if (
      session.status === LiveSessionStatus.SCHEDULED ||
      session.status === LiveSessionStatus.LIVE
    ) {
      session.status = LiveSessionStatus.LIVE;
      session.actualStart = new Date();
      const meetingUUID = (payload?.object as { uuid?: string } | undefined)?.uuid;
      if (meetingUUID) {
        session.zoomMeetingUUID = meetingUUID;
      }
      await this.liveSessionRepository.save(session);
    }
  }

  private async handleMeetingEnded(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    if (!zoomMeetingId) {
      this.logger.warn('Meeting ended webhook missing meeting ID');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });

    if (!session) {
      this.logger.warn(`No live session found for Zoom meeting ${zoomMeetingId}`);
      return;
    }

    session.status = LiveSessionStatus.COMPLETED;
    session.actualEnd = new Date();
    session.completedAt = new Date();
    session.teacherLeaveTime = session.teacherLeaveTime || new Date();

    const meetingUUID =
      (payload?.object as { uuid?: string } | undefined)?.uuid || session.zoomMeetingUUID;
    if (meetingUUID) {
      session.zoomMeetingUUID = meetingUUID;
    }

    if (session.actualStart) {
      const durationMs = session.actualEnd.getTime() - session.actualStart.getTime();
      session.durationMinutes = Math.floor(durationMs / 60000);
    }

    await this.liveSessionRepository.save(session);

    try {
      await this.attendanceIntelligence.recalculateSession(session.id);
      this.logger.log(`Recalculated attendance intelligence for session ${session.id}`);
    } catch (err) {
      this.logger.error(`Failed to recalculate attendance intelligence for session ${session.id}`, err);
    }

    if (session.zoomMeetingUUID) {
      this.reconciliationService.scheduleReconciliation(session.id, session.zoomMeetingUUID);
    }

    const studentIds = (await this.attendanceRepository.find({
      where: { sessionId: session.id },
      select: ['studentId'],
    })).map((a) => a.studentId);

    if (studentIds.length > 0) {
      try {
        await this.notificationsService.sendCustomNotifications(
          studentIds,
          'Class Completed',
          `Your class has ended. Duration: ${session.durationMinutes || 'N/A'} minutes.`,
          { sessionId: session.id, durationMinutes: session.durationMinutes },
        );
      } catch (err) {
        this.logger.error('Failed to send completion notification', err);
      }
    }
  }

  private async handleParticipantJoined(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    const participant = (payload?.object as any)?.participant as Record<string, unknown> | undefined;
    if (!zoomMeetingId || !participant) {
      this.logger.warn('Participant joined webhook missing data');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });
    if (!session) return;

    const participantInfo = await this.resolveParticipant(participant, session);

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId: session.id,
      participantId: participantInfo.id,
      participantRole: participantInfo.role,
      zoomUserId: String((participant as any).userid || participant.id || ''),
      eventType: TimelineEventType.JOIN,
      timestamp: new Date(),
      device: (participant as any).device as string || undefined,
      clientType: (participant as any).client_type as string || (participant as any).clientType as string || undefined,
      rawPayload: participant as any,
      webhookEventId: `${zoomMeetingId}_${participantInfo.id}_join_${Date.now()}`,
    });

    if (participantInfo.role === 'student') {
      try {
        await this.attendanceIntelligence.calculateAndUpdateAttendance(session.id, participantInfo.id);
        this.logger.log(`Attendance updated for student ${participantInfo.id} in session ${session.id}`);
      } catch (err) {
        this.logger.error(`Failed to update attendance for student ${participantInfo.id}`, err);
      }
    }

    if (participantInfo.role === 'teacher') {
      session.teacherJoinTime = new Date();
      await this.liveSessionRepository.save(session);
      this.logger.log(`Teacher join recorded for session ${session.id}`);
    }
  }

  private async handleParticipantLeft(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    const participant = (payload?.object as any)?.participant as Record<string, unknown> | undefined;
    if (!zoomMeetingId || !participant) {
      this.logger.warn('Participant left webhook missing data');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });
    if (!session) return;

    const participantInfo = await this.resolveParticipant(participant, session);

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId: session.id,
      participantId: participantInfo.id,
      participantRole: participantInfo.role,
      zoomUserId: String((participant as any).userid || participant.id || ''),
      eventType: TimelineEventType.LEAVE,
      timestamp: new Date(),
      device: (participant as any).device as string || undefined,
      clientType: (participant as any).client_type as string || (participant as any).clientType as string || undefined,
      rawPayload: participant as any,
      webhookEventId: `${zoomMeetingId}_${participantInfo.id}_leave_${Date.now()}`,
    });

    if (participantInfo.role === 'student') {
      try {
        await this.attendanceIntelligence.calculateAndUpdateAttendance(session.id, participantInfo.id);
        this.logger.log(`Attendance updated for student ${participantInfo.id} after leave in session ${session.id}`);
      } catch (err) {
        this.logger.error(`Failed to update attendance for student ${participantInfo.id}`, err);
      }
    }

    if (participantInfo.role === 'teacher') {
      session.teacherLeaveTime = new Date();
      if (session.actualStart && session.teacherLeaveTime) {
        const teacherDurationMs = session.teacherLeaveTime.getTime() - (session.teacherJoinTime || session.actualStart).getTime();
        session.durationMinutes = Math.floor(teacherDurationMs / 60000);
      }
      await this.liveSessionRepository.save(session);
      this.logger.log(`Teacher leave recorded for session ${session.id}`);
    }
  }

  private async handleRecordingCompleted(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    if (!zoomMeetingId) return;

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });
    if (!session) return;

    const recordingFiles = (payload?.object as any)?.recording_files || [];
    if (recordingFiles.length > 0 && !session.metadata?.recordings) {
      session.metadata = { ...(session.metadata || {}), recordings: recordingFiles };
      await this.liveSessionRepository.save(session);
      this.logger.log(`Recording metadata saved for session ${session.id}`);
    }
  }

  private async resolveParticipant(
    participant: Record<string, unknown>,
    session: LiveSession,
  ): Promise<{ id: string; role: 'teacher' | 'student' }> {
    const email = (participant.email as string) || '';
    const zoomUserId = String((participant as any).userid || participant.id || '');
    const participantId = (participant as any).participant_userid || zoomUserId;

    if (email) {
      const student = await this.studentRepository.findOne({
        where: [{ email }, { zoomEmail: email }],
      });
      if (student) return { id: student.id, role: 'student' };

      const teacher = await this.teacherRepository.findOne({
        where: { email },
      });
      if (teacher) return { id: teacher.id, role: 'teacher' };
    }

    if (zoomUserId) {
      const integration = await this.zoomIntegrationRepository.findOne({
        where: { zoomUserId },
      });
      if (integration) {
        const teacher = await this.teacherRepository.findOne({
          where: { id: integration.teacherId },
        });
        if (teacher) return { id: teacher.id, role: 'teacher' };
      }
    }

    if (session.studentId) {
      return { id: session.studentId, role: 'student' };
    }

    if (session.teacherId) {
      return { id: session.teacherId, role: 'teacher' };
    }

    this.logger.warn(
      `Unable to resolve participant: email=${email} zoomUserId=${zoomUserId} participantId=${participantId}`,
    );

    return { id: participantId || zoomUserId || 'unknown', role: 'student' };
  }

  private extractMeetingId(payload: Record<string, unknown>): string | null {
    const object = payload?.object as Record<string, unknown> | undefined;
    if (!object?.id) return null;
    return String(object.id);
  }
}
