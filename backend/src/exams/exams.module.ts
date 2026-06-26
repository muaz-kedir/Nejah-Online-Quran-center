import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { ExamEvaluation } from './entities/exam-evaluation.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Progress } from '../progress/entities/progress.entity';
import { User } from '../users/entities/user.entity';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { StudentsModule } from '../students/students.module';
import { TeachersModule } from '../teachers/teachers.module';
import { ProgressModule } from '../progress/progress.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamEvaluation, Student, Teacher, Progress, User]),
    StudentsModule,
    TeachersModule,
    ProgressModule,
    NotificationsModule,
  ],
  controllers: [ExamsController, EvaluationsController],
  providers: [ExamsService, EvaluationsService],
  exports: [ExamsService, EvaluationsService, TypeOrmModule],
})
export class ExamsModule {}
