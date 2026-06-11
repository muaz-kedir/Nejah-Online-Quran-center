import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { StudentsModule } from '../students/students.module';
import { TeachersModule } from '../teachers/teachers.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, Student, Teacher, Progress]),
    StudentsModule,
    TeachersModule,
    ProgressModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService, TypeOrmModule],
})
export class ExamsModule {}
