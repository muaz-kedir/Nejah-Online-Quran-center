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

  /** Ping /health every 10 minutes so Render free tier stays awake. */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async pingHealth() {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return;
    }

    const port = process.env.PORT || this.configService.get<string>('PORT') || '3000';
    const healthUrl = `http://127.0.0.1:${port}/health`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(healthUrl, { timeout: 5000 }),
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
