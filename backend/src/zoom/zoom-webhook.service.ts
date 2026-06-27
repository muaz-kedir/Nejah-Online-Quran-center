import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedWebhook } from './entities/processed-webhook.entity';
import { LiveSession } from './entities/live-session.entity';
import { LiveSessionAttendanceReportService } from './live-session-attendance-report.service';
import { LiveSessionLookupService } from './live-session-lookup.service';

@Injectable()
export class ZoomWebhookService {
  private readonly logger = new Logger(ZoomWebhookService.name);

  constructor(
    @InjectRepository(ProcessedWebhook)
    private readonly processedWebhookRepository: Repository<ProcessedWebhook>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    private readonly attendanceReportService: LiveSessionAttendanceReportService,
    private readonly liveSessionLookup: LiveSessionLookupService,
  ) {}

  async handleWebhook(
    event: string,
    payload: Record<string, unknown>,
    eventId?: string,
  ): Promise<void> {
    const meetingId = this.extractMeetingId(payload);
    const meetingUUID = this.extractMeetingUUID(payload);
    const hostId = this.extractHostId(payload);

    this.logger.log(
      `Zoom webhook: event=${event}, meetingId=${meetingId || 'n/a'}, ` +
        `meetingUUID=${meetingUUID || 'n/a'}, hostId=${hostId || 'n/a'}, eventId=${eventId || 'n/a'}`,
    );

    if (eventId) {
      const alreadyProcessed = await this.processedWebhookRepository.findOne({
        where: { eventId },
      });
      if (alreadyProcessed) {
        this.logger.log(`Skipping already-processed webhook event: ${eventId}`);
        return;
      }
    }

    try {
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
    } catch (error) {
      this.logger.error(
        `Zoom webhook processing failed for event=${event}, meetingId=${meetingId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
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
    if (!zoomMeetingId) return;

    const object = payload.object as Record<string, unknown> | undefined;
    const startTime = this.parseZoomTime(object?.start_time) || new Date();
    const meetingUUID = this.extractMeetingUUID(payload);
    const hostId = this.extractHostId(payload);

    await this.attendanceReportService.handleMeetingStarted(
      zoomMeetingId,
      startTime,
      meetingUUID,
      hostId,
    );
  }

  private async handleMeetingEnded(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    if (!zoomMeetingId) return;

    const object = payload.object as Record<string, unknown> | undefined;
    const endTime = this.parseZoomTime(object?.end_time) || new Date();
    const meetingUUID = this.extractMeetingUUID(payload);
    const hostId = this.extractHostId(payload);

    await this.attendanceReportService.handleMeetingEnded(
      zoomMeetingId,
      endTime,
      meetingUUID,
      hostId,
    );
  }

  private async handleParticipantJoined(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    const participant = (payload.object as any)?.participant;
    if (!zoomMeetingId || !participant) return;

    const joinTime =
      this.parseZoomTime(participant.join_time) ||
      this.parseZoomTime(payload.event_ts) ||
      new Date();

    await this.attendanceReportService.handleParticipantJoined(
      zoomMeetingId,
      {
        userId: String(participant.user_id || participant.id || ''),
        email: String(participant.email || participant.user_email || ''),
        name: String(participant.user_name || participant.name || ''),
        joinTime,
        zoomParticipantId: String(
          participant.participant_user_id || participant.participant_uuid || participant.id || '',
        ),
      },
      this.extractMeetingUUID(payload),
      this.extractHostId(payload),
    );
  }

  private async handleParticipantLeft(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    const participant = (payload.object as any)?.participant;
    if (!zoomMeetingId || !participant) return;

    const leaveTime =
      this.parseZoomTime(participant.leave_time) ||
      this.parseZoomTime(payload.event_ts) ||
      new Date();

    await this.attendanceReportService.handleParticipantLeft(
      zoomMeetingId,
      {
        userId: String(participant.user_id || participant.id || ''),
        email: String(participant.email || participant.user_email || ''),
        name: String(participant.user_name || participant.name || ''),
        joinTime: leaveTime,
        leaveTime,
        duration: Number(participant.duration || 0),
        zoomParticipantId: String(
          participant.participant_user_id || participant.participant_uuid || participant.id || '',
        ),
      },
      this.extractMeetingUUID(payload),
      this.extractHostId(payload),
    );
  }

  private async handleRecordingCompleted(payload: Record<string, unknown>): Promise<void> {
    const zoomMeetingId = this.extractMeetingId(payload);
    if (!zoomMeetingId) return;

    const session = await this.liveSessionLookup.findByMeetingRef(
      zoomMeetingId,
      this.extractMeetingUUID(payload),
    );
    if (!session) return;

    const recordingFiles = (payload.object as any)?.recording_files || [];
    if (recordingFiles.length > 0 && !session.metadata?.recordings) {
      session.metadata = { ...(session.metadata || {}), recordings: recordingFiles };
      await this.liveSessionRepository.save(session);
      this.logger.log(`Recording metadata saved for session ${session.id}`);
    }
  }

  private extractMeetingId(payload: Record<string, unknown>): string | null {
    const object = payload?.object as Record<string, unknown> | undefined;
    if (!object?.id) return null;
    return String(object.id);
  }

  private extractMeetingUUID(payload: Record<string, unknown>): string | undefined {
    const object = payload?.object as Record<string, unknown> | undefined;
    return object?.uuid ? String(object.uuid) : undefined;
  }

  private extractHostId(payload: Record<string, unknown>): string | undefined {
    const object = payload?.object as Record<string, unknown> | undefined;
    if (object?.host_id) return String(object.host_id);
    const participant = (object as any)?.participant;
    if (participant?.id) return String(participant.id);
    return undefined;
  }

  private parseZoomTime(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      return new Date(asNumber > 1e12 ? asNumber : asNumber * 1000);
    }
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
