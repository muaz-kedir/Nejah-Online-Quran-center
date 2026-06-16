import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduleSessionGeneratorService } from './schedule-session-generator.service';

@Injectable()
export class ScheduleSessionsCron {
  private readonly logger = new Logger(ScheduleSessionsCron.name);

  constructor(private readonly generator: ScheduleSessionGeneratorService) {}

  /** Nightly: materialize sessions for the coming week from recurring schedules. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateWeeklySessions() {
    try {
      await this.generator.generateUpcomingSessions(7);
    } catch (error) {
      this.logger.error(`Weekly session generation failed: ${error.message}`, error.stack);
    }
  }

  /** Hourly: ensure today's sessions exist (covers new schedules created mid-day). */
  @Cron(CronExpression.EVERY_HOUR)
  async ensureTodaySessions() {
    try {
      await this.generator.generateUpcomingSessions(0);
    } catch (error) {
      this.logger.error(`Today session generation failed: ${error.message}`, error.stack);
    }
  }
}
