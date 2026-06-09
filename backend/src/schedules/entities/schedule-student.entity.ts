import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('schedule_students')
export class ScheduleStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scheduleId: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.scheduleStudents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;
}
