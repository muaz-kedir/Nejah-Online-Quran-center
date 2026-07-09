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
import { Student } from '../../students/entities/student.entity';
import { Parent } from '../../parents/entities/parent.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { PaymentTransaction } from './payment-transaction.entity';

@Entity('student_fee_accounts')
export class StudentFeeAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => Parent, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Parent;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => Teacher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column()
  program: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5 })
  sessionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  teacherMonthlyBudget: number;

  @Column({ type: 'int', default: 0 })
  weeklyScheduleDays: number;

  @Column({ type: 'int', default: 60 })
  sessionDurationMinutes: number;

  @Column({ type: 'int', default: 12 })
  monthlySessions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyFee: number;

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

  @Column({ default: false })
  isFamilyBundled: boolean;

  @Column({ nullable: true })
  familyBillingGroupId: string;

  @OneToMany(() => PaymentTransaction, (tx) => tx.studentFeeAccount)
  transactions: PaymentTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
