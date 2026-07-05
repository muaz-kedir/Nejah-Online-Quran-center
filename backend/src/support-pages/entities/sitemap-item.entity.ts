import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sitemap_items')
export class SitemapItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => SitemapItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: SitemapItem;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isVisible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
