import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LocalizedText } from '../types/localized-text';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  studentName: string;

  @Column({ type: 'varchar', nullable: true })
  parentName: string | null;

  @Column({ type: 'varchar' })
  displayName: string;

  @Column({ type: 'varchar' })
  studentType: 'child' | 'adult' | 'parent';

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', nullable: true })
  photo: string | null;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'varchar', nullable: true })
  program: string | null;

  @Column({ type: 'varchar', nullable: true })
  learningDuration: string | null;

  @Column({ type: 'varchar', nullable: true })
  studentSince: string | null;

  @Column({ type: 'jsonb', default: {} })
  testimonialText: LocalizedText;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
