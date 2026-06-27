import { Module, forwardRef } from '@nestjs/common';
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
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { ExamEvaluation } from '../exams/entities/exam-evaluation.entity';
import { Resource } from '../resources/resources.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeacherReplacementsModule } from '../teacher-replacements/teacher-replacements.module';
import { ZoomModule } from '../zoom/zoom.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      TeacherNote,
      Student,
      Schedule,
      Homework,
      Progress,
      ProgressLog,
      Attendance,
      ClassSession,
      StudentAttendance,
      ExamEvaluation,
      Resource,
    ]),
    UsersModule,
    NotificationsModule,
    forwardRef(() => TeacherReplacementsModule),
    forwardRef(() => ZoomModule),
  ],
  controllers: [TeachersController, TeacherDashboardController],
  providers: [TeachersService],
  exports: [TeachersService, TypeOrmModule],
})
export class TeachersModule {}
