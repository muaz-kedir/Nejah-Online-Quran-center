import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplicationsService } from './teacher-applications.service';
import { TeacherApplication } from './entities/teacher-application.entity';
import { TeacherApplicationSettings } from './entities/teacher-application-settings.entity';
import { TeachersModule } from '../teachers/teachers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherApplication, TeacherApplicationSettings]),
    TeachersModule,
  ],
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService],
  exports: [TeacherApplicationsService],
})
export class TeacherApplicationsModule {}
