import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

@Controller('monitoring/health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    await this.dataSource.query('SELECT 1');
    return {
      status: 'ok',
      database: 'connected',
      features: {
        websiteCms: true,
      },
    };
  }
}
