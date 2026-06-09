import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MORE_INFO_REQUIRED = 'MORE_INFO_REQUIRED',
}

@Entity('teacher_applications')
export class TeacherApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  applicationNumber: string;

  // ── Personal Details ─────────────────────────────────────────────

  @Column()
  fullName: string;

  @Column({ nullable: true })
  password?: string;

  @Column()
  gender: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;

  @Column()
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  streetAddress: string;

  // ── Qualifications ───────────────────────────────────────────────

  @Column('simple-array')
  languages: string[];

  @Column({ nullable: true })
  internetConnectionType: string;

  @Column({ nullable: true })
  qiratEducationLevel: string;

  @Column({ nullable: true })
  islamicEducationLevel: string;

  @Column('simple-array', { nullable: true })
  teachingTimeAvailability: string[];

  @Column({ nullable: true })
  marketingSource: string;

  // ── Document URLs ────────────────────────────────────────────────

  @Column({ nullable: true })
  nationalIdUrl: string;

  @Column({ nullable: true })
  quranCertificateUrl: string;

  @Column({ nullable: true })
  islamicCertificateUrl: string;

  @Column({ nullable: true })
  teachingExperienceUrl: string;

  @Column({ nullable: true })
  cvResumeUrl: string;

  // ── Additional ───────────────────────────────────────────────────

  @Column({ type: 'text', nullable: true })
  additionalComments: string;

  // ── Review ───────────────────────────────────────────────────────

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING_REVIEW,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  infoRequestMessage: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  /** Set after approval to link to the created Teacher record */
  @Column({ nullable: true })
  createdTeacherId: string;

  // ── Timestamps ───────────────────────────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
