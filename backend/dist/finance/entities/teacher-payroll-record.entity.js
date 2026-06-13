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
exports.TeacherPayrollRecord = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const teacher_earning_detail_entity_1 = require("./teacher-earning-detail.entity");
let TeacherPayrollRecord = class TeacherPayrollRecord {
};
exports.TeacherPayrollRecord = TeacherPayrollRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherPayrollRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherPayrollRecord.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], TeacherPayrollRecord.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7 }),
    __metadata("design:type", String)
], TeacherPayrollRecord.prototype, "billingMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TeacherPayrollRecord.prototype, "totalSessions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], TeacherPayrollRecord.prototype, "totalEarnings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], TeacherPayrollRecord.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TeacherPayrollRecord.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => teacher_earning_detail_entity_1.TeacherEarningDetail, (d) => d.payrollRecord, { cascade: true }),
    __metadata("design:type", Array)
], TeacherPayrollRecord.prototype, "earningDetails", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherPayrollRecord.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeacherPayrollRecord.prototype, "updatedAt", void 0);
exports.TeacherPayrollRecord = TeacherPayrollRecord = __decorate([
    (0, typeorm_1.Entity)('teacher_payroll_records')
], TeacherPayrollRecord);
//# sourceMappingURL=teacher-payroll-record.entity.js.map