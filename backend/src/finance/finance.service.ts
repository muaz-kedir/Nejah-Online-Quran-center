import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like } from 'typeorm';
import { StudentFeeAccount } from './entities/student-fee-account.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { FamilyBillingGroup } from './entities/family-billing-group.entity';
import { FamilyBillingMember } from './entities/family-billing-member.entity';
import { TeacherPayrollRecord } from './entities/teacher-payroll-record.entity';
import { TeacherEarningDetail } from './entities/teacher-earning-detail.entity';
import { FinanceExpense } from './entities/finance-expense.entity';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ClassSession, SessionStatus } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { ExpenseCategory } from '../common/enums/expense-category.enum';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { RecordPaymentDto, UpdateStudentFeeDto, BundleFamilyDto, GeneratePayrollDto } from './dto/record-payment.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationChannel } from '../notifications/entities/notification.entity';
import {
  fmtDate,
  currentBillingMonth,
  startOfMonthDate,
  endOfMonthDate,
  startOfWeekDate,
  endOfWeekDate,
  startOfYearDate,
  endOfYearDate,
  addDaysDate,
  parseDateStr,
  isBeforeDate,
} from './finance-date.util';

const DEFAULT_SESSION_RATE = 5;
const WEEKS_PER_MONTH = 4;

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(StudentFeeAccount) private feeRepo: Repository<StudentFeeAccount>,
    @InjectRepository(PaymentTransaction) private txRepo: Repository<PaymentTransaction>,
    @InjectRepository(FamilyBillingGroup) private familyRepo: Repository<FamilyBillingGroup>,
    @InjectRepository(FamilyBillingMember)
    private familyMemberRepo: Repository<FamilyBillingMember>,
    @InjectRepository(TeacherPayrollRecord) private payrollRepo: Repository<TeacherPayrollRecord>,
    @InjectRepository(TeacherEarningDetail) private earningRepo: Repository<TeacherEarningDetail>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Parent) private parentRepo: Repository<Parent>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
    @InjectRepository(Schedule) private scheduleRepo: Repository<Schedule>,
    @InjectRepository(ClassSession) private sessionRepo: Repository<ClassSession>,
    @InjectRepository(StudentAttendance) private studentAttRepo: Repository<StudentAttendance>,
    @InjectRepository(TeacherReplacement) private replacementRepo: Repository<TeacherReplacement>,
    @InjectRepository(FinanceExpense) private expenseRepo: Repository<FinanceExpense>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  getCurrentBillingMonth(): string {
    return currentBillingMonth();
  }

  private parseTimeMinutes(timeStr: string): number {
    if (!timeStr) return 60;
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2) return 60;
    return parts[0] * 60 + parts[1];
  }

  private resolveDateRange(query: FinanceQueryDto): { start?: Date; end?: Date } {
    const now = new Date();
    switch (query.dateRange) {
      case 'today':
        return { start: now, end: now };
      case 'week':
        return { start: startOfWeekDate(now), end: endOfWeekDate(now) };
      case 'month':
        return { start: startOfMonthDate(now), end: endOfMonthDate(now) };
      case 'year':
        return { start: startOfYearDate(now), end: endOfYearDate(now) };
      case 'custom':
        return {
          start: query.startDate ? parseDateStr(query.startDate) : undefined,
          end: query.endDate ? parseDateStr(query.endDate) : undefined,
        };
      default:
        return {};
    }
  }

  private resolvePaymentStatus(
    amountPaid: number,
    effectiveFee: number,
    dueDate?: string,
  ): PaymentStatus {
    const remaining = effectiveFee - amountPaid;
    if (remaining <= 0) return PaymentStatus.PAID;
    if (amountPaid > 0) return PaymentStatus.PARTIAL;
    if (dueDate && isBeforeDate(dueDate, new Date())) return PaymentStatus.OVERDUE;
    return PaymentStatus.UNPAID;
  }

  private toNumber(val: any): number {
    return parseFloat(String(val ?? 0)) || 0;
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userRepo.find({
      where: [
        { role: UserRole.FINANCE_MANAGER, isActive: true },
        { role: UserRole.SUPER_ADMIN, isActive: true },
      ],
    });
    return admins.map((u) => u.id);
  }

  private resolveTeacherRate(fee: any, defaultRate: number): number {
    if (!fee) return defaultRate;
    if (fee.teacherMonthlyBudget != null) {
      const budget = this.toNumber(fee.teacherMonthlyBudget);
      const scheduled = this.toNumber(fee.monthlySessions);
      return scheduled > 0 ? budget / scheduled : defaultRate;
    }
    if (fee.sessionRate != null) return this.toNumber(fee.sessionRate);
    return defaultRate;
  }

  async calculateStudentFee(
    studentId: string,
    billingMonth?: string,
  ): Promise<Partial<StudentFeeAccount>> {
    const month = billingMonth || this.getCurrentBillingMonth();
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

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
    const sessionRate =
      existing?.sessionRate != null ? this.toNumber(existing.sessionRate) : DEFAULT_SESSION_RATE;

    const monthlyFee = sessionRate * monthlySessions;
    const dueDate = existing?.dueDate || fmtDate(addDaysDate(parseDateStr(`${month}-01`), 14));

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

  async syncStudentFeeAccounts(billingMonth?: string): Promise<{ synced: number }> {
    const month = billingMonth || this.getCurrentBillingMonth();
    const students = await this.studentRepo.find({
      where: { status: StudentStatus.ACTIVE, isAssigned: true },
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
          status: PaymentStatus.UNPAID,
        });
      } else {
        Object.assign(account, calc);
      }

      const effectiveFee =
        this.toNumber(account.monthlyFee) -
        this.toNumber(account.discountAmount) -
        this.toNumber(account.scholarshipAmount);
      account.remainingBalance = Math.max(effectiveFee - this.toNumber(account.amountPaid), 0);
      account.status = this.resolvePaymentStatus(
        this.toNumber(account.amountPaid),
        effectiveFee,
        account.dueDate,
      );
      await this.feeRepo.save(account);
      synced++;
    }

    return { synced };
  }

  async getDashboard() {
    await this.syncStudentFeeAccounts();
    const month = this.getCurrentBillingMonth();
    const monthStart = fmtDate(startOfMonthDate(new Date()));
    const monthEnd = fmtDate(endOfMonthDate(new Date()));
    const weekEnd = fmtDate(addDaysDate(new Date(), 7));
    const today = fmtDate(new Date());

    const accounts = await this.feeRepo.find({ where: { billingMonth: month } });
    const families = await this.familyRepo.find({ where: { billingMonth: month } });
    const payrolls = await this.payrollRepo.find({ where: { billingMonth: month } });

    const totalMonthlyRevenue =
      accounts.reduce((s, a) => s + this.toNumber(a.monthlyFee), 0) +
      families.filter((f) => f.isBundled).reduce((s, f) => s + this.toNumber(f.monthlyTotal), 0);

    const totalCollected =
      accounts.reduce((s, a) => s + this.toNumber(a.amountPaid), 0) +
      families.reduce((s, f) => s + this.toNumber(f.amountPaid), 0);

    const totalOutstanding =
      accounts.reduce((s, a) => s + this.toNumber(a.remainingBalance), 0) +
      families.reduce((s, f) => s + this.toNumber(f.remainingBalance), 0);

    const activePayingStudents = accounts.filter(
      (a) => a.status === PaymentStatus.PAID || a.status === PaymentStatus.PARTIAL,
    ).length;

    const activeFamilies = await this.parentRepo
      .createQueryBuilder('p')
      .innerJoin('p.students', 's')
      .where('s.status = :status', { status: StudentStatus.ACTIVE })
      .getCount();

    const totalTeacherPayroll = payrolls.reduce((s, p) => s + this.toNumber(p.totalEarnings), 0);

    const paymentsDueThisWeek =
      accounts.filter(
        (a) =>
          a.dueDate &&
          a.dueDate >= today &&
          a.dueDate <= weekEnd &&
          a.status !== PaymentStatus.PAID,
      ).length +
      families.filter(
        (f) =>
          f.dueDate &&
          f.dueDate >= today &&
          f.dueDate <= weekEnd &&
          f.status !== PaymentStatus.PAID,
      ).length;

    const overduePayments =
      accounts.filter((a) => a.status === PaymentStatus.OVERDUE).length +
      families.filter((f) => f.status === PaymentStatus.OVERDUE).length;

    const monthTransactions = await this.txRepo.find({
      where: {
        transactionDate: Between(monthStart, monthEnd),
        type: TransactionType.PAYMENT,
      },
    });

    const last12 = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym;
    }).reverse();

    const revenueTrends: { month: string; revenue: number }[] = [];
    const revenueVsPayroll: { month: string; revenue: number; payroll: number }[] = [];

    for (const ym of last12) {
      const accts = await this.feeRepo.find({ where: { billingMonth: ym } });
      const fams = await this.familyRepo.find({ where: { billingMonth: ym } });
      const pays = await this.payrollRepo.find({ where: { billingMonth: ym } });

      const rev =
        accts.reduce((s, a) => s + this.toNumber(a.amountPaid), 0) +
        fams.reduce((s, f) => s + this.toNumber(f.amountPaid), 0);

      const pay = pays.reduce((s, p) => s + this.toNumber(p.totalEarnings), 0);

      revenueTrends.push({ month: ym, revenue: +rev.toFixed(2) });
      revenueVsPayroll.push({ month: ym, revenue: +rev.toFixed(2), payroll: +pay.toFixed(2) });
    }

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
      revenueTrends,
      collectionVsOutstanding: [
        { name: 'Collected', value: +totalCollected.toFixed(2) },
        { name: 'Outstanding', value: +totalOutstanding.toFixed(2) },
      ],
      revenueVsPayroll,
    };
  }

  private mapStudentPaymentRow(
    account: StudentFeeAccount,
    student?: Student,
    parent?: Parent,
    teacher?: Teacher,
  ) {
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

  async getStudentPayments(query: FinanceQueryDto) {
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

    if (query.paymentStatus) qb.andWhere('fee.status = :status', { status: query.paymentStatus });
    if (query.studentId) qb.andWhere('fee.studentId = :studentId', { studentId: query.studentId });
    if (query.parentId) qb.andWhere('fee.parentId = :parentId', { parentId: query.parentId });
    if (query.teacherId) qb.andWhere('fee.teacherId = :teacherId', { teacherId: query.teacherId });
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

  async getStudentPaymentDetail(id: string) {
    const account = await this.feeRepo.findOne({
      where: { id },
      relations: ['student', 'parent', 'teacher', 'transactions'],
    });
    if (!account) throw new NotFoundException('Payment record not found');

    const schedules = await this.scheduleRepo.find({
      where: { studentId: account.studentId, status: 'active' },
    });

    const transactions = (account.transactions || []).sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    );

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
      teacherMonthlyBudget: account.teacherMonthlyBudget != null ? this.toNumber(account.teacherMonthlyBudget) : null,
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

  async recordStudentPayment(id: string, dto: RecordPaymentDto, userId: string) {
    const account = await this.feeRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Payment record not found');

    const tx = this.txRepo.create({
      studentFeeAccountId: id,
      amount: dto.amount,
      type: dto.type || TransactionType.PAYMENT,
      description: dto.description,
      paymentMethod: dto.paymentMethod,
      recordedBy: userId,
      transactionDate: dto.transactionDate || fmtDate(new Date()),
    });
    await this.txRepo.save(tx);

    if (dto.type === TransactionType.DISCOUNT) {
      account.discountAmount = this.toNumber(account.discountAmount) + dto.amount;
    } else if (dto.type === TransactionType.SCHOLARSHIP) {
      account.scholarshipAmount = this.toNumber(account.scholarshipAmount) + dto.amount;
    } else {
      account.amountPaid = this.toNumber(account.amountPaid) + dto.amount;
    }

    const effectiveFee =
      this.toNumber(account.monthlyFee) -
      this.toNumber(account.discountAmount) -
      this.toNumber(account.scholarshipAmount);
    account.remainingBalance = Math.max(effectiveFee - this.toNumber(account.amountPaid), 0);
    account.status = this.resolvePaymentStatus(
      this.toNumber(account.amountPaid),
      effectiveFee,
      account.dueDate,
    );
    const prevStatus = account.status;
    const paidBefore = this.toNumber(account.amountPaid) - (dto.type === TransactionType.PAYMENT ? dto.amount : 0);
    await this.feeRepo.save(account);

    const student = account.studentId ? await this.studentRepo.findOne({ where: { id: account.studentId }, relations: ['user'] }) : null;
    const parent = account.parentId ? await this.parentRepo.findOne({ where: { id: account.parentId }, relations: ['user'] }) : null;
    const adminIds = await this.getAdminUserIds();
    const studentName = student?.fullName || 'Student';
    const month = account.billingMonth;

    if (account.status === PaymentStatus.PAID && prevStatus !== PaymentStatus.PAID) {
      const msg = `Your payment of ${this.toNumber(dto.amount)} ETB has been successfully received. Status: Paid.`;
      const recipients: string[] = [];
      if (student?.userId) recipients.push(student.userId);
      if (parent?.user?.id) recipients.push(parent.user.id);
      await this.notificationsService.sendCustomNotifications(
        [...new Set([...recipients, ...adminIds])],
        'Payment Received',
        msg,
        { amount: this.toNumber(dto.amount), billingMonth: month, studentName },
        NotificationChannel.PAYMENT_RECEIVED,
        false,
        '/finance_student-payments',
      );
    } else if (account.status === PaymentStatus.PARTIAL && paidBefore <= 0) {
      const msg = `${this.toNumber(dto.amount)} ETB has been received. Remaining Balance: ${this.toNumber(account.remainingBalance)} ETB. Status: Partially Paid.`;
      const recipients: string[] = [];
      if (student?.userId) recipients.push(student.userId);
      if (parent?.user?.id) recipients.push(parent.user.id);
      await this.notificationsService.sendCustomNotifications(
        [...new Set([...recipients, ...adminIds])],
        'Partial Payment Recorded',
        msg,
        { amount: this.toNumber(dto.amount), remaining: this.toNumber(account.remainingBalance), billingMonth: month, studentName },
        NotificationChannel.PAYMENT_RECEIVED,
        false,
        '/finance_student-payments',
      );
    }

    return this.getStudentPaymentDetail(id);
  }

  async updateStudentFee(id: string, dto: UpdateStudentFeeDto) {
    const account = await this.feeRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Payment record not found');

    if (dto.discountAmount !== undefined) account.discountAmount = dto.discountAmount;
    if (dto.scholarshipAmount !== undefined) account.scholarshipAmount = dto.scholarshipAmount;
    if (dto.sessionRate !== undefined) {
      account.sessionRate = dto.sessionRate;
      account.monthlyFee = dto.sessionRate * account.monthlySessions;
    }
    if (dto.teacherMonthlyBudget !== undefined) account.teacherMonthlyBudget = dto.teacherMonthlyBudget;
    if (dto.dueDate) account.dueDate = dto.dueDate;

    const effectiveFee =
      this.toNumber(account.monthlyFee) -
      this.toNumber(account.discountAmount) -
      this.toNumber(account.scholarshipAmount);
    account.remainingBalance = Math.max(effectiveFee - this.toNumber(account.amountPaid), 0);

    if (dto.status) {
      account.status = dto.status;
    } else {
      account.status = this.resolvePaymentStatus(
        this.toNumber(account.amountPaid),
        effectiveFee,
        account.dueDate,
      );
    }

    const prevStatus = account.status;
    await this.feeRepo.save(account);

    const student = account.studentId ? await this.studentRepo.findOne({ where: { id: account.studentId }, relations: ['user'] }) : null;
    const parent = account.parentId ? await this.parentRepo.findOne({ where: { id: account.parentId }, relations: ['user'] }) : null;
    const adminIds = await this.getAdminUserIds();
    const studentName = student?.fullName || 'Student';

    if (account.status === PaymentStatus.OVERDUE && prevStatus !== PaymentStatus.OVERDUE) {
      const daysOverdue = account.dueDate ? Math.max(0, Math.ceil((Date.now() - new Date(account.dueDate).getTime()) / 86400000)) : 0;
      const msg = `The academic fee for ${studentName} is overdue. Outstanding Balance: ${this.toNumber(account.remainingBalance)} ETB. Days Overdue: ${daysOverdue}.`;
      const recipients: string[] = [...adminIds];
      if (parent?.user?.id) recipients.push(parent.user.id);
      if (student?.userId) recipients.push(student.userId);
      await this.notificationsService.sendCustomNotifications(
        [...new Set(recipients)],
        'Payment Overdue',
        msg,
        { studentName, amount: this.toNumber(account.remainingBalance), daysOverdue, billingMonth: account.billingMonth },
        NotificationChannel.PAYMENT_OVERDUE,
        false,
        '/finance_student-payments',
      );
    }

    return this.getStudentPaymentDetail(id);
  }

  async getFamilyPayments(query: FinanceQueryDto) {
    await this.syncStudentFeeAccounts(query.billingMonth);
    const month = query.billingMonth || this.getCurrentBillingMonth();
    const page = query.page || 1;
    const limit = query.limit || 20;

    const separateAccounts = await this.feeRepo.find({
      where: { billingMonth: month, isFamilyBundled: false },
      relations: ['student', 'parent'],
    });

    const parentMap = new Map<string, { parent: Parent; children: StudentFeeAccount[] }>();
    for (const acc of separateAccounts) {
      if (!acc.parentId) continue;
      const key = acc.parentId;
      if (!parentMap.has(key)) {
        parentMap.set(key, { parent: acc.parent, children: [] });
      }
      parentMap.get(key)!.children.push(acc);
    }

    const separateFamilies = Array.from(parentMap.entries())
      .filter(([, v]) => v.children.length >= 1)
      .map(([parentId, v]) => ({
        type: 'separate' as const,
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
        status: v.children.every((c) => c.status === PaymentStatus.PAID)
          ? PaymentStatus.PAID
          : v.children.some((c) => c.status === PaymentStatus.OVERDUE)
            ? PaymentStatus.OVERDUE
            : v.children.some((c) => c.status === PaymentStatus.PARTIAL)
              ? PaymentStatus.PARTIAL
              : PaymentStatus.UNPAID,
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
      type: 'bundled' as const,
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

  async bundleFamilyPayments(dto: BundleFamilyDto) {
    const month = dto.billingMonth || this.getCurrentBillingMonth();
    if (dto.studentIds.length < 2) {
      throw new BadRequestException('At least 2 students required for family bundling');
    }

    const accounts = await this.feeRepo.find({
      where: { studentId: In(dto.studentIds), billingMonth: month },
      relations: ['student'],
    });

    if (accounts.length !== dto.studentIds.length) {
      await this.syncStudentFeeAccounts(month);
    }

    const refreshed = await this.feeRepo.find({
      where: { studentId: In(dto.studentIds), billingMonth: month },
      relations: ['student'],
    });

    const monthlyTotal = refreshed.reduce((s, a) => s + this.toNumber(a.monthlyFee), 0);
    const dueDate = fmtDate(addDaysDate(parseDateStr(`${month}-01`), 14));

    const group = this.familyRepo.create({
      parentId: dto.parentId,
      monthlyTotal,
      amountPaid: 0,
      remainingBalance: monthlyTotal,
      status: PaymentStatus.UNPAID,
      dueDate,
      billingMonth: month,
      isBundled: true,
    });
    const saved = await this.familyRepo.save(group);

    for (const acc of refreshed) {
      await this.familyMemberRepo.save(
        this.familyMemberRepo.create({
          familyBillingGroupId: saved.id,
          studentId: acc.studentId,
          individualMonthlyFee: this.toNumber(acc.monthlyFee),
        }),
      );
      acc.isFamilyBundled = true;
      acc.familyBillingGroupId = saved.id;
      await this.feeRepo.save(acc);
    }

    return this.getFamilyPaymentDetail(saved.id);
  }

  async getFamilyPaymentDetail(id: string) {
    const group = await this.familyRepo.findOne({
      where: { id },
      relations: ['parent', 'members', 'members.student', 'transactions'],
    });
    if (!group) throw new NotFoundException('Family billing group not found');

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

  async recordFamilyPayment(id: string, dto: RecordPaymentDto, userId: string) {
    const group = await this.familyRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Family billing group not found');

    const tx = this.txRepo.create({
      familyBillingGroupId: id,
      amount: dto.amount,
      type: dto.type || TransactionType.PAYMENT,
      description: dto.description,
      paymentMethod: dto.paymentMethod,
      recordedBy: userId,
      transactionDate: dto.transactionDate || fmtDate(new Date()),
    });
    await this.txRepo.save(tx);

    if (dto.type === TransactionType.DISCOUNT) {
      group.discountAmount = this.toNumber(group.discountAmount) + dto.amount;
    } else if (dto.type === TransactionType.SCHOLARSHIP) {
      group.scholarshipAmount = this.toNumber(group.scholarshipAmount) + dto.amount;
    } else {
      group.amountPaid = this.toNumber(group.amountPaid) + dto.amount;
    }

    const effectiveFee =
      this.toNumber(group.monthlyTotal) -
      this.toNumber(group.discountAmount) -
      this.toNumber(group.scholarshipAmount);
    group.remainingBalance = Math.max(effectiveFee - this.toNumber(group.amountPaid), 0);
    group.status = this.resolvePaymentStatus(
      this.toNumber(group.amountPaid),
      effectiveFee,
      group.dueDate,
    );
    const prevGroupStatus = group.status;
    const paidBefore = this.toNumber(group.amountPaid) - (dto.type === TransactionType.PAYMENT ? dto.amount : 0);
    await this.familyRepo.save(group);

    const parent = group.parentId ? await this.parentRepo.findOne({ where: { id: group.parentId }, relations: ['user'] }) : null;
    const adminIds = await this.getAdminUserIds();
    const month = group.billingMonth;
    const members = await this.familyMemberRepo.find({ where: { familyBillingGroupId: id }, relations: ['student'] });
    const childNames = members.map((m) => m.student?.fullName || 'Student').join(', ');

    if (group.status === PaymentStatus.PAID && prevGroupStatus !== PaymentStatus.PAID) {
      const msg = `Your family payment of ${this.toNumber(dto.amount)} ETB has been successfully received. Status: Paid.`;
      const recipients: string[] = [...adminIds];
      if (parent?.user?.id) recipients.push(parent.user.id);
      await this.notificationsService.sendCustomNotifications(
        [...new Set(recipients)],
        'Payment Received',
        msg,
        { amount: this.toNumber(dto.amount), billingMonth: month, children: childNames },
        NotificationChannel.PAYMENT_RECEIVED,
        false,
        '/finance_family-payments',
      );
    } else if (group.status === PaymentStatus.PARTIAL && paidBefore <= 0) {
      const msg = `${this.toNumber(dto.amount)} ETB has been received. Remaining Balance: ${this.toNumber(group.remainingBalance)} ETB. Status: Partially Paid.`;
      const recipients: string[] = [...adminIds];
      if (parent?.user?.id) recipients.push(parent.user.id);
      await this.notificationsService.sendCustomNotifications(
        [...new Set(recipients)],
        'Partial Payment Recorded',
        msg,
        { amount: this.toNumber(dto.amount), remaining: this.toNumber(group.remainingBalance), billingMonth: month },
        NotificationChannel.PAYMENT_RECEIVED,
        false,
        '/finance_family-payments',
      );
    }

    return this.getFamilyPaymentDetail(id);
  }

  async updateFamilyPayment(id: string, dto: UpdateStudentFeeDto) {
    const group = await this.familyRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Family billing group not found');

    if (dto.discountAmount !== undefined) group.discountAmount = dto.discountAmount;
    if (dto.scholarshipAmount !== undefined) group.scholarshipAmount = dto.scholarshipAmount;
    if (dto.dueDate) group.dueDate = dto.dueDate;

    const effectiveFee =
      this.toNumber(group.monthlyTotal) -
      this.toNumber(group.discountAmount) -
      this.toNumber(group.scholarshipAmount);
    group.remainingBalance = Math.max(effectiveFee - this.toNumber(group.amountPaid), 0);

    if (dto.status) {
      group.status = dto.status;
    } else {
      group.status = this.resolvePaymentStatus(
        this.toNumber(group.amountPaid),
        effectiveFee,
        group.dueDate,
      );
    }

    await this.familyRepo.save(group);
    return this.getFamilyPaymentDetail(id);
  }

  async calculateTeacherEarnings(teacherId: string, billingMonth?: string) {
    const month = billingMonth || this.getCurrentBillingMonth();
    const [year, mon] = month.split('-').map(Number);
    const periodStart = fmtDate(new Date(year, mon - 1, 1));
    const periodEnd = fmtDate(endOfMonthDate(new Date(year, mon - 1, 1)));

    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const defaultSessionRate = this.toNumber(teacher.hourlyRate) || DEFAULT_SESSION_RATE;

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.studentAttendances', 'att')
      .leftJoinAndSelect('att.student', 'student')
      .where('session.teacherId = :teacherId', { teacherId })
      .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
      .andWhere('session.sessionDate >= :periodStart', { periodStart })
      .andWhere('session.sessionDate <= :periodEnd', { periodEnd })
      .getMany();

    const replacements = await this.replacementRepo.find({
      where: [{ originalTeacherId: teacherId }, { replacementTeacherId: teacherId }],
    });

    const feeAccounts = await this.feeRepo.find({ where: { billingMonth: month } });
    const feeMap = new Map(feeAccounts.map((a) => [a.studentId, a]));

    const studentEarnings = new Map<
      string,
      { sessions: number; earnings: number; isReplacement: boolean; replacementId?: string; rate: number }
    >();

    for (const session of sessions) {
      const attendances = session.studentAttendances || [];
      for (const att of attendances) {
        const sid = att.studentId;
        if (!sid) continue;

        const sessionDateStr =
          typeof session.sessionDate === 'string'
            ? session.sessionDate
            : fmtDate(new Date(session.sessionDate));

        const isReplaced = replacements.find(
          (r) =>
            r.originalTeacherId === teacherId &&
            r.studentId === sid &&
            sessionDateStr >= r.startDate &&
            sessionDateStr <= r.endDate,
        );

        if (isReplaced) continue;

        const asReplacement = replacements.find(
          (r) =>
            r.replacementTeacherId === teacherId &&
            r.studentId === sid &&
            sessionDateStr >= r.startDate &&
            sessionDateStr <= r.endDate,
        );

        const fee = feeMap.get(sid);
        const perStudentRate = this.resolveTeacherRate(fee, defaultSessionRate);

        const key = `${sid}-${asReplacement?.id || 'regular'}`;
        const existing = studentEarnings.get(key) || {
          sessions: 0,
          earnings: 0,
          isReplacement: !!asReplacement,
          replacementId: asReplacement?.id,
          rate: perStudentRate,
        };
        existing.sessions += 1;
        existing.earnings += perStudentRate;
        studentEarnings.set(key, existing);
      }

      if (attendances.length === 0) {
        const key = `unassigned-regular`;
        const existing = studentEarnings.get(key) || {
          sessions: 0,
          earnings: 0,
          isReplacement: false,
          rate: defaultSessionRate,
        };
        existing.sessions += 1;
        existing.earnings += defaultSessionRate;
        studentEarnings.set(key, existing);
      }
    }

    const coveringReplacements = replacements.filter(
      (r) => r.replacementTeacherId === teacherId && r.status === 'completed',
    );

    for (const rep of coveringReplacements) {
      const fee = feeMap.get(rep.studentId);
      const perStudentRate = this.resolveTeacherRate(fee, defaultSessionRate);

      const repSessions = sessions.filter((s) => {
        const sDate =
          typeof s.sessionDate === 'string'
            ? s.sessionDate
            : fmtDate(new Date(s.sessionDate));
        return (
          sDate >= rep.startDate &&
          sDate <= rep.endDate &&
          (s.studentAttendances || []).some((a) => a.studentId === rep.studentId)
        );
      });

      const repAttendances = repSessions.reduce(
        (sum, s) =>
          sum + (s.studentAttendances || []).filter((a) => a.studentId === rep.studentId).length,
        0,
      );

      if (repAttendances > 0) {
        const key = `${rep.studentId}-${rep.id}`;
        const existing = studentEarnings.get(key) || {
          sessions: 0,
          earnings: 0,
          isReplacement: true,
          replacementId: rep.id,
          rate: perStudentRate,
        };

        const alreadyCounted = existing.sessions;
        if (repAttendances > alreadyCounted) {
          const newSessions = repAttendances - alreadyCounted;
          existing.sessions += newSessions;
          existing.earnings += newSessions * perStudentRate;
          studentEarnings.set(key, existing);
        }
      }
    }

    const assignedStudents = await this.studentRepo.count({
      where: { teacherId, status: StudentStatus.ACTIVE },
    });
    const details = Array.from(studentEarnings.entries()).map(([key, val]) => {
      const studentId = key.split('-')[0] !== 'unassigned' ? key.split('-')[0] : null;
      return {
        studentId,
        sessionsConducted: val.sessions,
        sessionRate: val.rate,
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
      sessionRate: defaultSessionRate,
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

  async getTeacherPayments(query: FinanceQueryDto) {
    const month = query.billingMonth || this.getCurrentBillingMonth();
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.teacherRepo
      .createQueryBuilder('teacher')
      .where('teacher.status = :status', { status: 'active' });
    if (query.search)
      qb.andWhere('teacher.fullName ILIKE :search', { search: `%${query.search}%` });
    if (query.teacherId) qb.andWhere('teacher.id = :teacherId', { teacherId: query.teacherId });
    if (query.country)
      qb.andWhere('teacher.country ILIKE :country', { country: `%${query.country}%` });

    const total = await qb.getCount();
    const teachers = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = await Promise.all(
      teachers.map(async (t) => {
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
          earnings: payroll ? this.toNumber(payroll.totalEarnings) : calc.earnings,
          payrollStatus: payroll?.status || 'pending',
          paymentMethod: payroll?.paymentMethod || null,
          monthlySalary: this.toNumber(t.monthlySalary),
        };
      }),
    );

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getTeacherPaymentDetail(teacherId: string, billingMonth?: string) {
    const calc = await this.calculateTeacherEarnings(teacherId, billingMonth);
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    const payroll = await this.payrollRepo.findOne({
      where: { teacherId, billingMonth: calc.billingMonth },
      relations: ['earningDetails', 'earningDetails.student'],
    });

    const feeAccounts = await this.feeRepo.find({
      where: { billingMonth: calc.billingMonth },
    });
    const feeAccountMap = new Map(feeAccounts.map((fa) => [fa.studentId, fa]));

    const assignedStudents = await this.studentRepo.find({
      where: { teacherId, status: StudentStatus.ACTIVE },
    });

    const scheduleStudents = await this.scheduleRepo.find({
      where: { teacherId, status: 'active' },
      select: ['studentId'],
    });

    const allStudentIds = [
      ...new Set([
        ...calc.details.filter((d) => d.studentId).map((d) => d.studentId!),
        ...assignedStudents.map((s) => s.id),
        ...scheduleStudents.map((s) => s.studentId).filter(Boolean),
      ]),
    ];

    const studentDetails = await Promise.all(
      allStudentIds.map(async (studentId) => {
        const detail = calc.details.find((d) => d.studentId === studentId);
        const student = assignedStudents.find((s) => s.id === studentId)
          || await this.studentRepo.findOne({ where: { id: studentId } });
        const fee = feeAccountMap.get(studentId);
        const schedules = await this.scheduleRepo.find({
          where: { studentId, status: 'active' },
        });
        return {
          studentName: student?.fullName || '—',
          feeAccountId: fee?.id || null,
          teacherMonthlyBudget: fee?.teacherMonthlyBudget != null ? this.toNumber(fee.teacherMonthlyBudget) : null,
          monthlySessions: fee ? this.toNumber(fee.monthlySessions) : 0,
          assignableRate: fee?.sessionRate != null ? this.toNumber(fee.sessionRate) : (detail?.sessionRate ?? 0),
          weeklySchedule: schedules.map((s) => ({
            day: s.dayOfWeek,
            startTime: s.startTimeString,
            endTime: s.endTimeString,
            className: s.className,
          })),
          sessionsConducted: detail?.sessionsConducted ?? 0,
          earnings: detail?.earnings ?? 0,
          sessionRate: detail?.sessionRate ?? 0,
          studentId,
          isReplacement: detail?.isReplacement ?? false,
          replacementId: detail?.replacementId ?? null,
        };
      }),
    );

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
            paymentMethod: payroll.paymentMethod,
            billingMonth: payroll.billingMonth,
            paidAt: payroll.paidAt,
          }
        : null,
    };
  }

  async generatePayroll(billingMonth?: string, teacherId?: string, salaryOverride?: number, paymentMethod?: string, status?: string) {
    const month = billingMonth || this.getCurrentBillingMonth();
    let teachers = await this.teacherRepo.find({ where: { status: 'active' } });

    if (teacherId) {
      const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) throw new NotFoundException('Teacher not found');
      teachers = [teacher];
    }

    const generated: TeacherPayrollRecord[] = [];

    for (const teacher of teachers) {
      const calc = salaryOverride != null
        ? { sessionsConducted: 0, earnings: salaryOverride, details: [] }
        : await this.calculateTeacherEarnings(teacher.id, month);

      let record = await this.payrollRepo.findOne({
        where: { teacherId: teacher.id, billingMonth: month },
      });

      const recordStatus = status || 'pending';

      if (!record) {
        record = this.payrollRepo.create({
          teacherId: teacher.id,
          billingMonth: month,
          totalSessions: calc.sessionsConducted,
          totalEarnings: calc.earnings,
          status: recordStatus,
          paymentMethod: paymentMethod || null,
          paidAt: recordStatus === 'paid' ? new Date() : null,
        });
      } else {
        record.totalSessions = calc.sessionsConducted;
        record.totalEarnings = calc.earnings;
        if (paymentMethod) record.paymentMethod = paymentMethod;
        if (status) {
          record.status = status;
          if (status === 'paid') record.paidAt = new Date();
        }
      }

      const saved = await this.payrollRepo.save(record);
      if (record.status === 'paid') {
        try {
          await this.createExpense({
            amount: this.toNumber(record.totalEarnings),
            description: `Teacher salary for ${teacher.fullName} - ${month}`,
            category: ExpenseCategory.TEACHER_SALARY,
            expenseDate: fmtDate(new Date()),
          }, 'system');
        } catch (e) {
          console.warn(`[FinanceService] Failed to auto-create expense for teacher salary: ${e.message}`);
        }
      }
      await this.earningRepo.delete({ payrollRecordId: saved.id });

      for (const detail of calc.details) {
        if (!detail.studentId && detail.sessionsConducted === 0) continue;
        await this.earningRepo.save(
          this.earningRepo.create({
            payrollRecordId: saved.id,
            teacherId: teacher.id,
            studentId: detail.studentId || undefined,
            sessionsConducted: detail.sessionsConducted,
            sessionRate: detail.sessionRate,
            earnings: detail.earnings,
            isReplacement: detail.isReplacement,
            replacementId: detail.replacementId,
          }),
        );
      }

      generated.push(saved);

      const adminIds = await this.getAdminUserIds();
      const earningsAmount = this.toNumber(calc.earnings);
      if (earningsAmount > 0 && record.status === 'pending') {
        const recipients = [...adminIds];
        if (teacher.userId) recipients.push(teacher.userId);
        await this.notificationsService.sendCustomNotifications(
          [...new Set(recipients)],
          'Teacher Salary Due',
          `Teacher "${teacher.fullName}" has earned ${earningsAmount} ETB for ${month}. Please review and process the salary payment.`,
          { teacherId: teacher.id, teacherName: teacher.fullName, amount: earningsAmount, billingMonth: month },
          NotificationChannel.PAYMENT_REMINDER,
          false,
          '/finance_teacher-payments',
        );
      }
    }

    return { billingMonth: month, generated: generated.length, records: generated };
  }

  async markPayrollAsPaid(teacherId: string, billingMonth?: string, newStatus?: string) {
    const month = billingMonth || this.getCurrentBillingMonth();
    const record = await this.payrollRepo.findOne({
      where: { teacherId, billingMonth: month },
      relations: ['teacher'],
    });
    if (!record) throw new NotFoundException('Payroll record not found');

    const status = newStatus || 'paid';
    record.status = status;
    if (status === 'paid') {
      record.paidAt = record.paidAt || new Date();
    } else {
      record.paidAt = null;
    }
    await this.payrollRepo.save(record);

    const teacherName = record.teacher?.fullName || 'Teacher';
    if (status === 'paid') {
      const paidAmount = this.toNumber(record.totalEarnings);
      try {
        await this.createExpense({
          amount: paidAmount,
          description: `Teacher salary for ${teacherName} - ${month}`,
          category: ExpenseCategory.TEACHER_SALARY,
          expenseDate: fmtDate(new Date()),
        }, 'system');
      } catch (e) {
        console.warn(`[FinanceService] Failed to auto-create expense for teacher salary: ${e.message}`);
      }

      const adminIds = await this.getAdminUserIds();
      const recipients = [...adminIds];
      if (record.teacher?.userId) recipients.push(record.teacher.userId);
      await this.notificationsService.sendCustomNotifications(
        [...new Set(recipients)],
        'Teacher Salary Paid',
        `Salary payment of ${paidAmount} ETB has been successfully recorded for Teacher ${teacherName}.`,
        { teacherId, teacherName, amount: paidAmount, billingMonth: month },
        NotificationChannel.PAYMENT_RECEIVED,
        false,
        '/finance_teacher-payments',
      );
    }

    return { success: true, record };
  }

  async getRevenueAnalytics(query: FinanceQueryDto) {
    await this.syncStudentFeeAccounts();
    const { start, end } = this.resolveDateRange(query);
    const startStr = start ? fmtDate(start) : '2000-01-01';
    const endStr = end ? fmtDate(end) : fmtDate(new Date());

    const transactions = await this.txRepo.find({
      where: { type: TransactionType.PAYMENT, transactionDate: Between(startStr, endStr) },
      order: { transactionDate: 'ASC' },
    });

    const accounts = await this.feeRepo.find();
    const payrolls = await this.payrollRepo.find();

    const dailyMap = new Map<string, number>();
    const weeklyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();

    for (const tx of transactions) {
      const amt = this.toNumber(tx.amount);
      const day = tx.transactionDate;
      dailyMap.set(day, (dailyMap.get(day) || 0) + amt);

      const weekKey = fmtDate(startOfWeekDate(parseDateStr(day)));
      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + amt);

      const monthKey = day.slice(0, 7);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amt);
    }

    const now = new Date();
    const dailyRevenue = transactions
      .filter((t) => t.transactionDate === fmtDate(now))
      .reduce((s, t) => s + this.toNumber(t.amount), 0);

    const weekStart = fmtDate(startOfWeekDate(now));
    const weeklyRevenue = transactions
      .filter((t) => t.transactionDate >= weekStart)
      .reduce((s, t) => s + this.toNumber(t.amount), 0);

    const monthKey = currentBillingMonth();
    const monthlyRevenue = transactions
      .filter((t) => t.transactionDate.startsWith(monthKey))
      .reduce((s, t) => s + this.toNumber(t.amount), 0);

    const yearKey = String(now.getFullYear());
    const annualRevenue = transactions
      .filter((t) => t.transactionDate.startsWith(yearKey))
      .reduce((s, t) => s + this.toNumber(t.amount), 0);

    const outstandingTrend = accounts.reduce(
      (acc, a) => {
        const m = a.billingMonth;
        acc[m] = (acc[m] || 0) + this.toNumber(a.remainingBalance);
        return acc;
      },
      {} as Record<string, number>,
    );

    const payrollTrend = payrolls.reduce(
      (acc, p) => {
        acc[p.billingMonth] = (acc[p.billingMonth] || 0) + this.toNumber(p.totalEarnings);
        return acc;
      },
      {} as Record<string, number>,
    );

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

  async getFinancialReport(type: string, query: FinanceQueryDto) {
    await this.syncStudentFeeAccounts(query.billingMonth);
    const month = query.billingMonth || this.getCurrentBillingMonth();

    switch (type) {
      case 'parent-payments': {
        const families = await this.getFamilyPayments({
          ...query,
          billingMonth: month,
          limit: 1000,
        });
        const paid = families.data.filter((f: any) => f.status === PaymentStatus.PAID);
        const unpaid = families.data.filter(
          (f: any) => f.status === PaymentStatus.UNPAID || f.status === PaymentStatus.PARTIAL,
        );
        return {
          paidFamilies: paid.length,
          unpaidFamilies: unpaid.length,
          outstandingBalances: unpaid.reduce(
            (s: number, f: any) => s + (f.remainingBalance || f.monthlyTotal || 0),
            0,
          ),
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
          paidStudents: students.data.filter((s) => s.status === PaymentStatus.PAID).length,
          unpaidStudents: students.data.filter((s) => s.status === PaymentStatus.UNPAID).length,
          overdueStudents: students.data.filter((s) => s.status === PaymentStatus.OVERDUE).length,
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
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }

  async getExpenses(query: FinanceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.expenseRepo.createQueryBuilder('e');

    if (query.search)
      qb.andWhere('e.description ILIKE :search', { search: `%${query.search}%` });

    if (query.paymentStatus)
      qb.andWhere('e.category = :category', { category: query.paymentStatus });

    const { start, end } = this.resolveDateRange(query);
    if (start && end) {
      const startStr = fmtDate(start);
      const endStr = fmtDate(end);
      qb.andWhere('e.expenseDate >= :startStr', { startStr });
      qb.andWhere('e.expenseDate <= :endStr', { endStr });
    } else if (query.startDate && query.endDate) {
      qb.andWhere('e.expenseDate >= :startStr', { startStr: query.startDate });
      qb.andWhere('e.expenseDate <= :endStr', { endStr: query.endDate });
    }

    const total = await qb.getCount();
    const expenses = await qb
      .orderBy('e.expenseDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: expenses.map((e) => ({
        id: e.id,
        amount: this.toNumber(e.amount),
        description: e.description,
        category: e.category,
        expenseDate: e.expenseDate,
        isRecurring: e.isRecurring,
        recurringInterval: e.recurringInterval,
        attachmentUrl: e.attachmentUrl,
        notes: e.notes,
        recordedBy: e.recordedBy,
        createdAt: e.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getExpenseDetail(id: string) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return {
      id: expense.id,
      amount: this.toNumber(expense.amount),
      description: expense.description,
      category: expense.category,
      expenseDate: expense.expenseDate,
      isRecurring: expense.isRecurring,
      recurringInterval: expense.recurringInterval,
      attachmentUrl: expense.attachmentUrl,
      notes: expense.notes,
      recordedBy: expense.recordedBy,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  async createExpense(dto: CreateExpenseDto, userId: string) {
    const expense = this.expenseRepo.create({
      amount: dto.amount,
      description: dto.description,
      category: dto.category,
      expenseDate: dto.expenseDate || fmtDate(new Date()),
      isRecurring: dto.isRecurring || false,
      recurringInterval: dto.recurringInterval,
      attachmentUrl: dto.attachmentUrl,
      notes: dto.notes,
      recordedBy: userId,
    });
    const saved = await this.expenseRepo.save(expense);
    return this.getExpenseDetail(saved.id);
  }

  async updateExpense(id: string, dto: UpdateExpenseDto) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.description !== undefined) expense.description = dto.description;
    if (dto.category !== undefined) expense.category = dto.category;
    if (dto.expenseDate !== undefined) expense.expenseDate = dto.expenseDate;
    if (dto.isRecurring !== undefined) expense.isRecurring = dto.isRecurring;
    if (dto.recurringInterval !== undefined) expense.recurringInterval = dto.recurringInterval;
    if (dto.attachmentUrl !== undefined) expense.attachmentUrl = dto.attachmentUrl;
    if (dto.notes !== undefined) expense.notes = dto.notes;

    await this.expenseRepo.save(expense);
    return this.getExpenseDetail(id);
  }

  async deleteExpense(id: string) {
    const expense = await this.expenseRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.expenseRepo.remove(expense);
    return { message: 'Expense deleted' };
  }

  async getNetProfit(billingMonth?: string) {
    const month = billingMonth || this.getCurrentBillingMonth();
    const [year, mon] = month.split('-').map(Number);
    const monthStart = fmtDate(new Date(year, mon - 1, 1));
    const monthEnd = fmtDate(endOfMonthDate(new Date(year, mon - 1, 1)));

    const accounts = await this.feeRepo.find({ where: { billingMonth: month } });
    const families = await this.familyRepo.find({ where: { billingMonth: month } });
    const payrolls = await this.payrollRepo.find({ where: { billingMonth: month } });
    const expenses = await this.expenseRepo.find({
      where: {
        expenseDate: Between(monthStart, monthEnd),
      },
    });

    const totalCollected =
      accounts.reduce((s, a) => s + this.toNumber(a.amountPaid), 0) +
      families.reduce((s, f) => s + this.toNumber(f.amountPaid), 0);

    const totalExpected =
      accounts.reduce((s, a) => s + this.toNumber(a.monthlyFee), 0) +
      families.reduce((s, f) => s + this.toNumber(f.monthlyTotal), 0);

    const totalPayroll = payrolls.reduce((s, p) => s + this.toNumber(p.totalEarnings), 0);
    const totalExpenses = expenses.reduce((s, e) => s + this.toNumber(e.amount), 0);

    const collectionRate =
      totalExpected > 0 ? +((totalCollected / totalExpected) * 100).toFixed(2) : 0;

    const expenseBreakdown = expenses.reduce(
      (acc, e) => {
        const cat = e.category;
        acc[cat] = (acc[cat] || 0) + this.toNumber(e.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const prevMonth = mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, '0')}`;
    const prevAccounts = await this.feeRepo.find({ where: { billingMonth: prevMonth } });
    const prevPayrolls = await this.payrollRepo.find({ where: { billingMonth: prevMonth } });
    const prevExpenses = await this.expenseRepo.find({
      where: {
        expenseDate: Between(
          fmtDate(new Date(prevMonth.split('-')[0] as any, parseInt(prevMonth.split('-')[1]) - 1, 1)),
          fmtDate(endOfMonthDate(new Date(prevMonth.split('-')[0] as any, parseInt(prevMonth.split('-')[1]) - 1, 1))),
        ),
      },
    });

    const prevCollected = prevAccounts.reduce((s, a) => s + this.toNumber(a.amountPaid), 0);
    const prevPayroll = prevPayrolls.reduce((s, p) => s + this.toNumber(p.totalEarnings), 0);
    const prevExpenseTotal = prevExpenses.reduce((s, e) => s + this.toNumber(e.amount), 0);
    const prevNetProfit = prevCollected - prevExpenseTotal;
    const currentNetProfit = totalCollected - totalExpenses;

    const profitChange =
      prevNetProfit !== 0
        ? +(((currentNetProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100).toFixed(2)
        : currentNetProfit !== 0
          ? 100
          : 0;

    return {
      billingMonth: month,
      totalCollected: +totalCollected.toFixed(2),
      totalExpected: +totalExpected.toFixed(2),
      collectionRate,
      totalPayroll: +totalPayroll.toFixed(2),
      totalExpenses: +totalExpenses.toFixed(2),
      expenseBreakdown,
      netProfit: +currentNetProfit.toFixed(2),
      profitChange,
      previousMonth: prevMonth,
      previousNetProfit: +prevNetProfit.toFixed(2),
    };
  }
}
