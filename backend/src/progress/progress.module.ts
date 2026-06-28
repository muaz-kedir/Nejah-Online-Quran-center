import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Progress } from './entities/progress.entity';
import { ProgressLog } from './entities/progress-log.entity';
import { Feedback } from './entities/feedback.entity';
import { StudentLevelHistory } from './entities/level-history.entity';
import { ProgressionSettings } from './entities/progression-settings.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { ProgressService } from './progress.service';
import { LevelProgressionService } from './level-progression.service';
import { ProgressController } from './progress.controller';
import { TeachersModule } from '../teachers/teachers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Progress,
      ProgressLog,
      Feedback,
      StudentLevelHistory,
      ProgressionSettings,
      Student,
      Teacher,
      Parent,
      User,
    ]),
    forwardRef(() => TeachersModule),
    NotificationsModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService, LevelProgressionService],
  exports: [ProgressService, LevelProgressionService, TypeOrmModule],
})
export class ProgressModule {}
