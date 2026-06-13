import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomIntegration } from './entities/zoom-integration.entity';

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
      this.logger.error(`Failed to get Zoom access token: ${error.message}`, error.stack);
      throw new HttpException('Failed to authenticate with Zoom', HttpStatus.UNAUTHORIZED);
    }
  }

  verifyWebhookSignature(body: any, signatureHeader: string): boolean {
    if (!this.secretToken) {
      this.logger.warn('ZOOM_SECRET_TOKEN not configured, skipping webhook verification');
      return true;
    }
    const expectedSignature = this.secretToken;
    return signatureHeader === expectedSignature;
  }

  async createMeeting(
    teacherZoomUserId: string,
    topic: string,
    startTime: Date,
    durationMinutes: number,
    settings?: any,
  ): Promise<any> {
    const token = await this.getAccessToken();
    const defaultSettings = {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      mute_upon_entry: true,
      waiting_room: false,
      auto_recording: 'cloud',
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
      throw new HttpException('Failed to create Zoom meeting', HttpStatus.BAD_GATEWAY);
    }
  }

  async updateMeeting(zoomMeetingId: string, updateData: any): Promise<void> {
    const token = await this.getAccessToken();

    const payload: any = {};
    if (updateData.topic) payload.topic = updateData.topic;
    if (updateData.startTime) {
      payload.start_time = new Date(updateData.startTime).toISOString();
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
      this.logger.error(`Failed to update Zoom meeting ${zoomMeetingId}: ${error.message}`, error.stack);
      throw new HttpException('Failed to update Zoom meeting', HttpStatus.BAD_GATEWAY);
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
      this.logger.error(`Failed to delete Zoom meeting ${zoomMeetingId}: ${error.message}`, error.stack);
      throw new HttpException('Failed to delete Zoom meeting', HttpStatus.BAD_GATEWAY);
    }
  }

  async getMeeting(zoomMeetingId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/meetings/${zoomMeetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get Zoom meeting ${zoomMeetingId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async getMeetingAnalytics(zoomMeetingId: string): Promise<any> {
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

  async getRecordings(zoomMeetingId: string): Promise<any[]> {
    const token = await this.getAccessToken();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/meetings/${zoomMeetingId}/recordings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data?.recording_files || [];
    } catch (error) {
      this.logger.error(`Failed to get Zoom recordings: ${error.message}`, error.stack);
      return [];
    }
  }

  async listRecordings(zoomUserId: string, from?: string, to?: string): Promise<any[]> {
    const token = await this.getAccessToken();
    const params: any = { page_size: 30 };
    if (from) params.from = from;
    if (to) params.to = to;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${zoomUserId}/recordings`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
      );
      return response.data?.meetings || [];
    } catch (error) {
      this.logger.error(`Failed to list Zoom recordings: ${error.message}`, error.stack);
      return [];
    }
  }

  async getZoomUser(zoomUserId: string): Promise<any> {
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

    if (tokens?.accessToken) integration.accessToken = tokens.accessToken;
    if (tokens?.refreshToken) integration.refreshToken = tokens.refreshToken;
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

  async getTeacherIntegration(teacherId: string): Promise<ZoomIntegration> {
    const integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
    if (!integration) {
      return null;
    }
    return integration;
  }

  async getAllIntegrations(): Promise<ZoomIntegration[]> {
    return this.zoomIntegrationRepository.find({ relations: ['teacher'] });
  }

  async getTeacherByZoomUserId(zoomUserId: string): Promise<ZoomIntegration> {
    return this.zoomIntegrationRepository.findOne({
      where: { zoomUserId },
      relations: ['teacher'],
    });
  }
}
