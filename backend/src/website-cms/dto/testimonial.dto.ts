import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { LocalizedText } from '../types/localized-text';

export class CreateTestimonialDto {
  @IsString()
  studentName: string;

  @IsOptional()
  @IsString()
  parentName?: string | null;

  @IsString()
  displayName: string;

  @IsIn(['child', 'adult', 'parent'])
  studentType: 'child' | 'adult' | 'parent';

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  photo?: string | null;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  program?: string | null;

  @IsOptional()
  @IsString()
  learningDuration?: string | null;

  @IsOptional()
  @IsString()
  studentSince?: string | null;

  @IsObject()
  testimonialText: LocalizedText;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateTestimonialDto {
  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  parentName?: string | null;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsIn(['child', 'adult', 'parent'])
  studentType?: 'child' | 'adult' | 'parent';

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  photo?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  program?: string | null;

  @IsOptional()
  @IsString()
  learningDuration?: string | null;

  @IsOptional()
  @IsString()
  studentSince?: string | null;

  @IsOptional()
  @IsObject()
  testimonialText?: LocalizedText;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
