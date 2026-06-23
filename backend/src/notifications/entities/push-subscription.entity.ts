import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  userType: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dh: string;

  @Column({ type: 'text' })
  auth: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  deviceInfo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
