import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { LocalizedText } from '../types/localized-text';

@Entity('home_programs_sections')
export class HomeProgramsSection {
  @PrimaryColumn({ default: 'default' })
  id: string;

  @Column({ type: 'jsonb', default: {} })
  sectionHeader: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  mainTitle: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  description: LocalizedText;

  @UpdateDateColumn()
  updatedAt: Date;
}
