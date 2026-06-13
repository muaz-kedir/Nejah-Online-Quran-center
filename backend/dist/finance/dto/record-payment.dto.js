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
exports.GeneratePayrollDto = exports.BundleFamilyDto = exports.UpdateStudentFeeDto = exports.RecordPaymentDto = void 0;
const class_validator_1 = require("class-validator");
const transaction_type_enum_1 = require("../../common/enums/transaction-type.enum");
const payment_status_enum_1 = require("../../common/enums/payment-status.enum");
class RecordPaymentDto {
}
exports.RecordPaymentDto = RecordPaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RecordPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(transaction_type_enum_1.TransactionType),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "transactionDate", void 0);
class UpdateStudentFeeDto {
}
exports.UpdateStudentFeeDto = UpdateStudentFeeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStudentFeeDto.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStudentFeeDto.prototype, "scholarshipAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStudentFeeDto.prototype, "sessionRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(payment_status_enum_1.PaymentStatus),
    __metadata("design:type", String)
], UpdateStudentFeeDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStudentFeeDto.prototype, "dueDate", void 0);
class BundleFamilyDto {
}
exports.BundleFamilyDto = BundleFamilyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleFamilyDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BundleFamilyDto.prototype, "studentIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleFamilyDto.prototype, "billingMonth", void 0);
class GeneratePayrollDto {
}
exports.GeneratePayrollDto = GeneratePayrollDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GeneratePayrollDto.prototype, "billingMonth", void 0);
//# sourceMappingURL=record-payment.dto.js.map