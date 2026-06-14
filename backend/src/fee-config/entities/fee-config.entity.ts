import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LearningGoal } from '../../learning-goals/entities/learning-goal.entity';

@Entity('fee_configs')
export class FeeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  learningGoalId: string;

  @ManyToOne(() => LearningGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'learningGoalId' })
  learningGoal: LearningGoal;

  @Column()
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'ETB' })
  currency: string;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
