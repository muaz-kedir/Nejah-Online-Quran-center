"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const students_service_1 = require("./students.service");
const students_controller_1 = require("./students.controller");
const student_dashboard_controller_1 = require("./student-dashboard.controller");
const student_portal_service_1 = require("./student-portal.service");
const assignments_controller_1 = require("./assignments.controller");
const student_entity_1 = require("./entities/student.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const progress_log_entity_1 = require("../progress/entities/progress-log.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const attendance_entity_1 = require("../attendance/entities/attendance.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const feedback_entity_1 = require("../progress/entities/feedback.entity");
const notification_entity_1 = require("../notifications/entities/notification.entity");
const student_attendance_entity_1 = require("../attendance/entities/student-attendance.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const schedules_module_1 = require("../schedules/schedules.module");
const users_module_1 = require("../users/users.module");
const teachers_module_1 = require("../teachers/teachers.module");
const resources_module_1 = require("../resources/resources.module");
const attendance_module_1 = require("../attendance/attendance.module");
const teacher_replacements_module_1 = require("../teacher-replacements/teacher-replacements.module");
const parents_module_1 = require("../parents/parents.module");
let StudentsModule = class StudentsModule {
};
exports.StudentsModule = StudentsModule;
exports.StudentsModule = StudentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedules_module_1.SchedulesModule,
            users_module_1.UsersModule,
            teachers_module_1.TeachersModule,
            resources_module_1.ResourcesModule,
            attendance_module_1.AttendanceModule,
            teacher_replacements_module_1.TeacherReplacementsModule,
            parents_module_1.ParentsModule,
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                parent_entity_1.Parent,
                progress_entity_1.Progress,
                progress_log_entity_1.ProgressLog,
                homework_entity_1.Homework,
                attendance_entity_1.Attendance,
                schedule_entity_1.Schedule,
                feedback_entity_1.Feedback,
                notification_entity_1.Notification,
                student_attendance_entity_1.StudentAttendance,
                class_session_entity_1.ClassSession,
            ]),
        ],
        controllers: [students_controller_1.StudentsController, student_dashboard_controller_1.StudentDashboardController, assignments_controller_1.AssignmentsController],
        providers: [students_service_1.StudentsService, student_portal_service_1.StudentPortalService],
        exports: [students_service_1.StudentsService, student_portal_service_1.StudentPortalService],
    })
], StudentsModule);
//# sourceMappingURL=students.module.js.map