import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QiratService } from './qirat.service';
import { QiratController } from './qirat.controller';
import { ReportsModule } from '../reports/reports.module';
import { Student } from '../students/entities/student.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';

@Module({
  imports: [
    ReportsModule,
    TypeOrmModule.forFeature([Student, ClassSession, TeacherReplacement]),
  ],
  controllers: [QiratController],
  providers: [QiratService],
  exports: [QiratService],
})
export class QiratModule {}
