"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const attendance_service_1 = require("./attendance.service");
const attendance_controller_1 = require("./attendance.controller");
const class_session_entity_1 = require("./entities/class-session.entity");
const student_attendance_entity_1 = require("./entities/student-attendance.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const teachers_module_1 = require("../teachers/teachers.module");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([class_session_entity_1.ClassSession, student_attendance_entity_1.StudentAttendance, student_entity_1.Student, teacher_entity_1.Teacher, schedule_entity_1.Schedule]),
            notifications_module_1.NotificationsModule,
            (0, common_1.forwardRef)(() => teachers_module_1.TeachersModule),
        ],
        controllers: [attendance_controller_1.AttendanceController],
        providers: [attendance_service_1.AttendanceService],
        exports: [attendance_service_1.AttendanceService, typeorm_1.TypeOrmModule],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map