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
import { Teacher } from '../teachers/entities/teacher.entity';
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

type ZoomCredentialSet = {
  accountId: string;
  clientId: string;
  clientSecret: string;
};

@Injectable()
export class ZoomService implements OnModuleInit {
  private readonly logger = new Logger(ZoomService.name);
  private apiBaseUrl = 'https://api.zoom.us/v2';

  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private accountId = '';
  private clientId = '';
  private clientSecret = '';
  private secretToken = '';
  private credentialsSource: 'env' | 'database' | 'none' = 'none';
  private envCredentials: ZoomCredentialSet | null = null;
  private databaseCredentials: ZoomCredentialSet | null = null;
  private lastSuccessfulCredentialSource: 'env' | 'database' | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    @InjectRepository(ZoomPlatformConfig)
    private readonly platformConfigRepository: Repository<ZoomPlatformConfig>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reloadPlatformCredentials();
  }

  /** Strip whitespace and wrapping quotes from Render / copy-paste values. */
  private sanitizeCredential(value: string | undefined | null): string {
    if (!value) return '';
    let trimmed = value.replace(/^\uFEFF/, '').trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      trimmed = trimmed.slice(1, -1).trim();
    }
    return trimmed;
  }

  private isCompleteCredentialSet(creds: ZoomCredentialSet | null): creds is ZoomCredentialSet {
    return !!(creds?.accountId && creds.clientId && creds.clientSecret);
  }

  private applyCredentialSet(creds: ZoomCredentialSet, source: 'env' | 'database'): void {
    this.accountId = creds.accountId;
    this.clientId = creds.clientId;
    this.clientSecret = creds.clientSecret;
    this.credentialsSource = source;
  }

  private readEnvCredentials(): ZoomCredentialSet | null {
    const accountId = this.sanitizeCredential(
      this.configService.get<string>('ZOOM_ACCOUNT_ID') || process.env.ZOOM_ACCOUNT_ID,
    );
    const clientId = this.sanitizeCredential(
      this.configService.get<string>('ZOOM_CLIENT_ID') || process.env.ZOOM_CLIENT_ID,
    );
    const clientSecret = this.sanitizeCredential(
      this.configService.get<string>('ZOOM_CLIENT_SECRET') || process.env.ZOOM_CLIENT_SECRET,
    );
    if (!accountId || !clientId || !clientSecret) return null;
    return { accountId, clientId, clientSecret };
  }

  private credentialSourceOrder(): Array<'env' | 'database'> {
    const pref = this.sanitizeCredential(process.env.ZOOM_CREDENTIALS_SOURCE).toLowerCase();
    if (pref === 'database') return ['database', 'env'];
    if (pref === 'env') return ['env', 'database'];
    // Default: prefer database when saved (UI), then env — auto-fallback handles stale env on Render.
    if (this.isCompleteCredentialSet(this.databaseCredentials)) {
      return ['database', 'env'];
    }
    return ['env', 'database'];
  }

  private getCredentialsBySource(source: 'env' | 'database'): ZoomCredentialSet | null {
    return source === 'env' ? this.envCredentials : this.databaseCredentials;
  }

  private isInvalidClientCredentialsError(error: unknown): boolean {
    const payload = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
    const reason = String(payload?.reason || payload?.error || payload?.message || '').toLowerCase();
    return reason.includes('invalid client') || reason.includes('invalid_client');
  }

  private isEncryptedEnvelope(value: string): boolean {
    const parts = value.split(':');
    if (parts.length !== 3) return false;
    return parts.every((part) => /^[0-9a-f]+$/i.test(part) && part.length >= 8);
  }

  /** Read client secret from DB row — plaintext column first, then legacy encrypted. */
  private readStoredClientSecret(stored: ZoomPlatformConfig): string | null {
    const plain = this.sanitizeCredential(stored.clientSecret);
    if (plain && !this.isEncryptedEnvelope(plain)) {
      return plain;
    }

    if (!stored.clientSecretEncrypted) return null;

    const decrypted = this.encryptionService.decrypt(stored.clientSecretEncrypted);
    if (!decrypted) return null;

    const sanitized = this.sanitizeCredential(decrypted);
    if (!sanitized) return null;

    if (this.isEncryptedEnvelope(sanitized)) {
      this.logger.error(
        'Zoom client secret is stored in encrypted form but cannot be decrypted. ' +
          'Re-save Account ID, Client ID, and Client Secret in Zoom Settings (Super Admin).',
      );
      return null;
    }

    return sanitized;
  }

  private async loadDatabaseCredentials(): Promise<ZoomCredentialSet | null> {
    const stored = await this.platformConfigRepository.findOne({
      where: { id: PLATFORM_CONFIG_ID },
    });

    if (!stored?.accountId || !stored.clientId) return null;

    const clientSecret = this.readStoredClientSecret(stored);
    if (!clientSecret) return null;

    return {
      accountId: this.sanitizeCredential(stored.accountId),
      clientId: this.sanitizeCredential(stored.clientId),
      clientSecret,
    };
  }

  async reloadPlatformCredentials(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.lastSuccessfulCredentialSource = null;

    this.secretToken =
      this.sanitizeCredential(
        this.configService.get<string>('ZOOM_WEBHOOK_SECRET_TOKEN') ||
          process.env.ZOOM_WEBHOOK_SECRET_TOKEN,
      ) || '';

    this.envCredentials = this.readEnvCredentials();
    this.databaseCredentials = await this.loadDatabaseCredentials();

    const stored = await this.platformConfigRepository.findOne({
      where: { id: PLATFORM_CONFIG_ID },
    });
    if (stored?.secretTokenEncrypted && !this.secretToken) {
      const token = this.sanitizeCredential(
        this.encryptionService.decrypt(stored.secretTokenEncrypted),
      );
      if (token && !this.isEncryptedEnvelope(token)) {
        this.secretToken = token;
      }
    }

    const order = this.credentialSourceOrder();
    let applied = false;
    for (const source of order) {
      const creds = this.getCredentialsBySource(source);
      if (this.isCompleteCredentialSet(creds)) {
        this.applyCredentialSet(creds, source);
        applied = true;
        break;
      }
    }

    if (!applied) {
    this.accountId = '';
    this.clientId = '';
    this.clientSecret = '';
    this.credentialsSource = 'none';
  }

    if (
      this.isCompleteCredentialSet(this.envCredentials) &&
      this.isCompleteCredentialSet(this.databaseCredentials) &&
      this.envCredentials.clientId !== this.databaseCredentials.clientId
    ) {
      this.logger.warn(
        'Zoom credentials exist in both environment variables and the database with different Client IDs. ' +
          'Using source order: ' +
          order.join(' → ') +
          '. Set ZOOM_CREDENTIALS_SOURCE=env|database to force one source.',
      );
    }

    this.logWebhookSecretStatus();
  }

  /* ------------------------------------------------------------------ */
  /*  Server-to-Server OAuth token + API helper                           */
  /* ------------------------------------------------------------------ */

  private async requestZoomAccessToken(
    creds: ZoomCredentialSet,
  ): Promise<{ access_token: string; expires_in: number; api_url?: string }> {
    const credentials = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(creds.accountId)}`;

    const { data } = await firstValueFrom(
      this.httpService.post(
        tokenUrl,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return data;
  }

  async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      new Date() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    // Always refresh from DB/env before requesting a new Zoom token.
    await this.reloadPlatformCredentials();

    // No credentials configured at all — skip quietly
    if (!this.isPlatformConfigured()) {
      throw new HttpException(
        'Zoom is not configured. Add credentials in Zoom Settings.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sources = this.credentialSourceOrder();
    let lastError: unknown = null;

    for (const source of sources) {
      const creds = this.getCredentialsBySource(source);
      if (!this.isCompleteCredentialSet(creds)) continue;

      try {
        const data = await this.requestZoomAccessToken(creds);

        if (!data?.access_token) {
          throw new Error('Zoom token response did not include access_token');
        }

        this.applyCredentialSet(creds, source);
        this.lastSuccessfulCredentialSource = source;
        this.accessToken = data.access_token;
        this.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);

        if (data.api_url) {
          this.apiBaseUrl = `${String(data.api_url).replace(/\/$/, '')}/v2`;
        }

        if (source !== sources[0]) {
          this.logger.warn(
            `Zoom authentication succeeded using "${source}" credentials after "${sources[0]}" failed. ` +
              'Update Render environment variables or set ZOOM_CREDENTIALS_SOURCE to avoid fallback.',
          );
        }

        return this.accessToken;
      } catch (error) {
        lastError = error;
        if (!this.isInvalidClientCredentialsError(error)) {
          break;
        }
        this.logger.warn(
          `Zoom rejected ${source} credentials (${(error as { response?: { data?: { reason?: string } } })?.response?.data?.reason || 'invalid client'}). Trying next source.`,
        );
      }
    }

    this.accessToken = null;
    this.tokenExpiresAt = null;

    const zoomPayload = (lastError as { response?: { data?: unknown }; message?: string })?.response
      ?.data;
    const reason =
      (typeof zoomPayload === 'object' &&
        zoomPayload &&
        ((zoomPayload as Record<string, unknown>).reason ||
          (zoomPayload as Record<string, unknown>).error ||
          (zoomPayload as Record<string, unknown>).message)) ||
      (lastError as Error)?.message ||
      'Unknown Zoom OAuth error';

    this.logger.error(
      'Failed to get Zoom Server-to-Server access token from all configured sources',
      zoomPayload || (lastError as Error)?.message,
    );

    const hasEnv = this.isCompleteCredentialSet(this.envCredentials);
    const hasDb = this.isCompleteCredentialSet(this.databaseCredentials);
    let hint =
      'Verify ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET match your activated Server-to-Server OAuth app in Zoom Marketplace.';
    if (hasEnv && hasDb) {
      hint +=
        ' Credentials exist in both Render env vars and the database — remove outdated ZOOM_* env vars on Render or re-save the correct values in Zoom Settings.';
    } else if (hasEnv) {
      hint += ' Update the ZOOM_* variables on Render (no quotes around values).';
    } else if (hasDb) {
      hint +=
        ' Re-save Account ID, Client ID, and Client Secret in Zoom Settings (Super Admin). The Client Secret field is required every time you save.';
    } else {
      hint += ' Add credentials in Zoom Settings (Super Admin) or set ZOOM_* on Render.';
    }

    throw new HttpException(
      `Zoom Server-to-Server authentication failed (${reason}). ${hint}`,
      HttpStatus.BAD_GATEWAY,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Per-teacher OAuth token management                                  */
  /* ------------------------------------------------------------------ */

  async getTeacherAccessToken(teacherId: string): Promise<string | null> {
    const integration = await this.getTeacherIntegration(teacherId);
    if (!integration || integration.connectionStatus !== 'connected') {
      return null;
    }

    if (!integration.accessTokenEncrypted && !integration.refreshTokenEncrypted) {
      return null;
    }

    if (integration.tokenExpiresAt && new Date() < integration.tokenExpiresAt) {
      const decrypted = this.encryptionService.decrypt(integration.accessTokenEncrypted);
      if (decrypted) return decrypted;
    }

    return this.refreshTeacherToken(integration);
  }

  async refreshTeacherToken(integration: ZoomIntegration): Promise<string | null> {
    const oauthClientId = this.resolveOAuthClientId();
    const oauthClientSecret = this.resolveOAuthClientSecret();
    if (!oauthClientId || !oauthClientSecret) {
      return null;
    }

    const refreshToken = this.encryptionService.decrypt(integration.refreshTokenEncrypted);
    if (!refreshToken) {
      return null;
    }

    const credentials = Buffer.from(`${oauthClientId}:${oauthClientSecret}`).toString('base64');

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          'https://zoom.us/oauth/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }).toString(),
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const newAccessToken = this.encryptionService.encrypt(data.access_token) || data.access_token;
      const newRefreshToken = data.refresh_token
        ? this.encryptionService.encrypt(data.refresh_token) || data.refresh_token
        : integration.refreshTokenEncrypted;

      integration.accessTokenEncrypted = newAccessToken;
      integration.refreshTokenEncrypted = newRefreshToken;
      integration.tokenExpiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
      await this.zoomIntegrationRepository.save(integration);

      return data.access_token;
    } catch (error) {
      this.logger.error(
        `Zoom token refresh failed for teacher ${integration.teacherId}: ${error?.response?.data?.reason || error?.message}`,
      );
      return null;
    }
  }

  private resolveOAuthClientId(): string {
    return (
      this.configService.get<string>('ZOOM_OAUTH_CLIENT_ID') ||
      process.env.ZOOM_OAUTH_CLIENT_ID ||
      this.clientId ||
      ''
    );
  }

  private resolveOAuthClientSecret(): string {
    return (
      this.configService.get<string>('ZOOM_OAUTH_CLIENT_SECRET') ||
      process.env.ZOOM_OAUTH_CLIENT_SECRET ||
      this.clientSecret ||
      ''
    );
  }

  async verifyPlatformAuth(): Promise<{ ok: true; source: 'env' | 'database' }> {
    await this.getAccessToken();
    const source = this.lastSuccessfulCredentialSource || this.credentialsSource;
    return {
      ok: true,
      source: source === 'database' ? 'database' : 'env',
    };
  }

  private async zoomRequest<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.getAccessToken();
    return this.zoomRequestWithToken<T>(method, path, token, body);
  }

  private async zoomRequestWithToken<T>(
    method: HttpMethod,
    path: string,
    token: string,
    body?: unknown,
  ): Promise<T> {
    const url = path.startsWith('http')
      ? path
      : `${this.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

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
    topic: string,
    startTime: Date,
    durationMinutes: number,
    teacherId?: string,
  ): Promise<ZoomMeetingResult> {
    let token: string;

    if (teacherId) {
      const teacherToken = await this.getTeacherAccessToken(teacherId);
      if (teacherToken) {
        token = teacherToken;
      } else {
        this.assertPlatformConfigured();
        token = await this.getAccessToken();
      }
    } else {
      this.assertPlatformConfigured();
      token = await this.getAccessToken();
    }

    const meeting = await this.zoomRequestWithToken<{
      id: number;
      uuid: string;
      join_url: string;
      start_url: string;
      password?: string;
    }>('POST', '/users/me/meetings', token, {
      topic,
      type: 2,
      start_time: startTime.toISOString(),
      duration: durationMinutes || 60,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        approval_type: 2,
        audio: 'both',
        auto_recording: 'none',
        waiting_room: false,
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
    return (
      this.isCompleteCredentialSet(this.envCredentials) ||
      this.isCompleteCredentialSet(this.databaseCredentials) ||
      !!(this.accountId && this.clientId && this.clientSecret)
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
    activeSource: 'env' | 'database' | 'none';
    envConfigured: boolean;
    databaseConfigured: boolean;
    credentialsConflict: boolean;
    databaseSecretReadable: boolean;
    accountId: string | null;
    clientId: string | null;
    hasClientSecret: boolean;
    hasSecretToken: boolean;
  } {
    const envConfigured = this.isCompleteCredentialSet(this.envCredentials);
    const databaseConfigured = this.isCompleteCredentialSet(this.databaseCredentials);
    const credentialsConflict =
      envConfigured &&
      databaseConfigured &&
      this.envCredentials!.clientId !== this.databaseCredentials!.clientId;

    return {
      configured: this.isPlatformConfigured(),
      source: this.credentialsSource,
      activeSource: this.lastSuccessfulCredentialSource || this.credentialsSource,
      envConfigured,
      databaseConfigured,
      credentialsConflict,
      databaseSecretReadable: databaseConfigured,
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
  }): Promise<{ configured: boolean; source: 'database'; zoomAuthVerified: boolean }> {
    const accountId = this.sanitizeCredential(input.accountId);
    const clientId = this.sanitizeCredential(input.clientId);
    const clientSecret = this.sanitizeCredential(input.clientSecret);

    if (!accountId || !clientId) {
      throw new HttpException('Account ID and Client ID are required', HttpStatus.BAD_REQUEST);
    }

    let row = await this.platformConfigRepository.findOne({ where: { id: PLATFORM_CONFIG_ID } });
    if (!row) {
      row = this.platformConfigRepository.create({ id: PLATFORM_CONFIG_ID });
    }

    const existingSecret = row ? this.readStoredClientSecret(row) : null;

    if (!clientSecret && !existingSecret) {
      throw new HttpException(
        'Client Secret is required. Enter the secret from your Zoom Server-to-Server OAuth app.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const effectiveSecret = clientSecret || existingSecret!;

    row.accountId = accountId;
    row.clientId = clientId;
    row.clientSecret = effectiveSecret;
    if (clientSecret) {
      row.clientSecretEncrypted = this.encryptionService.encrypt(clientSecret) ?? clientSecret;
    }
    if (input.secretToken !== undefined) {
      const token = this.sanitizeCredential(input.secretToken);
      row.secretTokenEncrypted = token
        ? this.encryptionService.encrypt(token) ?? token
        : null;
    }

    await this.platformConfigRepository.save(row);

    this.databaseCredentials = { accountId, clientId, clientSecret: effectiveSecret };
    this.applyCredentialSet(this.databaseCredentials, 'database');
    this.accessToken = null;
    this.tokenExpiresAt = null;

    await this.verifyPlatformAuth();

    return { configured: true, source: 'database', zoomAuthVerified: true };
  }

  getWebhookSecretToken(): string {
    return (
      this.secretToken ||
      this.configService.get<string>('ZOOM_WEBHOOK_SECRET_TOKEN')?.trim() ||
      process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() ||
      ''
    );
  }

  /** Meeting SDK app key — same as ZOOM_CLIENT_ID or ZOOM_OAUTH_CLIENT_ID. */
  getOAuthClientId(): string | null {
    return this.resolveOAuthClientId() || null;
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

  async getUserZakToken(zoomUserIdOrEmail: string): Promise<string | null> {
    try {
      const resolved = await this.resolveZoomUser(
        zoomUserIdOrEmail,
        zoomUserIdOrEmail.includes('@') ? zoomUserIdOrEmail : undefined,
      );
      const data = await this.zoomRequest<{ token?: string }>(
        'GET',
        `/users/${this.encodeZoomUserId(resolved.id)}/token?type=zak`,
      );
      return data.token || null;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch ZAK token for ${zoomUserIdOrEmail}: ${(error as Error).message}`,
      );
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
    return this.pathEncodingsForUserId(userId)[0];
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Gmail treats dots in the local part as equivalent — try both forms. */
  private emailLookupKeys(email: string): string[] {
    const normalized = this.normalizeEmail(email);
    const keys = new Set<string>([normalized]);

    const [localPart, domain] = normalized.split('@');
    if (!localPart || !domain) return [...keys];

    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      const dotlessLocal = localPart.replace(/\./g, '');
      keys.add(`${dotlessLocal}@gmail.com`);
      keys.add(`${dotlessLocal}@googlemail.com`);
    }

    return [...keys];
  }

  private pathEncodingsForUserId(userId: string): string[] {
    const trimmed = userId.trim();
    if (!trimmed.includes('@')) {
      return [encodeURIComponent(trimmed)];
    }

    const email = this.normalizeEmail(trimmed);
    const encodings = new Set<string>();
    encodings.add(encodeURIComponent(email));
    encodings.add(email.replace('@', '%40'));
    // Some Zoom accounts accept the raw email in the path when using regional API hosts.
    encodings.add(email);
    return [...encodings];
  }

  private parseAccessTokenScopes(): string[] {
    try {
      const token = this.accessToken;
      if (!token) return [];
      const parts = token.split('.');
      if (parts.length < 2) return [];
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
      );
      const scope = String(payload?.scope || '');
      return scope.split(/\s+/).filter(Boolean);
    } catch {
      return [];
    }
  }

  private async assertUserReadScope(): Promise<void> {
    await this.getAccessToken();
    const scopes = this.parseAccessTokenScopes();
    if (scopes.length === 0) return;

    const canReadUsers = scopes.some(
      (scope) =>
        scope === 'user:read:admin' ||
        scope === 'user:read' ||
        scope.startsWith('user:read:'),
    );

    if (!canReadUsers) {
      throw new HttpException(
        'Your Zoom app is missing the user:read:admin scope. In Zoom Marketplace → your Server-to-Server OAuth app → Scopes, add user:read:admin and meeting:write:admin, activate the app, then try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async listAccountUsers(): Promise<
    Array<{ id: string; email: string; status?: string; displayName?: string }>
  > {
    this.assertPlatformConfigured();
    await this.assertUserReadScope();

    const users: Array<{ id: string; email: string; status?: string; displayName?: string }> =
      [];
    const statuses = ['active', 'pending', 'inactive'] as const;

    for (const status of statuses) {
      let nextPageToken: string | undefined;
      let pages = 0;

      do {
        const params = new URLSearchParams({ status, page_size: '300' });
        if (nextPageToken) params.set('next_page_token', nextPageToken);

        const result = await this.zoomRequestSoft<{
          users?: Array<{
            id: string;
            email: string;
            status?: string;
            display_name?: string;
            first_name?: string;
            last_name?: string;
          }>;
          next_page_token?: string;
        }>('GET', `/users?${params.toString()}`);

        if (result.ok === false) {
          if (result.status === 403) {
    throw new HttpException(
              'Zoom denied listing users. Add the user:read:admin scope to your Server-to-Server OAuth app and activate it.',
              HttpStatus.BAD_GATEWAY,
            );
          }
          break;
        }

        for (const user of result.data.users || []) {
          if (!user.id || !user.email) continue;
          users.push({
            id: user.id,
            email: user.email,
            status: user.status || status,
            displayName:
              user.display_name ||
              [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
              undefined,
          });
        }

        nextPageToken = result.data.next_page_token;
        pages += 1;
      } while (nextPageToken && pages < 50);
    }

    return users.sort((a, b) => a.email.localeCompare(b.email));
  }

  private async findZoomUserBySearchKey(
    email: string,
  ): Promise<{ id: string; email: string } | null> {
    const searchTerms = [...new Set([email, email.split('@')[0], ...this.emailLookupKeys(email)])];

    for (const term of searchTerms) {
      if (!term || term.length < 3) continue;

      const params = new URLSearchParams({
        search_key: term,
        page_size: '50',
        status: 'active',
      });

      const result = await this.zoomRequestSoft<{
        users?: Array<{ id: string; email: string }>;
      }>('GET', `/users?${params.toString()}`);

      if (!result.ok || !result.data.users?.length) continue;

      const match = result.data.users.find(
        (user) => user.email && this.emailsMatch(user.email, email),
      );
      if (match) return { id: match.id, email: match.email };
    }

    return null;
  }

  private suggestAccountEmails(
    targetEmail: string,
    accountUsers: Array<{ id: string; email: string; displayName?: string }>,
  ): string[] {
    const targetLocal = targetEmail.split('@')[0]?.replace(/\./g, '').toLowerCase() || '';
    if (!targetLocal) return [];

    const suggestions = accountUsers
      .filter((user) => {
        const local = user.email.split('@')[0]?.replace(/\./g, '').toLowerCase() || '';
        return (
          local.includes(targetLocal) ||
          targetLocal.includes(local) ||
          user.email.toLowerCase().includes(targetLocal)
        );
      })
      .map((user) => user.email);

    return [...new Set(suggestions)].slice(0, 5);
  }

  private async zoomRequestSoft<T>(
    method: HttpMethod,
    path: string,
  ): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
    const token = await this.getAccessToken();
    const url = path.startsWith('http')
      ? path
      : `${this.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
        }),
      );
      return { ok: true, data: response.data as T };
    } catch (error) {
      const status = error?.response?.status ?? HttpStatus.BAD_GATEWAY;
      const message =
        (error?.response?.data?.message as string | undefined) ||
        error?.message ||
        'Zoom API request failed';
      return { ok: false, status, message };
    }
  }

  private async fetchZoomUserByPath(
    identifier: string,
  ): Promise<{ id: string; email: string; type?: number } | null> {
    for (const encoded of this.pathEncodingsForUserId(identifier)) {
      const result = await this.zoomRequestSoft<{
        id: string;
        email: string;
        type?: number;
      }>('GET', `/users/${encoded}`);

      if (result.ok && result.data?.id) {
      return {
          id: result.data.id,
          email: result.data.email,
          type: result.data.type,
        };
      }

      if (result.ok === false) {
        if (result.status === 403) {
        throw new HttpException(
            'Zoom API denied user lookup. Add the user:read:admin scope to your Server-to-Server OAuth app and activate it.',
            HttpStatus.BAD_GATEWAY,
          );
        }
        continue;
      }
    }

    return null;
  }

  /** Zoom user type 2 = Licensed (can host meetings). */
  private static readonly ZOOM_LICENSED_USER_TYPE = 2;

  async verifyLicensedZoomUserByEmail(
    email: string,
  ): Promise<{ id: string; email: string }> {
    this.assertPlatformConfigured();
    await this.assertUserReadScope();

    const normalizedEmail = this.normalizeEmail(email);
    let zoomUser: { id: string; email: string; type?: number } | null = null;

    for (const candidate of this.emailLookupKeys(normalizedEmail)) {
      zoomUser = await this.fetchZoomUserByPath(candidate);
      if (zoomUser) break;
    }

    if (!zoomUser) {
      try {
        const resolved = await this.resolveZoomUser(normalizedEmail);
        zoomUser = await this.fetchZoomUserByPath(resolved.id);
        if (!zoomUser) {
          zoomUser = { id: resolved.id, email: resolved.email };
        }
      } catch {
      throw new HttpException(
          'Your email is not registered as a licensed Zoom user. Please contact your admin.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (zoomUser.type === undefined) {
      const details = await this.fetchZoomUserByPath(zoomUser.id);
      if (details?.type !== undefined) {
        zoomUser.type = details.type;
      }
    }

    if (zoomUser.type !== undefined && zoomUser.type !== ZoomService.ZOOM_LICENSED_USER_TYPE) {
      throw new HttpException(
        'Your email is not registered as a licensed Zoom user. Please contact your admin.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { id: zoomUser.id, email: zoomUser.email };
  }

  async connectTeacherWithNejahEmail(
    teacherId: string,
    nejahEmail: string,
  ): Promise<{ connected: true; email: string }> {
    const email = this.sanitizeCredential(nejahEmail);
    if (!email || !email.includes('@')) {
      throw new HttpException('Teacher account email is missing or invalid', HttpStatus.BAD_REQUEST);
    }

    // No Zoom API call — S2S OAuth creates meetings at session time using this email.
    await this.saveTeacherIntegration(teacherId, email, email);

    return {
      connected: true,
      email,
    };
  }

  async getTeacherConnectionStatus(
    teacherId: string,
    fallbackEmail?: string,
  ): Promise<{
    connected: boolean;
    email: string | null;
    zoomUserId: string | null;
    connectedAt: Date | null;
  }> {
    const integration = await this.getTeacherIntegration(teacherId);
    const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });

    const connected =
      integration?.connectionStatus === 'connected' || teacher?.zoomConnected === true;

    if (!connected) {
      return {
        connected: false,
        email: fallbackEmail || teacher?.email || null,
        zoomUserId: null,
        connectedAt: null,
      };
    }

    return {
      connected: true,
      email: integration?.zoomEmail || teacher?.zoomEmail || fallbackEmail || teacher?.email || null,
      zoomUserId: integration?.zoomUserId || teacher?.zoomUserId || null,
      connectedAt: integration?.connectedAt || teacher?.zoomConnectedAt || null,
    };
  }

  private emailsMatch(left: string, right: string): boolean {
    const leftKeys = new Set(this.emailLookupKeys(left));
    return this.emailLookupKeys(right).some((key) => leftKeys.has(key));
  }

  private async scanUsersInAccount(
    targetEmail: string,
  ): Promise<{ id: string; email: string } | null> {
    const statuses = ['active', 'pending', 'inactive'] as const;
    let nextPageToken: string | undefined;
    let pagesScanned = 0;
    const maxPages = 20;

    for (const status of statuses) {
      nextPageToken = undefined;
      pagesScanned = 0;

      do {
        const params = new URLSearchParams({
          status,
          page_size: '300',
        });
        if (nextPageToken) {
          params.set('next_page_token', nextPageToken);
        }

        const result = await this.zoomRequestSoft<{
          users?: Array<{ id: string; email: string }>;
          next_page_token?: string;
        }>('GET', `/users?${params.toString()}`);

        if (result.ok === false) {
          if (result.status === 403) {
            throw new HttpException(
              'Zoom API denied user listing. Add the user:read:admin scope to your Server-to-Server OAuth app and activate it.',
              HttpStatus.BAD_GATEWAY,
            );
          }
          this.logger.warn(
            `Zoom user list failed (status=${status}, page=${pagesScanned + 1}): ${result.message}`,
          );
          break;
        }

        const match = result.data.users?.find(
          (user) => user.email && this.emailsMatch(user.email, targetEmail),
        );
        if (match) {
          return { id: match.id, email: match.email };
        }

        nextPageToken = result.data.next_page_token;
        pagesScanned += 1;
      } while (nextPageToken && pagesScanned < maxPages);
    }

      return null;
  }

  async resolveZoomUser(
    identifier: string,
    fallbackEmail?: string,
  ): Promise<{ id: string; email: string }> {
    this.assertPlatformConfigured();
    await this.assertUserReadScope();

    const rawCandidates = [identifier, fallbackEmail]
      .map((value) => value?.trim())
      .filter(Boolean) as string[];
    const seen = new Set<string>();
    const candidates: string[] = [];

    for (const candidate of rawCandidates) {
      if (!candidate.includes('@')) {
        if (!seen.has(candidate.toLowerCase())) {
          seen.add(candidate.toLowerCase());
          candidates.push(candidate);
        }
        continue;
      }
      for (const variant of this.emailLookupKeys(candidate)) {
        const key = variant.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(variant);
      }
    }

    for (const candidate of candidates) {
      const direct = await this.fetchZoomUserByPath(candidate);
      if (direct) return direct;
    }

    const emailCandidates = [...new Set(rawCandidates.filter((c) => c.includes('@')))];
    for (const email of emailCandidates) {
      const fromSearch = await this.findZoomUserBySearchKey(email);
      if (fromSearch) return fromSearch;
    }

    for (const email of emailCandidates) {
      const fromList = await this.scanUsersInAccount(email);
      if (fromList) return fromList;
    }

    let accountUsers: Array<{ id: string; email: string; displayName?: string }> = [];
    try {
      accountUsers = await this.listAccountUsers();
    } catch (error) {
      if (error instanceof HttpException) throw error;
    }

    const primaryEmail = emailCandidates[0] || identifier;
    const suggestions = this.suggestAccountEmails(primaryEmail, accountUsers);
    const tried = emailCandidates.length ? emailCandidates.join(', ') : candidates.join(', ');

    if (accountUsers.length === 0) {
      throw new HttpException(
        `Zoom user not found for "${tried}" and no users were returned from your Zoom account. ` +
          'Add the teacher as a licensed user in Zoom Admin → Users (same account as your Server-to-Server app), then link again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const suggestionText = suggestions.length
      ? ` Similar emails on your Zoom account: ${suggestions.join(', ')}.`
      : accountUsers.length <= 8
        ? ` Licensed emails on your Zoom account: ${accountUsers.map((u) => u.email).join(', ')}.`
        : ` Your Zoom account has ${accountUsers.length} users — open Zoom Admin → Users to confirm the exact email.`;

    throw new HttpException(
      `Zoom user not found for "${tried}". The teacher must exist as a licensed user in Zoom Admin → Users on the same account as your Server-to-Server OAuth app.${suggestionText}`,
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

    const saved = await this.zoomIntegrationRepository.save(integration);
    await this.syncTeacherZoomFields(teacherId, {
      zoomConnected: true,
      zoomEmail,
      zoomUserId,
      zoomConnectedAt: saved.connectedAt,
    });

    return saved;
  }

  async syncTeacherZoomFields(
    teacherId: string,
    fields: {
      zoomConnected: boolean;
      zoomEmail: string | null;
      zoomUserId: string | null;
      zoomConnectedAt: Date | null;
    },
  ): Promise<void> {
    await this.teacherRepository.update(teacherId, fields);
  }

  async disconnectTeacher(teacherId: string): Promise<ZoomIntegration | null> {
    const integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });

    if (integration) {
    integration.connectionStatus = 'disconnected';
    integration.disconnectedAt = new Date();
      await this.zoomIntegrationRepository.save(integration);
    }

    await this.syncTeacherZoomFields(teacherId, {
      zoomConnected: false,
      zoomEmail: null,
      zoomUserId: null,
      zoomConnectedAt: null,
    });

    return integration;
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
