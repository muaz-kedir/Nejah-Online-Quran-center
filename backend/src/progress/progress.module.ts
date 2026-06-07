import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Progress } from './entities/progress.entity';
import { ProgressLog } from './entities/progress-log.entity';
import { Feedback } from './entities/feedback.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Parent } from '../parents/entities/parent.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { TeachersModule } from '../teachers/teachers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Progress,
      ProgressLog,
      Feedback,
      Student,
      Teacher,
      Parent,
    ]),
    TeachersModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService, TypeOrmModule],
})
export class ProgressModule {}
