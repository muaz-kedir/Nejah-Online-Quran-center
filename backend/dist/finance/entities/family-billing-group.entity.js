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
exports.FamilyBillingGroup = void 0;
const typeorm_1 = require("typeorm");
const parent_entity_1 = require("../../parents/entities/parent.entity");
const payment_status_enum_1 = require("../../common/enums/payment-status.enum");
const family_billing_member_entity_1 = require("./family-billing-member.entity");
const payment_transaction_entity_1 = require("./payment-transaction.entity");
let FamilyBillingGroup = class FamilyBillingGroup {
};
exports.FamilyBillingGroup = FamilyBillingGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FamilyBillingGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FamilyBillingGroup.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parent_entity_1.Parent, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", parent_entity_1.Parent)
], FamilyBillingGroup.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FamilyBillingGroup.prototype, "monthlyTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FamilyBillingGroup.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FamilyBillingGroup.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FamilyBillingGroup.prototype, "scholarshipAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FamilyBillingGroup.prototype, "remainingBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: payment_status_enum_1.PaymentStatus, default: payment_status_enum_1.PaymentStatus.UNPAID }),
    __metadata("design:type", String)
], FamilyBillingGroup.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], FamilyBillingGroup.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7 }),
    __metadata("design:type", String)
], FamilyBillingGroup.prototype, "billingMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], FamilyBillingGroup.prototype, "isBundled", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => family_billing_member_entity_1.FamilyBillingMember, (m) => m.familyBillingGroup, { cascade: true }),
    __metadata("design:type", Array)
], FamilyBillingGroup.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_transaction_entity_1.PaymentTransaction, (tx) => tx.familyBillingGroup),
    __metadata("design:type", Array)
], FamilyBillingGroup.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FamilyBillingGroup.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], FamilyBillingGroup.prototype, "updatedAt", void 0);
exports.FamilyBillingGroup = FamilyBillingGroup = __decorate([
    (0, typeorm_1.Entity)('family_billing_groups')
], FamilyBillingGroup);
//# sourceMappingURL=family-billing-group.entity.js.map