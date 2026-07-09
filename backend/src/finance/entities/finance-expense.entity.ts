import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';
import { ExpenseRecurringInterval } from '../../common/enums/expense-recurring-interval.enum';

@Entity('finance_expenses')
export class FinanceExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory;

  @Column({ type: 'date' })
  expenseDate: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: 'enum', enum: ExpenseRecurringInterval, nullable: true })
  recurringInterval: ExpenseRecurringInterval;

  @Column({ type: 'text', nullable: true })
  attachmentUrl: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  recordedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
