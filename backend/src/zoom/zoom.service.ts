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

  isPlatformConfigured(): boolean {
    return !!(this.accountId && this.clientId && this.clientSecret);
  }

  /** OAuth Client ID — also used as Meeting SDK appKey for embedded classroom JWTs. */
  getOAuthClientId(): string | null {
    return this.clientId || null;
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

  verifyWebhookSignature(
    body: Record<string, unknown>,
    signatureHeader: string,
    timestampHeader?: string,
  ): boolean {
    if (!this.secretToken) {
      this.logger.warn('ZOOM_SECRET_TOKEN not configured, skipping webhook verification');
      return true;
    }

    if (!signatureHeader) {
      this.logger.warn('Webhook request missing signature header');
      return false;
    }

    try {
      const rawBody = JSON.stringify(body);

      // Zoom sends x-zm-signature as v0=<hash> with x-zm-request-timestamp
      if (timestampHeader) {
        const message = `v0:${timestampHeader}:${rawBody}`;
        const expectedHash = crypto
          .createHmac('sha256', this.secretToken)
          .update(message)
          .digest('hex');
        const expected = `v0=${expectedHash}`;
        const actual = signatureHeader.trim();
        if (actual.length === expected.length) {
          return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
        }
        return false;
      }

      // Legacy authorization header fallback
      const expectedSignature = crypto
        .createHmac('sha256', this.secretToken)
        .update(rawBody)
        .digest('hex');
      const expected = `v0=${expectedSignature}`;
      const actual = signatureHeader.trim();
      if (actual.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
    } catch {
      this.logger.warn('Webhook signature verification failed');
      return false;
    }
  }

  generateMeetingSdkSignature(meetingNumber: string, role: 0 | 1): string | null {
    if (!this.clientId || !this.clientSecret) return null;

    const mn = String(meetingNumber).replace(/\D/g, '');
    if (!mn) return null;

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;
    const payload = {
      appKey: this.clientId,
      mn,
      role,
      iat,
      exp,
      tokenExp: exp,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  async getUserZakToken(zoomUserId: string): Promise<string | null> {
    const token = await this.getAccessToken();
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/users/${this.encodeZoomUserId(zoomUserId)}/token`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { type: 'zak' },
          },
        ),
      );
      return (response.data?.token as string) || null;
    } catch (error) {
      this.logger.warn(`Failed to fetch ZAK token for ${zoomUserId}: ${error.message}`);
      return null;
    }
  }

  /** Encode user id or email for Zoom API path segments. */
  private encodeZoomUserId(userId: string): string {
    const trimmed = userId.trim();
    if (trimmed.includes('@')) {
      return encodeURIComponent(trimmed.toLowerCase()).replace(/\./g, '%2E');
    }
    return encodeURIComponent(trimmed);
  }

  private async fetchZoomUser(
    identifier: string,
  ): Promise<{ id: string; email: string } | null> {
    const token = await this.getAccessToken();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${this.encodeZoomUserId(identifier)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      if (response.data?.id) {
        return { id: response.data.id, email: response.data.email };
      }
    } catch (error) {
      if (error?.response?.status !== 404) {
        this.logger.warn(`Zoom user lookup failed for "${identifier}": ${error.message}`);
      }
    }
    return null;
  }

  private async findZoomUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
    const token = await this.getAccessToken();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { email: email.trim().toLowerCase(), status: 'active' },
        }),
      );
      const users = response.data?.users as Array<{ id: string; email: string }> | undefined;
      if (users?.length) {
        return { id: users[0].id, email: users[0].email };
      }
    } catch (error) {
      this.logger.warn(`Zoom user email search failed for "${email}": ${error.message}`);
    }
    return null;
  }

  async resolveZoomUser(
    identifier: string,
    fallbackEmail?: string,
  ): Promise<{ id: string; email: string }> {
    if (!this.isPlatformConfigured()) {
      throw new HttpException(
        'Zoom platform credentials are not configured on the server',
        HttpStatus.BAD_REQUEST,
      );
    }

    const candidates = [identifier, fallbackEmail]
      .map((value) => value?.trim())
      .filter(Boolean) as string[];
    const seen = new Set<string>();

    for (const candidate of candidates) {
      const key = candidate.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const direct = await this.fetchZoomUser(candidate);
      if (direct) return direct;

      if (candidate.includes('@')) {
        const byEmail = await this.findZoomUserByEmail(candidate);
        if (byEmail) return byEmail;
      }
    }

    throw new HttpException(
      'Zoom user not found in your Zoom account. Open Zoom Settings and connect using your licensed Zoom email or User ID from the same account as your Server-to-Server OAuth app.',
      HttpStatus.BAD_REQUEST,
    );
  }

  async connectTeacherIntegration(
    teacherId: string,
    zoomUserIdOrEmail: string,
    zoomEmail?: string,
  ): Promise<ZoomIntegration> {
    const resolved = await this.resolveZoomUser(zoomUserIdOrEmail, zoomEmail);
    return this.saveTeacherIntegration(teacherId, resolved.id, resolved.email);
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
          `${this.baseUrl}/users/${this.encodeZoomUserId(teacherZoomUserId)}/meetings`,
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
      const zoomMessage = error?.response?.data?.message as string | undefined;
      if (status === 404) {
        throw new HttpException(
          'Zoom user not found — reconnect your Zoom account in Zoom Settings using your licensed Zoom email',
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
        zoomMessage || `Failed to create Zoom meeting: ${error.message}`,
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
    try {
      const resolved = await this.resolveZoomUser(zoomUserId);
      return { id: resolved.id, email: resolved.email };
    } catch {
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
