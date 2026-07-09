import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceNotificationsCron } from './finance-notifications.cron';
import { NotificationsModule } from '../notifications/notifications.module';
import { StudentFeeAccount } from './entities/student-fee-account.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { FamilyBillingGroup } from './entities/family-billing-group.entity';
import { FamilyBillingMember } from './entities/family-billing-member.entity';
import { TeacherPayrollRecord } from './entities/teacher-payroll-record.entity';
import { TeacherEarningDetail } from './entities/teacher-earning-detail.entity';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { FinanceExpense } from './entities/finance-expense.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentFeeAccount,
      PaymentTransaction,
      FamilyBillingGroup,
      FamilyBillingMember,
      TeacherPayrollRecord,
      TeacherEarningDetail,
      Student,
      Parent,
      Teacher,
      Schedule,
      ClassSession,
      StudentAttendance,
      TeacherReplacement,
      FinanceExpense,
      User,
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, FinanceNotificationsCron],
  exports: [FinanceService],
})
export class FinanceModule {}
