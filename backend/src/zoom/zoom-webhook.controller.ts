import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomService } from './zoom.service';
import { ZoomWebhookDto } from './dto/zoom-webhook.dto';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async handleWebhook(
    @Body() body: ZoomWebhookDto,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const event = body.event;
    const payload = body.payload;

    // Handle Zoom endpoint URL validation challenge FIRST
    if (event === 'endpoint.url_validation') {
      const plainToken = (payload as any)?.plainToken;
      if (plainToken) {
        const secretToken = this.zoomService.getWebhookSecretToken();
        if (!secretToken) {
          this.logger.warn('endpoint.url_validation received but ZOOM_WEBHOOK_SECRET_TOKEN is not set');
          return { plainToken, encryptedToken: '' };
        }
        const encryptedToken = crypto
          .createHmac('sha256', secretToken)
          .update(plainToken)
          .digest('hex');
        this.logger.log('✓ endpoint.url_validation responded successfully');
        return { plainToken, encryptedToken };
      }
    }

    // Verify signature for all other events
    const signature = headers['x-zm-signature'] || '';
    const timestamp = headers['x-zm-request-timestamp'];

    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(body);
    
    const isValid = this.verifyWebhookSignature(rawBody, signature, timestamp);
    
    if (!isValid) {
      this.logger.warn(
        `Webhook signature verification failed for event: ${event}`,
      );
      // Zoom requires 200 status even on rejection
      return { status: 'rejected', message: 'Invalid signature' };
    }

    this.logger.log(`✓ Webhook signature verified for event: ${event}`);

    // Acknowledge immediately and process in background
    const eventId = (payload as any)?.object?.id
      ? `${event}_${(payload as any).object.id}_${(payload as any).event_ts || Date.now()}`
      : undefined;

    // Process webhook asynchronously
    setImmediate(() => {
      this.zoomWebhookService
        .handleWebhook(event, payload, eventId)
        .catch((error) => {
          this.logger.error(
            `Background webhook processing error: ${error.message}`,
            error.stack,
          );
        });
    });

    // Return success immediately
    return { status: 'success', message: 'Webhook received' };
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

    if (!signatureHeader || !timestampHeader) {
      this.logger.warn('Missing signature or timestamp header');
      return false;
    }

    try {
      // Zoom signature format: v0=<hmac_sha256>
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

      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(actual),
      );
    } catch (error) {
      this.logger.error('Signature verification error:', error);
      return false;
    }
  }
}
