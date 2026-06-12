import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { StudentFeeAccount } from './student-fee-account.entity';
import { FamilyBillingGroup } from './family-billing-group.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  studentFeeAccountId: string;

  @ManyToOne(() => StudentFeeAccount, (acc) => acc.transactions, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'studentFeeAccountId' })
  studentFeeAccount: StudentFeeAccount;

  @Column({ nullable: true })
  familyBillingGroupId: string;

  @ManyToOne(() => FamilyBillingGroup, (grp) => grp.transactions, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'familyBillingGroupId' })
  familyBillingGroup: FamilyBillingGroup;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.PAYMENT })
  type: TransactionType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  recordedBy: string;

  @Column({ type: 'date' })
  transactionDate: string;

  @CreateDateColumn()
  createdAt: Date;
}
