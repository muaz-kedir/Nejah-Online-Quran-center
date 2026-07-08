import * as crypto from 'crypto';
import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  Res,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response, Request } from 'express';
import { ZoomService } from './zoom.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { EncryptionService } from '../common/encryption.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

const ZOOM_OAUTH_STATE_PREFIX = 'zst_';

@Controller('zoom-oauth')
export class ZoomOAuthController {
  private readonly stateCache = new Map<string, { teacherId: string; expiresAt: number }>();

  constructor(
    private readonly zoomService: ZoomService,
    private readonly teachersService: TeachersService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
  ) {}

  private getOAuthClientId(): string {
    const id =
      this.configService.get<string>('ZOOM_OAUTH_CLIENT_ID') ||
      this.configService.get<string>('ZOOM_CLIENT_ID') ||
      process.env.ZOOM_OAUTH_CLIENT_ID ||
      process.env.ZOOM_CLIENT_ID ||
      '';
    if (!id) throw new HttpException('ZOOM_OAUTH_CLIENT_ID is not configured', HttpStatus.BAD_REQUEST);
    return id;
  }

  private getOAuthClientSecret(): string {
    const secret =
      this.configService.get<string>('ZOOM_OAUTH_CLIENT_SECRET') ||
      this.configService.get<string>('ZOOM_CLIENT_SECRET') ||
      process.env.ZOOM_OAUTH_CLIENT_SECRET ||
      process.env.ZOOM_CLIENT_SECRET ||
      '';
    if (!secret) throw new HttpException('ZOOM_OAUTH_CLIENT_SECRET is not configured', HttpStatus.BAD_REQUEST);
    return secret;
  }

  private getRedirectUri(): string {
    return (
      this.configService.get<string>('ZOOM_OAUTH_REDIRECT_URI') ||
      process.env.ZOOM_OAUTH_REDIRECT_URI ||
      ''
    );
  }

  /**
   * Step 1: Redirect teacher to Zoom's OAuth consent page.
   */
  @Get('authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async authorize(@CurrentUser() user: { id: string }, @Res() res: Response) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);

    const clientId = this.getOAuthClientId();
    const redirectUri = this.getRedirectUri();
    if (!redirectUri) {
      throw new HttpException(
        'ZOOM_OAUTH_REDIRECT_URI is not configured. Set it to your callback URL (e.g. https://yourdomain.com/api/zoom-oauth/callback).',
        HttpStatus.BAD_REQUEST,
      );
    }

    const state = `${ZOOM_OAUTH_STATE_PREFIX}${crypto.randomUUID()}`;
    this.stateCache.set(state, {
      teacherId: teacher.id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authorizeUrl = new URL('https://zoom.us/oauth/authorize');
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('state', state);

    return res.redirect(authorizeUrl.toString());
  }

  /**
   * Step 2: Zoom redirects here after user authorizes.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const getFrontendUrl = (): string => {
      return (
        this.configService.get<string>('FRONTEND_URL') ||
        process.env.FRONTEND_URL ||
        (req.headers.referer ? new URL(req.headers.referer).origin : null) ||
        (req.headers.origin ? req.headers.origin : null) ||
        '/'
      );
    };

    if (error) {
      return res.redirect(
        `${getFrontendUrl()}/zoom-settings?zoom_oauth=error&reason=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !state) {
      throw new HttpException('Missing authorization code or state parameter', HttpStatus.BAD_REQUEST);
    }

    const cached = this.stateCache.get(state);
    if (!cached || cached.expiresAt < Date.now()) {
      throw new HttpException('Invalid or expired state parameter', HttpStatus.BAD_REQUEST);
    }
    this.stateCache.delete(state);

    const clientId = this.getOAuthClientId();
    const clientSecret = this.getOAuthClientSecret();
    const redirectUri = this.getRedirectUri();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    let tokenData: { access_token: string; refresh_token: string; expires_in: number };
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          'https://zoom.us/oauth/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }).toString(),
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      tokenData = data;
    } catch (err) {
      const message = err?.response?.data?.reason || err?.response?.data?.error || err?.message || 'Zoom OAuth token exchange failed';
      return res.redirect(
        `${getFrontendUrl()}/zoom-settings?zoom_oauth=error&reason=${encodeURIComponent(message)}`,
      );
    }

    const accessTokenEncrypted = this.encryptionService.encrypt(tokenData.access_token) || tokenData.access_token;
    const refreshTokenEncrypted = this.encryptionService.encrypt(tokenData.refresh_token) || tokenData.refresh_token;
    const tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in - 60) * 1000);

    let integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId: cached.teacherId },
    });
    if (!integration) {
      integration = this.zoomIntegrationRepository.create({ teacherId: cached.teacherId });
    }

    integration.accessTokenEncrypted = accessTokenEncrypted;
    integration.refreshTokenEncrypted = refreshTokenEncrypted;
    integration.tokenExpiresAt = tokenExpiresAt;
    integration.connectionStatus = 'connected';
    integration.connectedAt = new Date();
    integration.disconnectedAt = null;

    const saved = await this.zoomIntegrationRepository.save(integration);

    // Get the Zoom user info to store email/zoomUserId
    try {
      const userInfo = await this.getZoomUserInfo(tokenData.access_token);
      if (userInfo?.id) {
        saved.zoomUserId = userInfo.id;
      }
      if (userInfo?.email) {
        saved.zoomEmail = userInfo.email;
      }
      if (userInfo?.display_name) {
        saved.displayName = userInfo.display_name;
      }
      await this.zoomIntegrationRepository.save(saved);
    } catch {
      /* non-fatal — we can resolve the user later */
    }

    // Sync to teacher entity
    await this.zoomService.syncTeacherZoomFields(cached.teacherId, {
      zoomConnected: true,
      zoomEmail: saved.zoomEmail || null,
      zoomUserId: saved.zoomUserId || null,
      zoomConnectedAt: saved.connectedAt,
    });

    return res.redirect(`${getFrontendUrl()}/zoom-settings?zoom_oauth=success`);
  }

  /**
   * Disconnect teacher's Zoom OAuth integration.
   */
  @Delete('disconnect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async disconnect(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId: teacher.id },
    });

    if (integration) {
      // Try to revoke the Zoom token
      const clientId = this.getOAuthClientId();
      const clientSecret = this.getOAuthClientSecret();
      const token = this.encryptionService.decrypt(integration.accessTokenEncrypted) || integration.accessTokenEncrypted;
      if (token) {
        try {
          const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
          await firstValueFrom(
            this.httpService.post(
              'https://zoom.us/oauth/revoke',
              new URLSearchParams({ token }).toString(),
              {
                headers: {
                  Authorization: `Basic ${credentials}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              },
            ),
          );
        } catch {
          /* non-fatal */
        }
      }

      integration.accessTokenEncrypted = null;
      integration.refreshTokenEncrypted = null;
      integration.tokenExpiresAt = null;
      integration.connectionStatus = 'disconnected';
      integration.disconnectedAt = new Date();
      await this.zoomIntegrationRepository.save(integration);
    }

    await this.zoomService.syncTeacherZoomFields(teacher.id, {
      zoomConnected: false,
      zoomEmail: null,
      zoomUserId: null,
      zoomConnectedAt: null,
    });

    return { connected: false };
  }

  /**
   * Get the current OAuth connection status for the authenticated teacher.
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async getStatus(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId: teacher.id },
    });

    if (!integration || integration.connectionStatus !== 'connected') {
      return { connected: false, email: null, zoomUserId: null };
    }

    return {
      connected: true,
      email: integration.zoomEmail || null,
      zoomUserId: integration.zoomUserId || null,
      displayName: integration.displayName || null,
      connectedAt: integration.connectedAt,
    };
  }

  private async getZoomUserInfo(accessToken: string): Promise<{ id: string; email: string; display_name?: string } | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get('https://api.zoom.us/v2/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return data || null;
    } catch {
      return null;
    }
  }
}
