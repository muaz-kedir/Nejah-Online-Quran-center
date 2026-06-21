import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomService } from './zoom.service';
import { ZoomWebhookDto } from './dto/zoom-webhook.dto';
import { Throttle } from '@nestjs/throttler';
import * as crypto from 'crypto';

@Controller('zoom/webhook')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);

  constructor(
    private readonly zoomWebhookService: ZoomWebhookService,
    private readonly zoomService: ZoomService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async handleWebhook(@Body() body: ZoomWebhookDto, @Headers() headers: Record<string, string>) {
    const signature =
      headers['x-zm-signature'] || headers['authorization'] || '';
    const timestamp = headers['x-zm-request-timestamp'];

    const event = body.event;
    const payload = body.payload;

    // endpoint.url_validation must run BEFORE signature check because Zoom
    // sends this without a signature header during initial verification.
    if (event === 'endpoint.url_validation') {
      const plainToken = (payload as any)?.plainToken;
      if (plainToken) {
        const secretToken = this.zoomService.getWebhookSecretToken();
        if (!secretToken) {
          this.logger.warn('endpoint.url_validation received but ZOOM_WEBHOOK_SECRET_TOKEN is not set');
          return { status: false, message: 'Webhook secret not configured' };
        }
        const hashForVerify = crypto
          .createHmac('sha256', secretToken)
          .update(plainToken)
          .digest('hex');
        this.logger.log('endpoint.url_validation — responding with encryptedToken');
        return { plainToken, encryptedToken: hashForVerify };
      }
    }

    const isValid = this.zoomService.verifyWebhookSignature(
      body as unknown as Record<string, unknown>,
      signature,
      timestamp,
    );
    if (!isValid) {
      this.logger.warn({ event, signaturePresent: !!signature, timestampPresent: !!timestamp }, 'Webhook signature verification failed');
      return { status: false, message: 'Invalid signature' };
    }
    this.logger.log({ event }, 'Webhook signature verified');

    const eventId = (payload as any)?.object?.id
      ? `${event}_${(payload as any).object.id}_${(payload as any).event_ts || Date.now()}`
      : undefined;

    try {
      await this.zoomWebhookService.handleWebhook(event, payload, eventId);
      return { status: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      return { status: false, message: 'Processing error' };
    }
  }
}
