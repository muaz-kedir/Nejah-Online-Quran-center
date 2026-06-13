"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const students_module_1 = require("./students/students.module");
const teachers_module_1 = require("./teachers/teachers.module");
const parents_module_1 = require("./parents/parents.module");
const attendance_module_1 = require("./attendance/attendance.module");
const schedules_module_1 = require("./schedules/schedules.module");
const homework_module_1 = require("./homework/homework.module");
const progress_module_1 = require("./progress/progress.module");
const exams_module_1 = require("./exams/exams.module");
const notifications_module_1 = require("./notifications/notifications.module");
const chat_module_1 = require("./chat/chat.module");
const resources_module_1 = require("./resources/resources.module");
const messages_module_1 = require("./messages/messages.module");
const email_module_1 = require("./email/email.module");
const teacher_applications_module_1 = require("./teacher-applications/teacher-applications.module");
const teacher_replacements_module_1 = require("./teacher-replacements/teacher-replacements.module");
const reports_module_1 = require("./reports/reports.module");
const finance_module_1 = require("./finance/finance.module");
const qirat_module_1 = require("./qirat/qirat.module");
const zoom_module_1 = require("./zoom/zoom.module");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const databaseUrl = configService.get('DATABASE_URL');
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
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            students_module_1.StudentsModule,
            teachers_module_1.TeachersModule,
            parents_module_1.ParentsModule,
            attendance_module_1.AttendanceModule,
            schedules_module_1.SchedulesModule,
            homework_module_1.HomeworkModule,
            progress_module_1.ProgressModule,
            exams_module_1.ExamsModule,
            notifications_module_1.NotificationsModule,
            chat_module_1.ChatModule,
            resources_module_1.ResourcesModule,
            messages_module_1.MessagesModule,
            email_module_1.EmailModule,
            teacher_applications_module_1.TeacherApplicationsModule,
            teacher_replacements_module_1.TeacherReplacementsModule,
            reports_module_1.ReportsModule,
            finance_module_1.FinanceModule,
            qirat_module_1.QiratModule,
            zoom_module_1.ZoomModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map