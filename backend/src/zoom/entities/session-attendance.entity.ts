import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LiveSession } from './live-session.entity';
import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { AttendanceStatus } from '../enums/live-session-status.enum';

export interface AttendanceThresholds {
  presentRatio: number;
  lateRatio: number;
  earlyLeaveMinutes: number;
}

export const DEFAULT_ATTENDANCE_THRESHOLDS: AttendanceThresholds = {
  presentRatio: 0.8,
  lateRatio: 0.5,
  earlyLeaveMinutes: 10,
};

@Entity('session_attendances')
@Index(['studentId', 'sessionId'])
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

  @ManyToOne(() => Teacher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ type: 'timestamp', nullable: true })
  teacherStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  teacherEndTime: Date;

  @Column({ type: 'int', nullable: true })
  teacherDuration: number;

  @Column({ type: 'timestamp', nullable: true })
  joinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  leaveTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  attendanceStatus: AttendanceStatus;

  @Column({ type: 'int', default: 0 })
  rejoinCount: number;

  @Column({ type: 'int', default: 0 })
  networkDisconnects: number;

  @Column({ type: 'bigint', nullable: true })
  totalConnectedTimeMs: number;

  @Column({ type: 'bigint', nullable: true })
  longestContinuousPresenceMs: number;

  @Column({ type: 'bigint', nullable: true })
  teacherOverlapMs: number;

  @Column({ nullable: true })
  firstJoinTime: Date;

  @Column({ nullable: true })
  lastLeaveTime: Date;

  @Column({ nullable: true })
  zoomRegistrantJoinUrl: string;

  @Column({ default: false })
  isReconciled: boolean;

  @Column({ default: false })
  joinedViaTelegram: boolean;

  @Column({ type: 'timestamp', nullable: true })
  invitationSentAt: Date;

  @Column({ nullable: true })
  sessionStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
