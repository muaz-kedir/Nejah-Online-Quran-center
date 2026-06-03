import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { UserRole } from '../common/enums/user-role.enum';

export enum ResourceCategory {
  QURAN_RESOURCES = 'Quran Resources',
  QAIDA_NOORANIYA = 'Qaida Nooraniya',
  TAJWEED_MATERIALS = 'Tajweed Materials',
  ISLAMIC_STUDIES = 'Islamic Studies Materials',
  CLASS_MATERIALS = 'Class Materials',
}

export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ResourceCategory })
  category: ResourceCategory;

  @Column({ type: 'varchar' })
  fileUrl: string;

  @Column({ type: 'enum', enum: UserRole })
  createdByRole: UserRole;

  @Column()
  createdById: string;

  @Column({ type: 'enum', enum: ResourceStatus, default: ResourceStatus.ACTIVE })
  status: ResourceStatus;

  @Column({ nullable: true })
  tags: string;

  @Column({ type: 'integer', default: 0 })
  downloadCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastDownloadedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
