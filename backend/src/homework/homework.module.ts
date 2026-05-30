import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Homework } from './entities/homework.entity';
import { Student } from '../students/entities/student.entity';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Homework, Student])],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService, TypeOrmModule],
})
export class HomeworkModule {}
