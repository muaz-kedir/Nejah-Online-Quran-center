import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';

export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  titleEn: string;

  @Column({ nullable: true })
  titleAr: string;

  @Column({ nullable: true })
  titleAm: string;

  @Column({ type: 'text', default: '' })
  descriptionEn: string;

  @Column({ type: 'text', nullable: true })
  descriptionAr: string;

  @Column({ type: 'text', nullable: true })
  descriptionAm: string;

  @Column({ default: 'Uncategorized' })
  category: string;

  @Column({ default: 'All Levels' })
  learningLevel: string;

  @Column({ default: 'PDF' })
  resourceType: string;

  @Column({ type: 'varchar' })
  fileUrl: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'integer', default: 0 })
  displayOrder: number;

  @Column({ type: 'integer', default: 0 })
  fileSize: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.SUPER_ADMIN })
  createdByRole: UserRole;

  @Column({ nullable: true })
  createdById: string;

  @Column({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.ACTIVE })
  status: ResourceStatus;

  @Column({ type: 'integer', default: 0 })
  downloadCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastDownloadedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
