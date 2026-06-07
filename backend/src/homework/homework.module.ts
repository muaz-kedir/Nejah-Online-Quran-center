import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Homework } from './entities/homework.entity';
import { Student } from '../students/entities/student.entity';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';
import { TeachersModule } from '../teachers/teachers.module';
import { TeacherReplacementsModule } from '../teacher-replacements/teacher-replacements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Homework, Student]),
    TeachersModule,
    TeacherReplacementsModule,
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService, TypeOrmModule],
})
export class HomeworkModule {}
