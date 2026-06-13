"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const finance_service_1 = require("./finance.service");
const finance_controller_1 = require("./finance.controller");
const student_fee_account_entity_1 = require("./entities/student-fee-account.entity");
const payment_transaction_entity_1 = require("./entities/payment-transaction.entity");
const family_billing_group_entity_1 = require("./entities/family-billing-group.entity");
const family_billing_member_entity_1 = require("./entities/family-billing-member.entity");
const teacher_payroll_record_entity_1 = require("./entities/teacher-payroll-record.entity");
const teacher_earning_detail_entity_1 = require("./entities/teacher-earning-detail.entity");
const student_entity_1 = require("../students/entities/student.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const student_attendance_entity_1 = require("../attendance/entities/student-attendance.entity");
const teacher_replacement_entity_1 = require("../teacher-replacements/entities/teacher-replacement.entity");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_fee_account_entity_1.StudentFeeAccount,
                payment_transaction_entity_1.PaymentTransaction,
                family_billing_group_entity_1.FamilyBillingGroup,
                family_billing_member_entity_1.FamilyBillingMember,
                teacher_payroll_record_entity_1.TeacherPayrollRecord,
                teacher_earning_detail_entity_1.TeacherEarningDetail,
                student_entity_1.Student,
                parent_entity_1.Parent,
                teacher_entity_1.Teacher,
                schedule_entity_1.Schedule,
                class_session_entity_1.ClassSession,
                student_attendance_entity_1.StudentAttendance,
                teacher_replacement_entity_1.TeacherReplacement,
            ]),
        ],
        controllers: [finance_controller_1.FinanceController],
        providers: [finance_service_1.FinanceService],
        exports: [finance_service_1.FinanceService],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map