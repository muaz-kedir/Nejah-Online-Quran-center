import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { HelpArticle } from './help-article.entity';

@Entity('article_versions')
export class ArticleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  articleId: string;

  @ManyToOne(() => HelpArticle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: HelpArticle;

  @Column({ nullable: true })
  editor: string;

  @Column({ type: 'jsonb' })
  changes: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
