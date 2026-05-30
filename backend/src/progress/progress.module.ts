import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Progress } from './entities/progress.entity';
import { Feedback } from './entities/feedback.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Progress, Feedback, Student, Teacher])],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService, TypeOrmModule],
})
export class ProgressModule {}
