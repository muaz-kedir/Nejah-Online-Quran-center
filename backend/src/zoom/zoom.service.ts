import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { EncryptionService } from '../common/encryption.service';
import * as crypto from 'crypto';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private readonly baseUrl = 'https://api.zoom.us/v2';
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    private readonly encryptionService: EncryptionService,
  ) {}

  private get accountId(): string {
    return this.configService.get<string>('ZOOM_ACCOUNT_ID');
  }

  private get clientId(): string {
    return this.configService.get<string>('ZOOM_CLIENT_ID');
  }

  private get clientSecret(): string {
    return this.configService.get<string>('ZOOM_CLIENT_SECRET');
  }

  private get secretToken(): string {
    return this.configService.get<string>('ZOOM_SECRET_TOKEN');
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const tokenUrl = 'https://zoom.us/oauth/token';
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          tokenUrl,
          new URLSearchParams({ grant_type: 'account_credentials', account_id: this.accountId }),
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const { access_token, expires_in } = response.data;
      this.cachedToken = {
        accessToken: access_token,
        expiresAt: Date.now() + (expires_in - 60) * 1000,
      };

      return access_token;
    } catch (error) {
      this.logger.error('Failed to get Zoom access token', error.stack);
      throw new HttpException('Failed to authenticate with Zoom', HttpStatus.UNAUTHORIZED);
    }
  }

  verifyWebhookSignature(body: Record<string, unknown>, signatureHeader: string): boolean {
    if (!this.secretToken) {
      this.logger.warn('ZOOM_SECRET_TOKEN not configured, skipping webhook verification');
      return true;
    }

    if (!signatureHeader) {
      this.logger.warn('Webhook request missing authorization header');
      return false;
    }

    try {
      const rawBody = JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac('sha256', this.secretToken)
        .update(rawBody)
        .digest('hex');

      const expected = `v0=${expectedSignature}`;
      const actual = signatureHeader.trim();

      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
    } catch {
      this.logger.warn('Webhook signature verification failed');
      return false;
    }
  }

  async createMeeting(
    teacherZoomUserId: string,
    topic: string,
    startTime: Date,
    durationMinutes: number,
    settings?: Record<string, unknown>,
  ): Promise<{
    zoomMeetingId: string;
    zoomJoinUrl: string;
    zoomStartUrl: string;
    zoomPassword: string;
  }> {
    const token = await this.getAccessToken();
    const defaultSettings = {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      mute_upon_entry: true,
      waiting_room: false,
      auto_recording: 'none',
      approval_type: 2,
      audio: 'voip',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/users/${teacherZoomUserId}/meetings`,
          {
            topic,
            type: 2,
            start_time: startTime.toISOString(),
            duration: durationMinutes,
            timezone: 'UTC',
            settings: { ...defaultSettings, ...settings },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const meeting = response.data;
      return {
        zoomMeetingId: meeting.id.toString(),
        zoomJoinUrl: meeting.join_url,
        zoomStartUrl: meeting.start_url,
        zoomPassword: meeting.password || '',
      };
    } catch (error) {
      this.logger.error(`Failed to create Zoom meeting: ${error.message}`, error.stack);
      const status = error?.response?.status;
      if (status === 404) {
        throw new HttpException(
          'Zoom user not found — check Zoom integration settings',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (status === 429) {
        throw new HttpException(
          'Zoom API rate limit exceeded — try again later',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        `Failed to create Zoom meeting: ${error.message}`,
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async updateMeeting(zoomMeetingId: string, updateData: Record<string, unknown>): Promise<void> {
    const token = await this.getAccessToken();

    const payload: Record<string, unknown> = {};
    if (updateData.topic) payload.topic = updateData.topic;
    if (updateData.startTime) {
      payload.start_time = new Date(updateData.startTime as string | Date).toISOString();
      payload.type = 2;
    }
    if (updateData.durationMinutes) payload.duration = updateData.durationMinutes;
    if (updateData.settings) payload.settings = updateData.settings;

    try {
      await firstValueFrom(
        this.httpService.patch(`${this.baseUrl}/meetings/${zoomMeetingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to update Zoom meeting ${zoomMeetingId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update Zoom meeting: ${error.message}`,
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async deleteMeeting(zoomMeetingId: string): Promise<void> {
    const token = await this.getAccessToken();

    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/meetings/${zoomMeetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete Zoom meeting ${zoomMeetingId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to delete Zoom meeting: ${error.message}`,
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getMeeting(zoomMeetingId: string): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/meetings/${zoomMeetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get Zoom meeting ${zoomMeetingId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async getMeetingAnalytics(zoomMeetingId: string): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/meetings/${zoomMeetingId}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page_size: 300 },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Zoom meeting analytics: ${error.message}`, error.stack);
      return null;
    }
  }

  async getZoomUser(zoomUserId: string): Promise<Record<string, unknown> | null> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${zoomUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Zoom user: ${error.message}`, error.stack);
      return null;
    }
  }

  async saveTeacherIntegration(
    teacherId: string,
    zoomUserId: string,
    zoomEmail: string,
    tokens?: { accessToken?: string; refreshToken?: string; expiresAt?: Date },
  ): Promise<ZoomIntegration> {
    let integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });

    if (!integration) {
      integration = this.zoomIntegrationRepository.create({ teacherId });
    }

    integration.zoomUserId = zoomUserId;
    integration.zoomEmail = zoomEmail;
    integration.connectionStatus = 'connected';
    integration.connectedAt = new Date();

    if (tokens?.accessToken)
      integration.accessToken = this.encryptionService.encrypt(tokens.accessToken);
    if (tokens?.refreshToken)
      integration.refreshToken = this.encryptionService.encrypt(tokens.refreshToken);
    if (tokens?.expiresAt) integration.tokenExpiresAt = tokens.expiresAt;

    return this.zoomIntegrationRepository.save(integration);
  }

  async disconnectTeacher(teacherId: string): Promise<ZoomIntegration> {
    const integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
    if (!integration) {
      throw new HttpException('Zoom integration not found', HttpStatus.NOT_FOUND);
    }

    integration.connectionStatus = 'disconnected';
    integration.disconnectedAt = new Date();
    integration.accessToken = null;
    integration.refreshToken = null;
    integration.tokenExpiresAt = null;

    return this.zoomIntegrationRepository.save(integration);
  }

  async getTeacherIntegration(teacherId: string): Promise<ZoomIntegration | null> {
    return this.zoomIntegrationRepository.findOne({ where: { teacherId } });
  }

  async getAllIntegrations(): Promise<ZoomIntegration[]> {
    return this.zoomIntegrationRepository.find({ relations: ['teacher'] });
  }

  async getTeacherByZoomUserId(zoomUserId: string): Promise<ZoomIntegration | null> {
    return this.zoomIntegrationRepository.findOne({
      where: { zoomUserId },
      relations: ['teacher'],
    });
  }
}
