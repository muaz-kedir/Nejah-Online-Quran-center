import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './student-dashboard.controller';
import { Student } from './entities/student.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Feedback } from '../progress/entities/feedback.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Progress,
      Homework,
      Attendance,
      Schedule,
      Feedback,
    ]),
  ],
  controllers: [StudentsController, StudentDashboardController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
