import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @Column({ default: 0 })
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
