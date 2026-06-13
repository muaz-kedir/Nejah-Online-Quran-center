import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { LiveSession } from './live-session.entity';
import { Student } from '../../students/entities/student.entity';
import { AttendanceStatus } from '../enums/live-session-status.enum';

@Entity('session_attendances')
export class SessionAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveSession, (session) => session.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: LiveSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'timestamp', nullable: true })
  joinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  leaveTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  attendanceStatus: AttendanceStatus;

  @CreateDateColumn()
  createdAt: Date;
}
