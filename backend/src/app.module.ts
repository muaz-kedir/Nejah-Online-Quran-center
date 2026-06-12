import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ParentsModule } from './parents/parents.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SchedulesModule } from './schedules/schedules.module';
import { HomeworkModule } from './homework/homework.module';
import { ProgressModule } from './progress/progress.module';
import { ExamsModule } from './exams/exams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { ResourcesModule } from './resources/resources.module';
import { MessagesModule } from './messages/messages.module';
import { EmailModule } from './email/email.module';
import { TeacherApplicationsModule } from './teacher-applications/teacher-applications.module';
import { TeacherReplacementsModule } from './teacher-replacements/teacher-replacements.module';
import { ReportsModule } from './reports/reports.module';
import { FinanceModule } from './finance/finance.module';
import { QiratModule } from './qirat/qirat.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        
        // Prefer DATABASE_URL if available
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: ['error'],
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }
        
        // Fallback to individual credentials
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME') || configService.get('DB_DATABASE'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: ['error'],
          ssl: false,
        };
      },
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    ParentsModule,
    AttendanceModule,
    SchedulesModule,
    HomeworkModule,
    ProgressModule,
    ExamsModule,
    NotificationsModule,
    ChatModule,
    ResourcesModule,
    MessagesModule,
    EmailModule,
    TeacherApplicationsModule,
    TeacherReplacementsModule,
    ReportsModule,
    FinanceModule,
    QiratModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
