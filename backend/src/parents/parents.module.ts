import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { ParentDashboardController } from './parent-dashboard.controller';
import { Parent } from './entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      Parent,
      Student,
      User,
      Schedule,
      Homework,
      Feedback,
      Progress,
      ProgressLog,
    ]),
  ],
  controllers: [ParentsController, ParentDashboardController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
