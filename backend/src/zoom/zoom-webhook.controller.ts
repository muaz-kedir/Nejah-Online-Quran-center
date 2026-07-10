import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomService } from './zoom.service';
import { Request } from 'express';
import * as crypto from 'crypto';

type ZoomWebhookBody = {
  event?: string;
  payload?: Record<string, unknown>;
  event_ts?: number | string;
};

@Controller('zoom')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);

  constructor(
    private readonly zoomWebhookService: ZoomWebhookService,
    private readonly zoomService: ZoomService,
  ) {}

  @Get('webhook')
  webhookChallenge() {
    return { status: 'active' };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: false,
    }),
  )
  async handleWebhook(
    @Body() body: ZoomWebhookBody,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const event = body?.event || '';
    const payload = body?.payload || {};

    // Zoom endpoint URL validation — respond immediately (no signature check)
    if (event === 'endpoint.url_validation') {
      const plainToken = payload.plainToken as string | undefined;
      if (!plainToken) {
        this.logger.warn('endpoint.url_validation missing plainToken');
        return { plainToken: '', encryptedToken: '' };
      }

      const secretToken = this.zoomService.getWebhookSecretToken();
      if (!secretToken) {
        this.logger.warn(
          'endpoint.url_validation received but ZOOM_WEBHOOK_SECRET_TOKEN is not set',
        );
        return { plainToken, encryptedToken: '' };
      }

      const encryptedToken = crypto
        .createHmac('sha256', secretToken)
        .update(plainToken)
        .digest('hex');

      this.logger.log('Zoom endpoint.url_validation challenge answered');
      return { plainToken, encryptedToken };
    }

    const signature = headers['x-zm-signature'] || headers['x-zm-signature'.toLowerCase()] || '';
    const timestamp = headers['x-zm-request-timestamp'] || headers['x-zm-request-timestamp'.toLowerCase()];

    const rawBody = this.getRawBody(req);
    if (!this.verifyWebhookSignature(rawBody, signature, timestamp)) {
      this.logger.warn(`Webhook signature verification failed for event: ${event}`);
      return { status: 'rejected' };
    }

    this.logger.log(`Webhook signature verified for event: ${event}`);

    const eventId = (payload?.object as { id?: string | number } | undefined)?.id
      ? `${event}_${(payload.object as { id: string | number }).id}_${payload.event_ts || body.event_ts || Date.now()}`
      : undefined;

    setImmediate(() => {
      this.zoomWebhookService
        .handleWebhook(event, payload, eventId)
        .catch((error: Error) => {
          this.logger.error(
            `Background webhook processing error: ${error.message}`,
            error.stack,
          );
        });
    });

    return { status: 'success' };
  }

  private getRawBody(req: Request & { rawBody?: Buffer }): string {
    if (req.rawBody) {
      return Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : String(req.rawBody);
    }
    this.logger.warn('rawBody missing — webhook signature verification may fail');
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
