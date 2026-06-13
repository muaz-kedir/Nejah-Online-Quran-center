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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const finance_query_dto_1 = require("./dto/finance-query.dto");
const record_payment_dto_1 = require("./dto/record-payment.dto");
let FinanceController = class FinanceController {
    constructor(financeService) {
        this.financeService = financeService;
    }
    getDashboard() {
        return this.financeService.getDashboard();
    }
    syncAccounts(billingMonth) {
        return this.financeService.syncStudentFeeAccounts(billingMonth);
    }
    getStudentPayments(query) {
        return this.financeService.getStudentPayments(query);
    }
    getStudentPaymentDetail(id) {
        return this.financeService.getStudentPaymentDetail(id);
    }
    recordStudentPayment(id, dto, user) {
        return this.financeService.recordStudentPayment(id, dto, user.id);
    }
    updateStudentFee(id, dto) {
        return this.financeService.updateStudentFee(id, dto);
    }
    getFamilyPayments(query) {
        return this.financeService.getFamilyPayments(query);
    }
    bundleFamily(dto) {
        return this.financeService.bundleFamilyPayments(dto);
    }
    getFamilyPaymentDetail(id) {
        return this.financeService.getFamilyPaymentDetail(id);
    }
    recordFamilyPayment(id, dto, user) {
        return this.financeService.recordFamilyPayment(id, dto, user.id);
    }
    getTeacherPayments(query) {
        return this.financeService.getTeacherPayments(query);
    }
    getTeacherPaymentDetail(teacherId, billingMonth) {
        return this.financeService.getTeacherPaymentDetail(teacherId, billingMonth);
    }
    generatePayroll(dto) {
        return this.financeService.generatePayroll(dto.billingMonth);
    }
    getRevenueAnalytics(query) {
        return this.financeService.getRevenueAnalytics(query);
    }
    getFinancialReport(type, query) {
        return this.financeService.getFinancialReport(type, query);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Query)('billingMonth')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "syncAccounts", null);
__decorate([
    (0, common_1.Get)('student-payments'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_query_dto_1.FinanceQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getStudentPayments", null);
__decorate([
    (0, common_1.Get)('student-payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getStudentPaymentDetail", null);
__decorate([
    (0, common_1.Post)('student-payments/:id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_payment_dto_1.RecordPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordStudentPayment", null);
__decorate([
    (0, common_1.Patch)('student-payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_payment_dto_1.UpdateStudentFeeDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateStudentFee", null);
__decorate([
    (0, common_1.Get)('family-payments'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_query_dto_1.FinanceQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getFamilyPayments", null);
__decorate([
    (0, common_1.Post)('family-payments/bundle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [record_payment_dto_1.BundleFamilyDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "bundleFamily", null);
__decorate([
    (0, common_1.Get)('family-payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getFamilyPaymentDetail", null);
__decorate([
    (0, common_1.Post)('family-payments/:id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_payment_dto_1.RecordPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordFamilyPayment", null);
__decorate([
    (0, common_1.Get)('teacher-payments'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_query_dto_1.FinanceQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getTeacherPayments", null);
__decorate([
    (0, common_1.Get)('teacher-payments/:teacherId'),
    __param(0, (0, common_1.Param)('teacherId')),
    __param(1, (0, common_1.Query)('billingMonth')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getTeacherPaymentDetail", null);
__decorate([
    (0, common_1.Post)('teacher-payments/generate-payroll'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [record_payment_dto_1.GeneratePayrollDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "generatePayroll", null);
__decorate([
    (0, common_1.Get)('revenue-analytics'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_query_dto_1.FinanceQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)('reports/:type'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_query_dto_1.FinanceQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getFinancialReport", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.FINANCE_MANAGER, user_role_enum_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map