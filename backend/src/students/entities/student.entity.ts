import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Parent } from '../../parents/entities/parent.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  gender: string;

  @Column()
  age: number;

  @Column()
  residency: string;

  @Column()
  levelOfQuran: string;

  @Column({ unique: true })
  email: string;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Parent, (parent) => parent.students)
  parent: Parent;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
