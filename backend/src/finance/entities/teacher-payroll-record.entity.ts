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
import { Teacher } from '../../teachers/entities/teacher.entity';
import { TeacherEarningDetail } from './teacher-earning-detail.entity';

@Entity('teacher_payroll_records')
export class TeacherPayrollRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  teacherId: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ type: 'varchar', length: 7 })
  billingMonth: string;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @OneToMany(() => TeacherEarningDetail, (d) => d.payrollRecord, { cascade: true })
  earningDetails: TeacherEarningDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
