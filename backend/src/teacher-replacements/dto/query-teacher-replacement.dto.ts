import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ReplacementStatus } from '../../common/enums/replacement-status.enum';

export class QueryTeacherReplacementDto {
  @IsOptional()
  @IsEnum(ReplacementStatus)
  status?: ReplacementStatus;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  originalTeacherId?: string;

  @IsOptional()
  @IsUUID()
  replacementTeacherId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
