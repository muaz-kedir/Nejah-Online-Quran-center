import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZoomService } from './zoom.service';
import { ZoomOAuthService } from './zoom-oauth.service';
import { ZoomOAuthController } from './zoom-oauth.controller';
import { LiveSessionService } from './live-session.service';
import { SessionAttendanceService } from './session-attendance.service';
import { SessionNoteService } from './session-note.service';
import { ZoomWebhookService } from './zoom-webhook.service';
import { ZoomAnalyticsService } from './zoom-analytics.service';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { AttendanceReconciliationService } from './attendance-reconciliation.service';
import { LiveSessionAttendanceReportService } from './live-session-attendance-report.service';
import { LiveSessionAttendanceReportController } from './live-session-attendance-report.controller';
import { LiveSessionController } from './live-session.controller';
import { SessionNoteController } from './session-note.controller';
import { ZoomWebhookController } from './zoom-webhook.controller';
import { ZoomSettingsController } from './zoom-settings.controller';
import { ZoomAnalyticsController } from './zoom-analytics.controller';
import { SessionAttendanceController } from './session-attendance.controller';
import { ParentSessionController } from './parent-session.controller';
import { AnalyticsController } from './analytics.controller';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { ZoomPlatformConfig } from './entities/zoom-platform-config.entity';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { SessionNote } from './entities/session-note.entity';
import { ProcessedWebhook } from './entities/processed-webhook.entity';
import { ParticipantTimelineEvent } from './entities/participant-timeline-event.entity';
import { AttendanceSegment } from './entities/attendance-segment.entity';
import { SessionParticipantSummary } from './entities/session-participant-summary.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeachersModule } from '../teachers/teachers.module';
import { ScheduleSessionGeneratorService } from './schedule-session-generator.service';
import { ScheduleSessionsCron } from './schedule-sessions.cron';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import { LiveSessionLookupService } from './live-session-lookup.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ZoomIntegration,
      ZoomPlatformConfig,
      LiveSession,
      SessionAttendance,
      SessionNote,
      ProcessedWebhook,
      Student,
      Teacher,
      Parent,
      Schedule,
      ScheduleStudent,
      ParticipantTimelineEvent,
      AttendanceSegment,
      SessionParticipantSummary,
    ]),
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '30d',
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => NotificationsModule),
    forwardRef(() => TeachersModule),
  ],
  // controllers disabled — Zoom endpoints are not ready.
  // Teacher provides manual meeting links; Telegram bot posts them to students.
  controllers: [
    // LiveSessionController,
    // SessionNoteController,
    // ZoomWebhookController,
    // ZoomSettingsController,
    // ZoomOAuthController,
    // ZoomAnalyticsController,
    // SessionAttendanceController,
    // ParentSessionController,
    // AnalyticsController,
    // LiveSessionAttendanceReportController,
  ],
  providers: [
    EncryptionService,
    ZoomService,
    ZoomOAuthService,
    LiveSessionService,
    SessionAttendanceService,
    SessionNoteService,
    ZoomWebhookService,
    ZoomAnalyticsService,
    AttendanceIntelligenceService,
    AttendanceReconciliationService,
    LiveSessionAttendanceReportService,
    LiveSessionLookupService,
    ScheduleSessionGeneratorService,
    ScheduleSessionsCron,
  ],
  exports: [
    ZoomService,
    ZoomOAuthService,
    LiveSessionService,
    SessionAttendanceService,
    ZoomWebhookService,
    ZoomAnalyticsService,
    AttendanceIntelligenceService,
    AttendanceReconciliationService,
    LiveSessionAttendanceReportService,
    LiveSessionLookupService,
    ScheduleSessionGeneratorService,
  ],
})
export class ZoomModule {}
