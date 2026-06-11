import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Progress } from '../../progress/entities/progress.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

export enum ExamDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum ExamStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'time', nullable: true })
  durationMinutes: number;

  @Column({ type: 'enum', enum: ExamDifficulty, default: ExamDifficulty.MEDIUM })
  difficulty: ExamDifficulty;

  @Column({ type: 'enum', enum: ExamStatus, default: ExamStatus.SCHEDULED })
  status: ExamStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxScore: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'boolean', default: false })
  isGraded: boolean;

  @Column({ type: 'simple-array', nullable: true })
  correctAnswers: string[];

  @Column({ type: 'simple-array', nullable: true })
  studentAnswers: string[];

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Teacher, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => Progress, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'progressId' })
  progress: Progress;

  @Column({ nullable: true })
  progressId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
