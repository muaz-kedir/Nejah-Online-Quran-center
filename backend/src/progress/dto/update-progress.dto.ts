import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateProgressDto {
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
