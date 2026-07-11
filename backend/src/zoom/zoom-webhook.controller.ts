import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomService } from './zoom.service';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Controller('zoom')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);

  constructor(
    private readonly zoomWebhookService: ZoomWebhookService,
    private readonly zoomService: ZoomService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
  ) {
    const event = body?.event || '';
    const payload = body?.payload || {};

    this.logger.log(`Webhook event received: ${event}`);

    // URL validation (fallback if raw middleware didn't handle it, e.g. in tests)
    if (event === 'endpoint.url_validation') {
      const plainToken = payload?.plainToken as string | undefined;

      this.logger.log(`endpoint.url_validation - plainToken: ${plainToken}`);

      if (!plainToken) {
        this.logger.warn('endpoint.url_validation missing plainToken');
        return res.status(200).json({ plainToken: '', encryptedToken: '' });
      }

      const secretToken =
        this.zoomService.getWebhookSecretToken()?.trim() || '';

      if (!secretToken) {
        this.logger.warn('ZOOM_WEBHOOK_SECRET_TOKEN is not set');
        return res.status(200).json({ plainToken, encryptedToken: '' });
      }

      const encryptedToken = crypto
        .createHmac('sha256', secretToken)
        .update(plainToken)
        .digest('hex');

      this.logger.log(`secretToken length: ${secretToken.length}`);
      this.logger.log(`secretToken (first 4): ${secretToken.substring(0, 4)}`);
      this.logger.log(`secretToken (last 4): ${secretToken.substring(Math.max(0, secretToken.length - 4))}`);
      this.logger.log(`encryptedToken: ${encryptedToken}`);

      const responseBody = { plainToken, encryptedToken };
      this.logger.log(`responseBody: ${JSON.stringify(responseBody)}`);

      return res
        .status(200)
        .set('Content-Type', 'application/json')
        .json(responseBody);
    }

    // Signature verification for all other events
    const signature =
      headers['x-zm-signature'] ||
      headers['x-zm-signature'.toLowerCase()] ||
      '';
    const timestamp =
      headers['x-zm-request-timestamp'] ||
      headers['x-zm-request-timestamp'.toLowerCase()];

    const rawBody = this.getRawBody(req);
    if (!this.verifyWebhookSignature(rawBody, signature, timestamp)) {
      this.logger.warn(`Signature verification failed for event: ${event}`);
      return res.status(200).json({ status: 'rejected' });
    }

    this.logger.log(`Signature verified for event: ${event}`);

    const eventId = (payload?.object as { id?: string | number } | undefined)
      ?.id
      ? `${event}_${(payload.object as { id: string | number }).id}_${payload.event_ts || body.event_ts || Date.now()}`
      : undefined;

    setImmediate(() => {
      this.zoomWebhookService
        .handleWebhook(event, payload, eventId)
        .catch((error: Error) => {
          this.logger.error(
            `Background webhook error: ${error.message}`,
            error.stack,
          );
        });
    });

    return res.status(200).json({ status: 'success' });
  }

  private getRawBody(req: Request & { rawBody?: Buffer }): string {
    if (req.rawBody) {
      return Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : String(req.rawBody);
    }
    this.logger.warn('rawBody missing');
    return '';
  }

  private verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    timestampHeader?: string,
  ): boolean {
    const secretToken = this.zoomService.getWebhookSecretToken();

    if (!secretToken) {
      this.logger.warn('ZOOM_WEBHOOK_SECRET_TOKEN not configured, skipping verification');
      return true;
    }

    if (!rawBody || !signatureHeader || !timestampHeader) {
      this.logger.warn('Missing raw body, signature, or timestamp header');
      return false;
    }

    try {
      const message = `v0:${timestampHeader}:${rawBody}`;
      const expectedHash = crypto
        .createHmac('sha256', secretToken)
        .update(message)
        .digest('hex');
      const expected = `v0=${expectedHash}`;
      const actual = signatureHeader.trim();

      if (actual.length !== expected.length) {
        return false;
      }

      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
    } catch (error) {
      this.logger.error('Signature verification error:', error);
      return false;
    }
  }
}
