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
import { Teacher } from '../../teachers/entities/teacher.entity';
import { ScheduleStudent } from './schedule-student.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  className: string;

  @Column({ nullable: true })
  dayOfWeek: string; // 'Monday', 'Tuesday', etc.

  @Column({ nullable: true })
  startTimeString: string; // '15:30'

  @Column({ nullable: true })
  endTimeString: string; // '16:30'

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ nullable: true })
  studentId: string;

  @Column({ default: false })
  isGroupSession: boolean;

  @OneToMany(() => ScheduleStudent, (ss) => ss.schedule, { cascade: true })
  scheduleStudents: ScheduleStudent[];

  @ManyToOne(() => Teacher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ nullable: true })
  meetingLink: string;

  @Column({ nullable: true })
  classType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'active' })
  status: string; // active, inactive

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
