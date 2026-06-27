import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';

export type LiveSessionLookupContext = {
  meetingId: string;
  meetingUUID?: string;
  hostId?: string;
  eventType?: string;
};

export type LiveSessionLookupResult = {
  session: LiveSession | null;
  matchedBy?: 'meeting_id' | 'meeting_uuid' | 'host_attach' | 'live_meeting_id';
  attemptedIds?: string[];
};

@Injectable()
export class LiveSessionLookupService {
  private readonly logger = new Logger(LiveSessionLookupService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
  ) {}

  normalizeMeetingIds(meetingId: string): string[] {
    const raw = String(meetingId).trim();
    const numeric = raw.replace(/\D/g, '');
    const candidates = new Set<string>();
    if (raw) candidates.add(raw);
    if (numeric) candidates.add(numeric);
    return [...candidates];
  }

  async findByMeetingRef(
    meetingId: string,
    meetingUUID?: string,
  ): Promise<LiveSession | null> {
    const result = await this.resolve({
      meetingId,
      meetingUUID,
    });
    return result.session;
  }

  async resolve(ctx: LiveSessionLookupContext): Promise<LiveSessionLookupResult> {
    const attemptedIds = this.normalizeMeetingIds(ctx.meetingId);

    for (const id of attemptedIds) {
      const session = await this.liveSessionRepository.findOne({
        where: { zoomMeetingId: id },
        relations: ['teacher'],
      });
      if (session) {
        return { session, matchedBy: 'meeting_id', attemptedIds };
      }
    }

    if (ctx.meetingUUID) {
      const byUuid = await this.liveSessionRepository.findOne({
        where: { zoomMeetingUUID: ctx.meetingUUID },
        relations: ['teacher'],
      });
      if (byUuid) {
        return { session: byUuid, matchedBy: 'meeting_uuid', attemptedIds };
      }
    }

  // Prefer LIVE session when the same PMI is reused across sessions
    for (const id of attemptedIds) {
      const liveSession = await this.liveSessionRepository.findOne({
        where: { zoomMeetingId: id, status: LiveSessionStatus.LIVE },
        relations: ['teacher'],
        order: { actualStart: 'DESC' },
      });
      if (liveSession) {
        return { session: liveSession, matchedBy: 'live_meeting_id', attemptedIds };
      }
    }

    if (ctx.hostId && ctx.eventType === 'meeting.started') {
      const attached = await this.attachMeetingToTeacherSession(
        ctx.meetingId,
        ctx.meetingUUID,
        ctx.hostId,
      );
      if (attached) {
        return { session: attached, matchedBy: 'host_attach', attemptedIds };
      }
    }

    return { session: null, attemptedIds };
  }

  private async attachMeetingToTeacherSession(
    meetingId: string,
    meetingUUID?: string,
    hostId?: string,
  ): Promise<LiveSession | null> {
    const integration = await this.zoomIntegrationRepository.findOne({
      where: { zoomUserId: hostId },
    });
    if (!integration?.teacherId) return null;

    const activeSession = await this.liveSessionRepository.findOne({
      where: {
        teacherId: integration.teacherId,
        status: In([LiveSessionStatus.LIVE, LiveSessionStatus.SCHEDULED]),
      },
      order: { scheduledStart: 'DESC' },
      relations: ['teacher'],
    });

    if (!activeSession) return null;

    const normalizedId = this.normalizeMeetingIds(meetingId)[0] || String(meetingId);
    activeSession.zoomMeetingId = normalizedId;
    if (meetingUUID) activeSession.zoomMeetingUUID = meetingUUID;
    if (activeSession.status !== LiveSessionStatus.LIVE) {
      activeSession.status = LiveSessionStatus.LIVE;
      activeSession.actualStart = activeSession.actualStart || new Date();
    }

    await this.liveSessionRepository.save(activeSession);

    this.logger.warn(
      `Attached Zoom meeting ${normalizedId} to live session ${activeSession.id} ` +
        `(teacherId=${activeSession.teacherId}, scheduleId=${activeSession.scheduleId || 'n/a'}, ` +
        `hostId=${hostId})`,
    );

    return activeSession;
  }

  logLookupFailure(ctx: LiveSessionLookupContext, result: LiveSessionLookupResult): void {
    this.logger.error(
      `LiveSession not found for Zoom event — event=${ctx.eventType || 'unknown'}, ` +
        `meetingId=${ctx.meetingId}, meetingUUID=${ctx.meetingUUID || 'n/a'}, ` +
        `hostId=${ctx.hostId || 'n/a'}, attemptedIds=${JSON.stringify(result.attemptedIds || [])}`,
    );
  }
}
