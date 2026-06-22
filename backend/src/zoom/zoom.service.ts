import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { ZoomPlatformConfig } from './entities/zoom-platform-config.entity';
import { EncryptionService } from '../common/encryption.service';
import * as crypto from 'crypto';

const PLATFORM_CONFIG_ID = 'default';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type ZoomMeetingResult = {
  meetingId: string;
  meetingUUID: string;
  startUrl: string;
  joinUrl: string;
  password: string;
};

export type ZoomReportParticipant = {
  id?: string;
  user_id?: string;
  name?: string;
  user_email?: string;
  join_time?: string;
  leave_time?: string;
  duration?: number;
};

@Injectable()
export class ZoomService implements OnModuleInit {
  private readonly logger = new Logger(ZoomService.name);
  private readonly baseUrl = 'https://api.zoom.us/v2';

  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private accountId = '';
  private clientId = '';
  private clientSecret = '';
  private secretToken = '';
  private credentialsSource: 'env' | 'database' | 'none' = 'none';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    @InjectRepository(ZoomPlatformConfig)
    private readonly platformConfigRepository: Repository<ZoomPlatformConfig>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reloadPlatformCredentials();
  }

  async reloadPlatformCredentials(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiresAt = null;

    this.secretToken =
      this.configService.get<string>('ZOOM_WEBHOOK_SECRET_TOKEN')?.trim() ||
      process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() ||
      '';

    const envAccountId =
      this.configService.get<string>('ZOOM_ACCOUNT_ID')?.trim() ||
      process.env.ZOOM_ACCOUNT_ID?.trim() ||
      '';
    const envClientId =
      this.configService.get<string>('ZOOM_CLIENT_ID')?.trim() ||
      process.env.ZOOM_CLIENT_ID?.trim() ||
      '';
    const envClientSecret =
      this.configService.get<string>('ZOOM_CLIENT_SECRET')?.trim() ||
      process.env.ZOOM_CLIENT_SECRET?.trim() ||
      '';

    if (envAccountId && envClientId && envClientSecret) {
      this.accountId = envAccountId;
      this.clientId = envClientId;
      this.clientSecret = envClientSecret;
      this.credentialsSource = 'env';
      this.logWebhookSecretStatus();
      return;
    }

    const stored = await this.platformConfigRepository.findOne({
      where: { id: PLATFORM_CONFIG_ID },
    });

    if (stored?.accountId && stored.clientId && stored.clientSecretEncrypted) {
      this.accountId = stored.accountId.trim();
      this.clientId = stored.clientId.trim();
      this.clientSecret =
        this.encryptionService.decrypt(stored.clientSecretEncrypted)?.trim() || '';
      if (!this.secretToken && stored.secretTokenEncrypted) {
        this.secretToken =
          this.encryptionService.decrypt(stored.secretTokenEncrypted)?.trim() || '';
      }
      this.credentialsSource = this.clientSecret ? 'database' : 'none';
      this.logWebhookSecretStatus();
      return;
    }

    this.accountId = '';
    this.clientId = '';
    this.clientSecret = '';
    this.credentialsSource = 'none';
    this.logWebhookSecretStatus();
  }

  /* ------------------------------------------------------------------ */
  /*  Server-to-Server OAuth token + API helper                           */
  /* ------------------------------------------------------------------ */

  async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      new Date() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    const accountId =
      this.accountId ||
      this.configService.get<string>('ZOOM_ACCOUNT_ID') ||
      process.env.ZOOM_ACCOUNT_ID;
    const clientId =
      this.clientId ||
      this.configService.get<string>('ZOOM_CLIENT_ID') ||
      process.env.ZOOM_CLIENT_ID;
    const clientSecret =
      this.clientSecret ||
      this.configService.get<string>('ZOOM_CLIENT_SECRET') ||
      process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      throw new HttpException(
        'Zoom Server-to-Server OAuth is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
          {},
          { headers: { Authorization: `Basic ${credentials}` } },
        ),
      );

      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
      return this.accessToken;
    } catch (error) {
      this.logger.error(
        'Failed to get Zoom Server-to-Server access token',
        error?.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to authenticate with Zoom',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async zoomRequest<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = path.startsWith('http')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data: body,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data as T;
    } catch (error) {
      const status = error?.response?.status;
      const zoomMessage = error?.response?.data?.message as string | undefined;
      this.logger.error(
        `Zoom API ${method} ${path} failed: ${zoomMessage || error.message}`,
      );
      throw new HttpException(
        zoomMessage || `Zoom API request failed: ${error.message}`,
        status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Meetings & registrants                                              */
  /* ------------------------------------------------------------------ */

  async createMeeting(
    teacherEmail: string,
    topic: string,
    startTime: Date,
    durationMinutes: number,
  ): Promise<ZoomMeetingResult> {
    this.assertPlatformConfigured();

    const meeting = await this.zoomRequest<{
      id: number;
      uuid: string;
      join_url: string;
      start_url: string;
      password?: string;
    }>('POST', `/users/${this.encodeZoomUserId(teacherEmail)}/meetings`, {
      topic,
      type: 2,
      start_time: startTime.toISOString(),
      duration: durationMinutes,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        approval_type: 0,
        registrants_email_notification: false,
        waiting_room: false,
        join_before_host: false,
        mute_upon_entry: true,
        auto_recording: 'none',
        audio: 'voip',
      },
    });

    return {
      meetingId: String(meeting.id),
      meetingUUID: meeting.uuid,
      startUrl: meeting.start_url,
      joinUrl: meeting.join_url,
      password: meeting.password || '',
    };
  }

  async registerParticipant(
    meetingId: string,
    student: { email: string; firstName: string; lastName: string },
  ): Promise<string> {
    this.assertPlatformConfigured();

    const data = await this.zoomRequest<{ join_url?: string }>(
      'POST',
      `/meetings/${meetingId}/registrants`,
      {
        email: student.email,
        first_name: student.firstName,
        last_name: student.lastName,
      },
    );

    if (!data.join_url) {
      throw new HttpException(
        'Zoom did not return a registrant join URL',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return data.join_url;
  }

  async getMeetingParticipantsReport(
    meetingUUID: string,
  ): Promise<ZoomReportParticipant[]> {
    this.assertPlatformConfigured();

    const encodedUUID = encodeURIComponent(encodeURIComponent(meetingUUID));
    const data = await this.zoomRequest<{ participants?: ZoomReportParticipant[] }>(
      'GET',
      `/report/meetings/${encodedUUID}/participants?page_size=300`,
    );

    return data.participants || [];
  }

  async updateMeeting(
    zoomMeetingId: string,
    updateData: Record<string, unknown>,
  ): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (updateData.topic) payload.topic = updateData.topic;
    if (updateData.startTime) {
      payload.start_time = new Date(updateData.startTime as string | Date).toISOString();
      payload.type = 2;
    }
    if (updateData.durationMinutes) payload.duration = updateData.durationMinutes;
    if (updateData.settings) payload.settings = updateData.settings;

    await this.zoomRequest('PATCH', `/meetings/${zoomMeetingId}`, payload);
  }

  async deleteMeeting(zoomMeetingId: string): Promise<void> {
    await this.zoomRequest('DELETE', `/meetings/${zoomMeetingId}`);
  }

  async getMeeting(zoomMeetingId: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.zoomRequest<Record<string, unknown>>(
        'GET',
        `/meetings/${zoomMeetingId}`,
      );
    } catch {
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Platform config & webhooks                                          */
  /* ------------------------------------------------------------------ */

  isPlatformConfigured(): boolean {
    return !!(
      (this.accountId || process.env.ZOOM_ACCOUNT_ID) &&
      (this.clientId || process.env.ZOOM_CLIENT_ID) &&
      (this.clientSecret || process.env.ZOOM_CLIENT_SECRET)
    );
  }

  private assertPlatformConfigured(): void {
    if (!this.isPlatformConfigured()) {
      throw new HttpException(
        'Zoom platform credentials are not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  getPlatformConfigStatus(): {
    configured: boolean;
    source: 'env' | 'database' | 'none';
    accountId: string | null;
    clientId: string | null;
    hasClientSecret: boolean;
    hasSecretToken: boolean;
  } {
    return {
      configured: this.isPlatformConfigured(),
      source: this.credentialsSource,
      accountId: this.accountId || null,
      clientId: this.clientId || null,
      hasClientSecret: !!this.clientSecret,
      hasSecretToken: !!this.secretToken,
    };
  }

  async savePlatformConfig(input: {
    accountId: string;
    clientId: string;
    clientSecret?: string;
    secretToken?: string;
  }): Promise<{ configured: boolean; source: 'database' }> {
    const accountId = input.accountId?.trim();
    const clientId = input.clientId?.trim();
    const clientSecret = input.clientSecret?.trim();

    if (!accountId || !clientId) {
      throw new HttpException('Account ID and Client ID are required', HttpStatus.BAD_REQUEST);
    }

    let row = await this.platformConfigRepository.findOne({ where: { id: PLATFORM_CONFIG_ID } });
    if (!row) {
      row = this.platformConfigRepository.create({ id: PLATFORM_CONFIG_ID });
    }

    if (!clientSecret && !row.clientSecretEncrypted) {
      throw new HttpException('Client Secret is required', HttpStatus.BAD_REQUEST);
    }

    row.accountId = accountId;
    row.clientId = clientId;
    if (clientSecret) {
      row.clientSecretEncrypted = this.encryptionService.encrypt(clientSecret);
    }
    if (input.secretToken !== undefined) {
      row.secretTokenEncrypted = input.secretToken?.trim()
        ? this.encryptionService.encrypt(input.secretToken.trim())
        : null;
    }

    await this.platformConfigRepository.save(row);
    await this.reloadPlatformCredentials();

    if (!this.isPlatformConfigured()) {
      throw new HttpException(
        'Zoom credentials were saved but could not be loaded. Set ENCRYPTION_KEY in backend environment variables.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { configured: true, source: 'database' };
  }

  getWebhookSecretToken(): string {
    return (
      this.secretToken ||
      this.configService.get<string>('ZOOM_WEBHOOK_SECRET_TOKEN')?.trim() ||
      process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() ||
      ''
    );
  }

  /** Meeting SDK app key — same as ZOOM_CLIENT_ID. */
  getOAuthClientId(): string | null {
    return this.clientId || null;
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
    try {
      const data = await this.zoomRequest<{ token?: string }>(
        'GET',
        `/users/${this.encodeZoomUserId(zoomUserId)}/token?type=zak`,
      );
      return data.token || null;
    } catch (error) {
      this.logger.warn(`Failed to fetch ZAK token for ${zoomUserId}: ${error.message}`);
      return null;
    }
  }

  private logWebhookSecretStatus(): void {
    if (this.getWebhookSecretToken()) {
      this.logger.log('Zoom webhook secret configured');
    } else {
      this.logger.warn(
        'ZOOM_WEBHOOK_SECRET_TOKEN is not set — webhook signature verification will be skipped.',
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Teacher host mapping (no per-teacher OAuth tokens)                  */
  /* ------------------------------------------------------------------ */

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
    try {
      const data = await this.zoomRequest<{ id: string; email: string }>(
        'GET',
        `/users/${this.encodeZoomUserId(identifier)}`,
      );
      if (data?.id) {
        return { id: data.id, email: data.email };
      }
    } catch (error) {
      if (error?.status !== 404) {
        this.logger.warn(`Zoom user lookup failed for "${identifier}": ${error.message}`);
      }
    }
    return null;
  }

  private async findZoomUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
    try {
      const data = await this.zoomRequest<{ users?: Array<{ id: string; email: string }> }>(
        'GET',
        `/users?email=${encodeURIComponent(email.trim().toLowerCase())}&status=active`,
      );
      if (data.users?.length) {
        return { id: data.users[0].id, email: data.users[0].email };
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
    this.assertPlatformConfigured();

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
      'Zoom user not found in your Zoom account. Connect using the licensed Zoom email on the same account as your Server-to-Server OAuth app.',
      HttpStatus.BAD_REQUEST,
    );
  }

  async connectTeacherIntegration(
    teacherId: string,
    zoomUserIdOrEmail: string,
    zoomEmail?: string,
  ): Promise<ZoomIntegration> {
    const identifier = zoomUserIdOrEmail?.trim();
    if (!identifier) {
      throw new HttpException('Zoom User ID or email is required', HttpStatus.BAD_REQUEST);
    }

    const resolved = await this.resolveZoomUser(identifier, zoomEmail);
    return this.saveTeacherIntegration(teacherId, resolved.id, resolved.email);
  }

  async saveTeacherIntegration(
    teacherId: string,
    zoomUserId: string,
    zoomEmail: string,
  ): Promise<ZoomIntegration> {
    let integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });

    if (!integration) {
      integration = this.zoomIntegrationRepository.create({ teacherId });
    }

    integration.zoomUserId = zoomUserId;
    integration.zoomEmail = zoomEmail;
    integration.connectionStatus = 'connected';
    integration.connectedAt = new Date();
    integration.disconnectedAt = null;

    return this.zoomIntegrationRepository.save(integration);
  }

  async disconnectTeacher(teacherId: string): Promise<ZoomIntegration> {
    const integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
    if (!integration) {
      throw new HttpException('Zoom integration not found', HttpStatus.NOT_FOUND);
    }

    integration.connectionStatus = 'disconnected';
    integration.disconnectedAt = new Date();

    return this.zoomIntegrationRepository.save(integration);
  }

  async getTeacherIntegration(teacherId: string): Promise<ZoomIntegration | null> {
    return this.zoomIntegrationRepository.findOne({ where: { teacherId } });
  }

  async checkZoomConnectionHealth(teacherId: string): Promise<{
    connected: boolean;
    platformConfigured: boolean;
    apiReachable: boolean;
    zoomEmail: string | null;
  }> {
    const integration = await this.getTeacherIntegration(teacherId);
    if (!integration || integration.connectionStatus !== 'connected') {
      return {
        connected: false,
        platformConfigured: this.isPlatformConfigured(),
        apiReachable: false,
        zoomEmail: null,
      };
    }

    if (!this.isPlatformConfigured()) {
      return {
        connected: true,
        platformConfigured: false,
        apiReachable: false,
        zoomEmail: integration.zoomEmail,
      };
    }

    try {
      await this.resolveZoomUser(integration.zoomUserId, integration.zoomEmail);
      return {
        connected: true,
        platformConfigured: true,
        apiReachable: true,
        zoomEmail: integration.zoomEmail,
      };
    } catch {
      return {
        connected: true,
        platformConfigured: true,
        apiReachable: false,
        zoomEmail: integration.zoomEmail,
      };
    }
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

  async getZoomUser(zoomUserId: string): Promise<Record<string, unknown> | null> {
    try {
      const resolved = await this.resolveZoomUser(zoomUserId);
      return { id: resolved.id, email: resolved.email };
    } catch {
      return null;
    }
  }
}
