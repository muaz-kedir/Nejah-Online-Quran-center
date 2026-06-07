import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { ReplacementReason } from '../../common/enums/replacement-reason.enum';

export class UpdateTeacherReplacementDto {
  @IsOptional()
  @IsUUID()
  replacementTeacherId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ReplacementReason)
  reason?: ReplacementReason;

  @ValidateIf((o) => o.reason === ReplacementReason.OTHER)
  @IsOptional()
  @IsString()
  customReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
