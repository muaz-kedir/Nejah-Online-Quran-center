import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './student-dashboard.controller';
import { AssignmentsController } from './assignments.controller';
import { Student } from './entities/student.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { SchedulesModule } from '../schedules/schedules.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SchedulesModule,
    UsersModule,
    TypeOrmModule.forFeature([
      Student,
      Progress,
      Homework,
      Attendance,
      Schedule,
      Feedback,
    ]),
  ],
  controllers: [StudentsController, StudentDashboardController, AssignmentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
