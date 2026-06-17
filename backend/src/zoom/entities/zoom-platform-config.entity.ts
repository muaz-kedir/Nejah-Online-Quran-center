import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Singleton row — Zoom Server-to-Server OAuth credentials (env vars take precedence). */
@Entity('zoom_platform_config')
export class ZoomPlatformConfig {
  @PrimaryColumn({ default: 'default' })
  id: string;

  @Column({ nullable: true })
  accountId: string | null;

  @Column({ nullable: true })
  clientId: string | null;

  /** AES-256-GCM via EncryptionService */
  @Column({ type: 'text', nullable: true })
  clientSecretEncrypted: string | null;

  @Column({ type: 'text', nullable: true })
  secretTokenEncrypted: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
