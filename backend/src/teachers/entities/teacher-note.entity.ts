import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Teacher } from './teacher.entity';

export enum TeacherNoteType {
  CLASS_REMINDER = 'Class Reminder',
  OBSERVATION = 'Observation',
  GENERAL_REMINDER = 'General Reminder',
}

@Entity('teacher_notes')
export class TeacherNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TeacherNoteType, default: TeacherNoteType.GENERAL_REMINDER })
  type: TeacherNoteType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column()
  teacherId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
