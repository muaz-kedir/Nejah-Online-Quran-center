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
exports.SessionAttendance = void 0;
const typeorm_1 = require("typeorm");
const live_session_entity_1 = require("./live-session.entity");
const student_entity_1 = require("../../students/entities/student.entity");
const live_session_status_enum_1 = require("../enums/live-session-status.enum");
let SessionAttendance = class SessionAttendance {
};
exports.SessionAttendance = SessionAttendance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SessionAttendance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => live_session_entity_1.LiveSession, (session) => session.attendances, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", live_session_entity_1.LiveSession)
], SessionAttendance.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionAttendance.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], SessionAttendance.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionAttendance.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionAttendance.prototype, "joinTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SessionAttendance.prototype, "leaveTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SessionAttendance.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: live_session_status_enum_1.AttendanceStatus, default: live_session_status_enum_1.AttendanceStatus.ABSENT }),
    __metadata("design:type", String)
], SessionAttendance.prototype, "attendanceStatus", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SessionAttendance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SessionAttendance.prototype, "updatedAt", void 0);
exports.SessionAttendance = SessionAttendance = __decorate([
    (0, typeorm_1.Entity)('session_attendances')
], SessionAttendance);
//# sourceMappingURL=session-attendance.entity.js.map