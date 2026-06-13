import { TransactionType } from '../../common/enums/transaction-type.enum';
import { StudentFeeAccount } from './student-fee-account.entity';
import { FamilyBillingGroup } from './family-billing-group.entity';
export declare class PaymentTransaction {
    id: string;
    studentFeeAccountId: string;
    studentFeeAccount: StudentFeeAccount;
    familyBillingGroupId: string;
    familyBillingGroup: FamilyBillingGroup;
    amount: number;
    type: TransactionType;
    description: string;
    paymentMethod: string;
    recordedBy: string;
    transactionDate: string;
    createdAt: Date;
}
