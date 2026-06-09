import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity('progress_logs')
export class ProgressLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ type: 'varchar', nullable: true })
  learningTrack: string;

  @Column({ nullable: true })
  topicId: string;

  @Column({ nullable: true })
  topicName: string;

  @Column({ nullable: true })
  topicNameAr: string;

  @Column({ nullable: true })
  surahNumber: number;

  @Column({ nullable: true })
  surahName: string;

  @Column({ nullable: true })
  lastStudiedPage: number;

  @Column({ nullable: true })
  startAyah: number;

  @Column({ nullable: true })
  lastStudiedAyah: number;

  @Column({ nullable: true })
  endAyah: number;

  @Column({ nullable: true })
  memorizationStatus: string;

  @Column({ nullable: true })
  revisionStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'completed' })
  completionStatus: string;

  @Column({ default: false })
  isReview: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
