import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type LocalizedText = Record<'en' | 'ar' | 'am', string>;

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('support_pages')
export class SupportPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'jsonb', default: {} })
  title: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  subtitle: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  content: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  metaTitle: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  metaDescription: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  metaKeywords: LocalizedText;

  @Column({ nullable: true })
  ogImage: string;

  @Column({ type: 'enum', enum: PageStatus, default: PageStatus.DRAFT })
  status: PageStatus;

  @Column({ type: 'date', nullable: true })
  publishedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
