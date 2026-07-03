import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { FinanceQueryDto } from './dto/finance-query.dto';
import {
  RecordPaymentDto,
  UpdateStudentFeeDto,
  BundleFamilyDto,
  GeneratePayrollDto,
} from './dto/record-payment.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FINANCE_MANAGER, UserRole.SUPER_ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  getDashboard() {
    return this.financeService.getDashboard();
  }

  @Post('sync')
  syncAccounts(@Query('billingMonth') billingMonth?: string) {
    return this.financeService.syncStudentFeeAccounts(billingMonth);
  }

  @Get('student-payments')
  getStudentPayments(@Query() query: FinanceQueryDto) {
    return this.financeService.getStudentPayments(query);
  }

  @Get('student-payments/:id')
  getStudentPaymentDetail(@Param('id') id: string) {
    return this.financeService.getStudentPaymentDetail(id);
  }

  @Post('student-payments/:id/transactions')
  recordStudentPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.financeService.recordStudentPayment(id, dto, user.id);
  }

  @Patch('student-payments/:id')
  updateStudentFee(@Param('id') id: string, @Body() dto: UpdateStudentFeeDto) {
    return this.financeService.updateStudentFee(id, dto);
  }

  @Get('family-payments')
  getFamilyPayments(@Query() query: FinanceQueryDto) {
    return this.financeService.getFamilyPayments(query);
  }

  @Post('family-payments/bundle')
  bundleFamily(@Body() dto: BundleFamilyDto) {
    return this.financeService.bundleFamilyPayments(dto);
  }

  @Get('family-payments/:id')
  getFamilyPaymentDetail(@Param('id') id: string) {
    return this.financeService.getFamilyPaymentDetail(id);
  }

  @Patch('family-payments/:id')
  updateFamilyPayment(@Param('id') id: string, @Body() dto: UpdateStudentFeeDto) {
    return this.financeService.updateFamilyPayment(id, dto);
  }

  @Post('family-payments/:id/transactions')
  recordFamilyPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.financeService.recordFamilyPayment(id, dto, user.id);
  }

  @Get('teacher-payments')
  getTeacherPayments(@Query() query: FinanceQueryDto) {
    return this.financeService.getTeacherPayments(query);
  }

  @Get('teacher-payments/:teacherId')
  getTeacherPaymentDetail(
    @Param('teacherId') teacherId: string,
    @Query('billingMonth') billingMonth?: string,
  ) {
    return this.financeService.getTeacherPaymentDetail(teacherId, billingMonth);
  }

  @Post('teacher-payments/generate-payroll')
  generatePayroll(@Body() dto: GeneratePayrollDto) {
    return this.financeService.generatePayroll(dto.billingMonth);
  }

  @Patch('teacher-payments/:teacherId/payroll/mark-paid')
  markPayrollAsPaid(@Param('teacherId') teacherId: string, @Query('billingMonth') billingMonth?: string) {
    return this.financeService.markPayrollAsPaid(teacherId, billingMonth);
  }

  @Get('revenue-analytics')
  getRevenueAnalytics(@Query() query: FinanceQueryDto) {
    return this.financeService.getRevenueAnalytics(query);
  }

  @Get('reports/:type')
  getFinancialReport(@Param('type') type: string, @Query() query: FinanceQueryDto) {
    return this.financeService.getFinancialReport(type, query);
  }

  @Get('expenses')
  getExpenses(@Query() query: FinanceQueryDto) {
    return this.financeService.getExpenses(query);
  }

  @Get('expenses/:id')
  getExpenseDetail(@Param('id') id: string) {
    return this.financeService.getExpenseDetail(id);
  }

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: { id: string }) {
    return this.financeService.createExpense(dto, user.id);
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.financeService.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    return this.financeService.deleteExpense(id);
  }

  @Get('net-profit')
  getNetProfit(@Query('billingMonth') billingMonth?: string) {
    return this.financeService.getNetProfit(billingMonth);
  }
}
