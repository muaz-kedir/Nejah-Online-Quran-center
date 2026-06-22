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
        health: '/api/health',
        docs: '/api',
      },
    };
  }
}
