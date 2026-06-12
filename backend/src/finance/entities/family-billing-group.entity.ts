import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Parent } from '../../parents/entities/parent.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { FamilyBillingMember } from './family-billing-member.entity';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('family_billing_groups')
export class FamilyBillingGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentId: string;

  @ManyToOne(() => Parent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Parent;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyTotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  scholarshipAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingBalance: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  status: PaymentStatus;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  @Column({ type: 'varchar', length: 7 })
  billingMonth: string;

  @Column({ default: true })
  isBundled: boolean;

  @OneToMany(() => FamilyBillingMember, (m) => m.familyBillingGroup, { cascade: true })
  members: FamilyBillingMember[];

  @OneToMany(() => PaymentTransaction, (tx) => tx.familyBillingGroup)
  transactions: PaymentTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
