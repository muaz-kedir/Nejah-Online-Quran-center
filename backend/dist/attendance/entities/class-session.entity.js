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
exports.ClassSession = exports.TeacherAttendanceStatus = exports.SessionStatus = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const schedule_entity_1 = require("../../schedules/entities/schedule.entity");
const student_attendance_entity_1 = require("./student-attendance.entity");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["SCHEDULED"] = "SCHEDULED";
    SessionStatus["LIVE"] = "LIVE";
    SessionStatus["COMPLETED"] = "COMPLETED";
    SessionStatus["CANCELLED"] = "CANCELLED";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var TeacherAttendanceStatus;
(function (TeacherAttendanceStatus) {
    TeacherAttendanceStatus["PRESENT"] = "PRESENT";
    TeacherAttendanceStatus["LATE"] = "LATE";
    TeacherAttendanceStatus["ABSENT"] = "ABSENT";
})(TeacherAttendanceStatus || (exports.TeacherAttendanceStatus = TeacherAttendanceStatus = {}));
let ClassSession = class ClassSession {
};
exports.ClassSession = ClassSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ClassSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ClassSession.prototype, "classTitle", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ClassSession.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ClassSession.prototype, "quranLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], ClassSession.prototype, "sessionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ClassSession.prototype, "scheduledStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ClassSession.prototype, "scheduledEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClassSession.prototype, "actualStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClassSession.prototype, "actualEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED }),
    __metadata("design:type", String)
], ClassSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ClassSession.prototype, "meetingLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TeacherAttendanceStatus, nullable: true }),
    __metadata("design:type", String)
], ClassSession.prototype, "teacherAttendanceStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClassSession.prototype, "teacherJoinTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ClassSession.prototype, "teacherLeaveTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClassSession.prototype, "teacherDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClassSession.prototype, "totalStudentsAssigned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClassSession.prototype, "totalStudentsPresent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClassSession.prototype, "totalStudentsLate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClassSession.prototype, "totalStudentsAbsent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ClassSession.prototype, "totalStudentsLeftEarly", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], ClassSession.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ClassSession.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_entity_1.Schedule, { onDelete: 'CASCADE', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'scheduleId' }),
    __metadata("design:type", schedule_entity_1.Schedule)
], ClassSession.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ClassSession.prototype, "scheduleId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_attendance_entity_1.StudentAttendance, (attendance) => attendance.classSession, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], ClassSession.prototype, "studentAttendances", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ClassSession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ClassSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ClassSession.prototype, "updatedAt", void 0);
exports.ClassSession = ClassSession = __decorate([
    (0, typeorm_1.Entity)('class_sessions')
], ClassSession);
//# sourceMappingURL=class-session.entity.js.map