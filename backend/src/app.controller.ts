import { Controller, Get } from '@nestjs/common';

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
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
