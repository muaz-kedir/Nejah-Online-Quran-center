import { Parent } from '../../parents/entities/parent.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { FamilyBillingMember } from './family-billing-member.entity';
import { PaymentTransaction } from './payment-transaction.entity';
export declare class FamilyBillingGroup {
    id: string;
    parentId: string;
    parent: Parent;
    monthlyTotal: number;
    amountPaid: number;
    discountAmount: number;
    scholarshipAmount: number;
    remainingBalance: number;
    status: PaymentStatus;
    dueDate: string;
    billingMonth: string;
    isBundled: boolean;
    members: FamilyBillingMember[];
    transactions: PaymentTransaction[];
    createdAt: Date;
    updatedAt: Date;
}
