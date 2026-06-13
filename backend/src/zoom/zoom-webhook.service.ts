import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { AttendanceStatus } from './enums/live-session-status.enum';
import { ZoomService } from './zoom.service';
import { SessionAttendanceService } from './session-attendance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Student } from '../students/entities/student.entity';
import { ProcessedWebhook } from './entities/processed-webhook.entity';

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
    @InjectRepository(ProcessedWebhook)
    private readonly processedWebhookRepository: Repository<ProcessedWebhook>,
    private readonly zoomService: ZoomService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly notificationsService: NotificationsService,
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
      case 'participant.joined':
        await this.handleParticipantJoined(payload);
        break;
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

    if (session.actualStart) {
      const durationMs = session.actualEnd.getTime() - session.actualStart.getTime();
      session.durationMinutes = Math.floor(durationMs / 60000);
    }

    await this.liveSessionRepository.save(session);

    const attendances = await this.attendanceRepository.find({
      where: { sessionId: session.id },
    });

    for (const attendance of attendances) {
      if (!attendance.joinTime) {
        attendance.attendanceStatus = AttendanceStatus.ABSENT;
      } else if (!attendance.leaveTime) {
        attendance.leaveTime = session.actualEnd;
        if (attendance.joinTime) {
          attendance.duration = Math.floor(
            (attendance.leaveTime.getTime() - attendance.joinTime.getTime()) / 60000,
          );
        }
      }
    }
    await this.attendanceRepository.save(attendances);

    const studentIds = attendances.map((a) => a.studentId);
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

    try {
      const integration = await this.zoomService.getTeacherIntegration(session.teacherId);
      if (integration?.zoomUserId) {
        const recordings = await this.zoomService.getRecordings(zoomMeetingId);
        if (recordings.length > 0) {
          const recordingData = recordings.map((r: Record<string, unknown>) => ({
            id: r.id,
            url: (r as any).play_url || (r as any).download_url,
            duration: r.duration,
            size: (r as any).file_size,
            type: (r as any).recording_type,
          }));

          session.recordingData = recordingData;
          session.recordingUrl = recordingData[0]?.url || null;
          await this.liveSessionRepository.save(session);

          await this.notificationsService.sendCustomNotifications(
            studentIds,
            'Recording Available',
            'The recording for your class is now available.',
            { sessionId: session.id, recordingUrl: recordingData[0]?.url },
          );
        }
      }
    } catch (err) {
      this.logger.error('Failed to fetch recordings after meeting end', err);
    }
  }

  private async handleParticipantJoined(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    const participant = (payload?.object as any)?.participant as
      | Record<string, unknown>
      | undefined;
    if (!zoomMeetingId || !participant) {
      this.logger.warn('Participant joined webhook missing data');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });

    if (!session) return;

    const studentId = await this.resolveStudentFromParticipant(participant, session);
    if (!studentId) return;

    try {
      await this.sessionAttendanceService.recordJoin(session.id, studentId);
      this.logger.log(`Attendance recorded for student ${studentId} in session ${session.id}`);
    } catch (err) {
      this.logger.error(`Failed to record attendance for student ${studentId}`, err);
    }
  }

  private async handleParticipantLeft(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    const participant = (payload?.object as any)?.participant as
      | Record<string, unknown>
      | undefined;
    if (!zoomMeetingId || !participant) {
      this.logger.warn('Participant left webhook missing data');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });

    if (!session) return;

    const studentId = await this.resolveStudentFromParticipant(participant, session);
    if (!studentId) return;

    try {
      await this.sessionAttendanceService.recordLeave(session.id, studentId);
      this.logger.log(`Leave recorded for student ${studentId} in session ${session.id}`);
    } catch (err) {
      this.logger.error(`Failed to record leave for student ${studentId}`, err);
    }
  }

  private async resolveStudentFromParticipant(
    participant: Record<string, unknown>,
    session: LiveSession,
  ): Promise<string | null> {
    const email = (participant.email as string) || '';
    const zoomUserId = ((participant as any).userid || participant.id) as string;
    const name = (participant.user_name as string) || '';

    if (email) {
      const student = await this.studentRepository.findOne({
        where: [{ email }, { zoomEmail: email }],
      });
      if (student) return student.id;
    }

    if (session.studentId) {
      return session.studentId;
    }

    if (zoomUserId) {
      const integration = await this.zoomService.getTeacherByZoomUserId(zoomUserId);
      if (integration) {
        return integration.teacherId;
      }
    }

    this.logger.warn(
      `Unable to resolve participant to student: email=${email} name=${name} zoomUserId=${zoomUserId}`,
    );
    return null;
  }

  private async handleRecordingCompleted(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    if (!zoomMeetingId) {
      this.logger.warn('Recording completed webhook missing meeting ID');
      return;
    }

    const session = await this.liveSessionRepository.findOne({
      where: { zoomMeetingId },
    });

    if (!session) {
      this.logger.warn(`No session found for meeting ${zoomMeetingId} recording`);
      return;
    }

    try {
      const recordings = await this.zoomService.getRecordings(zoomMeetingId);
      if (recordings.length > 0) {
        const recordingData = recordings.map((r: Record<string, unknown>) => ({
          id: r.id,
          url: (r as any).play_url || (r as any).download_url,
          duration: r.duration,
          size: (r as any).file_size,
          type: (r as any).recording_type,
        }));

        session.recordingData = recordingData;
        session.recordingUrl = recordingData[0]?.url || null;
        await this.liveSessionRepository.save(session);

        const attendances = await this.attendanceRepository.find({
          where: { sessionId: session.id },
        });
        const studentIds = attendances.map((a) => a.studentId);

        await this.notificationsService.sendCustomNotifications(
          studentIds,
          'Recording Available',
          'The recording for your class is now available for review.',
          { sessionId: session.id, recordingUrl: recordingData[0]?.url },
        );
      }
    } catch (err) {
      this.logger.error('Failed to process recording completed webhook', err);
    }
  }

  private extractMeetingId(payload: Record<string, unknown>): string | null {
    const object = payload?.object as Record<string, unknown> | undefined;
    if (!object?.id) return null;
    return String(object.id);
  }
}
