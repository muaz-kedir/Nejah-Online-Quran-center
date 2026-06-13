"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const student_entity_1 = require("../students/entities/student.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const attendance_entity_1 = require("../attendance/entities/attendance.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const student_attendance_entity_1 = require("../attendance/entities/student-attendance.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const progress_log_entity_1 = require("../progress/entities/progress-log.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const exam_entity_1 = require("../exams/entities/exam.entity");
const teacher_replacement_entity_1 = require("../teacher-replacements/entities/teacher-replacement.entity");
const notification_entity_1 = require("../notifications/entities/notification.entity");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                parent_entity_1.Parent,
                teacher_entity_1.Teacher,
                attendance_entity_1.Attendance,
                class_session_entity_1.ClassSession,
                student_attendance_entity_1.StudentAttendance,
                schedule_entity_1.Schedule,
                progress_entity_1.Progress,
                progress_log_entity_1.ProgressLog,
                homework_entity_1.Homework,
                exam_entity_1.Exam,
                teacher_replacement_entity_1.TeacherReplacement,
                notification_entity_1.Notification,
            ]),
        ],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService],
        exports: [reports_service_1.ReportsService, typeorm_1.TypeOrmModule],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map