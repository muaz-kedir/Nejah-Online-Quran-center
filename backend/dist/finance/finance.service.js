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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
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
const payment_status_enum_1 = require("../common/enums/payment-status.enum");
const transaction_type_enum_1 = require("../common/enums/transaction-type.enum");
const finance_date_util_1 = require("./finance-date.util");
const DEFAULT_SESSION_RATE = 5;
const WEEKS_PER_MONTH = 4;
let FinanceService = class FinanceService {
    constructor(feeRepo, txRepo, familyRepo, familyMemberRepo, payrollRepo, earningRepo, studentRepo, parentRepo, teacherRepo, scheduleRepo, sessionRepo, studentAttRepo, replacementRepo) {
        this.feeRepo = feeRepo;
        this.txRepo = txRepo;
        this.familyRepo = familyRepo;
        this.familyMemberRepo = familyMemberRepo;
        this.payrollRepo = payrollRepo;
        this.earningRepo = earningRepo;
        this.studentRepo = studentRepo;
        this.parentRepo = parentRepo;
        this.teacherRepo = teacherRepo;
        this.scheduleRepo = scheduleRepo;
        this.sessionRepo = sessionRepo;
        this.studentAttRepo = studentAttRepo;
        this.replacementRepo = replacementRepo;
    }
    getCurrentBillingMonth() {
        return (0, finance_date_util_1.currentBillingMonth)();
    }
    parseTimeMinutes(timeStr) {
        if (!timeStr)
            return 60;
        const parts = timeStr.split(':').map(Number);
        if (parts.length < 2)
            return 60;
        return parts[0] * 60 + parts[1];
    }
    resolveDateRange(query) {
        const now = new Date();
        switch (query.dateRange) {
            case 'today':
                return { start: now, end: now };
            case 'week':
                return { start: (0, finance_date_util_1.startOfWeekDate)(now), end: (0, finance_date_util_1.endOfWeekDate)(now) };
            case 'month':
                return { start: (0, finance_date_util_1.startOfMonthDate)(now), end: (0, finance_date_util_1.endOfMonthDate)(now) };
            case 'year':
                return { start: (0, finance_date_util_1.startOfYearDate)(now), end: (0, finance_date_util_1.endOfYearDate)(now) };
            case 'custom':
                return {
                    start: query.startDate ? (0, finance_date_util_1.parseDateStr)(query.startDate) : undefined,
                    end: query.endDate ? (0, finance_date_util_1.parseDateStr)(query.endDate) : undefined,
                };
            default:
                return {};
        }
    }
    resolvePaymentStatus(amountPaid, effectiveFee, dueDate) {
        const remaining = effectiveFee - amountPaid;
        if (remaining <= 0)
            return payment_status_enum_1.PaymentStatus.PAID;
        if (amountPaid > 0)
            return payment_status_enum_1.PaymentStatus.PARTIAL;
        if (dueDate && (0, finance_date_util_1.isBeforeDate)(dueDate, new Date()))
            return payment_status_enum_1.PaymentStatus.OVERDUE;
        return payment_status_enum_1.PaymentStatus.UNPAID;
    }
    toNumber(val) {
        return parseFloat(String(val ?? 0)) || 0;
    }
    async calculateStudentFee(studentId, billingMonth) {
        const month = billingMonth || this.getCurrentBillingMonth();
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const schedules = await this.scheduleRepo.find({
            where: { studentId, status: 'active' },
        });
        const weeklyDays = schedules.length;
        const monthlySessions = weeklyDays * WEEKS_PER_MONTH;
        let sessionDurationMinutes = 60;
        if (schedules[0]?.startTimeString && schedules[0]?.endTimeString) {
            const start = this.parseTimeMinutes(schedules[0].startTimeString);
            const end = this.parseTimeMinutes(schedules[0].endTimeString);
            sessionDurationMinutes = Math.max(end - start, 60);
        }
        const existing = await this.feeRepo.findOne({ where: { studentId, billingMonth: month } });
        const sessionRate = existing?.sessionRate != null ? this.toNumber(existing.sessionRate) : DEFAULT_SESSION_RATE;
        const monthlyFee = sessionRate * monthlySessions;
        const dueDate = existing?.dueDate || (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.addDaysDate)((0, finance_date_util_1.parseDateStr)(`${month}-01`), 14));
        return {
            studentId,
            parentId: student.parentId,
            teacherId: student.teacherId,
            program: student.level,
            sessionRate,
            weeklyScheduleDays: weeklyDays,
            sessionDurationMinutes,
            monthlySessions,
            monthlyFee,
            dueDate,
            billingMonth: month,
        };
    }
    async syncStudentFeeAccounts(billingMonth) {
        const month = billingMonth || this.getCurrentBillingMonth();
        const students = await this.studentRepo.find({
            where: { status: student_entity_1.StudentStatus.ACTIVE, isAssigned: true },
        });
        let synced = 0;
        for (const student of students) {
            const calc = await this.calculateStudentFee(student.id, month);
            let account = await this.feeRepo.findOne({
                where: { studentId: student.id, billingMonth: month },
            });
            if (!account) {
                account = this.feeRepo.create({
                    ...calc,
                    amountPaid: 0,
                    discountAmount: 0,
                    scholarshipAmount: 0,
                    remainingBalance: this.toNumber(calc.monthlyFee),
                    status: payment_status_enum_1.PaymentStatus.UNPAID,
                });
            }
            else {
                Object.assign(account, calc);
            }
            const effectiveFee = this.toNumber(account.monthlyFee) -
                this.toNumber(account.discountAmount) -
                this.toNumber(account.scholarshipAmount);
            account.remainingBalance = Math.max(effectiveFee - this.toNumber(account.amountPaid), 0);
            account.status = this.resolvePaymentStatus(this.toNumber(account.amountPaid), effectiveFee, account.dueDate);
            await this.feeRepo.save(account);
            synced++;
        }
        return { synced };
    }
    async getDashboard() {
        await this.syncStudentFeeAccounts();
        const month = this.getCurrentBillingMonth();
        const monthStart = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.startOfMonthDate)(new Date()));
        const monthEnd = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.endOfMonthDate)(new Date()));
        const weekEnd = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.addDaysDate)(new Date(), 7));
        const today = (0, finance_date_util_1.fmtDate)(new Date());
        const accounts = await this.feeRepo.find({ where: { billingMonth: month } });
        const families = await this.familyRepo.find({ where: { billingMonth: month } });
        const payrolls = await this.payrollRepo.find({ where: { billingMonth: month } });
        const totalMonthlyRevenue = accounts.reduce((s, a) => s + this.toNumber(a.monthlyFee), 0) +
            families.filter((f) => f.isBundled).reduce((s, f) => s + this.toNumber(f.monthlyTotal), 0);
        const totalCollected = accounts.reduce((s, a) => s + this.toNumber(a.amountPaid), 0) +
            families.reduce((s, f) => s + this.toNumber(f.amountPaid), 0);
        const totalOutstanding = accounts.reduce((s, a) => s + this.toNumber(a.remainingBalance), 0) +
            families.reduce((s, f) => s + this.toNumber(f.remainingBalance), 0);
        const activePayingStudents = accounts.filter((a) => a.status === payment_status_enum_1.PaymentStatus.PAID || a.status === payment_status_enum_1.PaymentStatus.PARTIAL).length;
        const activeFamilies = await this.parentRepo
            .createQueryBuilder('p')
            .innerJoin('p.students', 's')
            .where('s.status = :status', { status: student_entity_1.StudentStatus.ACTIVE })
            .getCount();
        const totalTeacherPayroll = payrolls.reduce((s, p) => s + this.toNumber(p.totalEarnings), 0);
        const paymentsDueThisWeek = accounts.filter((a) => a.dueDate &&
            a.dueDate >= today &&
            a.dueDate <= weekEnd &&
            a.status !== payment_status_enum_1.PaymentStatus.PAID).length +
            families.filter((f) => f.dueDate &&
                f.dueDate >= today &&
                f.dueDate <= weekEnd &&
                f.status !== payment_status_enum_1.PaymentStatus.PAID).length;
        const overduePayments = accounts.filter((a) => a.status === payment_status_enum_1.PaymentStatus.OVERDUE).length +
            families.filter((f) => f.status === payment_status_enum_1.PaymentStatus.OVERDUE).length;
        const monthTransactions = await this.txRepo.find({
            where: {
                transactionDate: (0, typeorm_2.Between)(monthStart, monthEnd),
                type: transaction_type_enum_1.TransactionType.PAYMENT,
            },
        });
        return {
            totalMonthlyRevenue: +totalMonthlyRevenue.toFixed(2),
            totalCollectedPayments: +totalCollected.toFixed(2),
            totalOutstandingPayments: +totalOutstanding.toFixed(2),
            totalActivePayingStudents: activePayingStudents,
            totalActiveFamilies: activeFamilies,
            totalTeacherPayroll: +totalTeacherPayroll.toFixed(2),
            paymentsDueThisWeek,
            overduePayments,
            billingMonth: month,
            recentTransactions: monthTransactions.slice(0, 10).map((t) => ({
                id: t.id,
                amount: this.toNumber(t.amount),
                type: t.type,
                transactionDate: t.transactionDate,
                description: t.description,
            })),
        };
    }
    mapStudentPaymentRow(account, student, parent, teacher) {
        return {
            id: account.id,
            studentId: account.studentId,
            studentName: student?.fullName || '—',
            parentName: parent?.fullName || '—',
            teacherName: teacher?.fullName || '—',
            program: account.program,
            monthlyFee: this.toNumber(account.monthlyFee),
            amountPaid: this.toNumber(account.amountPaid),
            remainingBalance: this.toNumber(account.remainingBalance),
            status: account.status,
            dueDate: account.dueDate,
            billingMonth: account.billingMonth,
            isFamilyBundled: account.isFamilyBundled,
            country: student?.country || '—',
        };
    }
    async getStudentPayments(query) {
        await this.syncStudentFeeAccounts(query.billingMonth);
        const month = query.billingMonth || this.getCurrentBillingMonth();
        const page = query.page || 1;
        const limit = query.limit || 20;
        const qb = this.feeRepo
            .createQueryBuilder('fee')
            .leftJoinAndSelect('fee.student', 'student')
            .leftJoinAndSelect('fee.parent', 'parent')
            .leftJoinAndSelect('fee.teacher', 'teacher')
            .where('fee.billingMonth = :month', { month })
            .andWhere('fee.isFamilyBundled = false');
        if (query.paymentStatus)
            qb.andWhere('fee.status = :status', { status: query.paymentStatus });
        if (query.studentId)
            qb.andWhere('fee.studentId = :studentId', { studentId: query.studentId });
        if (query.parentId)
            qb.andWhere('fee.parentId = :parentId', { parentId: query.parentId });
        if (query.teacherId)
            qb.andWhere('fee.teacherId = :teacherId', { teacherId: query.teacherId });
        if (query.country)
            qb.andWhere('student.country ILIKE :country', { country: `%${query.country}%` });
        if (query.learningProgram)
            qb.andWhere('fee.program ILIKE :program', { program: `%${query.learningProgram}%` });
        if (query.search) {
            qb.andWhere('(student.fullName ILIKE :search OR parent.fullName ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const total = await qb.getCount();
        const accounts = await qb
            .orderBy('fee.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return {
            data: accounts.map((a) => this.mapStudentPaymentRow(a, a.student, a.parent, a.teacher)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getStudentPaymentDetail(id) {
        const account = await this.feeRepo.findOne({
            where: { id },
            relations: ['student', 'parent', 'teacher', 'transactions'],
        });
        if (!account)
            throw new common_1.NotFoundException('Payment record not found');
        const schedules = await this.scheduleRepo.find({
            where: { studentId: account.studentId, status: 'active' },
        });
        const transactions = (account.transactions || []).sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        return {
            ...this.mapStudentPaymentRow(account, account.student, account.parent, account.teacher),
            registrationDate: account.student?.createdAt,
            weeklySchedule: schedules.map((s) => ({
                day: s.dayOfWeek,
                startTime: s.startTimeString,
                endTime: s.endTimeString,
                className: s.className,
            })),
            sessionDurationMinutes: account.sessionDurationMinutes,
            monthlySessions: account.monthlySessions,
            sessionRate: this.toNumber(account.sessionRate),
            discountAmount: this.toNumber(account.discountAmount),
            scholarshipAmount: this.toNumber(account.scholarshipAmount),
            paymentHistory: transactions.map((t) => ({
                id: t.id,
                amount: this.toNumber(t.amount),
                type: t.type,
                description: t.description,
                paymentMethod: t.paymentMethod,
                transactionDate: t.transactionDate,
                createdAt: t.createdAt,
            })),
        };
    }
    async recordStudentPayment(id, dto, userId) {
        const account = await this.feeRepo.findOne({ where: { id } });
        if (!account)
            throw new common_1.NotFoundException('Payment record not found');
        const tx = this.txRepo.create({
            studentFeeAccountId: id,
            amount: dto.amount,
            type: dto.type || transaction_type_enum_1.TransactionType.PAYMENT,
            description: dto.description,
            paymentMethod: dto.paymentMethod,
            recordedBy: userId,
            transactionDate: dto.transactionDate || (0, finance_date_util_1.fmtDate)(new Date()),
        });
        await this.txRepo.save(tx);
        if (dto.type === transaction_type_enum_1.TransactionType.DISCOUNT) {
            account.discountAmount = this.toNumber(account.discountAmount) + dto.amount;
        }
        else if (dto.type === transaction_type_enum_1.TransactionType.SCHOLARSHIP) {
            account.scholarshipAmount = this.toNumber(account.scholarshipAmount) + dto.amount;
        }
        else {
            account.amountPaid = this.toNumber(account.amountPaid) + dto.amount;
        }
        const effectiveFee = this.toNumber(account.monthlyFee) -
            this.toNumber(account.discountAmount) -
            this.toNumber(account.scholarshipAmount);
        account.remainingBalance = Math.max(effectiveFee - this.toNumber(account.amountPaid), 0);
        account.status = this.resolvePaymentStatus(this.toNumber(account.amountPaid), effectiveFee, account.dueDate);
        await this.feeRepo.save(account);
        return this.getStudentPaymentDetail(id);
    }
    async updateStudentFee(id, dto) {
        const account = await this.feeRepo.findOne({ where: { id } });
        if (!account)
            throw new common_1.NotFoundException('Payment record not found');
        if (dto.discountAmount !== undefined)
            account.discountAmount = dto.discountAmount;
        if (dto.scholarshipAmount !== undefined)
            account.scholarshipAmount = dto.scholarshipAmount;
        if (dto.sessionRate !== undefined) {
            account.sessionRate = dto.sessionRate;
            account.monthlyFee = dto.sessionRate * account.monthlySessions;
        }
        if (dto.dueDate)
            account.dueDate = dto.dueDate;
        const effectiveFee = this.toNumber(account.monthlyFee) -
            this.toNumber(account.discountAmount) -
            this.toNumber(account.scholarshipAmount);
        account.remainingBalance = Math.max(effectiveFee - this.toNumber(account.amountPaid), 0);
        if (dto.status) {
            account.status = dto.status;
        }
        else {
            account.status = this.resolvePaymentStatus(this.toNumber(account.amountPaid), effectiveFee, account.dueDate);
        }
        await this.feeRepo.save(account);
        return this.getStudentPaymentDetail(id);
    }
    async getFamilyPayments(query) {
        await this.syncStudentFeeAccounts(query.billingMonth);
        const month = query.billingMonth || this.getCurrentBillingMonth();
        const page = query.page || 1;
        const limit = query.limit || 20;
        const separateAccounts = await this.feeRepo.find({
            where: { billingMonth: month, isFamilyBundled: false },
            relations: ['student', 'parent'],
        });
        const parentMap = new Map();
        for (const acc of separateAccounts) {
            if (!acc.parentId)
                continue;
            const key = acc.parentId;
            if (!parentMap.has(key)) {
                parentMap.set(key, { parent: acc.parent, children: [] });
            }
            parentMap.get(key).children.push(acc);
        }
        const separateFamilies = Array.from(parentMap.entries())
            .filter(([, v]) => v.children.length >= 1)
            .map(([parentId, v]) => ({
            type: 'separate',
            parentId,
            parentName: v.parent?.fullName || '—',
            children: v.children.map((c) => ({
                studentId: c.studentId,
                studentName: c.student?.fullName || '—',
                monthlyFee: this.toNumber(c.monthlyFee),
                status: c.status,
                registrationDate: c.student?.createdAt,
            })),
            monthlyTotal: v.children.reduce((s, c) => s + this.toNumber(c.monthlyFee), 0),
            status: v.children.every((c) => c.status === payment_status_enum_1.PaymentStatus.PAID)
                ? payment_status_enum_1.PaymentStatus.PAID
                : v.children.some((c) => c.status === payment_status_enum_1.PaymentStatus.OVERDUE)
                    ? payment_status_enum_1.PaymentStatus.OVERDUE
                    : v.children.some((c) => c.status === payment_status_enum_1.PaymentStatus.PARTIAL)
                        ? payment_status_enum_1.PaymentStatus.PARTIAL
                        : payment_status_enum_1.PaymentStatus.UNPAID,
        }));
        const bundledQb = this.familyRepo
            .createQueryBuilder('fam')
            .leftJoinAndSelect('fam.parent', 'parent')
            .leftJoinAndSelect('fam.members', 'members')
            .leftJoinAndSelect('members.student', 'student')
            .where('fam.billingMonth = :month', { month });
        if (query.parentId)
            bundledQb.andWhere('fam.parentId = :parentId', { parentId: query.parentId });
        if (query.paymentStatus)
            bundledQb.andWhere('fam.status = :status', { status: query.paymentStatus });
        if (query.search) {
            bundledQb.andWhere('parent.fullName ILIKE :search', { search: `%${query.search}%` });
        }
        const bundled = await bundledQb.getMany();
        const bundledFamilies = bundled.map((f) => ({
            type: 'bundled',
            id: f.id,
            parentId: f.parentId,
            parentName: f.parent?.fullName || '—',
            children: (f.members || []).map((m) => ({
                studentId: m.studentId,
                studentName: m.student?.fullName || '—',
                monthlyFee: this.toNumber(m.individualMonthlyFee),
            })),
            monthlyTotal: this.toNumber(f.monthlyTotal),
            amountPaid: this.toNumber(f.amountPaid),
            remainingBalance: this.toNumber(f.remainingBalance),
            status: f.status,
            dueDate: f.dueDate,
        }));
        const all = [...separateFamilies, ...bundledFamilies];
        const total = all.length;
        const data = all.slice((page - 1) * limit, page * limit);
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async bundleFamilyPayments(dto) {
        const month = dto.billingMonth || this.getCurrentBillingMonth();
        if (dto.studentIds.length < 2) {
            throw new common_1.BadRequestException('At least 2 students required for family bundling');
        }
        const accounts = await this.feeRepo.find({
            where: { studentId: (0, typeorm_2.In)(dto.studentIds), billingMonth: month },
            relations: ['student'],
        });
        if (accounts.length !== dto.studentIds.length) {
            await this.syncStudentFeeAccounts(month);
        }
        const refreshed = await this.feeRepo.find({
            where: { studentId: (0, typeorm_2.In)(dto.studentIds), billingMonth: month },
            relations: ['student'],
        });
        const monthlyTotal = refreshed.reduce((s, a) => s + this.toNumber(a.monthlyFee), 0);
        const dueDate = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.addDaysDate)((0, finance_date_util_1.parseDateStr)(`${month}-01`), 14));
        const group = this.familyRepo.create({
            parentId: dto.parentId,
            monthlyTotal,
            amountPaid: 0,
            remainingBalance: monthlyTotal,
            status: payment_status_enum_1.PaymentStatus.UNPAID,
            dueDate,
            billingMonth: month,
            isBundled: true,
        });
        const saved = await this.familyRepo.save(group);
        for (const acc of refreshed) {
            await this.familyMemberRepo.save(this.familyMemberRepo.create({
                familyBillingGroupId: saved.id,
                studentId: acc.studentId,
                individualMonthlyFee: this.toNumber(acc.monthlyFee),
            }));
            acc.isFamilyBundled = true;
            acc.familyBillingGroupId = saved.id;
            await this.feeRepo.save(acc);
        }
        return this.getFamilyPaymentDetail(saved.id);
    }
    async getFamilyPaymentDetail(id) {
        const group = await this.familyRepo.findOne({
            where: { id },
            relations: ['parent', 'members', 'members.student', 'transactions'],
        });
        if (!group)
            throw new common_1.NotFoundException('Family billing group not found');
        return {
            id: group.id,
            parentId: group.parentId,
            parentName: group.parent?.fullName,
            monthlyTotal: this.toNumber(group.monthlyTotal),
            amountPaid: this.toNumber(group.amountPaid),
            remainingBalance: this.toNumber(group.remainingBalance),
            discountAmount: this.toNumber(group.discountAmount),
            scholarshipAmount: this.toNumber(group.scholarshipAmount),
            status: group.status,
            dueDate: group.dueDate,
            billingMonth: group.billingMonth,
            children: (group.members || []).map((m) => ({
                studentId: m.studentId,
                studentName: m.student?.fullName,
                monthlyFee: this.toNumber(m.individualMonthlyFee),
            })),
            paymentHistory: (group.transactions || []).map((t) => ({
                id: t.id,
                amount: this.toNumber(t.amount),
                type: t.type,
                transactionDate: t.transactionDate,
                description: t.description,
            })),
        };
    }
    async recordFamilyPayment(id, dto, userId) {
        const group = await this.familyRepo.findOne({ where: { id } });
        if (!group)
            throw new common_1.NotFoundException('Family billing group not found');
        const tx = this.txRepo.create({
            familyBillingGroupId: id,
            amount: dto.amount,
            type: dto.type || transaction_type_enum_1.TransactionType.PAYMENT,
            description: dto.description,
            paymentMethod: dto.paymentMethod,
            recordedBy: userId,
            transactionDate: dto.transactionDate || (0, finance_date_util_1.fmtDate)(new Date()),
        });
        await this.txRepo.save(tx);
        if (dto.type === transaction_type_enum_1.TransactionType.DISCOUNT) {
            group.discountAmount = this.toNumber(group.discountAmount) + dto.amount;
        }
        else if (dto.type === transaction_type_enum_1.TransactionType.SCHOLARSHIP) {
            group.scholarshipAmount = this.toNumber(group.scholarshipAmount) + dto.amount;
        }
        else {
            group.amountPaid = this.toNumber(group.amountPaid) + dto.amount;
        }
        const effectiveFee = this.toNumber(group.monthlyTotal) -
            this.toNumber(group.discountAmount) -
            this.toNumber(group.scholarshipAmount);
        group.remainingBalance = Math.max(effectiveFee - this.toNumber(group.amountPaid), 0);
        group.status = this.resolvePaymentStatus(this.toNumber(group.amountPaid), effectiveFee, group.dueDate);
        await this.familyRepo.save(group);
        return this.getFamilyPaymentDetail(id);
    }
    async calculateTeacherEarnings(teacherId, billingMonth) {
        const month = billingMonth || this.getCurrentBillingMonth();
        const [year, mon] = month.split('-').map(Number);
        const periodStart = (0, finance_date_util_1.fmtDate)(new Date(year, mon - 1, 1));
        const periodEnd = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.endOfMonthDate)(new Date(year, mon - 1, 1)));
        const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
        if (!teacher)
            throw new common_1.NotFoundException('Teacher not found');
        const sessionRate = this.toNumber(teacher.hourlyRate) || DEFAULT_SESSION_RATE;
        const sessions = await this.sessionRepo
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.studentAttendances', 'att')
            .leftJoinAndSelect('att.student', 'student')
            .where('session.teacherId = :teacherId', { teacherId })
            .andWhere('session.status = :status', { status: class_session_entity_1.SessionStatus.COMPLETED })
            .andWhere('session.sessionDate >= :periodStart', { periodStart })
            .andWhere('session.sessionDate <= :periodEnd', { periodEnd })
            .getMany();
        const replacements = await this.replacementRepo.find({
            where: [{ originalTeacherId: teacherId }, { replacementTeacherId: teacherId }],
        });
        const studentEarnings = new Map();
        for (const session of sessions) {
            const attendances = session.studentAttendances || [];
            for (const att of attendances) {
                const sid = att.studentId;
                if (!sid)
                    continue;
                const sessionDateStr = typeof session.sessionDate === 'string'
                    ? session.sessionDate
                    : (0, finance_date_util_1.fmtDate)(new Date(session.sessionDate));
                const replacement = replacements.find((r) => r.studentId === sid &&
                    r.replacementTeacherId === teacherId &&
                    sessionDateStr >= r.startDate &&
                    sessionDateStr <= r.endDate);
                const key = `${sid}-${replacement?.id || 'regular'}`;
                const existing = studentEarnings.get(key) || {
                    sessions: 0,
                    earnings: 0,
                    isReplacement: !!replacement,
                    replacementId: replacement?.id,
                };
                existing.sessions += 1;
                existing.earnings += sessionRate;
                studentEarnings.set(key, existing);
            }
            if (attendances.length === 0) {
                const key = `unassigned-regular`;
                const existing = studentEarnings.get(key) || {
                    sessions: 0,
                    earnings: 0,
                    isReplacement: false,
                };
                existing.sessions += 1;
                existing.earnings += sessionRate;
                studentEarnings.set(key, existing);
            }
        }
        const assignedStudents = await this.studentRepo.count({
            where: { teacherId, status: student_entity_1.StudentStatus.ACTIVE },
        });
        const details = Array.from(studentEarnings.entries()).map(([key, val]) => {
            const studentId = key.split('-')[0] !== 'unassigned' ? key.split('-')[0] : null;
            return {
                studentId,
                sessionsConducted: val.sessions,
                sessionRate,
                earnings: val.earnings,
                isReplacement: val.isReplacement,
                replacementId: val.replacementId,
            };
        });
        const totalSessions = details.reduce((s, d) => s + d.sessionsConducted, 0);
        const totalEarnings = details.reduce((s, d) => s + d.earnings, 0);
        return {
            teacherId,
            teacherName: teacher.fullName,
            assignedStudents,
            sessionsConducted: totalSessions,
            sessionRate,
            earnings: +totalEarnings.toFixed(2),
            billingMonth: month,
            details,
            replacements: replacements.map((r) => ({
                id: r.id,
                studentId: r.studentId,
                originalTeacherId: r.originalTeacherId,
                replacementTeacherId: r.replacementTeacherId,
                startDate: r.startDate,
                endDate: r.endDate,
                status: r.status,
            })),
        };
    }
    async getTeacherPayments(query) {
        const month = query.billingMonth || this.getCurrentBillingMonth();
        const page = query.page || 1;
        const limit = query.limit || 20;
        const qb = this.teacherRepo
            .createQueryBuilder('teacher')
            .where('teacher.status = :status', { status: 'active' });
        if (query.search)
            qb.andWhere('teacher.fullName ILIKE :search', { search: `%${query.search}%` });
        if (query.teacherId)
            qb.andWhere('teacher.id = :teacherId', { teacherId: query.teacherId });
        if (query.country)
            qb.andWhere('teacher.country ILIKE :country', { country: `%${query.country}%` });
        const total = await qb.getCount();
        const teachers = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const data = await Promise.all(teachers.map(async (t) => {
            const calc = await this.calculateTeacherEarnings(t.id, month);
            const payroll = await this.payrollRepo.findOne({
                where: { teacherId: t.id, billingMonth: month },
            });
            return {
                teacherId: t.id,
                teacherName: t.fullName,
                totalAssignedStudents: calc.assignedStudents,
                sessionsConducted: calc.sessionsConducted,
                sessionRate: calc.sessionRate,
                earnings: calc.earnings,
                payrollStatus: payroll?.status || 'pending',
                monthlySalary: this.toNumber(t.monthlySalary),
            };
        }));
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
    async getTeacherPaymentDetail(teacherId, billingMonth) {
        const calc = await this.calculateTeacherEarnings(teacherId, billingMonth);
        const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
        const payroll = await this.payrollRepo.findOne({
            where: { teacherId, billingMonth: calc.billingMonth },
            relations: ['earningDetails', 'earningDetails.student'],
        });
        const studentDetails = await Promise.all(calc.details
            .filter((d) => d.studentId)
            .map(async (d) => {
            const student = await this.studentRepo.findOne({ where: { id: d.studentId } });
            return {
                studentName: student?.fullName || '—',
                ...d,
            };
        }));
        return {
            ...calc,
            monthlySalary: this.toNumber(teacher?.monthlySalary),
            assignedStudents: studentDetails,
            monthlySummary: {
                totalStudents: studentDetails.length,
                totalSessions: calc.sessionsConducted,
                totalEarnings: calc.earnings,
            },
            payroll: payroll
                ? {
                    id: payroll.id,
                    status: payroll.status,
                    totalEarnings: this.toNumber(payroll.totalEarnings),
                    paidAt: payroll.paidAt,
                }
                : null,
        };
    }
    async generatePayroll(billingMonth) {
        const month = billingMonth || this.getCurrentBillingMonth();
        const teachers = await this.teacherRepo.find({ where: { status: 'active' } });
        const generated = [];
        for (const teacher of teachers) {
            const calc = await this.calculateTeacherEarnings(teacher.id, month);
            let record = await this.payrollRepo.findOne({
                where: { teacherId: teacher.id, billingMonth: month },
            });
            if (!record) {
                record = this.payrollRepo.create({
                    teacherId: teacher.id,
                    billingMonth: month,
                    totalSessions: calc.sessionsConducted,
                    totalEarnings: calc.earnings,
                    status: 'pending',
                });
            }
            else {
                record.totalSessions = calc.sessionsConducted;
                record.totalEarnings = calc.earnings;
            }
            const saved = await this.payrollRepo.save(record);
            await this.earningRepo.delete({ payrollRecordId: saved.id });
            for (const detail of calc.details) {
                if (!detail.studentId && detail.sessionsConducted === 0)
                    continue;
                await this.earningRepo.save(this.earningRepo.create({
                    payrollRecordId: saved.id,
                    teacherId: teacher.id,
                    studentId: detail.studentId || undefined,
                    sessionsConducted: detail.sessionsConducted,
                    sessionRate: detail.sessionRate,
                    earnings: detail.earnings,
                    isReplacement: detail.isReplacement,
                    replacementId: detail.replacementId,
                }));
            }
            generated.push(saved);
        }
        return { billingMonth: month, generated: generated.length, records: generated };
    }
    async getRevenueAnalytics(query) {
        await this.syncStudentFeeAccounts();
        const { start, end } = this.resolveDateRange(query);
        const startStr = start ? (0, finance_date_util_1.fmtDate)(start) : '2000-01-01';
        const endStr = end ? (0, finance_date_util_1.fmtDate)(end) : (0, finance_date_util_1.fmtDate)(new Date());
        const transactions = await this.txRepo.find({
            where: { type: transaction_type_enum_1.TransactionType.PAYMENT, transactionDate: (0, typeorm_2.Between)(startStr, endStr) },
            order: { transactionDate: 'ASC' },
        });
        const accounts = await this.feeRepo.find();
        const payrolls = await this.payrollRepo.find();
        const dailyMap = new Map();
        const weeklyMap = new Map();
        const monthlyMap = new Map();
        for (const tx of transactions) {
            const amt = this.toNumber(tx.amount);
            const day = tx.transactionDate;
            dailyMap.set(day, (dailyMap.get(day) || 0) + amt);
            const weekKey = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.startOfWeekDate)((0, finance_date_util_1.parseDateStr)(day)));
            weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + amt);
            const monthKey = day.slice(0, 7);
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amt);
        }
        const now = new Date();
        const dailyRevenue = transactions
            .filter((t) => t.transactionDate === (0, finance_date_util_1.fmtDate)(now))
            .reduce((s, t) => s + this.toNumber(t.amount), 0);
        const weekStart = (0, finance_date_util_1.fmtDate)((0, finance_date_util_1.startOfWeekDate)(now));
        const weeklyRevenue = transactions
            .filter((t) => t.transactionDate >= weekStart)
            .reduce((s, t) => s + this.toNumber(t.amount), 0);
        const monthKey = (0, finance_date_util_1.currentBillingMonth)();
        const monthlyRevenue = transactions
            .filter((t) => t.transactionDate.startsWith(monthKey))
            .reduce((s, t) => s + this.toNumber(t.amount), 0);
        const yearKey = String(now.getFullYear());
        const annualRevenue = transactions
            .filter((t) => t.transactionDate.startsWith(yearKey))
            .reduce((s, t) => s + this.toNumber(t.amount), 0);
        const outstandingTrend = accounts.reduce((acc, a) => {
            const m = a.billingMonth;
            acc[m] = (acc[m] || 0) + this.toNumber(a.remainingBalance);
            return acc;
        }, {});
        const payrollTrend = payrolls.reduce((acc, p) => {
            acc[p.billingMonth] = (acc[p.billingMonth] || 0) + this.toNumber(p.totalEarnings);
            return acc;
        }, {});
        return {
            dailyRevenue: +dailyRevenue.toFixed(2),
            weeklyRevenue: +weeklyRevenue.toFixed(2),
            monthlyRevenue: +monthlyRevenue.toFixed(2),
            annualRevenue: +annualRevenue.toFixed(2),
            revenueTrends: Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
                month,
                revenue: +revenue.toFixed(2),
            })),
            collectionTrends: Array.from(dailyMap.entries()).map(([date, collected]) => ({
                date,
                collected: +collected.toFixed(2),
            })),
            outstandingTrends: Object.entries(outstandingTrend).map(([month, outstanding]) => ({
                month,
                outstanding: +outstanding.toFixed(2),
            })),
            payrollTrends: Object.entries(payrollTrend).map(([month, payroll]) => ({
                month,
                payroll: +payroll.toFixed(2),
            })),
        };
    }
    async getFinancialReport(type, query) {
        await this.syncStudentFeeAccounts(query.billingMonth);
        const month = query.billingMonth || this.getCurrentBillingMonth();
        switch (type) {
            case 'parent-payments': {
                const families = await this.getFamilyPayments({
                    ...query,
                    billingMonth: month,
                    limit: 1000,
                });
                const paid = families.data.filter((f) => f.status === payment_status_enum_1.PaymentStatus.PAID);
                const unpaid = families.data.filter((f) => f.status === payment_status_enum_1.PaymentStatus.UNPAID || f.status === payment_status_enum_1.PaymentStatus.PARTIAL);
                return {
                    paidFamilies: paid.length,
                    unpaidFamilies: unpaid.length,
                    outstandingBalances: unpaid.reduce((s, f) => s + (f.remainingBalance || f.monthlyTotal || 0), 0),
                    details: families.data,
                };
            }
            case 'student-payments': {
                const students = await this.getStudentPayments({
                    ...query,
                    billingMonth: month,
                    limit: 1000,
                });
                return {
                    paidStudents: students.data.filter((s) => s.status === payment_status_enum_1.PaymentStatus.PAID).length,
                    unpaidStudents: students.data.filter((s) => s.status === payment_status_enum_1.PaymentStatus.UNPAID).length,
                    overdueStudents: students.data.filter((s) => s.status === payment_status_enum_1.PaymentStatus.OVERDUE).length,
                    details: students.data,
                };
            }
            case 'teacher-payroll': {
                const teachers = await this.getTeacherPayments({
                    ...query,
                    billingMonth: month,
                    limit: 1000,
                });
                const payrolls = await this.payrollRepo.find({ where: { billingMonth: month } });
                return {
                    teacherEarnings: teachers.data.reduce((s, t) => s + t.earnings, 0),
                    monthlyPayroll: payrolls.reduce((s, p) => s + this.toNumber(p.totalEarnings), 0),
                    replacementPayroll: payrolls.length,
                    details: teachers.data,
                };
            }
            case 'revenue': {
                const analytics = await this.getRevenueAnalytics(query);
                const accounts = await this.feeRepo.find({ where: { billingMonth: month } });
                const totalExpected = accounts.reduce((s, a) => s + this.toNumber(a.monthlyFee), 0);
                const collected = accounts.reduce((s, a) => s + this.toNumber(a.amountPaid), 0);
                return {
                    totalRevenue: analytics.annualRevenue,
                    monthlyRevenue: analytics.monthlyRevenue,
                    collectionRate: totalExpected > 0 ? +((collected / totalExpected) * 100).toFixed(2) : 0,
                    details: analytics,
                };
            }
            default:
                throw new common_1.BadRequestException(`Unknown report type: ${type}`);
        }
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_fee_account_entity_1.StudentFeeAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_transaction_entity_1.PaymentTransaction)),
    __param(2, (0, typeorm_1.InjectRepository)(family_billing_group_entity_1.FamilyBillingGroup)),
    __param(3, (0, typeorm_1.InjectRepository)(family_billing_member_entity_1.FamilyBillingMember)),
    __param(4, (0, typeorm_1.InjectRepository)(teacher_payroll_record_entity_1.TeacherPayrollRecord)),
    __param(5, (0, typeorm_1.InjectRepository)(teacher_earning_detail_entity_1.TeacherEarningDetail)),
    __param(6, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(7, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(8, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(9, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(10, (0, typeorm_1.InjectRepository)(class_session_entity_1.ClassSession)),
    __param(11, (0, typeorm_1.InjectRepository)(student_attendance_entity_1.StudentAttendance)),
    __param(12, (0, typeorm_1.InjectRepository)(teacher_replacement_entity_1.TeacherReplacement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FinanceService);
//# sourceMappingURL=finance.service.js.map