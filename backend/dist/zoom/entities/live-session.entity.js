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
exports.LiveSession = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const student_entity_1 = require("../../students/entities/student.entity");
const schedule_entity_1 = require("../../schedules/entities/schedule.entity");
const session_attendance_entity_1 = require("./session-attendance.entity");
const session_note_entity_1 = require("./session-note.entity");
const live_session_status_enum_1 = require("../enums/live-session-status.enum");
let LiveSession = class LiveSession {
};
exports.LiveSession = LiveSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LiveSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], LiveSession.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LiveSession.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], LiveSession.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_entity_1.Schedule, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'scheduleId' }),
    __metadata("design:type", schedule_entity_1.Schedule)
], LiveSession.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "scheduleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "zoomMeetingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "zoomJoinUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "zoomStartUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LiveSession.prototype, "scheduledStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LiveSession.prototype, "scheduledEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "actualStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "actualEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], LiveSession.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: live_session_status_enum_1.LiveSessionStatus, default: live_session_status_enum_1.LiveSessionStatus.SCHEDULED }),
    __metadata("design:type", String)
], LiveSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], LiveSession.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_attendance_entity_1.SessionAttendance, (attendance) => attendance.session, { cascade: true }),
    __metadata("design:type", Array)
], LiveSession.prototype, "attendances", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_note_entity_1.SessionNote, (note) => note.session, { cascade: true }),
    __metadata("design:type", Array)
], LiveSession.prototype, "sessionNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LiveSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LiveSession.prototype, "updatedAt", void 0);
exports.LiveSession = LiveSession = __decorate([
    (0, typeorm_1.Entity)('live_sessions')
], LiveSession);
//# sourceMappingURL=live-session.entity.js.map