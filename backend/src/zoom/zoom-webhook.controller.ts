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

@SkipThrottle()
@Controller('zoom')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);

  constructor(
    private readonly zoomWebhookService: ZoomWebhookService,
    private readonly zoomService: ZoomService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: false,
    }),
  )
  async handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
  ) {
    const event = (body?.event as string) || '';
    const payload = (body?.payload as Record<string, unknown>) || {};

    this.logger.log(`Webhook event received: ${event}`);

    // URL validation (fallback if raw middleware didn't handle it, e.g. in tests)
    if (event === 'endpoint.url_validation') {
      return this.handleUrlValidation(payload);
    }

    const signature = headers['x-zm-signature'] || '';
    const timestamp = headers['x-zm-request-timestamp'];

    const rawBody = this.getRawBody(req);
    if (!this.verifyWebhookSignature(rawBody, signature, timestamp)) {
      this.logger.warn(`Signature verification failed for event: ${event}`);
      return res.status(200).json({ status: 'rejected' });
    }

    this.logger.log(`Signature verified for event: ${event}`);

    const eventId = this.buildEventId(event, body, payload);

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

  /* ------------------------------------------------------------------ */
  /*  URL validation (Zoom Event Subscription verification)              */
  /* ------------------------------------------------------------------ */

  private handleUrlValidation(payload: Record<string, unknown>) {
    const plainToken = payload.plainToken as string | undefined;
    if (!plainToken) {
      this.logger.warn('endpoint.url_validation missing plainToken');
      return { plainToken: '', encryptedToken: '' };
    }

    const secretToken = this.zoomService.getWebhookSecretToken();
    if (!secretToken) {
      this.logger.error(
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

  /* ------------------------------------------------------------------ */
  /*  Event ID generation for deduplication                              */
  /* ------------------------------------------------------------------ */

  private buildEventId(
    event: string,
    body: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): string | undefined {
    const object = payload?.object as Record<string, unknown> | undefined;
    const id = object?.id;
    if (!id) return undefined;

    const eventTs = payload.event_ts || (body as Record<string, unknown>).event_ts || Date.now();
    return `${event}_${String(id)}_${String(eventTs)}`;
  }

  /* ------------------------------------------------------------------ */
  /*  Raw body extraction                                                */
  /* ------------------------------------------------------------------ */

  private getRawBody(req: Request & { rawBody?: Buffer }): string {
    if (req.rawBody) {
      return Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : String(req.rawBody);
    }
    this.logger.warn('rawBody missing');
    return '';
  }

  /* ------------------------------------------------------------------ */
  /*  Signature verification (HMAC-SHA256)                               */
  /* ------------------------------------------------------------------ */

  private verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    timestampHeader?: string,
  ): boolean {
    const secretToken = this.zoomService.getWebhookSecretToken();

    if (!secretToken) {
      this.logger.error('ZOOM_WEBHOOK_SECRET_TOKEN not configured — rejecting webhook');
      return false;
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
