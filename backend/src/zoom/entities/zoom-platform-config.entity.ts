import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Singleton row — Zoom platform configuration (webhook secret, future OAuth credentials). */
@Entity('zoom_platform_config')
export class ZoomPlatformConfig {
  @PrimaryColumn({ default: 'default' })
  id: string;

  @Column({ type: 'text', nullable: true })
  secretTokenEncrypted: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
