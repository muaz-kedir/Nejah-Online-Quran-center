import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsString()
  lastStudiedSurah?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastStudiedAyah?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surahsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ayahsCount?: number;
}
