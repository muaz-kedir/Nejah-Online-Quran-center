import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { EncryptionService } from '../common/encryption.service';
import { ZoomService } from './zoom.service';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type ZoomTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
};

type ZoomUserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  type: number;
  account_id: string;
};

type PendingOAuthState = {
  teacherId: string;
  createdAt: number;
};

@Injectable()
export class ZoomOAuthService implements OnModuleInit {
  private readonly logger = new Logger(ZoomOAuthService.name);

  /** In-memory store for pending OAuth state values. Keyed by state string. */
  private pendingStates = new Map<string, PendingOAuthState>();

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly zoomAuthUrl: string;
  private readonly zoomTokenUrl: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    private readonly encryptionService: EncryptionService,
    private readonly zoomService: ZoomService,
  ) {
    this.clientId = this.configService.get<string>('ZOOM_CLIENT_ID') || process.env.ZOOM_CLIENT_ID || process.env.ZOOM_OAUTH_CLIENT_ID || '';
    this.clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET') || process.env.ZOOM_CLIENT_SECRET || process.env.ZOOM_OAUTH_CLIENT_SECRET || '';
    this.redirectUri = this.configService.get<string>('ZOOM_REDIRECT_URI') || process.env.ZOOM_REDIRECT_URI || process.env.ZOOM_OAUTH_REDIRECT_URI || '';
    this.zoomAuthUrl = this.configService.get<string>('ZOOM_OAUTH_URL') || process.env.ZOOM_OAUTH_URL || 'https://zoom.us/oauth/authorize';
    this.zoomTokenUrl = this.configService.get<string>('ZOOM_TOKEN_URL') || process.env.ZOOM_TOKEN_URL || 'https://zoom.us/oauth/token';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:8080';
  }

  async onModuleInit(): Promise<void> {
    // Inject this service into ZoomService for token retrieval
    this.zoomService.setOAuthService(this);
  }

  /* ------------------------------------------------------------------ */
  /*  State management (CSRF protection)                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a cryptographically secure state value and store it
   * with the associated teacher ID for callback validation.
   */
  createOAuthState(teacherId: string): string {
    this.pruneExpiredStates();

    const state = crypto.randomBytes(32).toString('hex');
    this.pendingStates.set(state, {
      teacherId,
      createdAt: Date.now(),
    });

    return state;
  }

  /**
   * Validate and consume an OAuth state value.
   * Returns the teacherId if valid, throws if invalid.
   */
  validateOAuthState(state: string): string {
    if (!state) {
      throw new HttpException('Missing OAuth state parameter', HttpStatus.BAD_REQUEST);
    }

    const pending = this.pendingStates.get(state);
    if (!pending) {
      throw new HttpException(
        'Invalid or expired OAuth state. Please try connecting again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Consume the state (one-time use)
    this.pendingStates.delete(state);

    // Check expiry
    if (Date.now() - pending.createdAt > OAUTH_STATE_TTL_MS) {
      throw new HttpException(
        'OAuth state has expired. Please try connecting again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return pending.teacherId;
  }

  private pruneExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.pendingStates) {
      if (now - data.createdAt > OAUTH_STATE_TTL_MS) {
        this.pendingStates.delete(state);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Authorization URL generation                                        */
  /* ------------------------------------------------------------------ */

  getAuthorizationUrl(state: string): string {
    if (!this.clientId) {
      throw new HttpException(
        'Zoom OAuth is not configured. Set ZOOM_CLIENT_ID environment variable.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
    });

    const url = `${this.zoomAuthUrl}?${params.toString()}`;

    this.logger.log(
      `OAuth redirect: redirect_uri=${this.redirectUri} client_id=${this.clientId.slice(0, 6)}... hasScope=${false} hasState=${!!state}`,
    );

    return url;
  }

  /* ------------------------------------------------------------------ */
  /*  Token exchange                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Exchange an authorization code for OAuth tokens.
   */
  async exchangeCodeForTokens(code: string): Promise<ZoomTokenResponse> {
    this.assertConfigured();

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ZoomTokenResponse>(
          this.zoomTokenUrl,
          new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
          }).toString(),
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      if (!data?.access_token) {
        throw new Error('Zoom token response did not include access_token');
      }

      return data;
    } catch (error) {
      const zoomError = error?.response?.data;
      this.logger.error(
        'Zoom OAuth token exchange failed',
        zoomError || error.message,
      );
      throw new HttpException(
        `Failed to exchange authorization code: ${zoomError?.reason || zoomError?.error || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Token refresh                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Refresh an expired OAuth access token using the refresh token.
   */
  async refreshAccessToken(refreshToken: string): Promise<ZoomTokenResponse> {
    this.assertConfigured();

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ZoomTokenResponse>(
          this.zoomTokenUrl,
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

      if (!data?.access_token) {
        throw new Error('Zoom token refresh response did not include access_token');
      }

      return data;
    } catch (error) {
      const zoomError = error?.response?.data;
      this.logger.error(
        'Zoom OAuth token refresh failed',
        zoomError || error.message,
      );
      throw new HttpException(
        `Failed to refresh Zoom access token: ${zoomError?.reason || zoomError?.error || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Zoom user profile                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Fetch the authenticated Zoom user's profile using their access token.
   */
  async getZoomUserProfile(accessToken: string): Promise<ZoomUserProfile> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ZoomUserProfile>('https://api.zoom.us/v2/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      if (!data?.id) {
        throw new Error('Zoom profile response did not include user id');
      }

      return data;
    } catch (error) {
      const zoomError = error?.response?.data;
      this.logger.error(
        'Failed to fetch Zoom user profile',
        zoomError || error.message,
      );
      throw new HttpException(
        `Failed to retrieve Zoom user profile: ${zoomError?.message || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Token storage (encrypted)                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Store OAuth tokens for a teacher's Zoom integration.
   * Tokens are encrypted at rest using AES-256-GCM.
   */
  async storeTokens(
    integrationId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): Promise<void> {
    const encryptedAccess = this.encryptionService.encrypt(accessToken);
    const encryptedRefresh = this.encryptionService.encrypt(refreshToken);
    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000); // subtract 60s buffer

    await this.zoomIntegrationRepository.update(integrationId, {
      accessTokenEncrypted: encryptedAccess,
      refreshTokenEncrypted: encryptedRefresh,
      tokenExpiresAt: expiresAt,
    });
  }

  /**
   * Retrieve a valid (possibly refreshed) access token for a teacher.
   * Returns null if no tokens are stored or refresh fails.
   */
  async getValidAccessToken(integrationId: string): Promise<string | null> {
    const integration = await this.zoomIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration?.accessTokenEncrypted || !integration.refreshTokenEncrypted) {
      return null;
    }

    // Check if token is still valid (with 5-minute buffer)
    const bufferMs = 5 * 60 * 1000;
    if (integration.tokenExpiresAt && new Date() < new Date(integration.tokenExpiresAt.getTime() - bufferMs)) {
      const token = this.encryptionService.decrypt(integration.accessTokenEncrypted);
      return token;
    }

    // Token expired or about to expire — refresh
    this.logger.log(`Refreshing OAuth token for integration ${integrationId}`);
    const refreshToken = this.encryptionService.decrypt(integration.refreshTokenEncrypted);
    if (!refreshToken) {
      this.logger.warn(`Cannot decrypt refresh token for integration ${integrationId}`);
      return null;
    }

    try {
      const newTokens = await this.refreshAccessToken(refreshToken);
      await this.storeTokens(integrationId, newTokens.access_token, newTokens.refresh_token, newTokens.expires_in);
      return newTokens.access_token;
    } catch (error) {
      this.logger.error(`Token refresh failed for integration ${integrationId}: ${error.message}`);
      return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Complete OAuth flow                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Complete the full OAuth callback flow:
   * 1. Exchange code for tokens
   * 2. Fetch Zoom user profile
   * 3. Store tokens encrypted
   * 4. Update integration with Zoom user info
   */
  async completeOAuthFlow(
    code: string,
    teacherId: string,
  ): Promise<{ success: boolean; email: string }> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Fetch Zoom user profile
    const profile = await this.getZoomUserProfile(tokens.access_token);

    // Find or create integration record
    let integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId },
    });

    if (!integration) {
      integration = this.zoomIntegrationRepository.create({ teacherId });
    }

    // Update Zoom user info
    integration.zoomUserId = profile.id;
    integration.zoomEmail = profile.email;
    integration.displayName = `${profile.first_name} ${profile.last_name}`.trim();
    integration.accountType = String(profile.type);
    integration.zoomAccountId = profile.account_id;
    integration.connectionStatus = 'connected';
    integration.connectedAt = new Date();
    integration.disconnectedAt = null;

    const saved = await this.zoomIntegrationRepository.save(integration);

    // Store encrypted tokens
    await this.storeTokens(saved.id, tokens.access_token, tokens.refresh_token, tokens.expires_in);

    this.logger.log(
      `Teacher ${teacherId} connected Zoom account ${profile.email} (zoomUserId=${profile.id})`,
    );

    return { success: true, email: profile.email };
  }

  /* ------------------------------------------------------------------ */
  /*  Disconnect                                                         */
  /* ------------------------------------------------------------------ */

  async disconnect(teacherId: string): Promise<void> {
    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId },
    });

    if (!integration) return;

    integration.accessTokenEncrypted = null;
    integration.refreshTokenEncrypted = null;
    integration.tokenExpiresAt = null;
    integration.connectionStatus = 'disconnected';
    integration.disconnectedAt = new Date();

    await this.zoomIntegrationRepository.save(integration);
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  getFrontendRedirectUrl(connected: boolean): string {
    const base = this.frontendUrl.replace(/\/$/, '');
    return `${base}/settings/integrations?zoom=${connected ? 'connected' : 'failed'}`;
  }

  private assertConfigured(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new HttpException(
        'Zoom OAuth is not configured. Set ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
