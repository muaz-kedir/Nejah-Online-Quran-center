import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TeacherReplacement } from './teacher-replacement.entity';

@Entity('teacher_replacement_audits')
export class TeacherReplacementAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  replacementId: string;

  @ManyToOne(() => TeacherReplacement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'replacementId' })
  replacement: TeacherReplacement;

  @Column()
  action: string;

  @Column()
  performedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  payloadJson: Record<string, unknown>;

  @CreateDateColumn()
  performedAt: Date;
}
