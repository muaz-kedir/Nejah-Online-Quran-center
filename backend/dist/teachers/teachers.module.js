"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeachersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const teachers_service_1 = require("./teachers.service");
const teachers_controller_1 = require("./teachers.controller");
const teacher_dashboard_controller_1 = require("./teacher-dashboard.controller");
const teacher_entity_1 = require("./entities/teacher.entity");
const teacher_note_entity_1 = require("./entities/teacher-note.entity");
const student_entity_1 = require("../students/entities/student.entity");
const users_module_1 = require("../users/users.module");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const attendance_entity_1 = require("../attendance/entities/attendance.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const teacher_replacements_module_1 = require("../teacher-replacements/teacher-replacements.module");
let TeachersModule = class TeachersModule {
};
exports.TeachersModule = TeachersModule;
exports.TeachersModule = TeachersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                teacher_entity_1.Teacher,
                teacher_note_entity_1.TeacherNote,
                student_entity_1.Student,
                schedule_entity_1.Schedule,
                homework_entity_1.Homework,
                progress_entity_1.Progress,
                attendance_entity_1.Attendance,
            ]),
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
            (0, common_1.forwardRef)(() => teacher_replacements_module_1.TeacherReplacementsModule),
        ],
        controllers: [teachers_controller_1.TeachersController, teacher_dashboard_controller_1.TeacherDashboardController],
        providers: [teachers_service_1.TeachersService],
        exports: [teachers_service_1.TeachersService],
    })
], TeachersModule);
//# sourceMappingURL=teachers.module.js.map