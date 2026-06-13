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
exports.StudentFeeAccount = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
const parent_entity_1 = require("../../parents/entities/parent.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const payment_status_enum_1 = require("../../common/enums/payment-status.enum");
const payment_transaction_entity_1 = require("./payment-transaction.entity");
let StudentFeeAccount = class StudentFeeAccount {
};
exports.StudentFeeAccount = StudentFeeAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], StudentFeeAccount.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parent_entity_1.Parent, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", parent_entity_1.Parent)
], StudentFeeAccount.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], StudentFeeAccount.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "program", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 5 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "sessionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "weeklyScheduleDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 60 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "sessionDurationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 12 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "monthlySessions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "monthlyFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "scholarshipAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], StudentFeeAccount.prototype, "remainingBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: payment_status_enum_1.PaymentStatus, default: payment_status_enum_1.PaymentStatus.UNPAID }),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7 }),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "billingMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], StudentFeeAccount.prototype, "isFamilyBundled", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StudentFeeAccount.prototype, "familyBillingGroupId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_transaction_entity_1.PaymentTransaction, (tx) => tx.studentFeeAccount),
    __metadata("design:type", Array)
], StudentFeeAccount.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentFeeAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentFeeAccount.prototype, "updatedAt", void 0);
exports.StudentFeeAccount = StudentFeeAccount = __decorate([
    (0, typeorm_1.Entity)('student_fee_accounts')
], StudentFeeAccount);
//# sourceMappingURL=student-fee-account.entity.js.map