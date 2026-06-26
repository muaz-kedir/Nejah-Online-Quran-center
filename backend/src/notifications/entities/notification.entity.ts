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
  TEMP_REPLACEMENT = 'TEMP_REPLACEMENT',
  HOMEWORK_ASSIGNED = 'HOMEWORK_ASSIGNED',
  HOMEWORK_UPDATED = 'HOMEWORK_UPDATED',
  HOMEWORK_DUE_SOON = 'HOMEWORK_DUE_SOON',
  HOMEWORK_GRADED = 'HOMEWORK_GRADED',
  CLASS_REMINDER = 'CLASS_REMINDER',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
  SCHEDULE_CHANGED = 'SCHEDULE_CHANGED',
  TEACHER_FEEDBACK = 'TEACHER_FEEDBACK',
  DAILY_PROGRESS = 'DAILY_PROGRESS',
  EVALUATION_PUBLISHED = 'EVALUATION_PUBLISHED',
  EXAM_RESULTS = 'EXAM_RESULTS',
  ATTENDANCE_CORRECTED = 'ATTENDANCE_CORRECTED',
  RESOURCE_ADDED = 'RESOURCE_ADDED',
  RESOURCE_UPDATED = 'RESOURCE_UPDATED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  MAINTENANCE = 'MAINTENANCE',
  FEATURE_UPDATE = 'FEATURE_UPDATE',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
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

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
