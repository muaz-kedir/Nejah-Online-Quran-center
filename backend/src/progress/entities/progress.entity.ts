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

@Entity('progress')
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0 })
  surahsCount: number;

  @Column({ default: 0 })
  ayahsCount: number;

  @Column({ default: 0 })
  weeksActive: number;

  // Float so percentages like 0.9 / 5.9 can be stored without integer cast errors
  @Column({ type: 'float', default: 0 })
  progressPercentage: number;

  @Column({ default: 'Beginner' })
  rank: string;

  @Column({ nullable: true })
  surahNumber: number;

  @Column({ nullable: true })
  lastStudiedSurah: string;

  @Column({ nullable: true })
  lastStudiedPage: number;

  @Column({ nullable: true })
  lastStudiedAyah: number;

  @Column({ type: 'varchar', nullable: true })
  learningTrack: string;

  @Column({ nullable: true })
  currentTopicId: string;

  @Column({ type: 'simple-json', default: '[]' })
  completedTopicIds: string[];

  // 'none' | 'ready' (criteria met, awaiting evaluation/approval) | 'recommended' (teacher passed evaluation)
  @Column({ type: 'varchar', default: 'none' })
  promotionStatus: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
