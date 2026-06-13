import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, IsIn } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsBoolean()
  isReview?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(114)
  surahNumber?: number;

  @IsOptional()
  @IsString()
  lastStudiedSurah?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(604)
  lastStudiedPage?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  startAyah?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  lastStudiedAyah?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  endAyah?: number;

  @IsOptional()
  @IsString()
  @IsIn(['new', 'in_progress', 'memorized', 'needs_review'])
  memorizationStatus?: string;

  @IsOptional()
  @IsString()
  @IsIn(['not_started', 'in_progress', 'completed'])
  revisionStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['completed', 'in_progress', 'review'])
  completionStatus?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surahsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ayahsCount?: number;
}
