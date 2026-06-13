import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomService } from './zoom.service';

@Controller('zoom/webhook')
export class ZoomWebhookController {
  private readonly logger = new Logger(ZoomWebhookController.name);

  constructor(
    private readonly zoomWebhookService: ZoomWebhookService,
    private readonly zoomService: ZoomService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ) {
    const isValid = this.zoomService.verifyWebhookSignature(body, authHeader || '');
    if (!isValid) {
      this.logger.warn('Invalid webhook signature received');
      return { status: false, message: 'Invalid signature' };
    }

    const event = body.event;
    const payload = body.payload;

    if (event === 'endpoint.url_validation') {
      const plainToken = payload?.plainToken;
      if (plainToken) {
        const crypto = require('crypto');
        const hashForVerify = crypto.createHmac('sha256', this.zoomService['secretToken'] || '').update(plainToken).digest('hex');
        return { plainToken, encryptedToken: hashForVerify };
      }
    }

    try {
      await this.zoomWebhookService.handleWebhook(event, payload);
      return { status: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      return { status: false, message: 'Processing error' };
    }
  }
}
