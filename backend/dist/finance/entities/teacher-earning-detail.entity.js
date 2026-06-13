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
exports.TeacherEarningDetail = void 0;
const typeorm_1 = require("typeorm");
const teacher_payroll_record_entity_1 = require("./teacher-payroll-record.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const student_entity_1 = require("../../students/entities/student.entity");
let TeacherEarningDetail = class TeacherEarningDetail {
};
exports.TeacherEarningDetail = TeacherEarningDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherEarningDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherEarningDetail.prototype, "payrollRecordId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_payroll_record_entity_1.TeacherPayrollRecord, (r) => r.earningDetails, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'payrollRecordId' }),
    __metadata("design:type", teacher_payroll_record_entity_1.TeacherPayrollRecord)
], TeacherEarningDetail.prototype, "payrollRecord", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherEarningDetail.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], TeacherEarningDetail.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherEarningDetail.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], TeacherEarningDetail.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TeacherEarningDetail.prototype, "sessionsConducted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TeacherEarningDetail.prototype, "sessionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TeacherEarningDetail.prototype, "earnings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TeacherEarningDetail.prototype, "isReplacement", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherEarningDetail.prototype, "replacementId", void 0);
exports.TeacherEarningDetail = TeacherEarningDetail = __decorate([
    (0, typeorm_1.Entity)('teacher_earning_details')
], TeacherEarningDetail);
//# sourceMappingURL=teacher-earning-detail.entity.js.map