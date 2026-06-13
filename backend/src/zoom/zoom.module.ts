import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
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
import { RecordingController } from './recording.controller';
import { ZoomAnalyticsController } from './zoom-analytics.controller';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { SessionNote } from './entities/session-note.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeachersModule } from '../teachers/teachers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ZoomIntegration,
      LiveSession,
      SessionAttendance,
      SessionNote,
      Student,
      Teacher,
    ]),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    NotificationsModule,
    TeachersModule,
  ],
  controllers: [
    LiveSessionController,
    SessionNoteController,
    ZoomWebhookController,
    ZoomSettingsController,
    RecordingController,
    ZoomAnalyticsController,
  ],
  providers: [
    ZoomService,
    LiveSessionService,
    SessionAttendanceService,
    SessionNoteService,
    ZoomWebhookService,
    ZoomAnalyticsService,
  ],
  exports: [
    ZoomService,
    LiveSessionService,
    SessionAttendanceService,
    ZoomWebhookService,
    ZoomAnalyticsService,
  ],
})
export class ZoomModule {}
