import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { SessionMeeting } from './session-meeting.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

export enum StudentAttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  LEFT_EARLY = 'LEFT_EARLY',
}

@Entity('student_session_attendances')
export class StudentSessionAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionMeeting, (session) => session.studentAttendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionMeetingId' })
  session: SessionMeeting;

  @Column()
  sessionMeetingId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ type: 'timestamp', nullable: true })
  joinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  leaveTime: Date;

  @Column({ nullable: true })
  totalDuration: number;

  @Column({
    type: 'enum',
    enum: StudentAttendanceStatus,
    default: StudentAttendanceStatus.ABSENT,
  })
  attendanceStatus: StudentAttendanceStatus;

  @OneToMany(() => Attendance, (attendance) => attendance.sessionAttendance)
  attendanceRecords: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
