import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('attendance_segments')
@Index(['sessionId', 'userEmail'])
export class AttendanceSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sessionId: string;

  @Column()
  userId: string;

  @Column()
  userEmail: string;

  @Column()
  userType: string;

  @Column({ nullable: true })
  zoomParticipantId: string;

  @Column({ type: 'timestamp', nullable: true })
  joinTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  leaveTime: Date;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ default: 'webhook' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
