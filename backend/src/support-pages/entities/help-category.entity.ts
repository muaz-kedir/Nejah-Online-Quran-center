import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type LocalizedText = Record<'en' | 'ar' | 'am', string>;

@Entity('help_categories')
export class HelpCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', default: {} })
  name: LocalizedText;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'jsonb', default: {} })
  description: LocalizedText;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
