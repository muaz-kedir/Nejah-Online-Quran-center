import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplicationsService } from './teacher-applications.service';
import { TeacherApplication } from './entities/teacher-application.entity';
import { TeacherApplicationSettings } from './entities/teacher-application-settings.entity';
import { TeachersModule } from '../teachers/teachers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherApplication, TeacherApplicationSettings, User]),
    TeachersModule,
    NotificationsModule,
  ],
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService],
  exports: [TeacherApplicationsService],
})
export class TeacherApplicationsModule {}
