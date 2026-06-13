"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMeeting = exports.TeacherAttendanceStatus = exports.SessionStatus = void 0;
const typeorm_1 = require("typeorm");
const schedule_entity_1 = require("../../schedules/entities/schedule.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const student_session_attendance_entity_1 = require("./student-session-attendance.entity");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "SCHEDULED";
    SessionStatus["LIVE"] = "LIVE";
    SessionStatus["ENDED"] = "ENDED";
    SessionStatus["CANCELLED"] = "CANCELLED";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var TeacherAttendanceStatus;
(function (TeacherAttendanceStatus) {
    TeacherAttendanceStatus["PRESENT"] = "PRESENT";
    TeacherAttendanceStatus["LATE"] = "LATE";
    TeacherAttendanceStatus["ABSENT"] = "ABSENT";
})(TeacherAttendanceStatus || (exports.TeacherAttendanceStatus = TeacherAttendanceStatus = {}));
let SessionMeeting = class SessionMeeting {
};
exports.SessionMeeting = SessionMeeting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SessionMeeting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_entity_1.Schedule, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'scheduleId' }),
    __metadata("design:type", schedule_entity_1.Schedule)
], SessionMeeting.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionMeeting.prototype, "scheduleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], SessionMeeting.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionMeeting.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SessionMeeting.prototype, "meetingLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED }),
    __metadata("design:type", String)
], SessionMeeting.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionMeeting.prototype, "teacherJoinTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionMeeting.prototype, "teacherLeaveTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionMeeting.prototype, "actualStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionMeeting.prototype, "actualEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], SessionMeeting.prototype, "totalDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TeacherAttendanceStatus,
        default: TeacherAttendanceStatus.ABSENT,
    }),
    __metadata("design:type", String)
], SessionMeeting.prototype, "attendanceStatus", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_session_attendance_entity_1.StudentSessionAttendance, (attendance) => attendance.session),
    __metadata("design:type", Array)
], SessionMeeting.prototype, "studentAttendances", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SessionMeeting.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SessionMeeting.prototype, "updatedAt", void 0);
exports.SessionMeeting = SessionMeeting = __decorate([
    (0, typeorm_1.Entity)('session_meetings')
], SessionMeeting);
//# sourceMappingURL=session-meeting.entity.js.map