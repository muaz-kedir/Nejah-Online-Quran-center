import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherReplacementsService } from './teacher-replacements.service';
import { TeacherReplacementsController } from './teacher-replacements.controller';
import { TeacherReplacementsCron } from './teacher-replacements.cron';
import { TeacherReplacement } from './entities/teacher-replacement.entity';
import { ReplacementScheduleOverride } from './entities/replacement-schedule-override.entity';
import { TeacherReplacementAudit } from './entities/teacher-replacement-audit.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      TeacherReplacement,
      ReplacementScheduleOverride,
      TeacherReplacementAudit,
      Student,
      Teacher,
      Schedule,
      User,
    ]),
  ],
  controllers: [TeacherReplacementsController],
  providers: [TeacherReplacementsService, TeacherReplacementsCron],
  exports: [TeacherReplacementsService],
})
export class TeacherReplacementsModule {}
