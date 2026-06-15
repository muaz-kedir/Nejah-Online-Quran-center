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

    const isValid = this.zoomService.verifyWebhookSignature(
      body as unknown as Record<string, unknown>,
      signature,
      timestamp,
    );
    if (!isValid) {
      this.logger.warn('Invalid webhook signature received');
      return { status: false, message: 'Invalid signature' };
    }

    const event = body.event;
    const payload = body.payload;

    if (event === 'endpoint.url_validation') {
      const plainToken = (payload as any)?.plainToken;
      if (plainToken) {
        const hashForVerify = crypto
          .createHmac('sha256', (this.zoomService as any).secretToken || '')
          .update(plainToken)
          .digest('hex');
        return { plainToken, encryptedToken: hashForVerify };
      }
    }

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
