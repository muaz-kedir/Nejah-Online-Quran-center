import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('session_participant_summaries')
@Index(['sessionId', 'userId'], { unique: true })
export class SessionParticipantSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sessionId: string;

  @Column()
  userId: string;

  @Column()
  userType: string;

  @Column({ nullable: true })
  participantId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ type: 'timestamp', nullable: true })
  firstJoinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLeaveTime: Date;

  @Column({ type: 'int', default: 0 })
  totalDurationSeconds: number;

  @Column({ default: 'absent' })
  status: string;

  @Column({ default: false })
  isReconciled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
