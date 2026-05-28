import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { ClassSession } from './class-session.entity';

export enum StudentAttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  LEFT_EARLY = 'LEFT_EARLY',
}

@Entity('student_attendance')
export class StudentAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  classSessionId: string;

  @ManyToOne(() => ClassSession, (session) => session.studentAttendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classSessionId' })
  classSession: ClassSession;

  @Column({ type: 'enum', enum: StudentAttendanceStatus, default: StudentAttendanceStatus.ABSENT })
  attendanceStatus: StudentAttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  joinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  leaveTime: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ type: 'boolean', default: false })
  notificationSent: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
