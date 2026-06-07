import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeacherReplacement } from './teacher-replacement.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity('replacement_schedule_overrides')
export class ReplacementScheduleOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  replacementId: string;

  @ManyToOne(() => TeacherReplacement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'replacementId' })
  replacement: TeacherReplacement;

  @Column()
  originalScheduleId: string;

  @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'originalScheduleId' })
  originalSchedule: Schedule;

  @Column()
  replacementTeacherId: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'replacementTeacherId' })
  replacementTeacher: Teacher;

  @Column({ nullable: true })
  meetingLink: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
