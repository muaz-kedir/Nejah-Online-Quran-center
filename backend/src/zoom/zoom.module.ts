import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ZoomService } from './zoom.service';
import { LiveSessionService } from './live-session.service';
import { SessionAttendanceService } from './session-attendance.service';
import { SessionNoteService } from './session-note.service';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomAnalyticsService } from './zoom-analytics.service';
import { LiveSessionController } from './live-session.controller';
import { SessionNoteController } from './session-note.controller';
import { ZoomWebhookController } from './zoom-webhook.controller';
import { ZoomSettingsController } from './zoom-settings.controller';
import { ZoomAnalyticsController } from './zoom-analytics.controller';
import { SessionAttendanceController } from './session-attendance.controller';
import { ParentSessionController } from './parent-session.controller';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { SessionNote } from './entities/session-note.entity';
import { ProcessedWebhook } from './entities/processed-webhook.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeachersModule } from '../teachers/teachers.module';
import { ScheduleSessionGeneratorService } from './schedule-session-generator.service';
import { ScheduleSessionsCron } from './schedule-sessions.cron';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ZoomIntegration,
      LiveSession,
      SessionAttendance,
      SessionNote,
      ProcessedWebhook,
      Student,
      Teacher,
      Parent,
      Schedule,
      ScheduleStudent,
    ]),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    NotificationsModule,
    forwardRef(() => TeachersModule),
  ],
  controllers: [
    LiveSessionController,
    SessionNoteController,
    ZoomWebhookController,
    ZoomSettingsController,
    ZoomAnalyticsController,
    SessionAttendanceController,
    ParentSessionController,
  ],
  providers: [
    EncryptionService,
    ZoomService,
    LiveSessionService,
    SessionAttendanceService,
    SessionNoteService,
    ZoomWebhookService,
    ZoomAnalyticsService,
    ScheduleSessionGeneratorService,
    ScheduleSessionsCron,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    ZoomService,
    LiveSessionService,
    SessionAttendanceService,
    ZoomWebhookService,
    ZoomAnalyticsService,
    ScheduleSessionGeneratorService,
  ],
})
export class ZoomModule {}
