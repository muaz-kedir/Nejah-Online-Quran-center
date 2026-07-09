import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { HelpArticle } from './help-article.entity';

@Entity('article_feedback')
export class ArticleFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  articleId: string;

  @ManyToOne(() => HelpArticle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: HelpArticle;

  @Column()
  isHelpful: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
