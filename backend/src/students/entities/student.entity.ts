import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Parent } from '../../parents/entities/parent.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { User } from '../../users/entities/user.entity';
import { OneToOne } from 'typeorm';
import { Gender } from '../../common/enums/gender.enum';

export enum QuranLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  HIFZ = 'Hifz',
  ADVANCED = 'Advanced',
  OTHER = 'Other',
}

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender: Gender;

  @Column()
  age: number;

  @Column({ nullable: true })
  currentResidency: string;

  @Column({ type: 'enum', enum: QuranLevel, default: QuranLevel.BEGINNER })
  level: QuranLevel;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  // Profile photo URL (optional)
  @Column({ nullable: true })
  avatarUrl: string;

  // Attendance & Progress (maintained separately but cached here for fast display)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendanceRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressRate: number;

  // Student ID like NJ-2024-001
  @Column({ unique: true, nullable: true })
  studentCode: string;

  @OneToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  // Relationships
  @ManyToOne(() => Parent, (parent) => parent.students, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Parent;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.students, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ nullable: true })
  teacherId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
