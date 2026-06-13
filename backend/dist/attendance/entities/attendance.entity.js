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
exports.Attendance = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
const student_session_attendance_entity_1 = require("../../sessions/entities/student-session-attendance.entity");
let Attendance = class Attendance {
};
exports.Attendance = Attendance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Attendance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Attendance.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Attendance.prototype, "isPresent", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], Attendance.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Attendance.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_session_attendance_entity_1.StudentSessionAttendance, (sessionAttendance) => sessionAttendance.attendanceRecords, {
        onDelete: 'SET NULL',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionAttendanceId' }),
    __metadata("design:type", student_session_attendance_entity_1.StudentSessionAttendance)
], Attendance.prototype, "sessionAttendance", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Attendance.prototype, "sessionAttendanceId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Attendance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Attendance.prototype, "updatedAt", void 0);
exports.Attendance = Attendance = __decorate([
    (0, typeorm_1.Entity)('attendance')
], Attendance);
//# sourceMappingURL=attendance.entity.js.map