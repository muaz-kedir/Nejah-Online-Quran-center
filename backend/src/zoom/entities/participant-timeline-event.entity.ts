import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { LiveSession } from './live-session.entity';
import { Student } from '../../students/entities/student.entity';

export enum TimelineEventType {
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
}

export enum TimelineEventSource {
  WEBHOOK = 'webhook',
  REPORT = 'report',
}

@Entity('participant_timeline_events')
@Index(['sessionId', 'participantId', 'timestamp'])
@Index(['sessionId', 'eventType'])
export class ParticipantTimelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  participantId: string;

  @Column({ type: 'varchar', length: 20 })
  participantRole: 'teacher' | 'student';

  @Column({ nullable: true })
  zoomUserId: string;

  @Column({ type: 'enum', enum: TimelineEventType })
  eventType: TimelineEventType;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ nullable: true })
  device: string;

  @Column({ nullable: true })
  clientType: string;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: any;

  @Column({ type: 'varchar', length: 64, nullable: true })
  webhookEventId: string;

  @Column({ type: 'varchar', length: 20, default: TimelineEventSource.WEBHOOK })
  source: TimelineEventSource;

  @CreateDateColumn()
  createdAt: Date;
}
