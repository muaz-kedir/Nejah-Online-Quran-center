import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import * as crypto from 'crypto';

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
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private apiBaseUrl = 'https://api.zoom.us/v2';

  private clientId = '';
  private clientSecret = '';
  private secretToken = '';

  private oauthService: import('./zoom-oauth.service').ZoomOAuthService | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
  ) {
    this.clientId = process.env.ZOOM_CLIENT_ID?.trim() || process.env.ZOOM_OAUTH_CLIENT_ID?.trim() || '';
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim() || process.env.ZOOM_OAUTH_CLIENT_SECRET?.trim() || '';
    this.secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() || '';
  }

  /**
   * Inject ZoomOAuthService after module init to avoid circular dependency.
   * Called by the module bootstrap or can be set manually.
   */
  setOAuthService(oauthService: import('./zoom-oauth.service').ZoomOAuthService): void {
    this.oauthService = oauthService;
  }

  /* ------------------------------------------------------------------ */
  /*  OAuth access token — teacher-specific                               */
  /* ------------------------------------------------------------------ */

  /**
   * Retrieve a valid Zoom OAuth access token for a specific teacher.
   * Handles token refresh automatically if the token is expired.
   *
   * Returns null if the teacher has no stored tokens or refresh fails.
   */
  async getTeacherAccessToken(teacherId: string): Promise<string | null> {
    if (!this.oauthService) {
      this.logger.warn('ZoomOAuthService not injected — cannot retrieve teacher access token');
      return null;
    }

    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId, connectionStatus: 'connected' },
    });

    if (!integration?.id) {
      return null;
    }

    const token = await this.oauthService.getValidAccessToken(integration.id);

    // If we had stored tokens but couldn't get a valid one, refresh failed → disconnect
    if (!token && integration.accessTokenEncrypted && integration.refreshTokenEncrypted) {
      this.logger.warn(
        `Token refresh failed for teacher ${teacherId} — marking as disconnected`,
      );
      await this.disconnectTeacher(teacherId);
    }

    return token;
  }

  /**
   * Retrieve a valid access token or throw a user-friendly error.
   * Use this in service methods that require Zoom API access.
   */
  async requireTeacherAccessToken(teacherId: string): Promise<string> {
    const token = await this.getTeacherAccessToken(teacherId);
    if (!token) {
      throw new BadRequestException(
        'Zoom account is not connected. Please connect your Zoom account in Settings before creating classes.',
      );
    }
    return token;
  }

  /**
   * Retrieve any valid access token from any connected teacher.
   * Used by admin endpoints that need Zoom API access (user listing, etc.).
   * Returns null if no teacher has valid tokens.
   */
  async getAnyValidAccessToken(): Promise<string | null> {
    if (!this.oauthService) return null;

    const integration = await this.zoomIntegrationRepository.findOne({
      where: { connectionStatus: 'connected' },
    });

    if (!integration?.id) return null;

    return this.oauthService.getValidAccessToken(integration.id);
  }

  /* ------------------------------------------------------------------ */
  /*  Zoom HTTP helpers                                                   */
  /* ------------------------------------------------------------------ */

  private async zoomRequest<T>(
    method: HttpMethod,
    path: string,
    accessToken: string,
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
            Authorization: `Bearer ${accessToken}`,
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

  private async zoomRequestSoft<T>(
    method: HttpMethod,
    path: string,
    accessToken: string,
  ): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
    const url = path.startsWith('http')
      ? path
      : `${this.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          headers: {
            Authorization: `Bearer ${accessToken}`,
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

  /* ------------------------------------------------------------------ */
  /*  Platform config status (OAuth not yet implemented)                  */
  /* ------------------------------------------------------------------ */

  /**
   * Whether the Zoom platform has at least one connected teacher with valid tokens.
   */
  isPlatformConfigured(): boolean {
    // Synchronous check — we can't await here, so check DB synchronously
    // This is a known limitation; callers that need accuracy should check
    // getAnyValidAccessToken() instead.
    return this.oauthService !== null;
  }

  /** Whether the Meeting SDK credentials are available for JWT signing. */
  isSdkConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /* ------------------------------------------------------------------ */
  /*  Meetings & registrants                                              */
  /* ------------------------------------------------------------------ */

  async createMeeting(
    topic: string,
    startTime: Date,
    durationMinutes: number,
    accessToken: string,
  ): Promise<ZoomMeetingResult> {
    const meeting = await this.zoomRequest<{
      id: number;
      uuid: string;
      join_url: string;
      start_url: string;
      password?: string;
    }>('POST', '/users/me/meetings', accessToken, {
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
    accessToken: string,
  ): Promise<string> {
    const data = await this.zoomRequest<{ join_url?: string }>(
      'POST',
      `/meetings/${meetingId}/registrants`,
      accessToken,
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
    accessToken: string,
  ): Promise<ZoomReportParticipant[]> {
    const encodedUUID = encodeURIComponent(encodeURIComponent(meetingUUID));
    const data = await this.zoomRequest<{ participants?: ZoomReportParticipant[] }>(
      'GET',
      `/report/meetings/${encodedUUID}/participants?page_size=300`,
      accessToken,
    );

    return data.participants || [];
  }

  async updateMeeting(
    zoomMeetingId: string,
    updateData: Record<string, unknown>,
    accessToken: string,
  ): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (updateData.topic) payload.topic = updateData.topic;
    if (updateData.startTime) {
      payload.start_time = new Date(updateData.startTime as string | Date).toISOString();
      payload.type = 2;
    }
    if (updateData.durationMinutes) payload.duration = updateData.durationMinutes;
    if (updateData.settings) payload.settings = updateData.settings;

    await this.zoomRequest('PATCH', `/meetings/${zoomMeetingId}`, accessToken, payload);
  }

  async deleteMeeting(zoomMeetingId: string, accessToken: string): Promise<void> {
    await this.zoomRequest('DELETE', `/meetings/${zoomMeetingId}`, accessToken);
  }

  async getMeeting(zoomMeetingId: string, accessToken: string): Promise<Record<string, unknown> | null> {
    try {
      return await this.zoomRequest<Record<string, unknown>>(
        'GET',
        `/meetings/${zoomMeetingId}`,
        accessToken,
      );
    } catch {
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Webhook secret                                                      */
  /* ------------------------------------------------------------------ */

  getWebhookSecretToken(): string {
    return (
      this.secretToken ||
      this.configService.get<string>('ZOOM_WEBHOOK_SECRET_TOKEN')?.trim() ||
      process.env.ZOOM_WEBHOOK_SECRET_TOKEN?.trim() ||
      ''
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Meeting SDK (JWT signing) — does NOT require OAuth access token     */
  /* ------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------ */
  /*  ZAK token (requires OAuth access token)                             */
  /* ------------------------------------------------------------------ */

  async getUserZakToken(zoomUserIdOrEmail: string, accessToken: string): Promise<string | null> {
    try {
      const resolved = await this.resolveZoomUser(
        zoomUserIdOrEmail,
        zoomUserIdOrEmail.includes('@') ? zoomUserIdOrEmail : undefined,
        accessToken,
      );
      const data = await this.zoomRequest<{ token?: string }>(
        'GET',
        `/users/${this.encodeZoomUserId(resolved.id)}/token?type=zak`,
        accessToken,
      );
      return data.token || null;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch ZAK token for ${zoomUserIdOrEmail}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Teacher host mapping                                                */
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
    encodings.add(email);
    return [...encodings];
  }

  private emailsMatch(left: string, right: string): boolean {
    const leftKeys = new Set(this.emailLookupKeys(left));
    return this.emailLookupKeys(right).some((key) => leftKeys.has(key));
  }

  /* ------------------------------------------------------------------ */
  /*  User resolution (requires OAuth access token)                       */
  /* ------------------------------------------------------------------ */

  async listAccountUsers(
    accessToken: string,
  ): Promise<
    Array<{ id: string; email: string; status?: string; displayName?: string }>
  > {
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
        }>('GET', `/users?${params.toString()}`, accessToken);

        if (result.ok === false) {
          if (result.status === 403) {
            throw new HttpException(
              'Zoom denied listing users. Ensure your OAuth app has the user:read:admin scope.',
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
    accessToken: string,
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
      }>('GET', `/users?${params.toString()}`, accessToken);

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

  private async fetchZoomUserByPath(
    identifier: string,
    accessToken: string,
  ): Promise<{ id: string; email: string; type?: number } | null> {
    for (const encoded of this.pathEncodingsForUserId(identifier)) {
      const result = await this.zoomRequestSoft<{
        id: string;
        email: string;
        type?: number;
      }>('GET', `/users/${encoded}`, accessToken);

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
            'Zoom API denied user lookup. Ensure your OAuth app has the user:read:admin scope.',
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
    accessToken: string,
  ): Promise<{ id: string; email: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    let zoomUser: { id: string; email: string; type?: number } | null = null;

    for (const candidate of this.emailLookupKeys(normalizedEmail)) {
      zoomUser = await this.fetchZoomUserByPath(candidate, accessToken);
      if (zoomUser) break;
    }

    if (!zoomUser) {
      try {
        const resolved = await this.resolveZoomUser(normalizedEmail, undefined, accessToken);
        zoomUser = await this.fetchZoomUserByPath(resolved.id, accessToken);
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
      const details = await this.fetchZoomUserByPath(zoomUser.id, accessToken);
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

  private async scanUsersInAccount(
    targetEmail: string,
    accessToken: string,
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
        }>('GET', `/users?${params.toString()}`, accessToken);

        if (result.ok === false) {
          if (result.status === 403) {
            throw new HttpException(
              'Zoom API denied user listing. Ensure your OAuth app has the user:read:admin scope.',
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
    fallbackEmail: string | undefined,
    accessToken: string,
  ): Promise<{ id: string; email: string }> {
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
      const direct = await this.fetchZoomUserByPath(candidate, accessToken);
      if (direct) return direct;
    }

    const emailCandidates = [...new Set(rawCandidates.filter((c) => c.includes('@')))];
    for (const email of emailCandidates) {
      const fromSearch = await this.findZoomUserBySearchKey(email, accessToken);
      if (fromSearch) return fromSearch;
    }

    for (const email of emailCandidates) {
      const fromList = await this.scanUsersInAccount(email, accessToken);
      if (fromList) return fromList;
    }

    let accountUsers: Array<{ id: string; email: string; displayName?: string }> = [];
    try {
      accountUsers = await this.listAccountUsers(accessToken);
    } catch (error) {
      if (error instanceof HttpException) throw error;
    }

    const primaryEmail = emailCandidates[0] || identifier;
    const suggestions = this.suggestAccountEmails(primaryEmail, accountUsers);
    const tried = emailCandidates.length ? emailCandidates.join(', ') : candidates.join(', ');

    if (accountUsers.length === 0) {
      throw new HttpException(
        `Zoom user not found for "${tried}" and no users were returned from your Zoom account. ` +
          'Add the teacher as a licensed user in Zoom Admin → Users, then link again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const suggestionText = suggestions.length
      ? ` Similar emails on your Zoom account: ${suggestions.join(', ')}.`
      : accountUsers.length <= 8
        ? ` Licensed emails on your Zoom account: ${accountUsers.map((u) => u.email).join(', ')}.`
        : ` Your Zoom account has ${accountUsers.length} users — open Zoom Admin → Users to confirm the exact email.`;

    throw new HttpException(
      `Zoom user not found for "${tried}". The teacher must exist as a licensed user in Zoom Admin → Users.${suggestionText}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  async connectTeacherWithNejahEmail(
    teacherId: string,
    nejahEmail: string,
  ): Promise<{ connected: true; email: string }> {
    const email = nejahEmail?.trim();
    if (!email || !email.includes('@')) {
      throw new HttpException('Teacher account email is missing or invalid', HttpStatus.BAD_REQUEST);
    }

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

  async connectTeacherIntegration(
    teacherId: string,
    zoomUserIdOrEmail: string,
    zoomEmail: string | undefined,
    accessToken: string,
  ): Promise<ZoomIntegration> {
    const identifier = zoomUserIdOrEmail?.trim();
    if (!identifier) {
      throw new HttpException('Zoom User ID or email is required', HttpStatus.BAD_REQUEST);
    }

    const resolved = await this.resolveZoomUser(identifier, zoomEmail, accessToken);
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

  async checkZoomConnectionHealth(teacherId: string, accessToken?: string): Promise<{
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

    if (!accessToken) {
      return {
        connected: true,
        platformConfigured: false,
        apiReachable: false,
        zoomEmail: integration.zoomEmail,
      };
    }

    try {
      await this.resolveZoomUser(integration.zoomUserId, integration.zoomEmail, accessToken);
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

  async getZoomUser(zoomUserId: string, accessToken: string): Promise<Record<string, unknown> | null> {
    try {
      const resolved = await this.resolveZoomUser(zoomUserId, undefined, accessToken);
      return { id: resolved.id, email: resolved.email };
    } catch {
      return null;
    }
  }
}
