import { TransactionType } from '../../common/enums/transaction-type.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
export declare class RecordPaymentDto {
    amount: number;
    type?: TransactionType;
    description?: string;
    paymentMethod?: string;
    transactionDate?: string;
}
export declare class UpdateStudentFeeDto {
    discountAmount?: number;
    scholarshipAmount?: number;
    sessionRate?: number;
    status?: PaymentStatus;
    dueDate?: string;
}
export declare class BundleFamilyDto {
    parentId: string;
    studentIds: string[];
    billingMonth?: string;
}
export declare class GeneratePayrollDto {
    billingMonth?: string;
}
