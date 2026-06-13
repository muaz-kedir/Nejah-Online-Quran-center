import { PaymentStatus } from '../../common/enums/payment-status.enum';
export declare class FinanceQueryDto {
    search?: string;
    studentId?: string;
    parentId?: string;
    teacherId?: string;
    country?: string;
    learningProgram?: string;
    paymentStatus?: PaymentStatus;
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    billingMonth?: string;
    page?: number;
    limit?: number;
}
