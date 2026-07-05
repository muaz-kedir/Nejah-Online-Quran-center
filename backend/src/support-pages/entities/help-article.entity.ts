import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { HelpCategory } from './help-category.entity';

export type LocalizedText = Record<'en' | 'ar' | 'am', string>;

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('help_articles')
export class HelpArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', default: {} })
  title: LocalizedText;

  @Column({ unique: true })
  slug: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => HelpCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: HelpCategory;

  @Column({ type: 'jsonb', default: {} })
  shortDescription: LocalizedText;

  @Column({ type: 'jsonb', default: {} })
  content: LocalizedText;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  author: string;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.DRAFT })
  status: ArticleStatus;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ type: 'int', default: 0 })
  notHelpfulCount: number;

  @Column({ type: 'date', nullable: true })
  publishedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
