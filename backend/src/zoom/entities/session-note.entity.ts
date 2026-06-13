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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
