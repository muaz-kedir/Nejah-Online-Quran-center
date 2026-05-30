import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeacherDashboardController } from './teacher-dashboard.controller';
import { Teacher } from './entities/teacher.entity';
import { TeacherNote } from './entities/teacher-note.entity';
import { Student } from '../students/entities/student.entity';
import { UsersModule } from '../users/users.module';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher, 
      TeacherNote, 
      Student, 
      Schedule, 
      Homework,
      Progress,
      Attendance,
    ]),
    UsersModule,
  ],
  controllers: [TeachersController, TeacherDashboardController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
