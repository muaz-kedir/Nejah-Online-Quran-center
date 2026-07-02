import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class RecordPaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  transactionDate?: string;
}

export class UpdateStudentFeeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  scholarshipAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sessionRate?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  teacherMonthlyBudget?: number;
}

export class BundleFamilyDto {
  @IsString()
  parentId: string;

  @IsString({ each: true })
  studentIds: string[];

  @IsOptional()
  @IsString()
  billingMonth?: string;
}

export class GeneratePayrollDto {
  @IsOptional()
  @IsString()
  billingMonth?: string;
}
