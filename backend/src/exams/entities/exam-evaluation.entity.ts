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
import { Teacher } from '../../teachers/entities/teacher.entity';

export enum EvaluationType {
  WEEKLY = 'Weekly Evaluation',
  MONTHLY = 'Monthly Evaluation',
  LEVEL_COMPLETION = 'Level Completion Evaluation',
  PROMOTION = 'Promotion Evaluation',
}

@Entity('exam_evaluations')
export class ExamEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column()
  programType: string; // e.g. Qaidah Nooraniyah, Quran Reading, Tajweed, Hifz (Memorization)

  @Column()
  currentLevel: string; // Student level at time of evaluation

  @Column({ type: 'enum', enum: EvaluationType })
  evaluationType: EvaluationType;

  @Column({ type: 'timestamp' })
  evaluationDate: Date;

  @Column({ type: 'integer' })
  score: number; // 0 - 100

  @Column({ type: 'text' })
  teacherComments: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ default: 'Continue Current Level' })
  promotionRecommendation: string; // 'Ready For Promotion' | 'Continue Current Level'

  @Column({ type: 'simple-json', nullable: true })
  criteriaRatings: Record<string, string | number>;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>; // Topic, Surah, Ayah, etc.

  @Column({ default: 'Pending' })
  promotionStatus: string; // 'Pending' | 'Approved' | 'Rejected'

  @Column({ nullable: true })
  approvedByUserId: string;

  @Column({ nullable: true })
  approvalDate: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
