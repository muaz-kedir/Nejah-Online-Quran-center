import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ScheduleSessionGeneratorService } from './schedule-session-generator.service';
import { AttendanceReconciliationService } from './attendance-reconciliation.service';
import { LiveSessionService } from './live-session.service';
import { LiveSession } from './entities/live-session.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class ScheduleSessionsCron {
  private readonly logger = new Logger(ScheduleSessionsCron.name);
  private readonly REMINDER_MINUTES = [15];
  private notifiedSessions = new Set<string>();

  constructor(
    private readonly generator: ScheduleSessionGeneratorService,
    private readonly liveSessionService: LiveSessionService,
    private readonly reconciliationService: AttendanceReconciliationService,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateWeeklySessions() {
    try {
      await this.generator.generateUpcomingSessions(7);
    } catch (error) {
      this.logger.error(`Weekly session generation failed: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async ensureTodaySessions() {
    try {
      await this.generator.generateUpcomingSessions(0);
      await this.generator.resyncScheduledSessionsForToday();
    } catch (error) {
      this.logger.error(`Today session generation failed: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireStaleScheduledSessions() {
    try {
      const count = await this.liveSessionService.expireStaleSessions();
      if (count > 0) {
        this.logger.log(`Auto-expired ${count} stale session(s) after grace window`);
      }
    } catch (error) {
      this.logger.error(`Stale session expiry cron failed: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryPendingReconciliations() {
    try {
      await this.reconciliationService.processPendingReconciliations();
    } catch (error) {
      this.logger.error(`Reconciliation retry cron failed: ${error.message}`, error.stack);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendClassReminders() {
    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);

    try {
      const soonSessions = await this.liveSessionRepository.find({
        where: {
          status: LiveSessionStatus.SCHEDULED,
          scheduledStart: Between(now, in15Min),
        },
        relations: ['teacher'],
      });

      for (const session of soonSessions) {
        const reminderKey = `${session.id}_15min`;
        if (this.notifiedSessions.has(reminderKey)) continue;

        const studentUserIds = await this.resolveStudentUserIds(session);
        const recipientIds = [...studentUserIds];

        if (recipientIds.length > 0) {
          await this.notificationsService.sendCustomNotifications(
            recipientIds,
            'Class Starts Soon',
            `Your class "${session.schedule?.className || 'Quran Class'}" with ${session.teacher?.fullName || 'your teacher'} starts in 15 minutes. Join link: ${session.zoomJoinUrl || 'Available in session'}`,
            {
              sessionId: session.id,
              joinUrl: session.zoomJoinUrl,
              scheduledStart: session.scheduledStart,
              type: 'class_reminder',
            },
          );
          this.logger.log(`Sent 15-min reminder for session ${session.id}`);
        }

        this.notifiedSessions.add(reminderKey);
      }

      if (this.notifiedSessions.size > 1000) {
        this.notifiedSessions.clear();
      }
    } catch (error) {
      this.logger.error(`Class reminder cron failed: ${error.message}`, error.stack);
    }
  }

  private async resolveStudentUserIds(session: LiveSession): Promise<string[]> {
    if (!session.studentId) return [];
    const student = await this.studentRepository.findOne({
      where: { id: session.studentId },
    });
    if (student?.userId) return [student.userId];
    return [];
  }
}
