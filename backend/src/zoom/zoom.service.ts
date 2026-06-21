import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
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

@Injectable()
export class ZoomService implements OnModuleInit {
  private readonly logger = new Logger(ZoomService.name);
  private readonly baseUrl = 'https://api.zoom.us/v2';
  private cachedToken: { accessToken: string; expiresAt: number } | null = null;

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
    this.cachedToken = null;

    const envAccountId = this.configService.get<string>('ZOOM_ACCOUNT_ID')?.trim() || '';
    const envClientId = this.configService.get<string>('ZOOM_CLIENT_ID')?.trim() || '';
    const envClientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET')?.trim() || '';
    const envSecretToken = this.configService.get<string>('ZOOM_SECRET_TOKEN')?.trim() || '';

    if (envAccountId && envClientId && envClientSecret) {
      this.accountId = envAccountId;
      this.clientId = envClientId;
      this.clientSecret = envClientSecret;
      this.secretToken = envSecretToken;
      this.credentialsSource = 'env';
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
      this.secretToken = stored.secretTokenEncrypted
        ? this.encryptionService.decrypt(stored.secretTokenEncrypted)?.trim() || ''
        : '';
      this.credentialsSource = this.clientSecret ? 'database' : 'none';
      return;
    }

    this.accountId = '';
    this.clientId = '';
    this.clientSecret = '';
    this.secretToken = '';
    this.credentialsSource = 'none';
  }

  isPlatformConfigured(): boolean {
    return !!(this.accountId && this.clientId && this.clientSecret);
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

  /** OAuth Client ID — also used as Meeting SDK appKey for embedded classroom JWTs. */
  getOAuthClientId(): string | null {
    return this.clientId || null;
  }

  /* ------------------------------------------------------------------ */
  /*  User-facing OAuth (authorization_code grant)                       */
  /* ------------------------------------------------------------------ */

  getZoomOAuthClientId(): string {
    return (
      this.configService.get<string>('ZOOM_OAUTH_CLIENT_ID')?.trim() ||
      this.clientId
    );
  }

  getZoomOAuthClientSecret(): string {
    return (
      this.configService.get<string>('ZOOM_OAUTH_CLIENT_SECRET')?.trim() ||
      this.clientSecret
    );
  }

  getZoomOAuthRedirectUri(): string {
    const explicit = this.configService.get<string>('ZOOM_OAUTH_REDIRECT_URI')?.trim();
    if (explicit) return explicit;

    const backendUrl =
      this.configService.get<string>('BACKEND_URL')?.trim() ||
      this.configService.get<string>('API_BASE_URL')?.trim();
    if (backendUrl) {
      const base = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const prefix = this.configService.get<string>('API_PREFIX') || 'api';
      return `${base}/${prefix}/zoom-settings/oauth/callback`;
    }

    return '';
  }

  assertOAuthConfiguredForAuthorize(): void {
    const clientId = this.getZoomOAuthClientId()?.trim();
    const redirectUri = this.getZoomOAuthRedirectUri()?.trim();

    if (!clientId) {
      throw new HttpException(
        'Zoom OAuth is not configured. Set ZOOM_OAUTH_CLIENT_ID (or ZOOM_CLIENT_ID) on the server.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!redirectUri) {
      throw new HttpException(
        'Zoom OAuth is not configured. Set ZOOM_OAUTH_REDIRECT_URI or BACKEND_URL on the server.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  getOAuthAuthorizationUrl(state: string): string {
    const clientId = this.getZoomOAuthClientId();
    const redirectUri = this.getZoomOAuthRedirectUri();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
    return `https://zoom.us/oauth/authorize?${params.toString()}`;
  }

  async exchangeAuthorizationCode(
    code: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number; scope?: string }> {
    const clientId = this.getZoomOAuthClientId();
    const clientSecret = this.getZoomOAuthClientSecret();
    const redirectUri = this.getZoomOAuthRedirectUri();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://zoom.us/oauth/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }),
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange Zoom authorization code', error?.response?.data || error.message);
      throw new HttpException(
        'Failed to complete Zoom authorization. Please try again.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async refreshTeacherOAuthToken(
    teacherId: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
    if (!integration?.refreshToken) {
      throw new HttpException(
        'No Zoom refresh token available. Please reconnect your Zoom account.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const clientId = this.getZoomOAuthClientId();
    const clientSecret = this.getZoomOAuthClientSecret();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const refreshToken = this.encryptionService.decrypt(integration.refreshToken);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://zoom.us/oauth/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);
      const encryptedAccess = this.encryptionService.encrypt(access_token);
      const encryptedRefresh = this.encryptionService.encrypt(refresh_token);

      await this.zoomIntegrationRepository.update(teacherId, {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
      });

      return { accessToken: access_token, refreshToken: refresh_token, expiresAt };
    } catch (error) {
      this.logger.error('Failed to refresh Zoom OAuth token', error.message);
      await this.disconnectTeacher(teacherId);
      throw new HttpException(
        'Zoom session expired. Please reconnect your Zoom account.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async fetchOAuthUserInfo(
    accessToken: string,
  ): Promise<{
    id: string;
    email: string;
    displayName: string;
    accountType: string;
    accountId?: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const data = response.data;
      return {
        id: data.id,
        email: data.email || '',
        displayName: data.display_name || data.first_name + ' ' + data.last_name || data.email,
        accountType: data.account_type === 1 ? 'Basic' : 'Licensed',
        accountId: data.account_id || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to fetch Zoom user info', error.message);
      throw new HttpException(
        'Failed to retrieve Zoom account information.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async saveOAuthIntegration(
    teacherId: string,
    userInfo: { id: string; email: string; displayName: string; accountType: string; accountId?: string },
    tokens: { accessToken: string; refreshToken: string; expiresAt: Date; scope?: string },
  ): Promise<ZoomIntegration> {
    const encryptedAccess = this.encryptionService.encrypt(tokens.accessToken);
    const encryptedRefresh = this.encryptionService.encrypt(tokens.refreshToken);

    let integration = await this.zoomIntegrationRepository.findOne({ where: { teacherId } });
    if (!integration) {
      integration = this.zoomIntegrationRepository.create({ teacherId });
    }

    integration.zoomUserId = userInfo.id;
    integration.zoomEmail = userInfo.email;
    integration.displayName = userInfo.displayName;
    integration.accountType = userInfo.accountType;
    integration.zoomAccountId = userInfo.accountId || null;
    integration.scope = tokens.scope || null;
    integration.accessToken = encryptedAccess;
    integration.refreshToken = encryptedRefresh;
    integration.tokenExpiresAt = tokens.expiresAt;
    integration.connectionStatus = 'connected';
    integration.connectedAt = new Date();

    return this.zoomIntegrationRepository.save(integration);
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
        'Zoom platform credentials are not configured. A super admin must add Server-to-Server OAuth credentials under Zoom Settings → Platform Configuration, or set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in the backend environment.',
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
    const identifier = zoomUserIdOrEmail?.trim();
    if (!identifier) {
      throw new HttpException('Zoom User ID or email is required', HttpStatus.BAD_REQUEST);
    }

    if (this.isPlatformConfigured()) {
      const resolved = await this.resolveZoomUser(identifier, zoomEmail);
      return this.saveTeacherIntegration(teacherId, resolved.id, resolved.email);
    }

    const email = (zoomEmail || (identifier.includes('@') ? identifier : '')).trim();
    if (!email) {
      throw new HttpException(
        'Zoom email is required when platform OAuth is not configured yet',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.saveTeacherIntegration(teacherId, identifier, email);
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

  async getTeacherIntegrationWithDecryptedTokens(teacherId: string): Promise<{
    integration: ZoomIntegration;
    decryptedAccessToken: string;
    decryptedRefreshToken: string | null;
  }> {
    const integration = await this.getTeacherIntegration(teacherId);
    if (!integration?.accessToken) {
      throw new HttpException('Zoom account not connected', HttpStatus.NOT_FOUND);
    }
    const decryptedAccessToken = this.encryptionService.decrypt(integration.accessToken);
    if (!decryptedAccessToken) {
      throw new HttpException('Failed to decrypt Zoom credentials', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const decryptedRefreshToken = integration.refreshToken
      ? this.encryptionService.decrypt(integration.refreshToken)
      : null;
    return { integration, decryptedAccessToken, decryptedRefreshToken };
  }

  async checkZoomConnectionHealth(teacherId: string): Promise<{
    connected: boolean;
    tokenExpired: boolean;
    tokenExpiresAt: Date | null;
    apiReachable: boolean;
  }> {
    const integration = await this.getTeacherIntegration(teacherId);
    if (!integration || integration.connectionStatus !== 'connected') {
      return { connected: false, tokenExpired: true, tokenExpiresAt: null, apiReachable: false };
    }

    const now = new Date();
    const tokenExpired = !integration.tokenExpiresAt || integration.tokenExpiresAt <= now;

    if (tokenExpired) {
      return {
        connected: true,
        tokenExpired: true,
        tokenExpiresAt: integration.tokenExpiresAt,
        apiReachable: false,
      };
    }

    try {
      const { decryptedAccessToken } = await this.getTeacherIntegrationWithDecryptedTokens(teacherId);
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${decryptedAccessToken}` },
          timeout: 5000,
        }),
      );
      return {
        connected: true,
        tokenExpired: false,
        tokenExpiresAt: integration.tokenExpiresAt,
        apiReachable: true,
      };
    } catch {
      return {
        connected: true,
        tokenExpired: false,
        tokenExpiresAt: integration.tokenExpiresAt,
        apiReachable: false,
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
}
