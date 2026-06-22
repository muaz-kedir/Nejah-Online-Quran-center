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

  /** AES-256-GCM via EncryptionService (legacy — prefer clientSecret) */
  @Column({ type: 'text', nullable: true })
  clientSecretEncrypted: string | null;

  /** Plaintext S2S client secret (server-side DB only; avoids ENCRYPTION_KEY breakage on Render). */
  @Column({ type: 'text', nullable: true })
  clientSecret: string | null;

  @Column({ type: 'text', nullable: true })
  secretTokenEncrypted: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
