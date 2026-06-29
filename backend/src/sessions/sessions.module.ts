import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionMeeting } from './entities/session-meeting.entity';
import { StudentSessionAttendance } from './entities/student-session-attendance.entity';
import { SessionService } from './sessions.service';
import { StudentAttendanceService } from './student-attendance.service';
import { SessionsAnalyticsService } from './sessions-analytics.service';
import { SessionsAnalyticsController } from './sessions-analytics.controller';
import { SchedulesModule } from '../schedules/schedules.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionMeeting, StudentSessionAttendance]),
    SchedulesModule,
    NotificationsModule,
  ],
  providers: [SessionService, StudentAttendanceService, SessionsAnalyticsService],
  controllers: [SessionsAnalyticsController],
  exports: [SessionService, StudentAttendanceService, SessionsAnalyticsService, TypeOrmModule],
})
export class SessionsModule {}
