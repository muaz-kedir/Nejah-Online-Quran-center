import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

export type LevelHistoryStatus =
  | 'in_progress'
  | 'completed'
  | 'repeated'
  | 'demoted'
  | 'paused';

export type LevelChangeType =
  | 'initial'
  | 'auto_promotion'
  | 'manual_promotion'
  | 'manual_demotion'
  | 'repeat'
  | 'pause'
  | 'resume';

/**
 * Append-only academic history of a student's journey through learning levels.
 * Doubles as the audit log for manual (admin) level changes.
 */
@Entity('student_level_history')
export class StudentLevelHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'varchar' })
  level: string;

  @Column({ type: 'varchar' })
  learningTrack: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', default: 'in_progress' })
  status: LevelHistoryStatus;

  @Column({ type: 'varchar', default: 'initial' })
  changeType: LevelChangeType;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ type: 'simple-json', nullable: true })
  completedTopicIdsSnapshot: string[] | null;

  @Column({ type: 'float', nullable: true })
  progressPercentageSnapshot: number | null;

  // null = automatic (system) change
  @Column({ type: 'varchar', nullable: true })
  changedByUserId: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
