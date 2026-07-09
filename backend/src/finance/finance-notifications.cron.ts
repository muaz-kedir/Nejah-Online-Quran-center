import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { StudentFeeAccount } from './entities/student-fee-account.entity';
import { TeacherPayrollRecord } from './entities/teacher-payroll-record.entity';
import { TeacherEarningDetail } from './entities/teacher-earning-detail.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { FamilyBillingGroup } from './entities/family-billing-group.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { ReplacementStatus } from '../common/enums/replacement-status.enum';
import { fmtDate, currentBillingMonth } from './finance-date.util';

@Injectable()
export class FinanceNotificationsCron {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StudentFeeAccount) private readonly feeRepo: Repository<StudentFeeAccount>,
    @InjectRepository(TeacherPayrollRecord) private readonly payrollRepo: Repository<TeacherPayrollRecord>,
    @InjectRepository(TeacherEarningDetail) private readonly earningRepo: Repository<TeacherEarningDetail>,
    @InjectRepository(TeacherReplacement) private readonly replacementRepo: Repository<TeacherReplacement>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Parent) private readonly parentRepo: Repository<Parent>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(FamilyBillingGroup) private readonly familyRepo: Repository<FamilyBillingGroup>,
  ) {}

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userRepo.find({
      where: [
        { role: UserRole.FINANCE_MANAGER, isActive: true },
        { role: UserRole.SUPER_ADMIN, isActive: true },
      ],
    });
    return admins.map((u) => u.id);
  }

  private async getParentUserId(parentId: string): Promise<string | null> {
    const parent = await this.parentRepo.findOne({ where: { id: parentId }, relations: ['user'] });
    return parent?.user?.id || null;
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkTeacherSalaryDue() {
    const month = currentBillingMonth();
    const adminIds = await this.getAdminUserIds();
    if (!adminIds.length) return;

    const pendingPayrolls = await this.payrollRepo.find({
      where: { billingMonth: month, status: 'pending' },
      relations: ['teacher'],
    });

    for (const record of pendingPayrolls) {
      const teacherName = record.teacher?.fullName || 'Teacher';
      const amount = parseFloat(String(record.totalEarnings)) || 0;
      if (amount <= 0) continue;

      await this.notificationsService.sendCustomNotifications(
        adminIds,
        'Teacher Salary Due',
        `Teacher "${teacherName}" has earned ${amount} ETB for ${month}. Please review and process the salary payment.`,
        { teacherId: record.teacherId, teacherName, amount, billingMonth: month },
        NotificationChannel.PAYMENT_REMINDER,
        false,
        '/finance_teacher-payments',
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkStudentFeeDue() {
    const today = fmtDate(new Date());
    const adminIds = await this.getAdminUserIds();

    const dueAccounts = await this.feeRepo.find({
      where: { dueDate: today, status: PaymentStatus.UNPAID },
      relations: ['student', 'parent'],
    });

    const familyDue = await this.familyRepo.find({
      where: { dueDate: today, status: PaymentStatus.UNPAID },
      relations: ['parent'],
    });

    for (const account of dueAccounts) {
      const studentName = account.student?.fullName || 'Student';
      const fee = parseFloat(String(account.monthlyFee)) || 0;

      const parentUserId = account.parentId ? await this.getParentUserId(account.parentId) : null;
      const studentUserId = account.student?.userId || null;
      const parentRecipients = [parentUserId, studentUserId].filter(Boolean) as string[];

      if (parentRecipients.length > 0) {
        await this.notificationsService.sendCustomNotifications(
          parentRecipients,
          'Monthly Academic Fee Reminder',
          `Your monthly academic fee for ${account.billingMonth} is now due. Amount: ${fee} ETB.`,
          { studentName, amount: fee, billingMonth: account.billingMonth, dueDate: account.dueDate },
          NotificationChannel.PAYMENT_REMINDER,
          false,
          '/finance_student-payments',
        );
      }

      if (adminIds.length > 0) {
        await this.notificationsService.sendCustomNotifications(
          adminIds,
          'Student Fee Due',
          `The monthly academic fee for ${studentName} is now due (${fee} ETB).`,
          { studentName, amount: fee, studentId: account.studentId, billingMonth: account.billingMonth },
          NotificationChannel.PAYMENT_REMINDER,
          false,
          '/finance_student-payments',
        );
      }
    }

    for (const group of familyDue) {
      const parentUserId = group.parentId ? await this.getParentUserId(group.parentId) : null;
      if (!parentUserId) continue;

      const total = parseFloat(String(group.monthlyTotal)) || 0;
      await this.notificationsService.sendCustomNotifications(
        [parentUserId],
        'Monthly Academic Fee Reminder',
        `Your family academic fee for ${group.billingMonth} is now due. Total Amount: ${total} ETB.`,
        { amount: total, billingMonth: group.billingMonth, dueDate: group.dueDate },
        NotificationChannel.PAYMENT_REMINDER,
        false,
        '/finance_family-payments',
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkOverduePayments() {
    const today = fmtDate(new Date());
    const adminIds = await this.getAdminUserIds();

    const overdueAccounts = await this.feeRepo.find({
      where: { dueDate: LessThan(today), status: PaymentStatus.UNPAID },
      relations: ['student', 'parent'],
    });

    const partialOverdue = await this.feeRepo.find({
      where: { dueDate: LessThan(today), status: PaymentStatus.PARTIAL },
      relations: ['student', 'parent'],
    });

    const allOverdue = [...overdueAccounts, ...partialOverdue];

    for (const account of allOverdue) {
      const studentName = account.student?.fullName || 'Student';
      const remaining = parseFloat(String(account.remainingBalance)) || 0;
      const dueDate = account.dueDate ? new Date(account.dueDate) : new Date();
      const daysOverdue = Math.max(0, Math.ceil((Date.now() - dueDate.getTime()) / 86400000));

      const parentUserId = account.parentId ? await this.getParentUserId(account.parentId) : null;
      const studentUserId = account.student?.userId || null;
      const recipients = [parentUserId, studentUserId, ...adminIds].filter(Boolean) as string[];

      if (recipients.length > 0) {
        await this.notificationsService.sendCustomNotifications(
          [...new Set(recipients)],
          'Payment Overdue',
          `The academic fee for ${studentName} is overdue. Outstanding Balance: ${remaining} ETB. Days Overdue: ${daysOverdue}.`,
          { studentName, amount: remaining, daysOverdue, billingMonth: account.billingMonth },
          NotificationChannel.PAYMENT_OVERDUE,
          false,
          '/finance_student-payments',
        );
      }
    }
  }

  @Cron('0 8 1 * *')
  async generateMonthlyPayrollNotifications() {
    const adminIds = await this.getAdminUserIds();
    if (!adminIds.length) return;

    const month = currentBillingMonth();
    const pendingPayrolls = await this.payrollRepo.find({
      where: { billingMonth: month, status: 'pending' },
      relations: ['teacher'],
    });

    if (pendingPayrolls.length === 0) return;

    const totalPayroll = pendingPayrolls.reduce((sum, r) => sum + (parseFloat(String(r.totalEarnings)) || 0), 0);
    const teacherCount = pendingPayrolls.length;

    await this.notificationsService.sendCustomNotifications(
      adminIds,
      'Monthly Payroll Generated',
      `Payroll for ${month} has been generated. ${teacherCount} teacher(s) have pending salaries totaling ${totalPayroll} ETB. Please review and process.`,
      { billingMonth: month, totalPayroll, teacherCount },
      NotificationChannel.PAYMENT_REMINDER,
      false,
      '/finance_teacher-payments',
    );

    for (const record of pendingPayrolls) {
      const teacherName = record.teacher?.fullName || 'Teacher';
      const teacherUserId = record.teacher?.userId;
      if (!teacherUserId) continue;
      const amount = parseFloat(String(record.totalEarnings)) || 0;
      if (amount <= 0) continue;

      await this.notificationsService.sendCustomNotifications(
        [teacherUserId],
        'Your Monthly Salary',
        `Your salary for ${month} has been calculated: ${amount} ETB based on ${record.totalSessions} session(s). It will be processed shortly.`,
        { billingMonth: month, amount, sessions: record.totalSessions },
        NotificationChannel.PAYMENT_REMINDER,
        false,
        '/finance_teacher-payments',
      );
    }
  }

  @Cron('0 9 1 * *')
  async generateMonthlySummary() {
    const month = currentBillingMonth();
    const adminIds = await this.getAdminUserIds();
    if (!adminIds.length) return;

    const allAccounts = await this.feeRepo.find({ where: { billingMonth: month } });
    const payrolls = await this.payrollRepo.find({ where: { billingMonth: month } });

    const totalRevenue = allAccounts.reduce((sum, a) => sum + (parseFloat(String(a.amountPaid)) || 0), 0);
    const totalSalaries = payrolls.reduce((sum, r) => sum + (parseFloat(String(r.totalEarnings)) || 0), 0);
    const outstandingFees = allAccounts.reduce((sum, a) => sum + (parseFloat(String(a.remainingBalance)) || 0), 0);
    const netProfit = totalRevenue - totalSalaries;
    const paidCount = allAccounts.filter((a) => a.status === PaymentStatus.PAID).length;
    const unpaidCount = allAccounts.filter((a) => a.status === PaymentStatus.UNPAID || a.status === PaymentStatus.OVERDUE).length;
    const partialCount = allAccounts.filter((a) => a.status === PaymentStatus.PARTIAL).length;

    const content =
      `Monthly Financial Summary for ${month}:\n` +
      `• Total Revenue: ${totalRevenue} ETB\n` +
      `• Teacher Salaries: ${totalSalaries} ETB\n` +
      `• Outstanding Fees: ${outstandingFees} ETB\n` +
      `• Partially Paid: ${partialCount} student(s)\n` +
      `• Net Profit: ${netProfit} ETB\n` +
      `• Paid Students: ${paidCount}\n` +
      `• Unpaid Students: ${unpaidCount}`;

    await this.notificationsService.sendCustomNotifications(
      adminIds,
      'Monthly Financial Summary',
      content,
      {
        billingMonth: month,
        totalRevenue,
        totalSalaries,
        outstandingFees,
        partialCount,
        netProfit,
        paidCount,
        unpaidCount,
      },
      NotificationChannel.SYSTEM_ALERT,
      false,
      '/finance_dashboard',
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkReplacementEarnings() {
    const adminIds = await this.getAdminUserIds();
    if (!adminIds.length) return;

    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const recentReplacements = await this.replacementRepo.find({
      where: {
        status: ReplacementStatus.COMPLETED,
        completedAt: LessThan(today),
      },
      relations: ['replacementTeacher', 'student'],
    });

    const recentInMonth = recentReplacements.filter((r) => {
      if (!r.completedAt) return false;
      return r.completedAt.getTime() >= firstOfMonth.getTime();
    });

    if (!recentInMonth.length) return;

    for (const replacement of recentInMonth) {
      const earnings = await this.earningRepo.find({
        where: { replacementId: replacement.id, isReplacement: true },
      });

      const totalEarnings = earnings.reduce((sum, e) => sum + (parseFloat(String(e.earnings)) || 0), 0);
      if (totalEarnings <= 0) continue;

      const teacherName = replacement.replacementTeacher?.fullName || 'Teacher';
      const totalSessions = earnings.reduce((sum, e) => sum + (e.sessionsConducted || 0), 0);

      await this.notificationsService.sendCustomNotifications(
        adminIds,
        'Replacement Payment Updated',
        `Teacher ${teacherName} has completed ${totalSessions} replacement session(s). Additional Earnings: ${totalEarnings} ETB. Teacher salary has been updated automatically.`,
        {
          replacementId: replacement.id,
          teacherName,
          totalSessions,
          totalEarnings,
          studentName: replacement.student?.fullName || 'Student',
        },
        NotificationChannel.PAYMENT_REMINDER,
        false,
        '/finance_teacher-payments',
      );
    }
  }
}
