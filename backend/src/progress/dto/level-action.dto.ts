import { IsEnum, IsIn, IsOptional, IsString, IsBoolean } from 'class-validator';
import { QuranLevel } from '../../students/entities/student.entity';

export class LevelActionDto {
  @IsIn(['promote', 'demote', 'repeat', 'pause', 'resume'])
  action: 'promote' | 'demote' | 'repeat' | 'pause' | 'resume';

  @IsOptional()
  @IsEnum(QuranLevel)
  targetLevel?: QuranLevel;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RecommendPromotionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateProgressionSettingsDto {
  @IsOptional()
  @IsIn(['full_quran', 'teacher_recommendation'])
  quranReadingCompletionMode?: 'full_quran' | 'teacher_recommendation';

  @IsOptional()
  @IsBoolean()
  tajweedRequiresEvaluation?: boolean;
}
