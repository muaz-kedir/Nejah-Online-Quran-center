import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, ValidateIf, Matches } from 'class-validator';
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
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string;

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
