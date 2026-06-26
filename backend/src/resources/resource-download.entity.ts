import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Resource } from './resources.entity';

@Entity('resource_downloads')
export class ResourceDownload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Resource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;

  @Column()
  resourceId: string;

  @CreateDateColumn()
  downloadedAt: Date;
}
