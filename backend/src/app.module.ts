import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ParentsModule } from './parents/parents.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SchedulesModule } from './schedules/schedules.module';
import { HomeworkModule } from './homework/homework.module';
import { ProgressModule } from './progress/progress.module';
import { ExamsModule } from './exams/exams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { ResourcesModule } from './resources/resources.module';
import { MessagesModule } from './messages/messages.module';
import { EmailModule } from './email/email.module';
import { TeacherApplicationsModule } from './teacher-applications/teacher-applications.module';
import { TeacherReplacementsModule } from './teacher-replacements/teacher-replacements.module';
import { ReportsModule } from './reports/reports.module';
import { FinanceModule } from './finance/finance.module';
import { QiratModule } from './qirat/qirat.module';
import { ZoomModule } from './zoom/zoom.module';
import { WebsocketModule } from './websocket/websocket.module';
import { LearningGoalsModule } from './learning-goals/learning-goals.module';
import { FeeConfigModule } from './fee-config/fee-config.module';
import { CurrencyModule } from './currency/currency.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { SessionsModule } from './sessions/sessions.module';
import { WebsiteCmsModule } from './website-cms/website-cms.module';
import { UploadsModule } from './uploads/uploads.module';
import { createTypeOrmOptions } from './database/typeorm.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => createTypeOrmOptions(configService),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    ParentsModule,
    AttendanceModule,
    SessionsModule,
    SchedulesModule,
    HomeworkModule,
    ProgressModule,
    ExamsModule,
    NotificationsModule,
    ChatModule,
    ResourcesModule,
    MessagesModule,
    EmailModule,
    TeacherApplicationsModule,
    TeacherReplacementsModule,
    ReportsModule,
    FinanceModule,
    QiratModule,
    ZoomModule,
    WebsocketModule,
    LearningGoalsModule,
    FeeConfigModule,
    CurrencyModule,
    WebsiteCmsModule,
    UploadsModule,
    ScheduleModule.forRoot(),
    HealthModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
