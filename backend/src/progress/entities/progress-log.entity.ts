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

  @Column()
  surahNumber: number;

  @Column()
  surahName: string;

  @Column()
  lastStudiedPage: number;

  @Column()
  lastStudiedAyah: number;

  @CreateDateColumn()
  createdAt: Date;
}
