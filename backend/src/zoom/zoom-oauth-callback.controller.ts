import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ZoomService } from './zoom.service';
import { getFrontendUrl } from '../config/frontend-url';

/**
 * Public OAuth callback — Zoom redirects here without a JWT.
 * Kept separate from ZoomSettingsController so JwtAuthGuard is not applied.
 */
@Controller('zoom-settings/oauth')
export class ZoomOAuthCallbackController {
  constructor(private readonly zoomService: ZoomService) {}

  @Get('callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = getFrontendUrl();

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/zoom-settings?zoom=error&message=Missing authorization code`);
    }

    try {
      const tokens = await this.zoomService.exchangeAuthorizationCode(code);
      const userInfo = await this.zoomService.fetchOAuthUserInfo(tokens.access_token);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await this.zoomService.saveOAuthIntegration(state, userInfo, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
      });

      return res.redirect(`${frontendUrl}/zoom-settings?zoom=connected`);
    } catch (error) {
      const message = error?.message || 'Authorization failed';
      return res.redirect(
        `${frontendUrl}/zoom-settings?zoom=error&message=${encodeURIComponent(message)}`,
      );
    }
  }
}
