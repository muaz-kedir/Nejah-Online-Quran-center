import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Exam } from '../exams/entities/exam.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Parent,
      Teacher,
      Attendance,
      ClassSession,
      StudentAttendance,
      Schedule,
      Progress,
      ProgressLog,
      Homework,
      Exam,
      TeacherReplacement,
      Notification,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule {}
