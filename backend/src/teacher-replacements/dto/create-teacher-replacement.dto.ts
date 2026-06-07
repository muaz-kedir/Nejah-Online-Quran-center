import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ReplacementReason } from '../../common/enums/replacement-reason.enum';

export class CreateTeacherReplacementDto {
  @IsUUID()
  originalTeacherId: string;

  @IsUUID()
  replacementTeacherId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  selectAllStudents?: boolean;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Start time must be HH:mm (24-hour)' })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'End time must be HH:mm (24-hour)' })
  endTime: string;

  @IsEnum(ReplacementReason)
  reason: ReplacementReason;

  @ValidateIf((o) => o.reason === ReplacementReason.OTHER)
  @IsString()
  @IsNotEmpty()
  customReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
