import { Controller, Get, UseGuards, Res, Query, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ZoomOAuthService } from './zoom-oauth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { TeachersService } from '../teachers/teachers.service';
import { ZoomService } from './zoom.service';

@Controller('zoom/oauth')
export class ZoomOAuthController {
  constructor(
    private readonly zoomOAuthService: ZoomOAuthService,
    private readonly zoomService: ZoomService,
    private readonly teachersService: TeachersService,
  ) {}

  /**
   * Step 1: Teacher clicks "Connect Zoom" in the frontend.
   *
   * Generates a secure OAuth state, stores the teacher ID in it,
   * and returns the Zoom authorization URL for the frontend to redirect to.
   *
   * GET /api/zoom/oauth/connect
   */
  @Get('connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async getConnectUrl(@CurrentUser() user: { id: string }) {
    const teacher = await this.teachersService.resolveAuthenticatedTeacher(user.id);
    const state = this.zoomOAuthService.createOAuthState(teacher.id);
    const url = this.zoomOAuthService.getAuthorizationUrl(state);

    return { url };
  }

  /**
   * Step 2: Zoom redirects back to this callback after teacher approves/denies.
   *
   * This endpoint is PUBLIC (no JWT) — security comes from the state parameter.
   *
   * GET /api/zoom/oauth/callback?code=xxxxx&state=yyyyy
   * GET /api/zoom/oauth/callback?error=access_denied&state=yyyyy
   */
  @Get('callback')
  @Public()
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    // Handle user denying authorization
    if (error) {
      const redirectUrl = this.zoomOAuthService.getFrontendRedirectUrl(false);
      return res.redirect(redirectUrl);
    }

    if (!code || !state) {
      const redirectUrl = this.zoomOAuthService.getFrontendRedirectUrl(false);
      return res.redirect(redirectUrl);
    }

    try {
      // Validate state (CSRF protection) and get teacherId
      const teacherId = this.zoomOAuthService.validateOAuthState(state);

      // Complete the OAuth flow: exchange code, fetch profile, store tokens
      await this.zoomOAuthService.completeOAuthFlow(code, teacherId);

      // Sync teacher entity zoom fields
      const integration = await this.zoomService.getTeacherIntegration(teacherId);
      if (integration) {
        await this.zoomService.syncTeacherZoomFields(teacherId, {
          zoomConnected: true,
          zoomEmail: integration.zoomEmail || null,
          zoomUserId: integration.zoomUserId || null,
          zoomConnectedAt: integration.connectedAt || null,
        });
      }

      const redirectUrl = this.zoomOAuthService.getFrontendRedirectUrl(true);
      return res.redirect(redirectUrl);
    } catch (err) {
      this.logger.error(`OAuth callback failed: ${err.message}`, err.stack);
      const redirectUrl = this.zoomOAuthService.getFrontendRedirectUrl(false);
      return res.redirect(redirectUrl);
    }
  }

  private readonly logger = new Logger(ZoomOAuthController.name);
}
