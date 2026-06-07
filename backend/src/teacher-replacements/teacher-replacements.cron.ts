import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TeacherReplacementsService } from './teacher-replacements.service';

@Injectable()
export class TeacherReplacementsCron {
  constructor(private readonly replacementsService: TeacherReplacementsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleLifecycle() {
    await this.replacementsService.processLifecycle();
  }
}
