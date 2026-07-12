import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationChannel {
  MEETING_STARTED = 'MEETING_STARTED',
  MEETING_ENDED = 'MEETING_ENDED',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  CLASS_ALERT = 'CLASS_ALERT',
  STUDENT_JOINED = 'STUDENT_JOINED',
  STUDENT_LEFT = 'STUDENT_LEFT',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  SCHEDULE_CHANGED = 'SCHEDULE_CHANGED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  dataJson: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
