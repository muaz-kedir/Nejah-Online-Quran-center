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
exports.PaymentTransaction = void 0;
const typeorm_1 = require("typeorm");
const transaction_type_enum_1 = require("../../common/enums/transaction-type.enum");
const student_fee_account_entity_1 = require("./student-fee-account.entity");
const family_billing_group_entity_1 = require("./family-billing-group.entity");
let PaymentTransaction = class PaymentTransaction {
};
exports.PaymentTransaction = PaymentTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "studentFeeAccountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_fee_account_entity_1.StudentFeeAccount, (acc) => acc.transactions, {
        onDelete: 'CASCADE',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'studentFeeAccountId' }),
    __metadata("design:type", student_fee_account_entity_1.StudentFeeAccount)
], PaymentTransaction.prototype, "studentFeeAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "familyBillingGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => family_billing_group_entity_1.FamilyBillingGroup, (grp) => grp.transactions, {
        onDelete: 'CASCADE',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'familyBillingGroupId' }),
    __metadata("design:type", family_billing_group_entity_1.FamilyBillingGroup)
], PaymentTransaction.prototype, "familyBillingGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PaymentTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: transaction_type_enum_1.TransactionType, default: transaction_type_enum_1.TransactionType.PAYMENT }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "recordedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PaymentTransaction.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransaction.prototype, "createdAt", void 0);
exports.PaymentTransaction = PaymentTransaction = __decorate([
    (0, typeorm_1.Entity)('payment_transactions')
], PaymentTransaction);
//# sourceMappingURL=payment-transaction.entity.js.map