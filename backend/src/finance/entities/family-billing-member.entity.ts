import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FamilyBillingGroup } from './family-billing-group.entity';
import { Student } from '../../students/entities/student.entity';

@Entity('family_billing_members')
export class FamilyBillingMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  familyBillingGroupId: string;

  @ManyToOne(() => FamilyBillingGroup, (grp) => grp.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyBillingGroupId' })
  familyBillingGroup: FamilyBillingGroup;

  @Column()
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  individualMonthlyFee: number;
}
