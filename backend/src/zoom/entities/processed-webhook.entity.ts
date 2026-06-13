import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('processed_webhooks')
export class ProcessedWebhook {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  eventId: string;

  @Index()
  @CreateDateColumn()
  processedAt: Date;
}
