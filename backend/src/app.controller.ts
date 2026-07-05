import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Nejah Online Quran Center API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        apiHealth: '/api/monitoring/health',
        zoomWebhook: '/zoom/webhook',
      },
    };
  }

  @Get('health')
  @SkipThrottle()
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
