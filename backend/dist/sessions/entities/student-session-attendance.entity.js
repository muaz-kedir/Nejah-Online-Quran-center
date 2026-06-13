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
exports.StudentSessionAttendance = exports.StudentAttendanceStatus = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
const session_meeting_entity_1 = require("./session-meeting.entity");
const attendance_entity_1 = require("../../attendance/entities/attendance.entity");
var StudentAttendanceStatus;
(function (StudentAttendanceStatus) {
    StudentAttendanceStatus["PRESENT"] = "PRESENT";
    StudentAttendanceStatus["LATE"] = "LATE";
    StudentAttendanceStatus["ABSENT"] = "ABSENT";
    StudentAttendanceStatus["LEFT_EARLY"] = "LEFT_EARLY";
})(StudentAttendanceStatus || (exports.StudentAttendanceStatus = StudentAttendanceStatus = {}));
let StudentSessionAttendance = class StudentSessionAttendance {
};
exports.StudentSessionAttendance = StudentSessionAttendance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentSessionAttendance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_meeting_entity_1.SessionMeeting, (session) => session.studentAttendances, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionMeetingId' }),
    __metadata("design:type", session_meeting_entity_1.SessionMeeting)
], StudentSessionAttendance.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentSessionAttendance.prototype, "sessionMeetingId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], StudentSessionAttendance.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentSessionAttendance.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StudentSessionAttendance.prototype, "joinTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StudentSessionAttendance.prototype, "leaveTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], StudentSessionAttendance.prototype, "totalDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: StudentAttendanceStatus,
        default: StudentAttendanceStatus.ABSENT,
    }),
    __metadata("design:type", String)
], StudentSessionAttendance.prototype, "attendanceStatus", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attendance_entity_1.Attendance, (attendance) => attendance.sessionAttendance),
    __metadata("design:type", Array)
], StudentSessionAttendance.prototype, "attendanceRecords", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentSessionAttendance.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentSessionAttendance.prototype, "updatedAt", void 0);
exports.StudentSessionAttendance = StudentSessionAttendance = __decorate([
    (0, typeorm_1.Entity)('student_session_attendances')
], StudentSessionAttendance);
//# sourceMappingURL=student-session-attendance.entity.js.map