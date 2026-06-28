import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentManagementService } from './student-management.service';
import { AssignmentsController } from './assignments.controller';
import { Student } from './entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { ExamEvaluation } from '../exams/entities/exam-evaluation.entity';
import { SchedulesModule } from '../schedules/schedules.module';
import { UsersModule } from '../users/users.module';
import { TeachersModule } from '../teachers/teachers.module';
import { ResourcesModule } from '../resources/resources.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { TeacherReplacementsModule } from '../teacher-replacements/teacher-replacements.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ParentsModule } from '../parents/parents.module';
import { ZoomModule } from '../zoom/zoom.module';
import { ProgressModule } from '../progress/progress.module';
import { StudentPortalService } from './student-portal.service';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { LiveSession } from '../zoom/entities/live-session.entity';
import { SessionAttendance } from '../zoom/entities/session-attendance.entity';

@Module({
  imports: [
    SchedulesModule,
    UsersModule,
    forwardRef(() => TeachersModule),
    ResourcesModule,
    AttendanceModule,
    TeacherReplacementsModule,
    NotificationsModule,
    ParentsModule,
    ZoomModule,
    ProgressModule,
    TypeOrmModule.forFeature([
      Student,
      Teacher,
      Parent,
      Progress,
      ProgressLog,
      Homework,
      Attendance,
      Schedule,
      Feedback,
      Notification,
      StudentAttendance,
      ClassSession,
      ExamEvaluation,
      TeacherReplacement,
      LiveSession,
      SessionAttendance,
    ]),
  ],
  controllers: [StudentsController, StudentDashboardController, AssignmentsController],
  providers: [StudentsService, StudentPortalService, StudentManagementService],
  exports: [StudentsService, StudentPortalService, StudentManagementService, TypeOrmModule],
})
export class StudentsModule {}
