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
exports.StudentAttendance = exports.StudentAttendanceStatus = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
const class_session_entity_1 = require("./class-session.entity");
var StudentAttendanceStatus;
(function (StudentAttendanceStatus) {
    StudentAttendanceStatus["PRESENT"] = "PRESENT";
    StudentAttendanceStatus["LATE"] = "LATE";
    StudentAttendanceStatus["ABSENT"] = "ABSENT";
    StudentAttendanceStatus["LEFT_EARLY"] = "LEFT_EARLY";
})(StudentAttendanceStatus || (exports.StudentAttendanceStatus = StudentAttendanceStatus = {}));
let StudentAttendance = class StudentAttendance {
};
exports.StudentAttendance = StudentAttendance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentAttendance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentAttendance.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], StudentAttendance.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentAttendance.prototype, "classSessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_session_entity_1.ClassSession, (session) => session.studentAttendances, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'classSessionId' }),
    __metadata("design:type", class_session_entity_1.ClassSession)
], StudentAttendance.prototype, "classSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: StudentAttendanceStatus, default: StudentAttendanceStatus.ABSENT }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "attendanceStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StudentAttendance.prototype, "joinTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StudentAttendance.prototype, "leaveTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], StudentAttendance.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], StudentAttendance.prototype, "notificationSent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StudentAttendance.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentAttendance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentAttendance.prototype, "updatedAt", void 0);
exports.StudentAttendance = StudentAttendance = __decorate([
    (0, typeorm_1.Entity)('student_attendance')
], StudentAttendance);
//# sourceMappingURL=student-attendance.entity.js.map