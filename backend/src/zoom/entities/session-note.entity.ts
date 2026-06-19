import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LiveSession } from './live-session.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

export enum SessionNoteVisibility {
  TEACHER_ONLY = 'teacher_only',
  ALL = 'all',
}

@Entity('session_notes')
export class SessionNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LiveSession, (session) => session.sessionNotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: LiveSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column()
  teacherId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: SessionNoteVisibility, default: SessionNoteVisibility.TEACHER_ONLY })
  visibility: SessionNoteVisibility;

  @Column({ type: 'text', nullable: true })
  lessonSummary: string;

  @Column({ type: 'text', nullable: true })
  topicsCovered: string;

  @Column({ type: 'text', nullable: true })
  homeworkAssigned: string;

  @Column({ type: 'text', nullable: true })
  completionRemarks: string;

  @Column({ type: 'text', nullable: true })
  studentPerformance: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
