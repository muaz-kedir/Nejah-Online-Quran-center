"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherReplacementsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const teacher_replacements_service_1 = require("./teacher-replacements.service");
const teacher_replacements_controller_1 = require("./teacher-replacements.controller");
const teacher_replacements_cron_1 = require("./teacher-replacements.cron");
const teacher_replacement_entity_1 = require("./entities/teacher-replacement.entity");
const replacement_schedule_override_entity_1 = require("./entities/replacement-schedule-override.entity");
const teacher_replacement_audit_entity_1 = require("./entities/teacher-replacement-audit.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const user_entity_1 = require("../users/entities/user.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const student_attendance_entity_1 = require("../attendance/entities/student-attendance.entity");
const notifications_module_1 = require("../notifications/notifications.module");
let TeacherReplacementsModule = class TeacherReplacementsModule {
};
exports.TeacherReplacementsModule = TeacherReplacementsModule;
exports.TeacherReplacementsModule = TeacherReplacementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            notifications_module_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                teacher_replacement_entity_1.TeacherReplacement,
                replacement_schedule_override_entity_1.ReplacementScheduleOverride,
                teacher_replacement_audit_entity_1.TeacherReplacementAudit,
                student_entity_1.Student,
                teacher_entity_1.Teacher,
                schedule_entity_1.Schedule,
                user_entity_1.User,
                class_session_entity_1.ClassSession,
                student_attendance_entity_1.StudentAttendance,
            ]),
        ],
        controllers: [teacher_replacements_controller_1.TeacherReplacementsController],
        providers: [teacher_replacements_service_1.TeacherReplacementsService, teacher_replacements_cron_1.TeacherReplacementsCron],
        exports: [teacher_replacements_service_1.TeacherReplacementsService],
    })
], TeacherReplacementsModule);
//# sourceMappingURL=teacher-replacements.module.js.map