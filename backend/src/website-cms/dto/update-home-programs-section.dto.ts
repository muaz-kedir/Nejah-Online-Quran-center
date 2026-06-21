import { IsObject, IsOptional } from 'class-validator';
import { LocalizedText } from '../types/localized-text';

export class UpdateHomeProgramsSectionDto {
  @IsOptional()
  @IsObject()
  sectionHeader?: LocalizedText;

  @IsOptional()
  @IsObject()
  mainTitle?: LocalizedText;

  @IsOptional()
  @IsObject()
  description?: LocalizedText;
}
