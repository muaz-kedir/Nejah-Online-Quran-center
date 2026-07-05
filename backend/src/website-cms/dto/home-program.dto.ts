import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { LocalizedText } from '../types/localized-text';

export class CreateHomeProgramDto {
  @IsObject()
  level: LocalizedText;

  @IsObject()
  title: LocalizedText;

  @IsObject()
  description: LocalizedText;

  @IsOptional()
  @IsObject()
  detailedContent?: LocalizedText;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHomeProgramDto {
  @IsOptional()
  @IsObject()
  level?: LocalizedText;

  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;

  @IsOptional()
  @IsObject()
  detailedContent?: LocalizedText;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
