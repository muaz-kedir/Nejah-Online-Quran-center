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
import { Student } from '../../students/entities/student.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { SessionAttendance } from './session-attendance.entity';
import { SessionNote } from './session-note.entity';
import { LiveSessionStatus } from '../enums/live-session-status.enum';

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column()
  teacherId: string;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ nullable: true })
  studentId: string;

  @ManyToOne(() => Schedule, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @Column({ nullable: true })
  scheduleId: string;

  @Column({ nullable: true })
  zoomMeetingId: string;

  @Column({ nullable: true })
  zoomJoinUrl: string;

  @Column({ nullable: true })
  zoomStartUrl: string;

  @Column({ type: 'timestamp' })
  scheduledStart: Date;

  @Column({ type: 'timestamp' })
  scheduledEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEnd: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ type: 'enum', enum: LiveSessionStatus, default: LiveSessionStatus.SCHEDULED })
  status: LiveSessionStatus;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  recordingData: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToMany(() => SessionAttendance, (attendance) => attendance.session, { cascade: true })
  attendances: SessionAttendance[];

  @OneToMany(() => SessionNote, (note) => note.session, { cascade: true })
  sessionNotes: SessionNote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
