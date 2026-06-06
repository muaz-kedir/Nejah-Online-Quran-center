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
import { OneToOne, OneToMany } from 'typeorm';
import { Gender } from '../../common/enums/gender.enum';
import { Schedule } from '../../schedules/entities/schedule.entity';

export enum QuranLevel {
  QAIDA_NOORANIYA = 'Qaida Nooraniya',
  QURAN_READING = 'Quran Reading',
  HIFZ_PROGRAM = 'Hifz Program',
  TAJWEED_PROGRAM = 'Tajweed Program',
  HIFZ_MURAJAA = 'Hifz Muraja\'a',
}

export enum AgeRange {
  UNDER_18 = 'Under 18',
  EIGHTEEN_TO_TWENTY_FIVE = '18 - 25',
  ABOVE_TWENTY_FIVE = 'Above 25',
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

  @Column({ type: 'varchar', default: AgeRange.UNDER_18 })
  ageRange: AgeRange;

  @Column({ nullable: true })
  currentResidency: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'varchar', default: QuranLevel.QURAN_READING })
  level: QuranLevel;

  @Column({ default: false })
  kitabRequested: boolean;

  @Column({ nullable: true })
  kitabName: string;

  @Column({ default: false })
  previousTraining: boolean;

  @Column({ type: 'text', nullable: true })
  trainingDetails: string;

  @Column({ nullable: true })
  referralSource: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ nullable: true })
  statusChangedAt: Date;

  @Column({ nullable: true })
  statusChangedBy: string;

  @Column({ nullable: true })
  statusChangeReason: string;

  @Column({ type: 'text', nullable: true })
  statusNotes: string;

  @Column({ default: false })
  isAssigned: boolean;

  // Profile photo URL (optional)
  @Column({ nullable: true })
  avatarUrl: string;

  // Family information (optional)
  @Column({ nullable: true })
  familyName: string;

  @Column({ nullable: true })
  familyPhone: string;

  @Column({ nullable: true })
  familyAddress: string;

  @Column({ nullable: true })
  familyCountry: string;

  // Learning goals
  @Column({ type: 'text', nullable: true })
  learningGoals: string;

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

  @OneToMany(() => Schedule, (schedule) => schedule.student)
  schedules: Schedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
