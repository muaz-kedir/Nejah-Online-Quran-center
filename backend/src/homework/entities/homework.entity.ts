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

export enum HomeworkDifficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum HomeworkStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
}

@Entity('homework')
export class Homework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: HomeworkDifficulty, default: HomeworkDifficulty.MEDIUM })
  difficulty: HomeworkDifficulty;

  @Column({ type: 'enum', enum: HomeworkStatus, default: HomeworkStatus.PENDING })
  status: HomeworkStatus;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @Column({ nullable: true })
  assignedByTeacherId: string;

  @Column({ nullable: true })
  replacementAssignmentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
