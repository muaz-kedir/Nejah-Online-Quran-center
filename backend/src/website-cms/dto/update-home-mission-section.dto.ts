import { IsObject, IsOptional, IsString } from 'class-validator';
import { LocalizedText } from '../types/localized-text';

export class UpdateHomeMissionSectionDto {
  @IsOptional()
  @IsObject()
  aboutHeader?: LocalizedText;

  @IsOptional()
  @IsObject()
  aboutDescription?: LocalizedText;

  @IsOptional()
  @IsObject()
  missionTitle?: LocalizedText;

  @IsOptional()
  @IsObject()
  missionHeading?: LocalizedText;

  @IsOptional()
  @IsObject()
  missionDescription?: LocalizedText;

  @IsOptional()
  @IsString()
  missionImageUrl?: string | null;
}
