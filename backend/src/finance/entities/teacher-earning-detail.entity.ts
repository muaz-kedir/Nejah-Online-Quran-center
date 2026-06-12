import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TeacherPayrollRecord } from './teacher-payroll-record.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('teacher_earning_details')
export class TeacherEarningDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  payrollRecordId: string;

  @ManyToOne(() => TeacherPayrollRecord, (r) => r.earningDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payrollRecordId' })
  payrollRecord: TeacherPayrollRecord;

  @Column()
  teacherId: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ nullable: true })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'int', default: 0 })
  sessionsConducted: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  sessionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  earnings: number;

  @Column({ default: false })
  isReplacement: boolean;

  @Column({ nullable: true })
  replacementId: string;
}
