import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type QuranReadingCompletionMode = 'full_quran' | 'teacher_recommendation';

/**
 * Single-row table of admin-definable level completion rules.
 */
@Entity('progression_settings')
export class ProgressionSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Option A (full_quran): all 114 surahs ticked.
  // Option C (teacher_recommendation): teacher recommends + evaluation pass.
  @Column({ type: 'varchar', default: 'full_quran' })
  quranReadingCompletionMode: QuranReadingCompletionMode;

  // When true, finishing all Tajweed topics requires a teacher evaluation
  // pass (or admin approval) before promotion to Hifz.
  @Column({ default: true })
  tajweedRequiresEvaluation: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
