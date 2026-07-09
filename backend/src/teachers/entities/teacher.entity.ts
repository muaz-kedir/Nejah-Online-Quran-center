import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Gender } from '../../common/enums/gender.enum';

@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @OneToOne(() => User, { cascade: true, onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.MALE })
  gender: Gender;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  qualification: string;

  @Column({ nullable: true })
  specialization: string;

  @Column({ default: 0 })
  experience: number;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  streetAddress: string;

  @Column({ nullable: true })
  dateOfBirth: string; // YYYY-MM-DD format

  @Column('simple-array', { nullable: true })
  languages: string[];

  @Column({ nullable: true })
  internetConnectionType: string;

  @Column({ nullable: true })
  qiratEducationLevel: string;

  @Column('simple-array', { nullable: true })
  teachingTimeAvailability: string[];

  @Column({ nullable: true })
  marketingSource: string;

  @Column({ type: 'text', nullable: true })
  additionalComments: string;

  @Column({ default: 'active' })
  status: string; // active, inactive, pending, on leave

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  weeklySchedule: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlySalary: number;

  @Column({ nullable: true })
  islamicEducationLevel: string; // Beginner, Intermediate, Advanced, Ijazah

  @Column({ type: 'text', nullable: true })
  teachingTopics: string; // comma-separated list

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: false })
  zoomConnected: boolean;

  @Column({ nullable: true })
  zoomEmail: string;

  @Column({ nullable: true })
  zoomUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  zoomConnectedAt: Date;

  @Column({ type: 'int', default: 1 })
  salaryDay: number;

  @OneToMany(() => Student, (student) => student.teacher)
  students: Student[];

  @OneToMany(() => Schedule, (schedule) => schedule.teacher)
  schedules: Schedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
