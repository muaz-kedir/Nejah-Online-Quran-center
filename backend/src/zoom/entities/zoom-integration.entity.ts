import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Teacher } from '../../teachers/entities/teacher.entity';

@Entity('zoom_integrations')
export class ZoomIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Teacher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column()
  teacherId: string;

  @Column({ nullable: true })
  zoomUserId: string;

  @Column({ nullable: true })
  zoomEmail: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  accountType: string;

  @Column({ type: 'text', nullable: true })
  accessToken: string;

  @Column({ type: 'text', nullable: true })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date;

  @Column({ default: 'disconnected' })
  connectionStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  connectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  disconnectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
