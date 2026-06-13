"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const session_meeting_entity_1 = require("./entities/session-meeting.entity");
const student_session_attendance_entity_1 = require("./entities/student-session-attendance.entity");
const sessions_service_1 = require("./sessions.service");
const student_attendance_service_1 = require("./student-attendance.service");
const schedules_module_1 = require("../schedules/schedules.module");
const notifications_module_1 = require("../notifications/notifications.module");
let SessionsModule = class SessionsModule {
};
exports.SessionsModule = SessionsModule;
exports.SessionsModule = SessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([session_meeting_entity_1.SessionMeeting, student_session_attendance_entity_1.StudentSessionAttendance]),
            schedules_module_1.SchedulesModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [sessions_service_1.SessionService, student_attendance_service_1.StudentAttendanceService],
        exports: [sessions_service_1.SessionService, student_attendance_service_1.StudentAttendanceService, typeorm_1.TypeOrmModule],
    })
], SessionsModule);
//# sourceMappingURL=sessions.module.js.map