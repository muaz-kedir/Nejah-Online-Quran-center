import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { LocalizedText } from '../types/localized-text';

export class CreateHomeMissionCardDto {
  @IsObject()
  title: LocalizedText;

  @IsObject()
  description: LocalizedText;

  @IsOptional()
  @IsString()
  iconUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHomeMissionCardDto {
  @IsOptional()
  @IsObject()
  title?: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;

  @IsOptional()
  @IsString()
  iconUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
