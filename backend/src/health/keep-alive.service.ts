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

  // Run every 10 minutes to keep Render service alive
  @Cron(CronExpression.EVERY_10_MINUTES)
  async pingHealth() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    // Only run on production (Render)
    if (nodeEnv !== 'production') {
      return;
    }

    try {
      const backendUrl =
        this.configService.get<string>('BACKEND_URL') ||
        this.configService.get<string>('API_BASE_URL') ||
        'https://nejah-online-quran-center.onrender.com';

      const apiPrefix = this.configService.get<string>('API_PREFIX') || 'api';
      const healthUrl = `${backendUrl}/${apiPrefix}/health`;

      const response = await firstValueFrom(
        this.httpService.get(healthUrl, { timeout: 5000 }),
      );

      if (response.data?.status === 'ok') {
        this.logger.log('✓ Keep-alive ping successful');
      }
    } catch (error) {
      this.logger.warn(`Keep-alive ping failed: ${error.message}`);
    }
  }
}
