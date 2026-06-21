import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { LocalizedText } from '../types/localized-text';

@Entity('home_mission_sections')
export class HomeMissionSection {
  @PrimaryColumn({ default: 'default' })
  id: string;

  @Column({ type: 'jsonb', default: {} })
  aboutHeader: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  aboutDescription: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  missionTitle: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  missionHeading: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  missionDescription: LocalizedText;

  @Column({ type: 'varchar', nullable: true })
  missionImageUrl: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
