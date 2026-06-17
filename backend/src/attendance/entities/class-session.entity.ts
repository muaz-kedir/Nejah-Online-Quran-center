import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { StudentAttendance } from './student-attendance.entity';

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TeacherAttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
}

@Entity('class_sessions')
export class ClassSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classTitle: string;

  @Column()
  subject: string;

  @Column()
  quranLevel: string;

  @Column({ type: 'date' })
  sessionDate: Date;

  @Column({ type: 'time' })
  scheduledStartTime: string;

  @Column({ type: 'time' })
  scheduledEndTime: string;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @Column({ nullable: true })
  meetingLink: string;

  @Column({ nullable: true })
  zoomMeetingId: string;

  @Column({ nullable: true })
  zoomPassword: string;

  @Column({ type: 'enum', enum: TeacherAttendanceStatus, nullable: true })
  teacherAttendanceStatus: TeacherAttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  teacherJoinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  teacherLeaveTime: Date;

  @Column({ type: 'int', default: 0 })
  teacherDuration: number;

  @Column({ type: 'int', default: 0 })
  totalStudentsAssigned: number;

  @Column({ type: 'int', default: 0 })
  totalStudentsPresent: number;

  @Column({ type: 'int', default: 0 })
  totalStudentsLate: number;

  @Column({ type: 'int', default: 0 })
  totalStudentsAbsent: number;

  @Column({ type: 'int', default: 0 })
  totalStudentsLeftEarly: number;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column()
  teacherId: string;

  @ManyToOne(() => Schedule, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @Column({ nullable: true })
  scheduleId: string;

  @OneToMany(() => StudentAttendance, (attendance) => attendance.classSession, {
    cascade: true,
  })
  studentAttendances: StudentAttendance[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
