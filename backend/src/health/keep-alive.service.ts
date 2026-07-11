import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /** Ping /health so Render free tier stays awake.
   *  Uses RENDER_EXTERNAL_URL (automatically set by Render) so the request
   *  arrives from outside the instance, preventing Render from spinning it down.
   *  Falls back to localhost in case the env var isn't available. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async pingHealth() {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return;
    }

    const externalUrl = process.env.RENDER_EXTERNAL_URL;
    if (!externalUrl) {
      this.logger.warn('RENDER_EXTERNAL_URL not set — cannot keep alive from outside');
      return;
    }

    const healthUrl = `${externalUrl.replace(/\/$/, '')}/health`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(healthUrl, { timeout: 10000 }),
      );

      if (response.data?.status === 'ok') {
        this.logger.log('Keep-alive ping successful');
      }
    } catch (error) {
      this.logger.warn(
        `Keep-alive ping failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
