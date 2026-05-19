import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Student } from '../../students/entities/student.entity';

export enum ParentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  residency: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column()
  relationshipWithStudent: string;

  @Column({ type: 'enum', enum: ParentStatus, default: ParentStatus.ACTIVE })
  status: ParentStatus;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => Student, (student) => student.parent, { eager: true })
  students: Student[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
