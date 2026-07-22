import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TeacherReplacementsService } from './teacher-replacements.service';

@Injectable()
export class TeacherReplacementsCron {
  private readonly logger = new Logger(TeacherReplacementsCron.name);

  constructor(private readonly replacementsService: TeacherReplacementsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleLifecycle() {
    try {
      await this.replacementsService.processLifecycle();
    } catch (err: any) {
      this.logger.error(`Replacement lifecycle failed: ${err.message}`, err.stack);
    }
  }
}
